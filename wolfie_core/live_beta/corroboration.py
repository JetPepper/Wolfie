from __future__ import annotations

from typing import Iterable

from .models import SourceClaim, SourceRecord


class CorroborationEngine:
    def corroborate(self, claim: SourceClaim, sources: Iterable[SourceRecord]) -> dict:
        source_list = list(sources)
        primary = [source for source in source_list if source.source_type.startswith("official")]
        independent = {source.domain for source in source_list if source.domain and source.status not in {"QUARANTINED", "REJECTED"}}
        duplicate_reposts = max(0, len(source_list) - len(independent))
        contradiction_count = len(claim.contradiction_sources)
        corroboration_score = min(1.0, (0.45 if primary else 0) + len(independent) * 0.12 - duplicate_reposts * 0.05 - contradiction_count * 0.2)
        truth_confidence = max(0.0, min(1.0, claim.confidence * 0.45 + corroboration_score * 0.55))
        status = "VERIFIED_PRIMARY_SOURCE" if primary and truth_confidence >= 0.72 else "PARTIAL_CONSENSUS" if truth_confidence >= 0.45 else "INSUFFICIENT_CORROBORATION"
        return {
            "status": status,
            "claim_id": claim.id,
            "primary_source_found": bool(primary),
            "independent_confirmations_count": len(independent),
            "duplicate_reposts_count": duplicate_reposts,
            "contradiction_count": contradiction_count,
            "corroboration_score": round(corroboration_score, 3),
            "truth_confidence": round(truth_confidence, 3),
        }
