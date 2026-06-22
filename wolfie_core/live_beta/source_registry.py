from __future__ import annotations

from typing import Dict, Iterable, List, Optional
from urllib.parse import urlparse

from wolfie_core.common import new_id, now_iso

from .models import SourceRecord
from .seed_registry import SEED_SOURCES


class SourceRegistry:
    def __init__(self, seeds: Iterable[dict] | None = None):
        self.sources: Dict[str, SourceRecord] = {}
        for seed in seeds or SEED_SOURCES:
            self.register_seed(seed)

    def register_seed(self, seed: dict) -> SourceRecord:
        source = SourceRecord(
            id=seed["id"],
            name=seed["name"],
            domain=seed["domain"],
            category=seed["category"],
            source_type=seed["source_type"],
            url=seed["url"],
            rss_url=seed.get("rss_url"),
            api_url=seed.get("api_url"),
            status=seed.get("status", seed.get("trust_tier", "CANDIDATE")),
            trust_tier=seed.get("trust_tier", "CANDIDATE"),
            reliability_score=seed.get("reliability_score", 0.5),
            max_signal_weight=seed.get("max_signal_weight", 0.05),
            can_create_signal=seed.get("can_create_signal", False),
            can_trigger_trade=False,
            discovered_at=now_iso(),
        )
        if source.trust_tier in {"TRUSTED", "SECTOR_AUTHORITY"}:
            source.can_confirm_signal = True
        self.sources[source.id] = source
        return source

    def discover_candidate(self, url: str, context: str, discovered_from_source_id: str | None = None) -> SourceRecord:
        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace("www.", "") or "unknown"
        existing = self.find_by_domain(domain)
        if existing:
            return existing
        source = SourceRecord(
            id=new_id("src"),
            name=domain,
            domain=domain,
            category="discovered",
            source_type="public_page",
            url=url,
            discovery_method=context,
            discovered_from_source_id=discovered_from_source_id,
            discovered_from_url=url,
            discovered_at=now_iso(),
            status="CANDIDATE",
            trust_tier="CANDIDATE",
            reliability_score=0.35,
            max_signal_weight=0.02,
            can_create_signal=False,
            can_confirm_signal=False,
            can_trigger_trade=False,
        )
        self.sources[source.id] = source
        return source

    def find_by_domain(self, domain: str) -> Optional[SourceRecord]:
        normalized = domain.lower().replace("www.", "")
        return next((source for source in self.sources.values() if source.domain == normalized), None)

    def get(self, source_id: str) -> Optional[SourceRecord]:
        return self.sources.get(source_id)

    def list_sources(self) -> List[dict]:
        return [source.to_dict() for source in sorted(self.sources.values(), key=lambda item: (item.category, item.name))]

    def health(self) -> dict:
        records = list(self.sources.values())
        return {
            "status": "SOURCE_AVAILABLE",
            "total_sources": len(records),
            "trusted_sources": len([source for source in records if source.trust_tier in {"TRUSTED", "SECTOR_AUTHORITY"}]),
            "candidate_sources": len([source for source in records if source.status in {"CANDIDATE", "QUARANTINED"}]),
            "trade_trigger_sources": len([source for source in records if source.can_trigger_trade]),
            "note": "No source can trigger a paper trade without corroboration, market consensus, RiskGate, and TradeCostEngine approval.",
        }
