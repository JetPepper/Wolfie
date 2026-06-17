from fastapi.testclient import TestClient

from apps.api.main import app
from wolfie_core.audit.log import AuditLog
from wolfie_core.broker.execution_planner import ExecutionPlanner
from wolfie_core.costs.cost_model import CostModel
from wolfie_core.mcp.contract_adapter import MCPContractAdapter
from wolfie_core.mcp.robinhood_sim import RobinhoodSimMCPServer
from wolfie_core.risk.position_sizer import DynamicPositionSizer
from wolfie_core.risk.risk_manager import RiskManager
from wolfie_core.signals.confluence import ConfluenceScorer
from wolfie_core.strategies.orchestrator import StrategyOrchestrator
from wolfie_core.strategies.simple_strategies import (
    Breakout20DStrategy,
    MovingAverageCrossoverStrategy,
    RSIMeanReversionStrategy,
)


client = TestClient(app)


def test_cost_model_calculates_total_cost_and_break_even():
    model = CostModel(slippage_bps=10, spread_bps=5)

    result = model.preview(symbol="AAPL", side="BUY", entry_price=100, exit_price=110, quantity=10)

    assert result["estimated_commission"]["value"] == 0
    assert result["estimated_spread_cost"]["status"] == "calculated"
    assert result["estimated_slippage"]["status"] == "estimated"
    assert result["total_estimated_cost"]["value"] == 1.5
    assert result["break_even_price"]["value"] == 100.15
    assert result["gross_pnl"]["value"] == 100
    assert result["net_pnl_after_costs"]["value"] == 98.5
    assert result["minimum_required_price_move"]["status"] == "calculated"
    assert result["formula_version"] == "cost_model_v1"


def test_cost_model_labels_estimates_not_verified():
    result = CostModel(slippage_bps=3).preview("AAPL", "BUY", 100, 101, 1)

    statuses = {value["status"] for value in result["outputs"].values()}
    assert "verified" not in statuses
    assert "estimated" in statuses


def test_risk_manager_blocks_market_options_margin_shorting_and_missing_inputs():
    manager = RiskManager()

    market = manager.check({"symbol": "AAPL", "side": "BUY", "order_type": "market", "asset_type": "equity", "price": 100, "spread_bps": 5, "volume": 1000, "cost_preview": {"total_estimated_cost": {"value": 1}}})
    options = manager.check({"symbol": "AAPL", "side": "BUY", "order_type": "limit", "asset_type": "option", "price": 100, "spread_bps": 5, "volume": 1000, "cost_preview": {"total_estimated_cost": {"value": 1}}})
    margin = manager.check({"symbol": "AAPL", "side": "BUY", "order_type": "limit", "uses_margin": True, "price": 100, "spread_bps": 5, "volume": 1000, "cost_preview": {"total_estimated_cost": {"value": 1}}})
    short = manager.check({"symbol": "AAPL", "side": "SELL_SHORT", "order_type": "limit", "price": 100, "spread_bps": 5, "volume": 1000, "cost_preview": {"total_estimated_cost": {"value": 1}}})
    missing = manager.check({"symbol": "AAPL", "side": "BUY", "order_type": "limit"})

    assert market["reason_code"] == "market_orders_disabled"
    assert options["reason_code"] == "options_disabled"
    assert margin["reason_code"] == "margin_disabled"
    assert short["reason_code"] == "shorting_disabled"
    assert missing["passed"] is False
    assert {"price", "spread_bps", "volume", "cost_preview"}.issubset(set(missing["missing_inputs"]))


def test_risk_manager_blocks_symbols_outside_allowed_symbols():
    result = RiskManager(allowed_symbols=["AAPL"]).check(
        {"symbol": "MSFT", "side": "BUY", "order_type": "limit", "price": 100, "spread_bps": 5, "volume": 1000, "cost_preview": {"total_estimated_cost": {"value": 1}}}
    )

    assert result["passed"] is False
    assert result["reason_code"] == "symbol_not_allowed"


def test_strategy_signal_returns_unknown_when_required_inputs_missing():
    signal = RSIMeanReversionStrategy().run("AAPL", quote={"symbol": "AAPL"}, candles=[])

    assert signal["status"] in {"UNKNOWN", "rejected"}
    assert signal["side"] == "HOLD"
    assert "candles" in signal["missing_inputs"]


def test_initial_strategies_are_deterministic_on_fixture_candles():
    server = RobinhoodSimMCPServer()
    quote = server.get_quote("AAPL")
    candles = server.get_historical_candles("AAPL")["candles"]

    rsi = RSIMeanReversionStrategy().run("AAPL", quote, candles)
    ma = MovingAverageCrossoverStrategy().run("AAPL", quote, candles)
    breakout = Breakout20DStrategy().run("AAPL", quote, candles)

    assert rsi["side"] in {"BUY", "SELL", "HOLD"}
    assert ma["side"] in {"BUY", "SELL", "HOLD"}
    assert breakout["side"] in {"BUY", "SELL", "HOLD"}
    assert rsi == RSIMeanReversionStrategy().run("AAPL", quote, candles)
    assert ma == MovingAverageCrossoverStrategy().run("AAPL", quote, candles)
    assert breakout == Breakout20DStrategy().run("AAPL", quote, candles)


def test_confluence_scorer_returns_action_thresholds():
    scorer = ConfluenceScorer()

    assert scorer.score({"confidence_score": 40, "status": "simulated"}, market_context={})["action"] == "ignore"
    assert scorer.score({"confidence_score": 55, "status": "simulated"}, market_context={"volume": 1, "spread_bps": 1, "cost_available": True, "risk_reward_available": True})["action"] == "watchlist"
    assert scorer.score({"confidence_score": 70, "status": "simulated"}, market_context={"volume": 1, "spread_bps": 1, "cost_available": True, "risk_reward_available": True})["action"] == "alert"
    assert scorer.score({"confidence_score": 80, "status": "simulated"}, market_context={"volume": 1, "spread_bps": 1, "cost_available": True, "risk_reward_available": True})["action"] == "paper_trade_signal"
    assert scorer.score({"confidence_score": 95, "status": "simulated"}, market_context={"volume": 1, "spread_bps": 1, "cost_available": True, "risk_reward_available": True})["action"] == "high_conviction_paper_trade_signal"


def test_dynamic_position_sizer_returns_unknown_if_stop_or_entry_missing():
    result = DynamicPositionSizer().size(account_size=25000, buying_power=25000, entry_price=None, stop_price=190, signal_score=80)

    assert result["status"] == "UNKNOWN"
    assert result["quantity"] == "UNKNOWN"


def test_execution_planner_creates_limit_orders_only_and_refuses_failed_risk():
    server = RobinhoodSimMCPServer()
    planner = ExecutionPlanner(MCPContractAdapter(server=server), RiskManager(), CostModel())
    signal = {"signal_id": "sig_1", "symbol": "AAPL", "side": "BUY", "confidence_score": 80}

    blocked = planner.create_plan(signal, order_type="market", limit_price=195.2, quantity=1, stop_price=190)
    approved = planner.create_plan(signal, order_type="limit", limit_price=195.2, quantity=1, stop_price=190)
    submitted = planner.submit_paper(approved)

    assert blocked["status"] == "rejected"
    assert blocked["risk_result"]["passed"] is False
    assert approved["order_type"] == "limit"
    assert approved["status"] == "planned"
    assert submitted["live_order_submitted"] is False
    assert submitted["execution_engine"] == "PaperExchange"


def test_strategy_orchestrator_audits_strategy_risk_cost_and_execution_events():
    audit = AuditLog()
    server = RobinhoodSimMCPServer(audit_log=audit)
    orchestrator = StrategyOrchestrator(MCPContractAdapter(server=server), audit_log=audit)

    result = orchestrator.run(symbol="AAPL", submit=False)

    event_types = [event["event_type"] for event in audit.list_events()]
    assert result["status"] == "simulated"
    assert "strategy_run" in event_types
    assert "signal_generated" in event_types
    assert "confluence_score" in event_types
    assert "risk_check" in event_types
    assert "cost_preview" in event_types
    assert "execution_plan" in event_types


def test_phase3_api_endpoints_preserve_status_and_provenance():
    strategies = client.get("/api/strategies").json()
    run = client.post("/api/strategies/run", json={"symbol": "AAPL", "submit": False}).json()
    score = client.post("/api/signals/score", json={"confidence_score": 80, "status": "simulated"}).json()
    risk = client.post("/api/risk/check", json={"symbol": "AAPL", "side": "BUY", "order_type": "market"}).json()
    plan = client.post("/api/execution/plan", json={"symbol": "AAPL", "side": "BUY", "limit_price": 195.2, "quantity": 1, "stop_price": 190}).json()
    recent = client.get("/api/signals/recent").json()

    assert strategies["status"] == "simulated"
    assert len(strategies["strategies"]) >= 6
    assert run["status"] == "simulated"
    assert score["status"] in {"calculated", "UNKNOWN"}
    assert risk["passed"] is False
    assert plan["status"] in {"planned", "rejected"}
    assert recent["status"] == "simulated"
