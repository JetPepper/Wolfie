from __future__ import annotations

from .source_discovery import SourceDiscoveryEngine


class CompanySourceBundleService:
    def __init__(self, discovery: SourceDiscoveryEngine):
        self.discovery = discovery

    def create_bundle(self, symbol: str, company_name: str | None = None) -> dict:
        if not symbol:
            return {"status": "UNKNOWN", "sources": [], "reason": "No symbol supplied for company source bundle."}
        discovered = self.discovery.discover_sources_for_symbol(symbol)
        return {
            "status": "SOURCE_DISCOVERED",
            "symbol": symbol.upper(),
            "company_name": company_name,
            "bundle_types": [
                "investor_relations",
                "press_releases",
                "sec_filings",
                "insider_filings",
                "earnings",
                "product_updates",
                "regulatory_updates",
            ],
            "sources": discovered["sources"],
        }
