from __future__ import annotations

import re
from typing import List

from wolfie_core.common import new_id, now_iso

from .models import SourceClaim

CLAIM_KEYWORDS = {
    "earnings": ["earnings", "revenue", "profit", "guidance"],
    "merger": ["merger", "acquisition", "acquire", "takeover"],
    "regulatory": ["fda", "sec", "regulator", "approval", "recall"],
    "insider_trade": ["form 4", "insider", "director", "officer"],
    "politician_trade": ["house disclosure", "senate disclosure", "congressional"],
    "contract_award": ["contract", "award", "procurement"],
    "social_velocity": ["trending", "mentions", "viral"],
    "rumor": ["rumor", "unconfirmed", "reportedly"],
}


class ClaimExtractionEngine:
    def extract(self, source_id: str, article_id: str, title: str, body: str) -> dict:
        text = " ".join([title, body]).strip()
        if not text:
            return {"status": "UNKNOWN", "claims": [], "reason": "No article text supplied."}
        sentences = re.split(r"(?<=[.!?])\s+", text)
        claims: List[SourceClaim] = []
        for sentence in sentences:
            lowered = sentence.lower()
            claim_type = next((kind for kind, words in CLAIM_KEYWORDS.items() if any(word in lowered for word in words)), None)
            if not claim_type:
                continue
            tickers = sorted(set(re.findall(r"\b[A-Z]{2,5}\b", sentence)))
            claims.append(SourceClaim(
                id=new_id("claim"),
                source_id=source_id,
                article_id=article_id,
                claim_text=sentence[:500],
                claim_type=claim_type,
                tickers=tickers,
                entities=[],
                extracted_at=now_iso(),
                confidence=0.55 if "unconfirmed" not in lowered and "rumor" not in lowered else 0.25,
            ))
        return {"status": "SOURCE_PARTIAL" if claims else "INSUFFICIENT_DATA", "claims": [claim.to_dict() for claim in claims]}
