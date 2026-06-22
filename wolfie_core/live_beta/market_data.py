from __future__ import annotations

import csv
import io
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from wolfie_core.common import now_iso

from .models import AcquisitionStep, MarketConsensus
from .source_registry import SourceRegistry


def normalize_symbol(symbol: str) -> str:
    return "".join(ch for ch in symbol.upper().strip() if ch.isalnum() or ch in {".", "-"})


class MarketDataAcquisitionService:
    def __init__(self, registry: SourceRegistry):
        self.registry = registry
        self.cache: Dict[str, Dict[str, Any]] = {}

    def get_quote(self, symbol: str) -> dict:
        consensus = MarketConsensusEngine(self).resolve_market_consensus(symbol)
        return consensus.to_dict()

    def get_quotes(self, symbols: List[str]) -> dict:
        return {"status": "SOURCE_AVAILABLE", "quotes": [self.get_quote(symbol) for symbol in symbols if normalize_symbol(symbol)]}

    def get_candles(self, symbol: str, timeframe: str = "1d", start: str | None = None, end: str | None = None) -> dict:
        normalized = normalize_symbol(symbol)
        if not normalized:
            return {"status": "UNKNOWN", "symbol": None, "candles": [], "reason": "No symbol supplied."}
        trace = self._base_trace(normalized)
        quote = self._fetch_stooq_quote(normalized, trace)
        if not quote:
            return {"status": "SOURCE_UNAVAILABLE", "symbol": normalized, "candles": [], "acquisition_trace": [step.to_dict() for step in trace]}
        price = quote["last"]
        candle = {"timestamp": quote["observed_at"], "open": price, "high": price, "low": price, "close": price, "volume": quote.get("volume"), "source_id": "stooq"}
        return {"status": "SOURCE_PARTIAL", "symbol": normalized, "timeframe": timeframe, "candles": [candle], "warning": "Only latest public quote was available; no synthetic candle series generated.", "acquisition_trace": [step.to_dict() for step in trace]}

    def get_market_status(self) -> dict:
        return {"status": "SOURCE_PARTIAL", "market": "US equities", "detail": "Market calendar source not yet corroborated in this beta route."}

    def get_snapshot(self, symbol: str) -> dict:
        return self.get_quote(symbol)

    def get_latest_trade(self, symbol: str) -> dict:
        return self.get_quote(symbol)

    def get_corporate_actions(self, symbol: str) -> dict:
        return {"status": "SOURCE_UNAVAILABLE", "symbol": normalize_symbol(symbol), "actions": [], "reason": "Corporate-actions source not yet acquired."}

    def get_news(self, symbol: str) -> dict:
        return {"status": "SEARCHING_PUBLIC_SOURCES", "symbol": normalize_symbol(symbol), "articles": [], "reason": "News ingestion waits for source discovery; no fallback headlines are fabricated."}

    def get_provider_health(self) -> dict:
        return {"status": "SOURCE_AVAILABLE", "providers": self.registry.health()}

    def discover_public_market_sources(self, symbol: str) -> dict:
        return {"status": "SOURCE_DISCOVERED", "symbol": normalize_symbol(symbol), "sources": [self.registry.get("stooq").to_dict()] if self.registry.get("stooq") else []}

    def extract_public_quote(self, source_url: str) -> dict:
        return {"status": "SOURCE_VALIDATING", "source_url": source_url, "reason": "HTML quote extraction is queued; no value is inferred from page text."}

    def extract_public_candles(self, source_url: str) -> dict:
        return {"status": "SOURCE_VALIDATING", "source_url": source_url, "reason": "HTML candle extraction is queued; no chart data is fabricated."}

    def _base_trace(self, symbol: str) -> List[AcquisitionStep]:
        cached = symbol in self.cache
        return [
            AcquisitionStep(1, "Local real-data cache", "SOURCE_AVAILABLE" if cached else "SOURCE_UNAVAILABLE", "Checked recent real-data cache.", None),
            AcquisitionStep(2, "Official primary public source", "SEARCHING_PUBLIC_SOURCES", "No official quote source is assumed for this symbol.", None),
            AcquisitionStep(3, "Public feeds/pages", "SEARCHING_PUBLIC_SOURCES", "Trying lawful public market-data page provider.", "https://stooq.com/"),
        ]

    def _fetch_stooq_quote(self, symbol: str, trace: List[AcquisitionStep]) -> Optional[dict]:
        stooq_symbol = f"{symbol.lower()}.us"
        url = f"https://stooq.com/q/l/?s={stooq_symbol}&f=sd2t2ohlcv&h&e=csv"
        try:
            request = Request(url, headers={"User-Agent": "Wolfie live-agent-beta source validation"})
            with urlopen(request, timeout=8) as response:
                text = response.read().decode("utf-8", errors="replace")
            rows = list(csv.DictReader(io.StringIO(text)))
            row = rows[0] if rows else {}
            close_value = row.get("Close") or row.get("Last")
            if not close_value or close_value.upper() == "N/D":
                trace.append(AcquisitionStep(4, "Public market page extraction", "SOURCE_UNAVAILABLE", "Provider returned no quote value.", url))
                return None
            quote = {
                "symbol": symbol,
                "source_id": "stooq",
                "source_name": "Stooq Public Market Data",
                "source_url": url,
                "last": float(close_value),
                "bid": None,
                "ask": None,
                "volume": float(row["Volume"]) if row.get("Volume", "").replace(".", "", 1).isdigit() else None,
                "observed_at": f"{row.get('Date', '')}T{row.get('Time', '')}Z" if row.get("Date") and row.get("Time") else now_iso(),
                "fetched_at": now_iso(),
                "status": "SOURCE_AVAILABLE",
            }
            self.cache[symbol] = quote
            trace.append(AcquisitionStep(4, "Public market page extraction", "SOURCE_AVAILABLE", "Fetched public quote value with source URL and timestamp.", url))
            return quote
        except (HTTPError, URLError, TimeoutError, ValueError) as error:
            trace.append(AcquisitionStep(4, "Public market page extraction", "SOURCE_UNAVAILABLE", f"Public quote fetch failed: {type(error).__name__}", url))
            return None


class MarketConsensusEngine:
    def __init__(self, acquisition: MarketDataAcquisitionService):
        self.acquisition = acquisition

    def resolve_market_consensus(self, symbol: str) -> MarketConsensus:
        normalized = normalize_symbol(symbol)
        trace = self.acquisition._base_trace(normalized) if normalized else [AcquisitionStep(1, "Input validation", "UNKNOWN", "No symbol supplied.")]
        if not normalized:
            return MarketConsensus("", now_iso(), [], [], [], [], None, None, None, None, None, 0, 0, [], ["No symbol supplied."], 0, "UNKNOWN", trace)
        quote = self.acquisition._fetch_stooq_quote(normalized, trace)
        if not quote:
            return MarketConsensus(normalized, now_iso(), ["stooq"], [], ["stooq"], [], None, None, None, None, None, 0, 0, [], ["No quote source returned a usable price."], 0, "SOURCE_UNAVAILABLE", trace)
        source_values = [quote]
        return MarketConsensus(
            symbol=normalized,
            requested_at=now_iso(),
            sources_requested=["stooq"],
            sources_returned=["stooq"],
            sources_failed=[],
            source_values=source_values,
            consensus_price=quote["last"],
            consensus_bid=None,
            consensus_ask=None,
            consensus_spread_bps=None,
            consensus_volume=quote.get("volume"),
            timestamp_freshness_score=0.65,
            source_agreement_score=0.45,
            outliers=[],
            warnings=["Only one public quote source returned; confidence is reduced.", "Bid/ask spread unavailable, so execution planning must block paper orders."],
            truth_confidence=0.45,
            status="PARTIAL_CONSENSUS",
            acquisition_trace=trace,
        )
