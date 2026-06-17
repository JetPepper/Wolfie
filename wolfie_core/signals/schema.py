from __future__ import annotations

from typing import Any, Dict, List

from wolfie_core.common import new_id, now_iso, provenance


def make_signal(
    strategy_id: str,
    strategy_name: str,
    symbol: str,
    side: str,
    confidence_score: float,
    setup_type: str,
    reason_json: Dict[str, Any],
    required_inputs: List[str],
    input_data_points: Dict[str, Any],
    status: str = "simulated",
    missing_inputs: List[str] | None = None,
) -> Dict[str, Any]:
    if missing_inputs:
        status = "UNKNOWN"
        side = "HOLD"
    return {
        "signal_id": new_id("signal"),
        "strategy_id": strategy_id,
        "strategy_name": strategy_name,
        "symbol": symbol,
        "side": side,
        "confidence_score": confidence_score,
        "setup_type": setup_type,
        "reason_json": reason_json,
        "required_inputs": required_inputs,
        "missing_inputs": missing_inputs or [],
        "input_data_points": input_data_points,
        "created_at": now_iso(),
        "status": status,
        "provenance": provenance(strategy_name),
    }
