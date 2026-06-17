# Wolfie UI Direction

Wolfie should feel like a premium dark market-intelligence cockpit, not a generic broker dashboard and not a casino trading screen.

The UI must be clean, cinematic, readable, data-dense, and honest about simulation status.

## Design Principles

- Dark-first interface.
- Premium graphite and charcoal surfaces.
- Clear hierarchy before decoration.
- Dense information with generous alignment and spacing.
- Market-intelligence feel rather than retail brokerage feel.
- Hard truth display on every page.
- Every metric shows status and provenance.
- Unknown data is displayed as `UNKNOWN`, never hidden or guessed.
- Simulated execution must be visually clear.
- Risk and audit information must be easy to inspect.

## Required Global Truth Banner

Every page must show:

- Environment: `SIMULATED_LIVE_MCP_LOCAL`
- Broker interface: `Robinhood-compatible MCP simulation`
- Execution: `PaperExchange`
- Real Robinhood connected: `false`
- Robinhood login required: `false`
- Live order submitted: `false`
- Real money at risk: `false`

The banner must be persistent, readable, and impossible to confuse with a live trading state.

## Dashboard Divisions

The dashboard must be organized into three major divisions:

1. Live Info
2. 48-Hour Paper Trial Lab
3. Future Model Suggestions

### Live Info

Displays current simulated market, account, position, signal, risk, order, and audit state.

All values must show status and provenance.

### 48-Hour Paper Trial Lab

Displays paper-only strategy trials, trial windows, metrics, audit summaries, and completion status.

Trial outputs must not imply real trading performance.

### Future Model Suggestions

Displays candidate strategies, models, or parameter changes requiring review.

Suggestions must be labeled as `forecasted`, `estimated`, `calculated`, `simulated`, `UNKNOWN`, or `rejected`.

No suggestion may appear auto-approved.

## Component List

Core components:

- Global truth banner.
- Environment status strip.
- Paper account summary.
- Simulated quote panel.
- Paper positions table.
- Paper orders table.
- Order detail drawer.
- Order preview panel.
- Risk decision panel.
- Cost model panel.
- Signal stack panel.
- Strategy orchestration timeline.
- 48-hour trial run card.
- Trial metric table.
- Trial audit summary.
- Future model suggestion card.
- Approval-required status badge.
- Data provenance tooltip or popover.
- Data status badge.
- Audit event table.
- Audit event detail drawer.
- Chart panels for simulated and calculated metrics.

## Typography

Preferred fonts:

- Display: Space Grotesk or Satoshi.
- Body/UI: Geist, Satoshi, or Inter.
- Numbers/data: JetBrains Mono or IBM Plex Mono.

Typography rules:

- Use display type sparingly for page titles and major cockpit labels.
- Use body/UI type for controls, tables, labels, and dense panels.
- Use monospaced type for prices, quantities, timestamps, IDs, order statuses, and metrics.
- Avoid stale fintech typography patterns.
- Avoid oversized marketing hero text inside the product.
- Ensure all labels fit their containers on desktop and mobile.
- Do not rely on color alone to communicate status.

## Color Tokens

```text
background: #080A0F
surface: #10141C
surfaceElevated: #151B26
border: rgba(255,255,255,0.08)
textPrimary: #F4F7FA
textSecondary: #9BA6B2
muted: #5F6B7A
accent: #6EE7F9
accent2: #A78BFA
warning: #FBBF24
profit: #38D996
loss: #FF5C7A
unknown: #8B95A1
```

Color rules:

- Use `background` for the application shell.
- Use `surface` for primary panels.
- Use `surfaceElevated` for overlays, drawers, focused panels, and selected states.
- Use `border` for subtle separation.
- Use `accent` for primary focus, selected navigation, and important simulated-live interface details.
- Use `accent2` sparingly for model intelligence and future suggestion emphasis.
- Use `warning` for approval, stale, and caution states.
- Use `profit` and `loss` only for financial direction.
- Use `unknown` for `UNKNOWN`, unavailable, and unresolved values.

## Motion Rules

- Motion should be restrained, precise, and functional.
- Use subtle transitions for panel entry, drawer open, hover, selection, and status changes.
- Avoid arcade-like animation.
- Avoid flashing profit/loss effects.
- Avoid confetti, celebratory fills, or gambling-like reward loops.
- Motion must not obscure truth labels, risk state, or audit state.
- Respect reduced-motion preferences when implemented.

## Chart Rules

- Charts must show whether data is simulated, calculated, estimated, forecasted, stale, unknown, or rejected.
- Axes, legends, and tooltips must be readable on dark surfaces.
- Forecasted lines must be visually distinct from simulated historical or replayed lines.
- Unknown or missing data must appear as gaps or explicit `UNKNOWN` markers, not smoothed values.
- Do not interpolate missing values unless the chart explicitly labels the interpolation as `estimated`.
- Do not display real-time live market claims in current mode.
- Every chart must expose provenance for its source data.

## Data Provenance Display Rules

Every displayed metric should include:

- Status.
- Source.
- Timestamp or simulation clock time.
- Calculation basis when calculated.
- Assumptions when estimated.
- Model or scenario name when forecasted.
- Rejection reason when rejected.

For compact views, show status visibly and make provenance available through a tooltip, popover, drawer, or detail row.

For audit views, show provenance directly.

`UNKNOWN` values must be rendered as `UNKNOWN`.

## What The UI Must Avoid

- Do not present simulated execution as real execution.
- Do not create a Robinhood login UI.
- Do not show a live trading toggle.
- Do not imply real money is at risk.
- Do not hide the truth banner.
- Do not use casino-like effects.
- Do not use generic broker dashboard styling.
- Do not create a marketing landing page as the primary product view.
- Do not show unlabeled metrics.
- Do not smooth over missing data.
- Do not use unlabeled forecasts.
- Do not imply model suggestions are approved.
- Do not use decorative clutter that competes with audit, risk, or truth information.

