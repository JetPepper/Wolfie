from __future__ import annotations

import re
from typing import List
from urllib.parse import urljoin

from .source_registry import SourceRegistry


HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)


class SourceDiscoveryEngine:
    def __init__(self, registry: SourceRegistry):
        self.registry = registry

    def discover_from_html(self, base_url: str, html: str, source_id: str | None = None) -> dict:
        links = sorted({urljoin(base_url, href) for href in HREF_RE.findall(html) if href and not href.startswith("#")})
        records = [self.registry.discover_candidate(link, "html_outbound_link", source_id).to_dict() for link in links[:50]]
        return {"status": "SOURCE_DISCOVERED", "base_url": base_url, "discovered_count": len(records), "sources": records}

    def discover_sources_for_symbol(self, symbol: str) -> dict:
        if not symbol:
            return {"status": "UNKNOWN", "reason": "No symbol supplied for source discovery.", "sources": []}
        templates = [
            ("SEC EDGAR search", f"https://www.sec.gov/edgar/search/#/q={symbol}"),
            ("Company investor relations search", f"https://www.sec.gov/cgi-bin/browse-edgar?CIK={symbol}&owner=exclude&action=getcompany"),
            ("Public market data page", f"https://stooq.com/q/?s={symbol.lower()}.us"),
        ]
        records = [self.registry.discover_candidate(url, label).to_dict() for label, url in templates]
        return {"status": "SOURCE_DISCOVERED", "symbol": symbol.upper(), "sources": records}

    def discover_common_feeds(self, url: str) -> dict:
        candidates = ["/feed", "/rss", "/rss.xml", "/atom.xml", "/sitemap.xml", "/news", "/press-releases", "/investors", "/investor-relations", "/sec-filings"]
        records = [self.registry.discover_candidate(urljoin(url, path), "common_feed_path").to_dict() for path in candidates]
        return {"status": "SOURCE_DISCOVERED", "url": url, "sources": records}
