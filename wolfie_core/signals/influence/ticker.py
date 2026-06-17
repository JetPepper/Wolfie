from __future__ import annotations

import re
from typing import Dict

from wolfie_core.common import provenance


COMMON_WORDS = {"THE", "AND", "FOR", "CEO", "CFO", "FDA", "SEC", "A", "I", "IT", "AI", "USA", "IPO"}


class TickerMentionExtractor:
    def __init__(self, alias_map: Dict[str, str] | None = None):
        self.alias_map = alias_map or {"Apple": "AAPL", "Apple Inc": "AAPL"}

    def extract(self, text: str) -> Dict:
        tickers = set()
        for match in re.findall(r"\$?\b[A-Z]{1,5}\b", text or ""):
            symbol = match.replace("$", "")
            if symbol not in COMMON_WORDS:
                tickers.add(symbol)
        lower = (text or "").lower()
        for alias, ticker in self.alias_map.items():
            if alias.lower() in lower:
                tickers.add(ticker)
        status = "calculated" if tickers else "UNKNOWN"
        return {
            "tickers": sorted(tickers),
            "confidence": 0.9 if tickers else 0,
            "status": status,
            "missing_inputs": [] if tickers else ["ticker"],
            "source_mode": "SIM_REPLAY_DATA",
            "provenance": provenance("TickerMentionExtractor") | {"source_mode": "SIM_REPLAY_DATA"},
        }
