from __future__ import annotations

from typing import Any, Dict, List

from wolfie_core.audit.log import AuditLog
from wolfie_core.broker.execution_planner import ExecutionPlanner
from wolfie_core.common import provenance
from wolfie_core.costs.cost_model import CostModel
from wolfie_core.mcp.contract_adapter import MCPContractAdapter
from wolfie_core.risk.position_sizer import DynamicPositionSizer
from wolfie_core.risk.risk_manager import RiskManager
from wolfie_core.signals.confluence import ConfluenceScorer
from wolfie_core.strategies.simple_strategies import default_strategies


class StrategyOrchestrator:
    def __init__(
        self,
        adapter: MCPContractAdapter,
        audit_log: AuditLog | None = None,
        strategies: List[Any] | None = None,
        risk_manager: RiskManager | None = None,
        cost_model: CostModel | None = None,
    ):
        self.adapter = adapter
        self.audit_log = audit_log or AuditLog()
        self.strategies = strategies or default_strategies()
        self.risk_manager = risk_manager or RiskManager()
        self.cost_model = cost_model or CostModel()
        self.scorer = ConfluenceScorer()
        self.sizer = DynamicPositionSizer()
        self.planner = ExecutionPlanner(adapter, self.risk_manager, self.cost_model)
        self.recent_signals: List[Dict[str, Any]] = []
        self.recent_scores: List[Dict[str, Any]] = []
        self.recent_risk_checks: List[Dict[str, Any]] = []
        self.recent_cost_previews: List[Dict[str, Any]] = []
        self.recent_execution_plans: List[Dict[str, Any]] = []
        self.recent_submissions: List[Dict[str, Any]] = []

    def list_strategies(self) -> Dict[str, Any]:
        return {"status": "simulated", "strategies": [{"strategy_id": s.strategy_id, "strategy_name": s.strategy_name, "setup_type": s.setup_type, "enabled": True} for s in self.strategies], "provenance": provenance("StrategyOrchestrator")}

    def run(self, symbol: str = "AAPL", submit: bool = False) -> Dict[str, Any]:
        quote = self.adapter.call("get_quote", symbol=symbol)
        candles = self.adapter.call("get_historical_candles", symbol=symbol)["candles"]
        account = self.adapter.call("get_account")
        self.audit_log.record("strategy_run", f"Manual strategy run for {symbol}", {"symbol": symbol})
        signals = []
        scores = []
        plans = []
        submissions = []
        for strategy in self.strategies:
            signal = strategy.run(symbol, quote, candles)
            signals.append(signal)
            self.recent_signals.append(signal)
            self.audit_log.record("signal_generated" if signal["status"] != "UNKNOWN" else "signal_rejected", f"{strategy.strategy_name} generated {signal['side']}", signal)
            cost = self.cost_model.preview(symbol, signal["side"], quote.get("last"), quote.get("last"), 1)
            self.recent_cost_previews.append(cost)
            self.audit_log.record("cost_preview", f"Cost preview for {signal['signal_id']}", cost)
            score = self.scorer.score(signal, {"volume": quote.get("volume"), "spread_bps": 5, "cost_available": cost["status"] != "UNKNOWN", "risk_reward_available": True})
            scores.append(score)
            self.recent_scores.append(score)
            self.audit_log.record("confluence_score", f"Score {score['score']} for {signal['signal_id']}", score)
            baseline_risk = self.risk_manager.check(
                {
                    "symbol": symbol,
                    "side": signal["side"],
                    "order_type": "limit",
                    "price": quote.get("last"),
                    "spread_bps": 5,
                    "volume": quote.get("volume"),
                    "cost_preview": cost,
                    "asset_type": "equity",
                }
            )
            self.recent_risk_checks.append(baseline_risk)
            self.audit_log.record("risk_check", f"Risk check for {signal['signal_id']}", baseline_risk)
            if signal["side"] in {"BUY", "SELL"} and score["score"] >= 75:
                sizing = self.sizer.size(account["equity"], account["buying_power"], quote.get("last"), quote.get("last", 0) * 0.98, score["score"])
                quantity = sizing["quantity"] if sizing["status"] == "calculated" and sizing["quantity"] else 1
                plan = self.planner.create_plan(signal, "limit", quote["last"], quantity, quote["last"] * 0.98, quote["last"] * 1.02)
                plans.append(plan)
                self.recent_execution_plans.append(plan)
                if not plan["risk_result"]["passed"]:
                    self.audit_log.record("risk_block", f"Risk blocked {signal['signal_id']}", plan["risk_result"])
                self.audit_log.record("execution_plan", f"Execution plan for {signal['signal_id']}", plan, True)
                if submit and plan["status"] == "planned":
                    submitted = self.planner.submit_paper(plan)
                    submissions.append(submitted)
                    self.recent_submissions.append(submitted)
                    self.audit_log.record("paper_order_submission", f"Submitted paper order for {signal['signal_id']}", submitted, True)
        if not plans:
            no_trade_plan = {"status": "rejected", "reason_code": "no_signal_met_execution_threshold", "source_mode": "simulated", "provenance": provenance("StrategyOrchestrator")}
            self.recent_execution_plans.append(no_trade_plan)
            self.audit_log.record("execution_plan", "No execution plan created; no signal met threshold", no_trade_plan, True)
        return {"status": "simulated", "symbol": symbol, "signals": signals, "scores": scores, "execution_plans": plans, "submissions": submissions, "provenance": provenance("StrategyOrchestrator")}

    def recent(self) -> Dict[str, Any]:
        return {
            "status": "simulated",
            "signals": self.recent_signals[-20:],
            "scores": self.recent_scores[-20:],
            "risk_checks": self.recent_risk_checks[-20:],
            "cost_previews": self.recent_cost_previews[-20:],
            "execution_plans": self.recent_execution_plans[-20:],
            "submissions": self.recent_submissions[-20:],
            "provenance": provenance("StrategyOrchestrator"),
        }
