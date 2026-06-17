# Wolfie Architecture

Wolfie Trading Bot is currently designed for `SIMULATED_LIVE_MCP_LOCAL` mode.

The system must feel live-like to Wolfie while remaining fully local, simulated, auditable, and unable to trade real money.

## System Diagram

```text
Wolfie Bot
  -> RobinhoodSimMCPServer
  -> MCPContractAdapter
  -> DataIntegrityService
  -> Signal Engines
  -> StrategyOrchestrator
  -> RiskManager
  -> CostModel
  -> PaperExchange
  -> AuditLog
  -> Dashboard
```

## Module Responsibilities

### Wolfie Bot

Wolfie Bot is the decision-making agent.

In current mode, Wolfie may believe it is interacting with a live Robinhood-compatible MCP server.

Wolfie Bot must not receive hidden real-broker access.

### RobinhoodSimMCPServer

`RobinhoodSimMCPServer` exposes a Robinhood-compatible MCP simulation.

It should provide live-like tools:

- `get_quote`
- `preview_order`
- `place_order`
- `cancel_order`
- `replace_order`
- `get_positions`
- `get_account`
- `list_orders`
- `get_order`

The server must never connect to Robinhood in `SIMULATED_LIVE_MCP_LOCAL` mode.

### MCPContractAdapter

`MCPContractAdapter` normalizes MCP requests and responses into internal contracts.

It should ensure tool responses include:

- Data status.
- Provenance.
- Environment.
- Simulated execution flags.
- Error or rejection details when applicable.

### DataIntegrityService

`DataIntegrityService` enforces the no-hallucination rule.

It must:

- Reject unsupported or malformed data.
- Label simulated values as `simulated`.
- Label deterministic outputs as `calculated`.
- Label approximations as `estimated`.
- Label model projections as `forecasted`.
- Label expired data as `stale`.
- Return `UNKNOWN` for unavailable required values.
- Preserve provenance for every material value.

### Signal Engines

Signal engines produce candidate signals from allowed inputs.

Signal outputs must include data status, provenance, input references, and any known limitations.

Signal engines must not assume missing values.

### StrategyOrchestrator

`StrategyOrchestrator` selects, sequences, and evaluates strategy actions.

It must route all proposed orders through `RiskManager` and `CostModel` before any `PaperExchange` action.

### RiskManager

`RiskManager` blocks unsafe or unsupported actions.

In current mode, it must enforce:

- No real broker execution.
- No real money at risk.
- No live order submission.
- Rejection of malformed orders.
- Rejection of strategies with missing required data.

### CostModel

`CostModel` estimates or calculates simulated costs.

It must label outputs as `calculated`, `estimated`, `UNKNOWN`, or `rejected`.

It must not imply real broker fees, fills, spreads, or slippage unless those values are explicitly provided by an allowed future source.

### PaperExchange

`PaperExchange` is the only execution destination in current mode.

It owns simulated:

- Account state.
- Cash balance.
- Positions.
- Orders.
- Order lifecycle transitions.
- Fills.
- Cancellations.
- Replacements.
- Rejections.

All `PaperExchange` data must be labeled `simulated` unless it is a deterministic calculation from simulated state, in which case it may be labeled `calculated`.

### AuditLog

`AuditLog` records material system behavior.

Audit records must preserve the difference between what Wolfie attempted and what the system actually executed.

### Dashboard

The dashboard presents truth, paper trial activity, model suggestions, metrics, and audit context.

The UI must always show that execution is simulated in current mode.

## Data Flow

1. Wolfie Bot calls a live-like MCP tool.
2. `RobinhoodSimMCPServer` receives the tool request.
3. `MCPContractAdapter` validates and normalizes the contract.
4. `DataIntegrityService` checks required values, status labels, and provenance.
5. Signal engines may produce labeled signals from allowed inputs.
6. `StrategyOrchestrator` chooses a proposed action.
7. `RiskManager` approves or rejects the proposed action.
8. `CostModel` calculates or estimates simulated costs when needed.
9. `PaperExchange` executes only simulated paper behavior.
10. `AuditLog` records the full event path.
11. `Dashboard` displays truth banner, state, provenance, and status labels.

## Simulated MCP Behavior

The simulated MCP server must be live-like at the interface level and simulated at the execution level.

`place_order` should appear functional to Wolfie, but must only create a simulated paper order.

Mandatory current-mode facts:

- `real_robinhood_connected`: `false`
- `robinhood_login_required`: `false`
- `live_order_submitted`: `false`
- `real_money_at_risk`: `false`

If a simulated MCP tool lacks required data, it must return `UNKNOWN` or `rejected`.

If a simulated MCP tool returns data from fixtures, synthetic generation, replay, or paper state, that data must be labeled with the correct non-real status.

## PaperExchange Behavior

`PaperExchange` must provide local-only paper execution.

It should support:

- Paper account reads.
- Paper position reads.
- Paper order creation.
- Paper order preview effects.
- Paper order cancellation.
- Paper order replacement.
- Paper order lookup.
- Paper order listing.
- Simulated fills when defined by the current phase.
- Rejections for invalid or unsupported orders.

It must not:

- Connect to Robinhood.
- Submit real broker orders.
- Query real balances.
- Query real positions.
- Query real order history.
- Use real account credentials.

## DataIntegrityService Behavior

`DataIntegrityService` is the hard boundary against hallucinated or unlabeled data.

Required behavior:

- Every value must have a data status.
- Every material value must have provenance.
- Missing required values return `UNKNOWN`.
- Unsupported values are `rejected`.
- Stale values are labeled `stale`.
- Simulated values are labeled `simulated`.
- Calculations disclose their input statuses.
- Forecasts are labeled `forecasted`.
- Estimates are labeled `estimated`.

The service must not silently coerce missing data into default values.

## Audit Log Expectations

Audit entries must be append-only unless a future storage design explicitly supports corrections as separate events.

Each audit entry must include:

- Timestamp.
- Environment.
- Module name.
- Action name.
- Input summary.
- Output summary.
- Data status.
- Provenance.
- Rejection reason when applicable.
- `real_robinhood_connected`.
- `robinhood_login_required`.
- `live_order_submitted`.
- `real_money_at_risk`.

Audit entries should make it possible to answer:

- What did Wolfie request?
- What data did Wolfie use?
- Which statuses were attached?
- Which module approved or rejected the action?
- Did anything touch a real broker?
- Was real money ever at risk?

In current mode, the final two answers must always be `false`.

## Future Mode Notes

These notes are future-only. They must not be implemented in the current beta.

### Future Real Robinhood MCP Mode

A future mode may introduce a real Robinhood-compatible MCP connection only after explicit user approval and a separate design review.

That future mode would require:

- Auth design.
- Credential storage design.
- Real account data provenance.
- Live risk approval controls.
- Compliance review.
- Kill switch behavior.
- Separate audit flags.
- Clear UI mode separation.

### Future Live Approval Mode

A future live approval mode may allow human-approved live order submission only after explicit user approval and separate implementation work.

That future mode would require:

- Human approval before each live order or approved batch.
- Visible mode switch distinct from `SIMULATED_LIVE_MCP_LOCAL`.
- Broker connection status.
- Real money risk warnings.
- Live order audit records.
- Operational safeguards.

Current mode must not include live approval mode behavior.

