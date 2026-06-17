from fastapi.testclient import TestClient

from apps.api.main import app
from wolfie_core.audit.log import AuditLog
from wolfie_core.replay.engine import ReplayEngine
from wolfie_core.scenarios.engine import ScenarioEngine
from wolfie_core.scenarios.fixture_loader import FixtureLoader
from wolfie_core.scenarios.synthetic import SyntheticMarketGenerator
from wolfie_core.scenarios.validator import ScenarioValidator


client = TestClient(app)


def test_fixture_loader_loads_valid_json_fixture_with_provenance():
    loader = FixtureLoader()

    fixture = loader.load("quotes", "AAPL.json", required_fields=["symbol", "bid", "ask", "last"])

    assert fixture["status"] == "simulated"
    assert fixture["source_mode"] == "SIM_REPLAY_DATA"
    assert fixture["fixture_id"] == "quotes/AAPL.json"
    assert fixture["symbol"] == "AAPL"
    assert fixture["provenance"]["source_mode"] == "SIM_REPLAY_DATA"


def test_fixture_loader_returns_unknown_for_missing_required_fixture_fields():
    loader = FixtureLoader()

    fixture = loader.load("quotes", "AAPL.json", required_fields=["symbol", "does_not_exist"])

    assert fixture["status"] == "UNKNOWN"
    assert fixture["missing_fields"] == ["does_not_exist"]
    assert fixture["fixture_id"] == "quotes/AAPL.json"


def test_scenario_engine_lists_all_required_scenario_names():
    names = {scenario["scenario_name"] for scenario in ScenarioEngine().list_scenarios()["scenarios"]}

    assert {
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
    }.issubset(names)


def test_synthetic_market_generator_seed_determinism():
    generator = SyntheticMarketGenerator()

    first = generator.generate(seed=7, regime="breakout", symbol="AAPL", points=5)
    second = generator.generate(seed=7, regime="breakout", symbol="AAPL", points=5)
    third = generator.generate(seed=8, regime="breakout", symbol="AAPL", points=5)

    assert first == second
    assert first != third
    assert first["source_mode"] == "SIM_SYNTHETIC_DATA"
    assert first["status"] == "simulated"


def test_replay_engine_preserves_event_order_and_instant_replay_completes():
    audit = AuditLog()
    scenario = ScenarioEngine(audit_log=audit).get_scenario("MissingSpreadReject")
    replay = ReplayEngine(audit_log=audit)

    result = replay.replay(scenario, speed="instant")

    timestamps = [event["timestamp"] for event in result["events"]]
    assert timestamps == sorted(timestamps)
    assert result["status"] == "completed"
    assert result["speed"] == "instant"
    assert any(event["event_type"] == "replay_started" for event in audit.list_events())
    assert any(event["event_type"] == "replay_completed" for event in audit.list_events())


def test_required_scenarios_validate_expected_behaviors():
    engine = ScenarioEngine()
    validator = ScenarioValidator()
    required = [
        "MissingSpreadReject",
        "MissingPriceReject",
        "WideSpreadReject",
        "OpeningRangeBreakoutWinner",
        "OpeningRangeBreakoutFailure",
        "VWAPReclaimWinner",
        "VWAPReclaimFailure",
        "SocialHypeFade",
        "LowLiquidityTrap",
        "ConflictingBotSignals",
        "CandidateModelOverfits",
    ]

    results = {scenario_id: validator.validate(engine.run_scenario(scenario_id)) for scenario_id in required}

    assert results["MissingSpreadReject"]["expected_unknown_values"] >= 1
    assert results["MissingPriceReject"]["expected_unknown_values"] >= 1
    assert results["WideSpreadReject"]["expected_risk_blocks"] >= 1
    assert results["OpeningRangeBreakoutWinner"]["expected_paper_trades"] >= 1
    assert results["OpeningRangeBreakoutFailure"]["expected_blocked_trades"] >= 1
    assert results["VWAPReclaimWinner"]["expected_paper_trades"] >= 1
    assert results["SocialHypeFade"]["expected_blocked_trades"] >= 1
    assert results["LowLiquidityTrap"]["expected_risk_blocks"] >= 1
    assert results["ConflictingBotSignals"]["manual_review_required"] is True
    assert results["CandidateModelOverfits"]["expected_blocked_trades"] >= 1
    assert all(result["validation_status"] in {"passed", "partial"} for result in results.values())


def test_scenario_validator_fails_live_order_or_verified_replay_data():
    validator = ScenarioValidator()

    live = validator.validate({"actual_events": [{"live_order_submitted": True, "status": "simulated"}], "expected": {}})
    verified = validator.validate({"actual_events": [{"live_order_submitted": False, "status": "verified", "source_mode": "SIM_REPLAY_DATA"}], "expected": {}})

    assert live["validation_status"] == "failed"
    assert live["failure_reason"] == "unexpected_live_order_attempt"
    assert verified["validation_status"] == "failed"
    assert verified["failure_reason"] == "unexpected_verified_label"


def test_phase4_api_endpoints_return_status_and_results():
    scenarios = client.get("/api/scenarios").json()
    detail = client.get("/api/scenarios/MissingSpreadReject").json()
    loaded = client.post("/api/scenarios/MissingSpreadReject/load").json()
    replay = client.post("/api/scenarios/MissingSpreadReject/replay").json()
    results = client.get("/api/scenarios/MissingSpreadReject/results").json()
    synthetic = client.post("/api/synthetic/generate", json={"seed": 11, "regime": "trend", "symbol": "AAPL", "points": 4}).json()
    runs = client.get("/api/replay/runs").json()

    assert scenarios["status"] == "simulated"
    assert detail["scenario_id"] == "MissingSpreadReject"
    assert loaded["source_mode"] == "SIM_REPLAY_DATA"
    assert replay["status"] == "completed"
    assert results["validation_status"] in {"passed", "partial"}
    assert synthetic["source_mode"] == "SIM_SYNTHETIC_DATA"
    assert runs["status"] == "simulated"


def test_audit_log_records_replay_and_validation_events():
    audit = AuditLog()
    engine = ScenarioEngine(audit_log=audit)
    scenario_result = engine.run_scenario("WideSpreadReject")
    ScenarioValidator(audit_log=audit).validate(scenario_result)
    ReplayEngine(audit_log=audit).replay(engine.get_scenario("WideSpreadReject"), speed="instant")

    event_types = [event["event_type"] for event in audit.list_events()]

    assert "scenario_loaded" in event_types
    assert "scenario_validation_result" in event_types
    assert "replay_started" in event_types
    assert "replay_event_processed" in event_types
    assert "replay_completed" in event_types
