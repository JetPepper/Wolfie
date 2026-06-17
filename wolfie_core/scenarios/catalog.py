REQUIRED_SCENARIO_NAMES = [
    "InsiderMomentumWinner",
    "InsiderMomentumFailure",
    "ClusterBuyContinuation",
    "NewsBreakoutContinuation",
    "NewsSpikeFade",
    "SocialHypeMomentum",
    "SocialHypeFade",
    "LowLiquidityTrap",
    "WideSpreadReject",
    "MissingSpreadReject",
    "MissingPriceReject",
    "DataStaleFailure",
    "MarketPanic",
    "ChoppyMarket",
    "OpeningRangeBreakoutWinner",
    "OpeningRangeBreakoutFailure",
    "VWAPReclaimWinner",
    "VWAPReclaimFailure",
    "ConflictingBotSignals",
    "CandidateModelImproves",
    "CandidateModelOverfits",
    "CandidateModelWorsensDrawdown",
]


def scenario_template(name: str, seed: int = 1):
    expected = {
        "paper_trades": 0,
        "blocked_trades": 0,
        "unknown_values": 0,
        "risk_blocks": 0,
        "audit_events": ["scenario_loaded"],
        "dashboard_status": "simulated",
    }
    quote = {"symbol": "AAPL", "bid": 195.1, "ask": 195.2, "last": 195.15, "volume": 1000000, "status": "simulated"}
    decisions = [{"type": "wolfie_decision", "status": "simulated", "action": "HOLD", "live_order_submitted": False}]
    if name == "MissingSpreadReject":
        quote["ask"] = "UNKNOWN"
        expected.update({"unknown_values": 1, "blocked_trades": 1, "risk_blocks": 1})
        decisions = [{"type": "risk_block", "status": "UNKNOWN", "reason_code": "missing_spread", "live_order_submitted": False}]
    elif name == "MissingPriceReject":
        quote["last"] = "UNKNOWN"
        expected.update({"unknown_values": 1, "blocked_trades": 1, "risk_blocks": 1})
        decisions = [{"type": "risk_block", "status": "UNKNOWN", "reason_code": "missing_price", "live_order_submitted": False}]
    elif name == "WideSpreadReject":
        quote["ask"] = 205.0
        expected.update({"blocked_trades": 1, "risk_blocks": 1})
        decisions = [{"type": "risk_block", "status": "rejected", "reason_code": "wide_spread", "live_order_submitted": False}]
    elif name in {"OpeningRangeBreakoutWinner", "VWAPReclaimWinner"}:
        expected.update({"paper_trades": 1})
        decisions = [{"type": "paper_trade_signal", "status": "simulated", "action": "BUY", "live_order_submitted": False}]
    elif name in {"OpeningRangeBreakoutFailure", "VWAPReclaimFailure", "SocialHypeFade", "LowLiquidityTrap", "CandidateModelOverfits"}:
        expected.update({"blocked_trades": 1, "risk_blocks": 1})
        decisions = [{"type": "risk_block", "status": "rejected", "reason_code": "scenario_guardrail", "live_order_submitted": False}]
    elif name == "ConflictingBotSignals":
        expected.update({"blocked_trades": 1, "manual_review_required": True})
        decisions = [{"type": "manual_review", "status": "simulated", "reason_code": "conflicting_signals", "live_order_submitted": False}]

    return {
        "scenario_id": name,
        "scenario_name": name,
        "description": f"Phase 4 simulated scenario: {name}.",
        "source_mode": "SIM_REPLAY_DATA",
        "seed": seed,
        "simulated_tickers": ["AAPL"],
        "simulated_market_data": {"quote": quote},
        "simulated_quote_events": [{"timestamp": "2026-06-16T14:30:00Z", "type": "quote", "payload": quote, "status": quote.get("status", "simulated")}],
        "simulated_candle_events": [{"timestamp": "2026-06-16T14:31:00Z", "type": "candle", "payload": {"close": quote.get("last")}, "status": "simulated"}],
        "simulated_filing_events": [],
        "simulated_news_events": [{"timestamp": "2026-06-16T14:32:00Z", "type": "news", "payload": {"headline": name}, "status": "simulated"}] if "News" in name else [],
        "simulated_social_events": [{"timestamp": "2026-06-16T14:32:30Z", "type": "social", "payload": {"topic": name}, "status": "simulated"}] if "Social" in name else [],
        "decision_events": [{"timestamp": "2026-06-16T14:33:00Z", **event} for event in decisions],
        "expected_wolfie_behavior": "Follow scenario-specific simulated guardrails.",
        "expected_dashboard_status": expected["dashboard_status"],
        "expected_paper_trades": expected["paper_trades"],
        "expected_blocked_trades": expected["blocked_trades"],
        "expected_unknown_values": expected["unknown_values"],
        "expected_risk_blocks": expected["risk_blocks"],
        "expected_audit_events": expected["audit_events"],
        "manual_review_required": expected.get("manual_review_required", False),
        "status": "simulated",
    }

