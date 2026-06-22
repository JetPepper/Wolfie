from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI
from pydantic import BaseModel

from wolfie_core.broker.environment import TRUTH_STATE
from wolfie_core.broker.execution_planner import ExecutionPlanner
from wolfie_core.costs.cost_model import CostModel
from wolfie_core.live_beta import (
    ClaimExtractionEngine,
    CompanySourceBundleService,
    CorroborationEngine,
    MarketConsensusEngine,
    MarketDataAcquisitionService,
    ReasoningEngine,
    SourceDiscoveryEngine,
    SourcePerformanceEngine,
    SourceRegistry,
    SourceValidationEngine,
)
from wolfie_core.live_beta.models import SourceClaim
from wolfie_core.mcp.contract_adapter import MCPContractAdapter
from wolfie_core.mcp.robinhood_sim import RobinhoodSimMCPServer
from wolfie_core.paper_exchange.exchange import PaperExchange
from wolfie_core.risk.risk_manager import RiskManager
from wolfie_core.replay.engine import ReplayEngine
from wolfie_core.scenarios.engine import ScenarioEngine
from wolfie_core.scenarios.fixture_loader import FixtureLoader
from wolfie_core.scenarios.synthetic import SyntheticMarketGenerator
from wolfie_core.scenarios.validator import ScenarioValidator
from wolfie_core.signals.confluence import ConfluenceScorer
from wolfie_core.signals.fusion import SignalFusionEngine
from wolfie_core.signals.influence import MarketInfluenceEngine
from wolfie_core.signals.insider import InsiderAlphaEngine
from wolfie_core.strategies.orchestrator import StrategyOrchestrator


app = FastAPI(title="Wolfie Trading Bot API", version="0.1.0")

server = RobinhoodSimMCPServer()
adapter = MCPContractAdapter(server=server)
cost_model = CostModel()
risk_manager = RiskManager()
source_registry = SourceRegistry()
source_discovery = SourceDiscoveryEngine(source_registry)
source_validation = SourceValidationEngine()
claim_extraction = ClaimExtractionEngine()
corroboration_engine = CorroborationEngine()
source_performance = SourcePerformanceEngine()
market_acquisition = MarketDataAcquisitionService(source_registry)
market_consensus = MarketConsensusEngine(market_acquisition)
company_sources = CompanySourceBundleService(source_discovery)
reasoning_engine = ReasoningEngine(market_consensus, risk_manager, cost_model)
orchestrator = StrategyOrchestrator(adapter=adapter, audit_log=server.audit_log, risk_manager=risk_manager, cost_model=cost_model)
scenario_engine = ScenarioEngine(audit_log=server.audit_log)
replay_engine = ReplayEngine(audit_log=server.audit_log)
scenario_validator = ScenarioValidator(audit_log=server.audit_log)
synthetic_generator = SyntheticMarketGenerator(audit_log=server.audit_log)
fixture_loader = FixtureLoader(audit_log=server.audit_log)
insider_engine = InsiderAlphaEngine(audit_log=server.audit_log)
influence_engine = MarketInfluenceEngine(audit_log=server.audit_log)
fusion_engine = SignalFusionEngine(audit_log=server.audit_log)
scenario_results = {}


class OrderRequest(BaseModel):
    symbol: str
    side: str
    order_type: str
    quantity: float
    limit_price: float


class CancelOrderRequest(BaseModel):
    order_id: str


class ReplaceOrderRequest(BaseModel):
    order_id: str
    quantity: Optional[float] = None
    limit_price: Optional[float] = None


class StrategyRunRequest(BaseModel):
    symbol: str
    submit: bool = False


class ScoreRequest(BaseModel):
    confidence_score: float
    status: str = "simulated"
    market_context: dict = {}


class ExecutionPlanRequest(BaseModel):
    symbol: str
    side: str = "BUY"
    limit_price: float
    quantity: float
    stop_price: Optional[float] = None
    take_profit_price: Optional[float] = None


class SyntheticGenerateRequest(BaseModel):
    seed: int
    regime: str
    symbol: str
    points: int = 10


class FixtureIngestRequest(BaseModel):
    fixture: str


class SignalFuseRequest(BaseModel):
    insider_signal: Dict[str, Any] = {}
    cluster_signal: Dict[str, Any] = {}
    influence_signal: Dict[str, Any] = {}
    technical_signal: Dict[str, Any] = {}
    market_context: Dict[str, Any] = {}
    cost_risk_context: Dict[str, Any] = {}


class SourceDiscoverRequest(BaseModel):
    symbol: Optional[str] = None
    url: Optional[str] = None


class ArticleIngestRequest(BaseModel):
    source_id: str
    article_id: str = "manual_article"
    url: Optional[str] = None
    title: str = ""
    body: str = ""


class ClaimCorroborateRequest(BaseModel):
    claim: Dict[str, Any]
    source_ids: list[str] = []


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/environment")
def environment():
    return TRUTH_STATE.copy()


@app.get("/api/paper/account")
def paper_account():
    return server.get_account()


@app.get("/api/paper/positions")
def paper_positions():
    return server.get_positions()["positions"]


@app.post("/api/paper/reset")
def paper_reset():
    server.paper_exchange = PaperExchange()
    result = server.get_account()
    server.audit_log.record("paper_account_reset", "Reset simulated paper account", result, True)
    return result


@app.get("/api/market/quote/{symbol}")
def market_quote(symbol: str):
    return market_acquisition.get_quote(symbol)


@app.get("/api/market/quote")
def market_quote_query(symbol: str):
    return market_acquisition.get_quote(symbol)


@app.get("/api/market/quotes")
def market_quotes(symbols: str = ""):
    requested = [symbol.strip() for symbol in symbols.split(",") if symbol.strip()]
    return market_acquisition.get_quotes(requested)


@app.get("/api/mcp/capabilities")
def mcp_capabilities():
    return adapter.capabilities()


@app.get("/api/mcp/tools")
def mcp_tools():
    return adapter.tools()


@app.get("/api/instruments/{symbol}")
def instrument(symbol: str):
    return company_sources.create_bundle(symbol)


@app.get("/api/market/candles/{symbol}")
def market_candles(symbol: str):
    return market_acquisition.get_candles(symbol)


@app.get("/api/market/candles")
def market_candles_query(symbol: str, timeframe: str = "1d", start: Optional[str] = None, end: Optional[str] = None):
    return market_acquisition.get_candles(symbol, timeframe, start, end)


@app.get("/api/market/snapshot")
def market_snapshot(symbol: Optional[str] = None):
    if not symbol:
        return {"status": "SOURCE_UNAVAILABLE", "quotes": [], "reason": "Provide a symbol or configured watchlist; no default ticker is seeded."}
    return market_acquisition.get_snapshot(symbol)


@app.get("/api/market/consensus")
def market_consensus_route(symbol: str):
    return market_consensus.resolve_market_consensus(symbol).to_dict()


@app.get("/api/market/sources/status")
def market_sources_status():
    return market_acquisition.get_provider_health()


@app.post("/api/market/discover")
def market_discover(request: SourceDiscoverRequest):
    if request.symbol:
        return market_acquisition.discover_public_market_sources(request.symbol)
    if request.url:
        return source_discovery.discover_common_feeds(request.url)
    return {"status": "UNKNOWN", "reason": "Provide a symbol or URL for discovery."}


@app.get("/api/trading-hours")
def trading_hours():
    return server.get_trading_hours()


@app.get("/api/fees")
def fee_schedule(symbol: Optional[str] = None):
    if not symbol:
        return {"status": "SOURCE_AVAILABLE", "schedule": cost_model.get_settings(), "note": "Fee schedule is product-level; no default ticker is required."}
    return server.get_fee_schedule(symbol)


@app.get("/api/sources/registry")
def sources_registry():
    return {"status": "SOURCE_AVAILABLE", "sources": source_registry.list_sources()}


@app.get("/api/sources/health")
def sources_health():
    return source_registry.health()


@app.post("/api/sources/discover")
def sources_discover(request: SourceDiscoverRequest):
    if request.symbol:
        return source_discovery.discover_sources_for_symbol(request.symbol)
    if request.url:
        return source_discovery.discover_common_feeds(request.url)
    return {"status": "UNKNOWN", "reason": "Provide a symbol or URL for discovery."}


@app.post("/api/sources/{source_id}/validate")
def sources_validate(source_id: str):
    source = source_registry.get(source_id)
    if not source:
        return {"status": "SOURCE_UNAVAILABLE", "source_id": source_id}
    return source_validation.validate(source)


@app.post("/api/news/ingest-article")
def news_ingest_article(request: ArticleIngestRequest):
    claims = claim_extraction.extract(request.source_id, request.article_id, request.title, request.body)
    return {"status": claims["status"], "article": request.model_dump(), "claims": claims["claims"]}


@app.post("/api/claims/corroborate")
def claims_corroborate(request: ClaimCorroborateRequest):
    claim = SourceClaim(**request.claim)
    sources = [source_registry.get(source_id) for source_id in request.source_ids]
    return corroboration_engine.corroborate(claim, [source for source in sources if source])


@app.get("/api/sources/performance")
def sources_performance():
    return source_performance.list_performance()


@app.post("/api/company/source-bundle")
def company_source_bundle(request: SourceDiscoverRequest):
    if not request.symbol:
        return {"status": "UNKNOWN", "reason": "Provide a symbol to create a company source bundle."}
    return company_sources.create_bundle(request.symbol)


@app.get("/api/reasoning/trace")
def reasoning_trace(symbol: str, bot_id: str = "user_bot", paper_capital: float = 0):
    return reasoning_engine.build_trace(bot_id, symbol, paper_capital)


@app.post("/api/orders/preview")
def preview_order(order: OrderRequest):
    return server.preview_order(**order.model_dump())


@app.post("/api/orders/place")
def place_order(order: OrderRequest):
    return server.place_order(**order.model_dump())


@app.get("/api/orders")
def list_orders():
    return server.list_orders()["orders"]


@app.post("/api/orders/cancel")
def cancel_order(order: CancelOrderRequest):
    return server.cancel_order(order.order_id)


@app.post("/api/orders/replace")
def replace_order(order: ReplaceOrderRequest):
    return server.replace_order(order.order_id, quantity=order.quantity, limit_price=order.limit_price)


@app.get("/api/orders/{order_id}")
def get_order(order_id: str):
    return server.get_order(order_id)


@app.get("/api/audit")
def audit_events():
    return server.audit_log.list_events()


@app.get("/api/strategies")
def strategies():
    return orchestrator.list_strategies()


@app.post("/api/strategies/run")
def run_strategies(request: StrategyRunRequest):
    return orchestrator.run(symbol=request.symbol, submit=request.submit)


@app.post("/api/signals/score")
def score_signal(request: ScoreRequest):
    return ConfluenceScorer().score(request.model_dump(exclude={"market_context"}), request.market_context)


@app.post("/api/risk/check")
def risk_check(candidate: dict):
    return risk_manager.check(candidate)


@app.post("/api/execution/plan")
def execution_plan(request: ExecutionPlanRequest):
    trace = reasoning_engine.build_trace("manual_api_signal", request.symbol, 0)
    if trace["finalDecision"]["action"] == "block":
        return {**trace, "status": "rejected", "live_order_submitted": False}
    planner = ExecutionPlanner(adapter, risk_manager, cost_model)
    signal = {"signal_id": "manual_api_signal", "symbol": request.symbol, "side": request.side, "confidence_score": trace["tradeConfidence"] * 100}
    return planner.create_plan(signal, "limit", request.limit_price, request.quantity, request.stop_price, request.take_profit_price)


@app.post("/api/execution/submit-paper")
def execution_submit_paper(plan: dict):
    planner = ExecutionPlanner(adapter, risk_manager, cost_model)
    return planner.submit_paper(plan)


@app.get("/api/cost-settings")
def cost_settings():
    return cost_model.get_settings()


@app.post("/api/cost-settings")
def update_cost_settings(values: dict):
    return cost_model.update_settings(values)


@app.get("/api/risk-settings")
def risk_settings():
    return risk_manager.get_settings()


@app.post("/api/risk-settings")
def update_risk_settings(values: dict):
    return risk_manager.update_settings(values)


@app.get("/api/signals/recent")
def recent_signals():
    return orchestrator.recent()


@app.get("/api/insiders/events")
def insider_events():
    return insider_engine.list_events()


@app.post("/api/insiders/ingest-fixture")
def insider_ingest_fixture(request: FixtureIngestRequest):
    return {"status": "SOURCE_UNAVAILABLE", "reason": "Fixture ingestion is developer-test-lab only and cannot feed normal beta routes.", "dev_test_lab_route": "/api/dev-test-lab/insiders/ingest-fixture"}


@app.post("/api/dev-test-lab/insiders/ingest-fixture")
def dev_lab_insider_ingest_fixture(request: FixtureIngestRequest):
    payload = fixture_loader.load("form4", request.fixture)
    if "events" in payload:
        results = [insider_engine.ingest_event(event) for event in payload["events"]]
        return {
            "results": results,
            "alert": results[-1]["alert"] if results else {},
            "status": "simulated",
            "source_mode": payload.get("source_mode", "SIM_REPLAY_DATA"),
            "provenance": payload.get("provenance"),
        }
    return insider_engine.ingest_event(payload)


@app.get("/api/insiders/leaderboard")
def insider_leaderboard():
    return insider_engine.ranked_leaderboard()


@app.get("/api/insiders/clusters")
def insider_clusters():
    return insider_engine.clusters()


@app.get("/api/insiders/alerts")
def insider_alerts():
    return insider_engine.list_alerts()


@app.post("/api/influence/ingest-fixture")
def influence_ingest_fixture(request: FixtureIngestRequest):
    return {"status": "SOURCE_UNAVAILABLE", "reason": "Fixture ingestion is developer-test-lab only and cannot feed normal beta routes.", "dev_test_lab_route": "/api/dev-test-lab/influence/ingest-fixture"}


@app.post("/api/dev-test-lab/influence/ingest-fixture")
def dev_lab_influence_ingest_fixture(request: FixtureIngestRequest):
    category = "news" if request.fixture.startswith("news_") else "social"
    payload = fixture_loader.load(category, request.fixture)
    return influence_engine.ingest_event(payload)


@app.get("/api/influence/feed")
def influence_feed():
    return influence_engine.list_feed()


@app.get("/api/influence/alerts")
def influence_alerts():
    return influence_engine.list_alerts()


@app.get("/api/influence/source-stats")
def influence_source_stats():
    return influence_engine.source_stats()


@app.post("/api/signals/fuse")
def signals_fuse(request: SignalFuseRequest):
    return fusion_engine.fuse(
        insider_signal=request.insider_signal,
        cluster_signal=request.cluster_signal,
        influence_signal=request.influence_signal,
        technical_signal=request.technical_signal,
        market_context=request.market_context,
        cost_risk_context=request.cost_risk_context,
    )


@app.get("/api/signals/fused")
def signals_fused():
    return fusion_engine.list_fused()


@app.get("/api/scenarios")
def scenarios():
    return {"status": "SOURCE_UNAVAILABLE", "reason": "Scenario replay is developer-test-lab only and cannot feed normal beta routes."}


@app.get("/api/dev-test-lab/scenarios")
def dev_lab_scenarios():
    return scenario_engine.list_scenarios()


@app.get("/api/scenarios/{scenario_id}")
def scenario_detail(scenario_id: str):
    return {"status": "SOURCE_UNAVAILABLE", "reason": "Scenario replay is developer-test-lab only and cannot feed normal beta routes.", "scenario_id": scenario_id}


@app.get("/api/dev-test-lab/scenarios/{scenario_id}")
def dev_lab_scenario_detail(scenario_id: str):
    return scenario_engine.get_scenario(scenario_id)


@app.post("/api/scenarios/{scenario_id}/load")
def scenario_load(scenario_id: str):
    return {"status": "SOURCE_UNAVAILABLE", "reason": "Scenario replay is developer-test-lab only and cannot feed normal beta routes.", "scenario_id": scenario_id}


@app.post("/api/dev-test-lab/scenarios/{scenario_id}/load")
def dev_lab_scenario_load(scenario_id: str):
    scenario = scenario_engine.load_scenario(scenario_id)
    server.set_market_data_mode("SIM_REPLAY_DATA", scenario)
    return scenario


@app.post("/api/scenarios/{scenario_id}/replay")
def scenario_replay(scenario_id: str):
    return {"status": "SOURCE_UNAVAILABLE", "reason": "Scenario replay is developer-test-lab only and cannot feed normal beta routes.", "scenario_id": scenario_id}


@app.post("/api/dev-test-lab/scenarios/{scenario_id}/replay")
def dev_lab_scenario_replay(scenario_id: str):
    scenario = scenario_engine.load_scenario(scenario_id)
    server.set_market_data_mode("SIM_REPLAY_DATA", scenario)
    replay = replay_engine.replay(scenario, speed="instant")
    scenario_results[scenario_id] = scenario_validator.validate(scenario_engine.run_scenario(scenario_id))
    return replay


@app.get("/api/scenarios/{scenario_id}/results")
def scenario_result(scenario_id: str):
    return {"status": "SOURCE_UNAVAILABLE", "reason": "Scenario replay is developer-test-lab only and cannot feed normal beta routes.", "scenario_id": scenario_id}


@app.get("/api/dev-test-lab/scenarios/{scenario_id}/results")
def dev_lab_scenario_result(scenario_id: str):
    if scenario_id not in scenario_results:
        scenario_results[scenario_id] = scenario_validator.validate(scenario_engine.run_scenario(scenario_id))
    return scenario_results[scenario_id]


@app.post("/api/synthetic/generate")
def synthetic_generate(request: SyntheticGenerateRequest):
    return {"status": "SOURCE_UNAVAILABLE", "reason": "Synthetic generation is developer-test-lab only and cannot feed normal beta routes."}


@app.post("/api/dev-test-lab/synthetic/generate")
def dev_lab_synthetic_generate(request: SyntheticGenerateRequest):
    data = synthetic_generator.generate(seed=request.seed, regime=request.regime, symbol=request.symbol, points=request.points)
    server.set_market_data_mode("SIM_SYNTHETIC_DATA", {"simulated_market_data": {"quote": data["quotes"][-1]}})
    return data


@app.get("/api/replay/runs")
def replay_runs():
    return replay_engine.list_runs()


@app.get("/api/replay/runs/{replay_id}")
def replay_run(replay_id: str):
    return replay_engine.get_run(replay_id)
