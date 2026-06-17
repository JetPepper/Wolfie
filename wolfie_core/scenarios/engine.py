from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

from wolfie_core.audit.log import AuditLog
from wolfie_core.common import now_iso, provenance
from wolfie_core.scenarios.catalog import REQUIRED_SCENARIO_NAMES, scenario_template


class ScenarioEngine:
    def __init__(self, audit_log: AuditLog | None = None):
        self.audit_log = audit_log or AuditLog()
        self.root = Path(__file__).resolve().parents[2] / "fixtures" / "scenarios"
        self.loaded: Dict[str, Dict[str, Any]] = {}

    def list_scenarios(self) -> Dict[str, Any]:
        return {
            "status": "simulated",
            "source_mode": "SIM_REPLAY_DATA",
            "scenarios": [self._summary(self.get_scenario(name)) for name in REQUIRED_SCENARIO_NAMES],
            "provenance": provenance("ScenarioEngine") | {"source_mode": "SIM_REPLAY_DATA"},
        }

    def get_scenario(self, scenario_id: str) -> Dict[str, Any]:
        path = self.root / f"{scenario_id}.json"
        if path.exists():
            with path.open() as handle:
                scenario = json.load(handle)
        else:
            scenario = scenario_template(scenario_id, seed=abs(hash(scenario_id)) % 10000)
        scenario["source_mode"] = "SIM_REPLAY_DATA"
        scenario["status"] = "simulated"
        scenario["provenance"] = provenance("ScenarioEngine") | {"source_mode": "SIM_REPLAY_DATA", "scenario_id": scenario_id, "seed": scenario.get("seed")}
        return scenario

    def load_scenario(self, scenario_id: str) -> Dict[str, Any]:
        scenario = self.get_scenario(scenario_id)
        scenario["loaded_at"] = now_iso()
        self.loaded[scenario_id] = scenario
        self.audit_log.record("scenario_loaded", f"Loaded scenario {scenario_id}", scenario)
        return scenario

    def run_scenario(self, scenario_id: str) -> Dict[str, Any]:
        scenario = self.load_scenario(scenario_id)
        actual_events = scenario.get("simulated_quote_events", []) + scenario.get("simulated_candle_events", []) + scenario.get("decision_events", [])
        result = {
            "scenario_id": scenario_id,
            "status": "simulated",
            "source_mode": "SIM_REPLAY_DATA",
            "scenario": scenario,
            "actual_events": actual_events,
            "expected": {
                "paper_trades": scenario["expected_paper_trades"],
                "blocked_trades": scenario["expected_blocked_trades"],
                "unknown_values": scenario["expected_unknown_values"],
                "risk_blocks": scenario["expected_risk_blocks"],
                "audit_events": scenario["expected_audit_events"],
                "manual_review_required": scenario.get("manual_review_required", False),
            },
            "provenance": provenance("ScenarioEngine") | {"source_mode": "SIM_REPLAY_DATA", "scenario_id": scenario_id},
        }
        self.audit_log.record("wolfie_decision_during_replay", f"Scenario decisions prepared for {scenario_id}", result)
        return result

    def _summary(self, scenario):
        return {
            "scenario_id": scenario["scenario_id"],
            "scenario_name": scenario["scenario_name"],
            "description": scenario["description"],
            "source_mode": scenario["source_mode"],
            "tickers": scenario["simulated_tickers"],
            "expected_behavior": scenario["expected_wolfie_behavior"],
            "status": scenario["status"],
        }
