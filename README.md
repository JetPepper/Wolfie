# Wolfie Trading Bot

Wolfie is a localhost-first agentic trading intelligence app. The current product direction is **Agentic Bot Runtime + Signal Console + TradeCostEngine**.

The app does not claim live brokerage execution. Simulated mode uses the user's Wolfie capital amount for allocation, risk, trade economics, and bot decision review. Live mode is a professional setup state until authorized broker/execution paths, disclosures, account authorization, and execution audit logs are implemented.

## Active Product Surface

- Dashboard: capital, available allocation, decision ledger, bot/source status, and portfolio/bot/stock performance chart.
- Bots: primary and specialized bot presets, deployment controls, editable allocation/risk/source/rule fields, disclosure intelligence workspaces, and custom bot builder.
- Signal Console: the primary bot-intelligence interface replacing the old 3D Bot Thought system.
- Activity: stored trade/activity audit surface.
- Settings: starting capital, provider/source status, mode controls, sound, reset, and bot defaults.

## Runtime Architecture

The frontend now models the required runtime path:

`Data Acquisition Layer -> Source Adapters -> Acquisition Ladder -> Normalization -> Signal Store -> Indicator Engine -> Bot Preset Engine -> Bot Decision Engine -> TradeCostEngine -> Risk Gate -> Execution/Simulation Engine -> Bot Memory/Learning Engine -> Self-Healing Engine -> Signal Console UI`

Implemented TypeScript domain objects live in `apps/web/app/lib/agentic-runtime.ts`:

- `SignalEvent`
- `BotPreset`
- `DecisionFrame`
- `RiskGateResult`
- `BotMemory`
- `SelfHealingAction`
- `AcquisitionSource`

The rendered Signal Console shows live/delayed/stale/fallback/cached/waiting source freshness labels and never invents unavailable live prices or headlines.

## TradeCostEngine

Trade cost math is centralized in `apps/web/app/lib/fees.ts`. The UI consumes calculated estimates instead of scattering fee logic across components.

The current schedule object includes source metadata and update fields:

- SEC Section 31 covered sale fee: $20.60 per $1,000,000 effective April 4, 2026.
- FINRA 2026 equity TAF estimate: $0.000195 per share, capped at $9.79.
- Robinhood-style pass-through fee categories for options, index options, ADR custody, crypto routing/spread, spread, slippage, and margin interest estimates.

The engine returns gross entry/exit value, explicit fees, spread/slippage, margin interest, total friction, net P&L, break-even price, minimum profitable move, fee drag percentage, and account-size suitability.

## Small Account Protection

Every decision frame passes through net-expectancy and small-account checks before the UI can present an actionable trade state. Smaller accounts, especially near $1,000, block high-turnover/low-margin setups unless costs, spread, slippage, expected move, freshness, and risk/reward justify the trade.

Bots can show `watch`, `prepare`, `block`, or `cooldown` decisions with plain-English reasons. Direction confidence alone is not sufficient.

## Acquisition Ladder

The acquisition ladder is documented in code and UI:

- Market/candles: authorized live provider -> authorized REST -> broker data -> public delayed quote/candle -> cached last-known value -> waiting state.
- SEC/company filings: EDGAR APIs -> company facts/submissions -> parser -> cached reviewed filing -> waiting state.
- FINRA/market structure: FINRA datasets/APIs -> cached delayed publication labels.
- News/social: licensed or authorized APIs and allowed public sources only. No login walls, paywalls, private groups, or bypass behavior.

When no production source is connected, the app labels the state honestly instead of generating live claims.

## Verification

Common commands:

```bash
corepack pnpm --dir apps/web build
corepack pnpm --dir apps/web test:visual
corepack pnpm --dir apps/web dev
```

`corepack pnpm --dir apps/web lint` currently invokes Next's ESLint setup prompt because this repo does not yet have an ESLint configuration. It is not a valid non-interactive lint check until config is added.

## Local Review

Run locally at:

```text
http://localhost:3000/
```
