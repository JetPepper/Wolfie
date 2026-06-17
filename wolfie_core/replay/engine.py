from __future__ import annotations

from typing import Any, Dict, List

from wolfie_core.audit.log import AuditLog
from wolfie_core.common import new_id, provenance


class ReplayEngine:
    def __init__(self, audit_log: AuditLog | None = None):
        self.audit_log = audit_log or AuditLog()
        self.runs: Dict[str, Dict[str, Any]] = {}

    def replay(self, scenario: Dict[str, Any], speed: str = "instant") -> Dict[str, Any]:
        replay_id = new_id("replay")
        events = []
        for key in ["simulated_quote_events", "simulated_candle_events", "simulated_filing_events", "simulated_news_events", "simulated_social_events", "decision_events"]:
            events.extend(scenario.get(key, []))
        events = sorted(events, key=lambda event: event.get("timestamp", ""))
        self.audit_log.record("replay_started", f"Replay started for {scenario['scenario_id']}", {"replay_id": replay_id, "scenario_id": scenario["scenario_id"], "speed": speed})
        decisions = []
        for event in events:
            processed = {**event, "replay_id": replay_id, "source_mode": "SIM_REPLAY_DATA", "status": event.get("status", "simulated"), "provenance": provenance("ReplayEngine") | {"replay_id": replay_id, "scenario_id": scenario["scenario_id"]}}
            self.audit_log.record("replay_event_processed", f"Processed replay event {event.get('type')}", processed)
            if event.get("type") in {"wolfie_decision", "paper_trade_signal", "risk_block", "manual_review"}:
                decisions.append(processed)
                self.audit_log.record("wolfie_decision_during_replay", f"Wolfie decision {event.get('type')}", processed, event.get("type") == "paper_trade_signal")
        result = {
            "replay_id": replay_id,
            "scenario_id": scenario["scenario_id"],
            "speed": speed,
            "status": "completed",
            "source_mode": "SIM_REPLAY_DATA",
            "events": events,
            "decisions": decisions,
            "provenance": provenance("ReplayEngine") | {"replay_id": replay_id, "scenario_id": scenario["scenario_id"]},
        }
        self.runs[replay_id] = result
        self.audit_log.record("replay_completed", f"Replay completed for {scenario['scenario_id']}", result)
        return result

    def list_runs(self) -> Dict[str, Any]:
        return {"status": "simulated", "source_mode": "SIM_REPLAY_DATA", "runs": list(self.runs.values()), "provenance": provenance("ReplayEngine")}

    def get_run(self, replay_id: str) -> Dict[str, Any]:
        return self.runs.get(replay_id, {"status": "UNKNOWN", "source_mode": "SIM_REPLAY_DATA", "replay_id": replay_id, "provenance": provenance("ReplayEngine")})
