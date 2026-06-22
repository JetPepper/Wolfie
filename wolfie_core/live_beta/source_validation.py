from __future__ import annotations

from urllib.parse import urlparse

from wolfie_core.common import now_iso

from .models import SourceRecord


class SourceValidationEngine:
    def validate(self, source: SourceRecord) -> dict:
        parsed = urlparse(source.url)
        identity_validated = bool(parsed.scheme in {"http", "https"} and parsed.netloc)
        official = source.source_type.startswith("official") or source.domain.endswith(".gov") or source.domain == "sec.gov"
        manipulation_risk = 0.08 if official else max(0.15, source.manipulation_risk_score)
        reliability = max(source.reliability_score, 0.82 if official else source.reliability_score)
        status = "SECTOR_AUTHORITY" if official else ("PROVISIONALLY_TRUSTED" if reliability >= 0.65 else "CANDIDATE")
        source.last_validated_at = now_iso()
        source.status = status
        source.trust_tier = status
        source.reliability_score = reliability
        source.manipulation_risk_score = manipulation_risk
        source.max_signal_weight = 0.35 if official else min(source.max_signal_weight, 0.08)
        source.can_create_signal = official and source.category in {"filings", "regulatory", "procurement"}
        source.can_trigger_trade = False
        return {
            "status": "SOURCE_VALIDATING",
            "source_id": source.id,
            "identity_validated": identity_validated,
            "sector_relevance_score": source.sector_expertise_score,
            "initial_reliability_score": reliability,
            "manipulation_risk_score": manipulation_risk,
            "independence_score": source.source_independence_score,
            "allowed_use": "context_and_confirmation_only" if not source.can_create_signal else "primary_evidence_requires_corroboration",
            "max_signal_weight": source.max_signal_weight,
            "trust_tier": source.trust_tier,
            "source_status": source.status,
        }
