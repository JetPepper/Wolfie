from typing import Dict

from wolfie_core.common import provenance


class SentimentScorer:
    BULLISH = {"beat", "beats", "raises", "raise", "strong", "breakout", "upgrade", "approval", "growth", "demand"}
    BEARISH = {"miss", "cut", "lawsuit", "downgrade", "bankruptcy", "fraud", "fade", "weak", "short report"}
    URGENT = {"breaking", "urgent", "now", "just"}
    UNCERTAIN = {"rumor", "unconfirmed", "may", "could", "might"}

    def score(self, text: str) -> Dict:
        words = (text or "").lower()
        bullish_hits = sum(1 for word in self.BULLISH if word in words)
        bearish_hits = sum(1 for word in self.BEARISH if word in words)
        sentiment_score = max(-100, min(100, (bullish_hits - bearish_hits) * 22))
        if sentiment_score > 10:
            label = "bullish"
        elif sentiment_score < -10:
            label = "bearish"
        else:
            label = "neutral"
        return {
            "sentiment_score": sentiment_score,
            "urgency_score": min(100, sum(1 for word in self.URGENT if word in words) * 25),
            "uncertainty_score": min(100, sum(1 for word in self.UNCERTAIN if word in words) * 30),
            "bullish_bearish_neutral": label,
            "catalyst_type": self._catalyst(words),
            "status": "calculated" if text else "UNKNOWN",
            "source_mode": "SIM_REPLAY_DATA",
            "provenance": provenance("SentimentScorer") | {"source_mode": "SIM_REPLAY_DATA"},
        }

    def _catalyst(self, text: str) -> str:
        checks = [
            ("upgrade", "analyst_upgrade"),
            ("downgrade", "analyst_downgrade"),
            ("earnings", "earnings"),
            ("guidance", "guidance"),
            ("regulatory", "regulatory"),
            ("fda", "FDA"),
            ("merger", "merger_acquisition"),
            ("acquisition", "merger_acquisition"),
            ("lawsuit", "lawsuit"),
            ("ceo", "management_change"),
            ("sec", "SEC_filing"),
            ("macro", "macro"),
            ("launch", "product_launch"),
            ("bankruptcy", "bankruptcy_distress"),
            ("short report", "short_report"),
            ("moon", "social_hype"),
            ("hype", "social_hype"),
        ]
        for needle, catalyst in checks:
            if needle in text:
                return catalyst
        return "unknown"
