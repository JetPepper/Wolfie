from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Iterable

from wolfie_core.audit.log import AuditLog
from wolfie_core.common import now_iso, provenance


class FixtureLoader:
    def __init__(self, root: Path | None = None, audit_log: AuditLog | None = None):
        self.root = root or Path(__file__).resolve().parents[2] / "fixtures"
        self.audit_log = audit_log or AuditLog()

    def load(self, category: str, filename: str, required_fields: Iterable[str] | None = None) -> Dict[str, Any]:
        fixture_id = f"{category}/{filename}"
        path = self.root / category / filename
        if not path.exists():
            result = self._unknown(fixture_id, ["fixture_file"])
            self.audit_log.record("missing_data", f"Missing fixture {fixture_id}", result)
            return result
        with path.open() as handle:
            payload = json.load(handle)
        missing = [field for field in (required_fields or []) if payload.get(field) in (None, "", "UNKNOWN")]
        if missing:
            result = {**payload, **self._unknown(fixture_id, missing)}
            self.audit_log.record("missing_unknown_field", f"Fixture {fixture_id} missing {missing}", result)
            return result
        result = {
            **payload,
            "fixture_id": fixture_id,
            "source_mode": payload.get("source_mode", "SIM_REPLAY_DATA"),
            "status": "simulated",
            "loaded_at": now_iso(),
            "provenance": provenance("FixtureLoader") | {"source_mode": payload.get("source_mode", "SIM_REPLAY_DATA")},
        }
        self.audit_log.record("fixture_loaded", f"Loaded fixture {fixture_id}", result)
        return result

    def _unknown(self, fixture_id: str, missing_fields):
        return {
            "fixture_id": fixture_id,
            "source_mode": "SIM_REPLAY_DATA",
            "status": "UNKNOWN",
            "missing_fields": list(missing_fields),
            "loaded_at": now_iso(),
            "provenance": provenance("FixtureLoader") | {"source_mode": "SIM_REPLAY_DATA"},
        }
