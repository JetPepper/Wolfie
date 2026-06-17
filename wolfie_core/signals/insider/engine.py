from __future__ import annotations

from typing import Any, Dict, List

from wolfie_core.audit.log import AuditLog
from wolfie_core.common import now_iso, provenance
from wolfie_core.signals.insider.cluster import ClusterBuyingDetector
from wolfie_core.signals.insider.leaderboard import InsiderLeaderboard
from wolfie_core.signals.insider.market_context import InsiderMarketContextAnalyzer
from wolfie_core.signals.insider.scorer import InsiderSignalScorer


class InsiderAlphaEngine:
    REQUIRED = ["accession_number", "ticker", "owner_name", "transaction_date", "transaction_code"]

    def __init__(self, audit_log: AuditLog | None = None):
        self.audit_log = audit_log or AuditLog()
        self.events: List[Dict[str, Any]] = []
        self.alerts: List[Dict[str, Any]] = []
        self.scorer = InsiderSignalScorer()
        self.cluster_detector = ClusterBuyingDetector()
        self.leaderboard = InsiderLeaderboard()
        self.market_context = InsiderMarketContextAnalyzer()

    def ingest_event(self, event: Dict[str, Any], quote: Dict[str, Any] | None = None) -> Dict[str, Any]:
        source_mode = event.get("source_mode", "SIM_REPLAY_DATA")
        if event.get("status") == "verified":
            event = {**event, "status": "simulated"}
        missing = [field for field in self.REQUIRED if event.get(field) in (None, "", "UNKNOWN")]
        normalized = {
            **event,
            "source_mode": source_mode,
            "status": "UNKNOWN" if missing else event.get("status", "simulated"),
            "ingested_at": now_iso(),
            "provenance": provenance("InsiderAlphaEngine") | {"source_mode": source_mode, "scenario_id": event.get("scenario_id")},
        }
        self.events.append(normalized)

        context = self.market_context.analyze(normalized, quote or {}) if quote is not None else {"market_confirmation": False, "status": "UNKNOWN", "missing_inputs": ["quote"], "source_mode": source_mode}
        cluster = self.cluster_detector.detect(self.events)
        alert = self.scorer.score(normalized, context, cluster)
        self.alerts.append(alert)
        result = {
            "event": normalized,
            "market_context": context,
            "cluster": cluster,
            "alert": alert,
            "status": normalized["status"] if normalized["status"] == "UNKNOWN" else "simulated",
            "source_mode": source_mode,
            "provenance": normalized["provenance"],
        }
        self.audit_log.record("insider_event_ingested", f"Ingested simulated insider event {event.get('accession_number', 'UNKNOWN')}", result)
        self.audit_log.record("insider_signal_scored", f"Scored simulated insider signal for {event.get('ticker', 'UNKNOWN')}", alert)
        return result

    def list_events(self):
        return self._collection("events", self.events)

    def list_alerts(self):
        return self._collection("alerts", self.alerts)

    def clusters(self):
        return self.cluster_detector.detect(self.events)

    def ranked_leaderboard(self):
        return self.leaderboard.rank(self.events)

    def _collection(self, key: str, values: List[Dict[str, Any]]):
        return {
            key: values,
            "status": "simulated",
            "source_mode": "SIM_REPLAY_DATA",
            "provenance": provenance("InsiderAlphaEngine") | {"source_mode": "SIM_REPLAY_DATA"},
        }
