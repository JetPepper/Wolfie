from fastapi.testclient import TestClient

from apps.api.main import app
from wolfie_core.audit.log import AuditLog
from wolfie_core.signals.fusion import SignalFusionEngine
from wolfie_core.signals.influence import (
    EngagementVelocityTracker,
    InfluenceScorer,
    MarketInfluenceEngine,
    MarketReactionAnalyzer,
    RumorRiskFilter,
    SentimentScorer,
    TickerMentionExtractor,
)
from wolfie_core.signals.insider import (
    ClusterBuyingDetector,
    InsiderAlphaEngine,
    InsiderLeaderboard,
    InsiderMarketContextAnalyzer,
    InsiderSignalScorer,
)


def form4_event(**overrides):
    event = {
        "accession_number": "sim-form4-001",
        "issuer_name": "Apple Inc.",
        "issuer_cik": "0000320193",
        "ticker": "AAPL",
        "owner_name": "Jane Example",
        "owner_cik": "0000000001",
        "owner_role": "CEO",
        "transaction_date": "2026-06-10",
        "filing_date": "2026-06-11",
        "transaction_code": "P",
        "shares": 5000,
        "price": 195.0,
        "dollar_value": 975000,
        "ownership_after": 25000,
        "direct_or_indirect": "D",
        "is_10b5_1": False,
        "source_mode": "SIM_REPLAY_DATA",
        "status": "simulated",
        "scenario_id": "phase5_test",
    }
    event.update(overrides)
    return event


def quote(**overrides):
    payload = {
        "symbol": "AAPL",
        "bid": 196.9,
        "ask": 197.1,
        "last": 197.0,
        "volume": 2500000,
        "average_volume": 1000000,
        "vwap": 196.0,
        "spread_bps": 10.15,
        "status": "simulated",
        "source_mode": "SIM_REPLAY_DATA",
    }
    payload.update(overrides)
    return payload


def influence_event(**overrides):
    event = {
        "event_id": "sim-news-001",
        "source_type": "simulated_news",
        "source_name": "Wolfie Fixture Wire",
        "headline": "AAPL raises guidance after strong product demand",
        "body": "Breaking: Apple raises guidance with strong demand and confirmed volume breakout.",
        "published_at": "2026-06-12T14:00:00Z",
        "engagement": {"mentions": 400, "shares": 120, "replies": 35, "minutes_observed": 30},
        "market_data": quote(last=199.0) | {"previous_close": 194.0},
        "source_mode": "SIM_REPLAY_DATA",
        "status": "simulated",
        "scenario_id": "phase5_test",
    }
    event.update(overrides)
    return event


def test_insider_purchase_scores_above_sale_and_award_is_downweighted():
    scorer = InsiderSignalScorer()
    purchase = scorer.score(form4_event(transaction_code="P"), market_context={"market_confirmation": True}, cluster={"cluster_detected": True})
    sale = scorer.score(form4_event(transaction_code="S"), market_context={"market_confirmation": True})
    award = scorer.score(form4_event(transaction_code="A"), market_context={"market_confirmation": True})

    assert purchase["insider_signal_score"] > sale["insider_signal_score"]
    assert sale["insider_signal_score"] > award["insider_signal_score"]
    assert purchase["recommended_action"] in {"trading_alert", "paper_trade_signal", "high_conviction_paper_trade_signal"}
    assert purchase["status"] != "verified"


def test_unknown_transaction_code_produces_no_trading_signal():
    result = InsiderSignalScorer().score(form4_event(transaction_code="UNKNOWN"))

    assert result["status"] == "rejected"
    assert result["recommended_action"] == "log_only"
    assert result["missing_inputs"] == []
    assert result["provenance"]["source_mode"] == "SIM_REPLAY_DATA"


def test_cluster_detection_and_leaderboard_are_simulated_replay_derived():
    events = [
        form4_event(owner_name="Buyer One", transaction_date="2026-06-01", dollar_value=300000),
        form4_event(owner_name="Buyer Two", transaction_date="2026-06-05", dollar_value=700000),
        form4_event(owner_name="Seller One", transaction_code="S", dollar_value=200000),
    ]

    cluster = ClusterBuyingDetector(window_days=10).detect(events)
    leaderboard = InsiderLeaderboard().rank(events)

    assert cluster["cluster_detected"] is True
    assert cluster["ticker"] == "AAPL"
    assert cluster["status"] == "simulated"
    assert leaderboard["label"] == "simulated/replay-derived"
    assert leaderboard["source_mode"] == "SIM_REPLAY_DATA"
    assert leaderboard["top_buyers"][0]["owner_name"] in {"Buyer One", "Buyer Two"}


def test_market_context_missing_values_are_unknown():
    context = InsiderMarketContextAnalyzer().analyze(form4_event(), {"symbol": "AAPL"})

    assert context["status"] == "UNKNOWN"
    assert "bid" in context["missing_inputs"]
    assert context["market_confirmation"] is False


def test_ticker_extractor_avoids_common_word_false_positives():
    extractor = TickerMentionExtractor(alias_map={"Apple": "AAPL"})
    result = extractor.extract("THE CEO said Apple demand is strong and FDA timing is unrelated.")

    assert "AAPL" in result["tickers"]
    assert "THE" not in result["tickers"]
    assert "CEO" not in result["tickers"]
    assert "FDA" not in result["tickers"]
    assert result["status"] == "calculated"


def test_sentiment_engagement_rumor_and_influence_scoring():
    sentiment = SentimentScorer().score("Breaking AAPL upgrade after strong guidance beat")
    engagement = EngagementVelocityTracker().track({"mentions": 200, "shares": 50, "replies": 25, "minutes_observed": 25})
    missing_engagement = EngagementVelocityTracker().track({})
    rumor = RumorRiskFilter().evaluate({"source_type": "stocktwits", "body": "Rumor AAPL will moon 100x, guaranteed pump"}, market_context={"market_confirmation": False})
    influence = InfluenceScorer().score(influence_event(), sentiment, engagement, {"market_confirmation": True}, {"rumor_risk_score": 5, "risk_flags": []})

    assert sentiment["bullish_bearish_neutral"] == "bullish"
    assert sentiment["catalyst_type"] == "analyst_upgrade"
    assert missing_engagement["status"] == "UNKNOWN"
    assert rumor["recommended_action"] in {"ignore", "watchlist_only"}
    assert "pump_like_language" in rumor["risk_flags"]
    assert influence["influence_score"] >= 70
    assert influence["recommended_action"] in {"alert", "paper_trade_signal", "high_conviction"}
    assert influence["status"] != "verified"


def test_social_rumor_without_confirmation_cannot_auto_trade():
    event = influence_event(source_type="reddit", headline="AAPL moon rumor", body="Unconfirmed rumor AAPL will moon 100x.")
    result = MarketInfluenceEngine(audit_log=AuditLog(":memory:")).ingest_event(event)

    assert result["alert"]["recommended_action"] in {"ignore", "watchlist"}
    assert result["alert"]["signal_type"] != "paper_trade_signal"
    assert result["rumor_risk"]["rumor_risk_score"] >= 50


def test_market_reaction_analyzer_calculates_returns():
    reaction = MarketReactionAnalyzer().analyze(
        {
            "symbol": "AAPL",
            "previous_close": 190.0,
            "last": 199.5,
            "volume": 2_500_000,
            "average_volume": 1_000_000,
            "bid": 199.4,
            "ask": 199.6,
        }
    )

    assert reaction["status"] == "calculated"
    assert reaction["return_pct"] == 5.0
    assert reaction["relative_volume"] == 2.5
    assert reaction["reaction_type"] == "confirmed_bullish"


def test_fusion_boosts_confirmed_insider_news_and_rejects_bad_data():
    fusion = SignalFusionEngine(audit_log=AuditLog(":memory:"))
    fused = fusion.fuse(
        insider_signal={"insider_signal_score": 82, "recommended_action": "paper_trade_signal", "status": "simulated"},
        cluster_signal={"cluster_detected": True, "cluster_score": 75, "status": "simulated"},
        influence_signal={"influence_score": 80, "recommended_action": "paper_trade_signal", "status": "simulated"},
        technical_signal={"confidence_score": 70, "status": "simulated"},
        market_context={"market_confirmation": True, "spread_bps": 12, "quote_status": "simulated"},
        cost_risk_context={"risk": {"passed": True}},
    )
    rejected = fusion.fuse(
        insider_signal={"insider_signal_score": 82, "status": "simulated"},
        market_context={"market_confirmation": False, "spread_bps": "UNKNOWN", "quote_status": "UNKNOWN"},
        cost_risk_context={"risk": {"passed": False, "reason_code": "missing_required_input"}},
    )

    assert fused["signal_type"] == "INSIDER_PLUS_NEWS"
    assert fused["recommended_action"] in {"paper_trade_signal", "high_conviction_paper_trade_signal"}
    assert rejected["status"] == "rejected"
    assert rejected["recommended_action"] == "no_trade"


def test_engines_record_audit_events_and_reject_live_order_flags():
    audit = AuditLog(":memory:")
    insider = InsiderAlphaEngine(audit_log=audit)
    influence = MarketInfluenceEngine(audit_log=audit)
    insider.ingest_event(form4_event())
    influence.ingest_event(influence_event())
    rejected = SignalFusionEngine(audit_log=audit).fuse(
        insider_signal={"insider_signal_score": 80, "status": "simulated", "live_order_submitted": True}
    )

    event_types = [event["event_type"] for event in audit.list_events()]
    assert "insider_event_ingested" in event_types
    assert "influence_event_ingested" in event_types
    assert "signal_fusion_rejected" in event_types
    assert rejected["status"] == "rejected"
    assert rejected["rejection_reason"] == "live_order_submitted_true"


def test_phase5_api_endpoints_preserve_provenance_and_status():
    client = TestClient(app)

    insider = client.post("/api/insiders/ingest-fixture", json={"fixture": "open_market_purchase_winner.json"}).json()
    influence = client.post("/api/influence/ingest-fixture", json={"fixture": "news_breakout_continuation.json"}).json()
    fused = client.post(
        "/api/signals/fuse",
        json={
            "insider_signal": insider["alert"],
            "influence_signal": influence["alert"],
            "market_context": {"market_confirmation": True, "spread_bps": 12, "quote_status": "simulated"},
            "cost_risk_context": {"risk": {"passed": True}},
        },
    ).json()

    assert client.get("/api/insiders/events").json()["status"] == "simulated"
    assert client.get("/api/insiders/leaderboard").json()["label"] == "simulated/replay-derived"
    assert client.get("/api/insiders/clusters").json()["status"] == "simulated"
    assert client.get("/api/insiders/alerts").json()["status"] == "simulated"
    assert client.get("/api/influence/feed").json()["status"] == "simulated"
    assert client.get("/api/influence/alerts").json()["status"] == "simulated"
    assert client.get("/api/influence/source-stats").json()["status"] == "calculated"
    assert client.get("/api/signals/fused").json()["status"] == "simulated"
    assert fused["source_mode"] == "SIM_REPLAY_DATA"
    assert fused["live_order_submitted"] is False
    assert fused["status"] != "verified"
