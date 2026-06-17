from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List

from wolfie_core.audit.log import AuditLog
from wolfie_core.common import now_iso, provenance
from wolfie_core.signals.influence.engagement import EngagementVelocityTracker
from wolfie_core.signals.influence.reaction import MarketReactionAnalyzer
from wolfie_core.signals.influence.rumor import RumorRiskFilter
from wolfie_core.signals.influence.scorer import InfluenceScorer
from wolfie_core.signals.influence.sentiment import SentimentScorer
from wolfie_core.signals.influence.ticker import TickerMentionExtractor


class MarketInfluenceEngine:
    def __init__(self, audit_log: AuditLog | None = None):
        self.audit_log = audit_log or AuditLog()
        self.feed: List[Dict[str, Any]] = []
        self.alerts: List[Dict[str, Any]] = []
        self.extractor = TickerMentionExtractor()
        self.sentiment = SentimentScorer()
        self.engagement = EngagementVelocityTracker()
        self.reaction = MarketReactionAnalyzer()
        self.rumor = RumorRiskFilter()
        self.scorer = InfluenceScorer()

    def ingest_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        source_mode = event.get("source_mode", "SIM_REPLAY_DATA")
        text = f"{event.get('headline', '')} {event.get('body', '')}"
        tickers = self.extractor.extract(text)
        normalized = {
            **event,
            "tickers": event.get("tickers") or tickers["tickers"],
            "ticker": event.get("ticker") or (tickers["tickers"][0] if tickers["tickers"] else "UNKNOWN"),
            "source_mode": source_mode,
            "status": "simulated" if event.get("status") != "verified" else "simulated",
            "ingested_at": now_iso(),
            "provenance": provenance("MarketInfluenceEngine") | {"source_mode": source_mode, "scenario_id": event.get("scenario_id")},
        }
        sentiment = self.sentiment.score(text)
        engagement = self.engagement.track(event.get("engagement", {}))
        reaction = self.reaction.analyze(event.get("market_data", {}))
        rumor = self.rumor.evaluate(normalized, reaction)
        alert = self.scorer.score(normalized, sentiment, engagement, reaction, rumor)
        self.feed.append(normalized)
        self.alerts.append(alert)
        result = {
            "event": normalized,
            "ticker_mentions": tickers,
            "sentiment": sentiment,
            "engagement_velocity": engagement,
            "market_reaction": reaction,
            "rumor_risk": rumor,
            "alert": alert,
            "status": "simulated",
            "source_mode": source_mode,
            "provenance": normalized["provenance"],
        }
        self.audit_log.record("influence_event_ingested", f"Ingested simulated influence event {event.get('event_id', 'UNKNOWN')}", result)
        self.audit_log.record("influence_signal_scored", f"Scored simulated influence signal for {normalized['ticker']}", alert)
        return result

    def list_feed(self):
        return self._collection("feed", self.feed)

    def list_alerts(self):
        return self._collection("alerts", self.alerts)

    def source_stats(self):
        counts = Counter(event.get("source_type", "UNKNOWN") for event in self.feed)
        return {
            "source_stats": [{"source_type": key, "count": value, "status": "calculated"} for key, value in counts.items()],
            "status": "calculated",
            "source_mode": "SIM_REPLAY_DATA",
            "provenance": provenance("MarketInfluenceEngine") | {"source_mode": "SIM_REPLAY_DATA"},
        }

    def _collection(self, key: str, values: List[Dict[str, Any]]):
        return {
            key: values,
            "status": "simulated",
            "source_mode": "SIM_REPLAY_DATA",
            "provenance": provenance("MarketInfluenceEngine") | {"source_mode": "SIM_REPLAY_DATA"},
        }
