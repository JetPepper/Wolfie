from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


ALLOWED_DATA_STATUSES = {
    "SEARCHING_PUBLIC_SOURCES",
    "SOURCE_DISCOVERED",
    "SOURCE_VALIDATING",
    "SOURCE_AVAILABLE",
    "SOURCE_PARTIAL",
    "SOURCE_CONFLICT",
    "SOURCE_STALE",
    "SOURCE_BLOCKED_BY_TERMS",
    "SOURCE_BLOCKED_BY_ROBOTS",
    "SOURCE_REQUIRES_LOGIN",
    "SOURCE_PAYWALLED",
    "SOURCE_RATE_LIMITED",
    "SOURCE_UNAVAILABLE",
    "INSUFFICIENT_CORROBORATION",
    "VERIFIED_PRIMARY_SOURCE",
    "VERIFIED_CONSENSUS",
    "PARTIAL_CONSENSUS",
    "CONFLICTING_DATA",
    "STALE_DATA",
    "INSUFFICIENT_DATA",
    "UNKNOWN",
    "PAPER_ONLY_EXECUTION",
    "LIVE_DISABLED",
}


@dataclass
class AcquisitionStep:
    step: int
    name: str
    status: str
    detail: str
    source_url: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return self.__dict__.copy()


@dataclass
class SourceRecord:
    id: str
    name: str
    domain: str
    category: str
    source_type: str
    url: str
    rss_url: Optional[str] = None
    api_url: Optional[str] = None
    ingestion_method: str = "public_page"
    requires_key: bool = False
    free_tier_available: bool = True
    paid_only: bool = False
    terms_notes: str = "Use lawful public access only; do not bypass login, paywall, robots, or rate limits."
    robots_policy_status: str = "UNKNOWN"
    discovery_method: str = "seed_registry"
    discovered_from_source_id: Optional[str] = None
    discovered_from_url: Optional[str] = None
    discovered_at: Optional[str] = None
    status: str = "CANDIDATE"
    trust_tier: str = "CANDIDATE"
    reliability_score: float = 0.5
    sector_expertise_score: float = 0.5
    originality_score: float = 0.5
    timeliness_score: float = 0.5
    corroboration_score: float = 0.5
    historical_accuracy_score: float = 0.5
    market_relevance_score: float = 0.5
    correction_rate: float = 0.0
    contradiction_rate: float = 0.0
    false_positive_rate: float = 0.0
    manipulation_risk_score: float = 0.25
    source_independence_score: float = 0.5
    max_signal_weight: float = 0.05
    can_create_signal: bool = False
    can_confirm_signal: bool = True
    can_trigger_trade: bool = False
    last_validated_at: Optional[str] = None
    last_ingested_at: Optional[str] = None
    last_success_at: Optional[str] = None
    last_error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return self.__dict__.copy()


@dataclass
class SourceEvidence:
    id: str
    source_type: str
    source_name: str
    fetched_at: str
    observed_at: str
    freshness_state: str
    confidence: float
    raw_value_summary: str
    normalized_summary: str
    legal_access_mode: str
    used_in_decision: bool
    source_url: Optional[str] = None
    warning: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return self.__dict__.copy()


@dataclass
class SignalComputation:
    id: str
    signal_type: str
    inputs: List[SourceEvidence]
    formula_or_method: str
    output_direction: str
    output_magnitude: float
    output_confidence: float
    explanation: str
    stale_input_penalty: float
    conflict_penalty: float

    def to_dict(self) -> Dict[str, Any]:
        value = self.__dict__.copy()
        value["inputs"] = [item.to_dict() for item in self.inputs]
        return value


@dataclass
class SourceClaim:
    id: str
    source_id: str
    article_id: str
    claim_text: str
    claim_type: str
    tickers: List[str]
    entities: List[str]
    extracted_at: str
    confidence: float
    verification_status: str = "SOURCE_VALIDATING"
    verification_sources: List[str] = field(default_factory=list)
    contradiction_sources: List[str] = field(default_factory=list)
    primary_source_url: Optional[str] = None
    market_reaction_score: Optional[float] = None
    eventual_outcome: Optional[str] = None
    created_signal_ids: List[str] = field(default_factory=list)
    event_date: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return self.__dict__.copy()


@dataclass
class MarketConsensus:
    symbol: str
    requested_at: str
    sources_requested: List[str]
    sources_returned: List[str]
    sources_failed: List[str]
    source_values: List[Dict[str, Any]]
    consensus_price: Optional[float]
    consensus_bid: Optional[float]
    consensus_ask: Optional[float]
    consensus_spread_bps: Optional[float]
    consensus_volume: Optional[float]
    timestamp_freshness_score: float
    source_agreement_score: float
    outliers: List[str]
    warnings: List[str]
    truth_confidence: float
    status: str
    acquisition_trace: List[AcquisitionStep]

    def to_dict(self) -> Dict[str, Any]:
        value = self.__dict__.copy()
        value["acquisition_trace"] = [step.to_dict() for step in self.acquisition_trace]
        return value
