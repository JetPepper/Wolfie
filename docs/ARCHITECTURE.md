# Architecture

Wolfie now centers on an agentic bot runtime, not a paper broker simulation framework.

## Primary Runtime Path

`Data Acquisition Layer -> Source Adapters -> Acquisition Ladder -> Normalization -> Signal Store -> Indicator Engine -> Bot Preset Engine -> Bot Decision Engine -> TradeCostEngine -> Risk Gate -> Execution/Simulation Engine -> Bot Memory/Learning Engine -> Self-Healing Engine -> Signal Console UI`

The current frontend implementation lives primarily in:

- `apps/web/app/lib/agentic-runtime.ts`
- `apps/web/app/lib/fees.ts`
- `apps/web/app/page.tsx`

## Acquisition Ladder

Each source lane has an adapter path, cadence, freshness state, and user-facing detail.

- Market/candles: authorized live provider, authorized REST, broker data, public delayed quote/candle, cached last-known value, waiting state.
- Filings: SEC EDGAR/company facts/submissions, parser, cached reviewed filing, waiting state.
- FINRA: official datasets/APIs, cache, delayed publication labels.
- News/social: licensed/authorized APIs or allowed public sources only.

The app must not bypass private sources, login walls, paywalls, or anti-scraping controls. If a source is unavailable, the UI shows waiting, delayed, fallback, stale, or cached status.

## Bot Preset Engine

Bot presets define:

- trading style
- risk tolerance
- fixed or percentage allocation
- attention targets
- ignored signals
- signal weights
- trade frequency limits
- stop loss, take profit, max daily loss
- confirmation rules
- learning rules
- self-healing rules
- education copy

Selecting a bot changes Signal Console reasoning and emphasis.

## Decision Engine

Each `DecisionFrame` includes signals, conflicts, costs, risk gate, current decision, rejected opportunities, what changes the bot's mind, memory, self-healing actions, and source freshness.

Allowed decision states are:

`ignore`, `watch`, `investigate`, `prepare`, `enter_position`, `reduce_position`, `exit_position`, `block`, `cooldown`.

The current UI renders conservative review states only unless net expectancy and risk gates justify advancement.

## TradeCostEngine

`apps/web/app/lib/fees.ts` centralizes fee and friction math:

- gross entry value
- gross exit value
- SEC Section 31 sell fee
- FINRA Trading Activity Fee
- options/index/ADR/crypto estimates
- spread and slippage
- margin interest
- total trade friction
- net P&L
- break-even price
- minimum required profitable move
- fee drag percentage
- account-size suitability

Fee sources include source URL, effective date, formula, rounding rule, exemptions, and verification timestamp.

## Risk Gate

Risk gate decisions evaluate:

- expected gross move
- regulatory fees
- spread
- slippage
- margin interest
- account size
- position size
- likely holding time
- strategy turnover
- risk/reward
- recent bot performance
- data freshness
- signal agreement/conflict

Small accounts block high-churn or low-margin setups when fee drag and execution quality make the trade uneconomic.

## Learning And Self-Healing

The runtime records visible `BotMemory` and `SelfHealingAction` events. Self-healing is bounded: large preset changes require user approval, and weight changes are capped by review window.
