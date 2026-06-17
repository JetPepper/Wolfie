# Wolfie Product Rules

Wolfie Trading Bot is currently in `SIMULATED_LIVE_MCP_LOCAL` mode.

This mode exists to build a localhost-first standalone beta where Wolfie believes it is connected to a live Robinhood-compatible MCP server, while every order and account action is routed into a simulated `PaperExchange`.

No Robinhood login is allowed. No broker credentials are allowed. No real account data is allowed. No real money is allowed. No live trading is allowed.

## Absolute No-Hallucination Rule

Wolfie must use zero hallucinations or assumed data.

Nothing may be presented as fact unless it is backed by explicit input, fixture data, deterministic calculation, local simulated state, or a named source available to the system at the time of display.

If data is missing, stale, simulated, estimated, calculated, or forecasted, label it explicitly.

If a required value is unavailable, return `UNKNOWN`.

Wolfie must not fabricate, interpolate, extrapolate, smooth, backfill, or silently fill missing values.

## Data Status Definitions

Every displayed or audited data point must carry one of these statuses:

- `verified`: Confirmed from an allowed source or validated internal state for the current mode.
- `calculated`: Produced by deterministic calculation from disclosed inputs.
- `estimated`: Approximation based on disclosed assumptions or incomplete data.
- `forecasted`: Forward-looking output from a model, scenario, or projection.
- `simulated`: Produced by the local simulation layer, fixtures, replay engine, synthetic generator, or `PaperExchange`.
- `stale`: Previously available data that is older than its declared freshness threshold.
- `UNKNOWN`: Required value is unavailable or cannot be determined.
- `rejected`: Value, signal, order, or action was refused by validation, data integrity, risk, cost, execution, or policy checks.

## Simulated-vs-Real Truth Rules

In `SIMULATED_LIVE_MCP_LOCAL` mode, these values are mandatory and global:

- Environment: `SIMULATED_LIVE_MCP_LOCAL`
- Broker interface: `Robinhood-compatible MCP simulation`
- Execution: `PaperExchange`
- Real Robinhood connected: `false`
- Robinhood login required: `false`
- Live order submitted: `false`
- Real money at risk: `false`

These values must appear in the global UI truth banner on every page.

These values must also be included in audit records for account, order, and execution events.

Wolfie may believe it is trading live, but the UI and audit layer must always show simulated execution.

## Live Trading Prohibition

Live trading is prohibited in the current beta.

`place_order` may appear functional to Wolfie through the simulated MCP contract, but internally it must only create simulated paper orders.

`live_order_submitted` must always be `false`.

No code path may submit an order to Robinhood or any real broker in `SIMULATED_LIVE_MCP_LOCAL` mode.

No code path may transfer funds, query real balances, read real positions, or retrieve real order history from Robinhood or any real broker in this mode.

## Robinhood Login Prohibition

Robinhood login is prohibited in `SIMULATED_LIVE_MCP_LOCAL` mode.

The system must not request, store, validate, proxy, refresh, or transmit Robinhood credentials.

The system must not use user cookies, browser sessions, OAuth tokens, API keys, device tokens, or any other credential that could access a real Robinhood account.

Any attempted Robinhood login path must be rejected and audited with status `rejected`.

## Audit and Provenance Requirements

Every material event must be recorded in the audit layer.

Material events include:

- MCP tool calls and responses.
- Quote requests.
- Account and position reads.
- Order previews.
- Order placement attempts.
- Order cancellations.
- Order replacements.
- Risk checks.
- Cost model calculations.
- Strategy decisions.
- Signal generation.
- Data integrity validation.
- Data rejection.
- Model suggestions.
- Approval or rejection of model promotion.

Each audit event must include:

- Timestamp.
- Environment.
- Calling module.
- Action name.
- Input summary.
- Output summary.
- Data status.
- Provenance.
- Whether real Robinhood was connected.
- Whether live order submission occurred.
- Whether real money was at risk.

When a value is simulated, calculated, estimated, forecasted, stale, unknown, or rejected, the audit event must state that status directly.

## 48-Hour Paper Trial Requirement

Strategies and models must complete a 48-hour paper trial before they can be considered for promotion.

The 48-hour paper trial must run only through the local simulated MCP server and `PaperExchange` unless a future mode explicitly changes this rule.

Trial results must be labeled as `simulated`, `calculated`, `estimated`, or `forecasted` as appropriate.

Trial outputs must not imply real trading performance.

## Model Promotion Approval Requirement

No strategy, signal engine, model, or policy may be promoted automatically.

Promotion requires explicit approval after review of:

- 48-hour paper trial results.
- Audit logs.
- Risk metrics.
- Cost model outputs.
- Data provenance.
- Known limitations.
- Rejected or `UNKNOWN` values.

Promotion approval must be recorded in the audit log.

In the current mode, approval may only promote a model within simulated paper execution.

## Current Beta Operating Rules

- Wolfie should believe it is trading through a live Robinhood-compatible MCP server.
- `RobinhoodSimMCPServer` should expose live-like tools such as `get_quote`, `preview_order`, `place_order`, `cancel_order`, `replace_order`, `get_positions`, `get_account`, `list_orders`, and `get_order`.
- `place_order` should appear functional to Wolfie.
- Internally, `place_order` must only create simulated paper orders.
- `live_order_submitted` must always be `false`.
- Real Robinhood connected must always be `false`.
- Real money at risk must always be `false`.

