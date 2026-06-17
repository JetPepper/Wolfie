from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List

from wolfie_core.broker.environment import MCP_SERVER_NAME, SOURCE_MODE


SIM_SOURCE_MODES = {"simulated", "SIM_REPLAY_DATA", "SIM_SYNTHETIC_DATA"}


SUPPORTED_STATUSES = {
    "verified",
    "calculated",
    "estimated",
    "forecasted",
    "simulated",
    "stale",
    "UNKNOWN",
    "rejected",
}


class DataIntegrityService:
    def label_simulated(self, payload: Dict[str, Any], source_name: str = MCP_SERVER_NAME, source_mode: str = SOURCE_MODE) -> Dict[str, Any]:
        labeled = deepcopy(payload)
        labeled["status"] = "simulated"
        labeled["source_mode"] = source_mode
        labeled["provenance"] = self.provenance(source_name=source_name, source_mode=source_mode, scenario_id=payload.get("scenario_id"), replay_id=payload.get("replay_id"), seed=payload.get("seed"))
        return labeled

    def require_fields(
        self,
        payload: Dict[str, Any],
        required_fields: Iterable[str],
        source_name: str,
        source_mode: str = SOURCE_MODE,
    ) -> Dict[str, Any]:
        missing = [
            field
            for field in required_fields
            if field not in payload or payload[field] is None or payload[field] == ""
        ]
        if missing:
            return {
                "status": "UNKNOWN",
                "missing_fields": missing,
                "source_mode": source_mode,
                "provenance": self.provenance(source_name=source_name, source_mode=source_mode),
            }
        return self.label_simulated(payload, source_name=source_name, source_mode=source_mode)

    def detect_stale(self, payload: Dict[str, Any], max_age_seconds: int, now: datetime | None = None) -> Dict[str, Any]:
        timestamp = payload.get("timestamp")
        if not timestamp:
            return {"status": "UNKNOWN", "missing_fields": ["timestamp"], "provenance": self.provenance(source_name="DataIntegrityService", source_mode=payload.get("source_mode", SOURCE_MODE))}
        observed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        current = now or datetime.now(timezone.utc)
        if (current - observed).total_seconds() > max_age_seconds:
            stale = deepcopy(payload)
            stale["status"] = "stale"
            stale["provenance"] = self.provenance(source_name="DataIntegrityService", source_mode=payload.get("source_mode", SOURCE_MODE))
            return stale
        return self.label_simulated(payload, source_name="DataIntegrityService", source_mode=payload.get("source_mode", SOURCE_MODE))

    def validate_status(self, status: str) -> str:
        if status not in SUPPORTED_STATUSES:
            return "UNKNOWN"
        if status == "verified" and SOURCE_MODE == "simulated":
            return "simulated"
        return status

    def provenance(self, source_name: str, source_mode: str = SOURCE_MODE, scenario_id=None, replay_id=None, seed=None) -> Dict[str, Any]:
        data = {
            "source_name": source_name,
            "source_mode": source_mode,
            "mcp_server": MCP_SERVER_NAME,
            "observed_at": datetime.now(timezone.utc).isoformat(),
        }
        if scenario_id is not None:
            data["scenario_id"] = scenario_id
        if replay_id is not None:
            data["replay_id"] = replay_id
        if seed is not None:
            data["seed"] = seed
        return data
