# Product Rules

## Current Product Lock

Wolfie is an agentic trading intelligence app with two visible modes:

- **Paper**: uses the user's Wolfie capital amount, acquisition-ladder source states, TradeCostEngine estimates, bot decision frames, risk gates, memory, and self-healing.
- **Live**: shows the required authorized broker/execution setup path. It must not imply brokerage execution until that path is implemented and verified.

## Signal Console

Signal Console is the primary bot intelligence interface. The legacy force-graph thought view is not part of the normal product surface.

Signal Console must show:

- live market pulse/source freshness
- signal stack
- conflicts
- trade economics
- risk gate
- decision state
- rejected opportunities
- what would change the bot's mind
- learning memory
- self-healing history
- source freshness

## Data Integrity

Do not invent unavailable live data. Do not generate unsourced headlines. Do not bypass login walls, private groups, paywalls, or anti-scraping protections.

When data is unavailable, show a professional state: waiting, delayed, stale, fallback, or cached.

Normal product routes must not depend on fixtures, generated market candles, default tickers, or static confidence. Fixture replay and synthetic generation belong under `/api/dev-test-lab/*`.

## Trade Economics

Every proposed trade must pass through TradeCostEngine and the Risk Gate before being treated as actionable.

Direction confidence alone is not enough. Net expectancy after fees, spread, slippage, and account-size suitability must justify the decision.

## Small Account Protection

Small account threshold and strategy suitability must be configurable. Bots must suppress high-turnover low-margin setups unless trade economics prove the setup is viable after costs.

The UI should explain blocks plainly, such as high fee drag, poor execution quality, stale data, or insufficient expected move.

## Bot Presets

Bots must have real presets:

- risk tolerance
- trading style
- allocation mode
- attention targets
- ignored signals
- weights
- trade frequency limits
- stop loss/take profit/max daily loss
- confirmation rules
- learning rules
- self-healing guardrails
- plain-English education copy

Custom bot creation must let users define behavior without bypassing source, risk, and cost checks.

## Forbidden UI States

Do not show:

- raw keys
- debug-only data
- dead controls
- unsupported live execution claims
- hidden placeholder trading
- unsupported source claims
- `CONFIG_REQUIRED`

Every visible control must either function or explain the required setup step.
