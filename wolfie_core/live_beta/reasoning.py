from __future__ import annotations

from typing import List

from wolfie_core.common import new_id, now_iso
from wolfie_core.costs.cost_model import CostModel
from wolfie_core.risk.risk_manager import RiskManager

from .market_data import MarketConsensusEngine
from .models import SignalComputation, SourceEvidence


class ReasoningEngine:
    def __init__(self, consensus: MarketConsensusEngine, risk_manager: RiskManager, cost_model: CostModel):
        self.consensus = consensus
        self.risk_manager = risk_manager
        self.cost_model = cost_model

    def build_trace(self, bot_id: str, symbol: str, paper_capital: float) -> dict:
        market = self.consensus.resolve_market_consensus(symbol)
        fetched_at = now_iso()
        evidence = [
            SourceEvidence(
                id=new_id("evidence"),
                source_type="market_data",
                source_name="Market consensus",
                source_url=market.source_values[0]["source_url"] if market.source_values else None,
                fetched_at=fetched_at,
                observed_at=market.requested_at,
                freshness_state="delayed" if market.status == "PARTIAL_CONSENSUS" else "unavailable",
                confidence=market.truth_confidence,
                raw_value_summary=str(market.consensus_price) if market.consensus_price is not None else "No price available",
                normalized_summary=market.status,
                warning="; ".join(market.warnings) if market.warnings else None,
                legal_access_mode="public_page" if market.source_values else "unavailable",
                used_in_decision=market.status in {"PARTIAL_CONSENSUS", "VERIFIED_CONSENSUS"},
            )
        ]
        computations: List[SignalComputation] = [
            SignalComputation(
                id=new_id("calc"),
                signal_type="market_consensus",
                inputs=evidence,
                formula_or_method="Require consensus price plus bid/ask spread before execution.",
                output_direction="neutral" if market.consensus_price else "blocked",
                output_magnitude=market.consensus_price or 0,
                output_confidence=market.truth_confidence,
                explanation="Market data is used only with source trace; missing spread blocks paper execution.",
                stale_input_penalty=0 if market.status != "STALE_DATA" else 0.35,
                conflict_penalty=0 if market.status != "CONFLICTING_DATA" else 0.4,
            )
        ]
        cost = self.cost_model.preview(symbol, "BUY", market.consensus_price, market.consensus_price, 1 if market.consensus_price else None)
        risk = self.risk_manager.check({
            "symbol": symbol,
            "side": "BUY",
            "order_type": "limit",
            "price": market.consensus_price or "UNKNOWN",
            "spread_bps": market.consensus_spread_bps if market.consensus_spread_bps is not None else "UNKNOWN",
            "volume": market.consensus_volume if market.consensus_volume is not None else "UNKNOWN",
            "cost_preview": cost,
            "asset_type": "equity",
        })
        final_decision = "block" if not risk["passed"] or market.status not in {"PARTIAL_CONSENSUS", "VERIFIED_CONSENSUS"} else "watch"
        rejected = []
        if market.consensus_spread_bps is None:
            rejected.append("Missing bid/ask spread blocks paper execution planning.")
        if market.truth_confidence < 0.6:
            rejected.append("Market consensus confidence is reduced because only one public source returned.")
        return {
            "decisionFrameId": new_id("frame"),
            "botId": bot_id,
            "ticker": symbol,
            "evidence": [item.to_dict() for item in evidence],
            "computations": [item.to_dict() for item in computations],
            "weightedSignals": [{"signal": "market_consensus", "weight": 0.25, "confidence": market.truth_confidence}],
            "riskGateInputs": risk,
            "tradeCostInputs": cost,
            "truthConfidence": market.truth_confidence,
            "tradeConfidence": 0 if final_decision == "block" else min(0.35, market.truth_confidence),
            "finalDecision": {
                "action": final_decision,
                "status": "blocked" if final_decision == "block" else "watch_only",
                "paperOnly": True,
                "liveOrderSubmitted": False,
            },
            "finalExplanation": "Paper-only execution remains blocked until source consensus, spread, volume, costs, and risk pass.",
            "rejectedBecause": rejected,
            "whatWouldChangeMind": [
                "A second independent market source confirms price.",
                "Bid/ask spread becomes available and cost-efficient.",
                "RiskGate receives fresh price, spread, volume, and cost inputs.",
            ],
            "unavailableSources": [] if market.status in {"PARTIAL_CONSENSUS", "VERIFIED_CONSENSUS"} else ["market_consensus", "bid_ask_spread", "volume"],
            "staleSources": ["market_consensus"] if market.status == "STALE_DATA" else [],
            "paperOnlyExecution": True,
            "live_order_submitted": False,
        }
