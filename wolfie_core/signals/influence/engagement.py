from typing import Dict

from wolfie_core.common import provenance


class EngagementVelocityTracker:
    REQUIRED = ["mentions", "shares", "replies", "minutes_observed"]

    def track(self, engagement: Dict) -> Dict:
        missing = [field for field in self.REQUIRED if engagement.get(field) in (None, "", "UNKNOWN")]
        if missing:
            return {
                "mentions_per_minute": "UNKNOWN",
                "share_rate": "UNKNOWN",
                "reply_rate": "UNKNOWN",
                "status": "UNKNOWN",
                "missing_inputs": missing,
                "source_mode": "SIM_REPLAY_DATA",
                "provenance": provenance("EngagementVelocityTracker") | {"source_mode": "SIM_REPLAY_DATA"},
            }
        minutes = max(float(engagement["minutes_observed"]), 1)
        return {
            "mentions_per_minute": round(float(engagement["mentions"]) / minutes, 4),
            "share_rate": round(float(engagement["shares"]) / minutes, 4),
            "reply_rate": round(float(engagement["replies"]) / minutes, 4),
            "status": "calculated",
            "missing_inputs": [],
            "source_mode": "SIM_REPLAY_DATA",
            "provenance": provenance("EngagementVelocityTracker") | {"source_mode": "SIM_REPLAY_DATA"},
        }
