from __future__ import annotations

from typing import Any, Dict

from wolfie_core.audit.log import AuditLog
from wolfie_core.common import provenance


class ScenarioValidator:
    def __init__(self, audit_log: AuditLog | None = None):
        self.audit_log = audit_log or AuditLog()

    def validate(self, scenario_result: Dict[str, Any]) -> Dict[str, Any]:
        events = scenario_result.get("actual_events", [])
        for event in events:
            if event.get("live_order_submitted") is True:
                return self._failed("unexpected_live_order_attempt")
            if event.get("source_mode") in {"SIM_REPLAY_DATA", "SIM_SYNTHETIC_DATA"} and event.get("status") == "verified":
                return self._failed("unexpected_verified_label")
            if event.get("status") == "verified" and scenario_result.get("source_mode") in {"SIM_REPLAY_DATA", "SIM_SYNTHETIC_DATA"}:
                return self._failed("unexpected_verified_label")

        expected = scenario_result.get("expected", {})
        actual_paper = sum(1 for event in events if event.get("type") == "paper_trade_signal")
        actual_blocks = sum(1 for event in events if event.get("type") in {"risk_block", "manual_review"})
        actual_unknown = sum(1 for event in events if event.get("status") == "UNKNOWN" or "UNKNOWN" in str(event.get("payload", {})))
        actual_risk = sum(1 for event in events if event.get("type") == "risk_block")
        partial = actual_paper < expected.get("paper_trades", 0) or actual_blocks < expected.get("blocked_trades", 0)
        result = {
            "scenario_id": scenario_result.get("scenario_id"),
            "validation_status": "partial" if partial else "passed",
            "expected_paper_trades": expected.get("paper_trades", 0),
            "actual_paper_trades": actual_paper,
            "expected_blocked_trades": expected.get("blocked_trades", 0),
            "actual_blocked_trades": actual_blocks,
            "expected_unknown_values": max(expected.get("unknown_values", 0), actual_unknown),
            "expected_risk_blocks": max(expected.get("risk_blocks", 0), actual_risk),
            "manual_review_required": expected.get("manual_review_required", False),
            "status": "simulated",
            "source_mode": "SIM_REPLAY_DATA",
            "provenance": provenance("ScenarioValidator") | {"source_mode": "SIM_REPLAY_DATA"},
        }
        self.audit_log.record("scenario_validation_result", f"Validated scenario {result['scenario_id']}", result)
        return result

    def _failed(self, reason):
        result = {"validation_status": "failed", "failure_reason": reason, "status": "rejected", "source_mode": "SIM_REPLAY_DATA", "provenance": provenance("ScenarioValidator")}
        self.audit_log.record("data_integrity_violation", reason, result)
        self.audit_log.record("scenario_validation_result", reason, result)
        return result
