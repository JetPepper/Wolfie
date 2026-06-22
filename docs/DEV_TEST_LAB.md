# Dev Test Lab

Wolfie keeps fixture replay, scenarios, and synthetic generation behind `/api/dev-test-lab/*`.

These routes are for deterministic development checks only. They are not the normal Signal Console runtime, do not represent live intelligence, and must not drive user-facing market claims.

Normal beta routes use the source registry, discovery, validation, claim extraction, corroboration, market consensus, TradeCostEngine, risk gate, and paper-only execution gate. If a source is unavailable, the normal product returns `UNKNOWN`, `SOURCE_UNAVAILABLE`, `waiting`, `delayed`, `stale`, `fallback`, or `cached` rather than fabricating data.
