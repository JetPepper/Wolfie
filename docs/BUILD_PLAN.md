# Wolfie Build Plan

> **For future Codex tasks:** This project is currently documentation-only. Do not scaffold application code until the user explicitly requests implementation.

Wolfie Trading Bot will be built as a localhost-first standalone beta in `SIMULATED_LIVE_MCP_LOCAL` mode.

The beta goal is to let Wolfie interact with a Robinhood-compatible MCP surface while all account, market, and order behavior is routed into local simulation and `PaperExchange`.

No phase may connect to Robinhood, request Robinhood login, use broker credentials, access real account data, submit real orders, or risk real money unless a future user-approved mode explicitly changes those rules.

## Phase 1: Local Simulation Foundation

### Goal

Create the minimal local system proving Wolfie can interact with a simulated Robinhood-compatible MCP interface while real trading is impossible.

### Expected Deliverables

- Frontend scaffold.
- Backend scaffold.
- Simulated MCP server scaffold.
- Global truth banner on every page.
- Paper account fixture.
- One simulated quote.
- One simulated paper order flow.
- Audit records for the simulated quote and paper order.
- Data status labels for all visible values.

### Required Tests

- Test that `real_robinhood_connected` is always `false`.
- Test that `robinhood_login_required` is always `false`.
- Test that `live_order_submitted` is always `false`.
- Test that `real_money_at_risk` is always `false`.
- Test that `place_order` creates only a simulated paper order.
- Test that no Robinhood credentials are accepted or required.
- Test that every page includes the global truth banner.
- Test that missing required values return `UNKNOWN`.

### What Not To Build Yet

- Full order lifecycle.
- Strategy engines.
- Risk scoring beyond hard safety assertions.
- Cost modeling beyond placeholders labeled `UNKNOWN` or `calculated`.
- Replay, scenario, or synthetic market generation.
- Insider or influence engines.
- Model suggestions.
- Any external API integration.
- Any Robinhood integration.

## Phase 2: Live-Like Simulated MCP Order Lifecycle

### Goal

Expand `RobinhoodSimMCPServer` so Wolfie can use live-like tools against the simulated paper account.

### Expected Deliverables

- `get_quote`.
- `preview_order`.
- `place_order`.
- `cancel_order`.
- `replace_order`.
- `get_positions`.
- `get_account`.
- `list_orders`.
- `get_order`.
- Simulated order states.
- Simulated rejection paths.
- Data integrity checks on every MCP response.
- Audit trail for every MCP call.

### Required Tests

- Test each MCP tool returns an explicit data status.
- Test `preview_order` does not create an order.
- Test `place_order` creates only a `PaperExchange` order.
- Test cancellation changes only simulated order state.
- Test replacement changes only simulated order state.
- Test invalid orders are rejected with status `rejected`.
- Test missing quote, account, position, or order data returns `UNKNOWN`.
- Test no MCP tool can submit a live order.

### What Not To Build Yet

- Strategy automation.
- Real market data.
- Robinhood auth.
- Real account synchronization.
- Model promotion workflows.
- Premium UI polish beyond clarity and required truth display.

## Phase 3: Strategy, Risk, and Cost Core

### Goal

Add internal decision systems while preserving hard simulation boundaries and explicit data provenance.

### Expected Deliverables

- Signal engines.
- `SignalIntelligenceEngine`.
- `StrategyOrchestrator`.
- `RiskManager`.
- `CostModel`.
- Strategy decision audit records.
- Risk rejection records.
- Cost calculation provenance.
- Dashboard surfaces for strategy state, risk state, and cost assumptions.

### Required Tests

- Test strategies cannot bypass `RiskManager`.
- Test strategies cannot bypass `PaperExchange`.
- Test every signal has a data status and provenance.
- Test `CostModel` outputs are labeled `calculated`, `estimated`, `UNKNOWN`, or `rejected`.
- Test risk rejections prevent paper order creation.
- Test forecasted outputs are labeled `forecasted`.
- Test strategies cannot read unstated or unavailable data.

### What Not To Build Yet

- Live broker execution.
- Real Robinhood data.
- Production strategy promotion.
- Scenario replay framework.
- Insider or market influence engines.

## Phase 4: Scenario, Replay, Fixture, and Synthetic Market Systems

### Goal

Create controlled market simulation inputs for repeatable paper testing.

### Expected Deliverables

- `ScenarioEngine`.
- `ReplayEngine`.
- `FixtureLoader`.
- `SyntheticMarketGenerator`.
- Fixture provenance metadata.
- Replay clock controls.
- Synthetic data labels.
- Scenario audit records.

### Required Tests

- Test fixture values include provenance.
- Test synthetic values are labeled `simulated`.
- Test replayed values are labeled `simulated` or `stale` as appropriate.
- Test scenarios cannot be mislabeled as verified live data.
- Test missing fixture fields return `UNKNOWN`.
- Test replay execution cannot submit real orders.

### What Not To Build Yet

- Real-time external market feeds.
- Paid data provider integration.
- Real broker integration.
- Model promotion beyond simulated trial tracking.

## Phase 5: Insider and Market Influence Engines Using Fixtures First

### Goal

Add early `InsiderAlphaEngine` and `MarketInfluenceEngine` behavior using fixture-only inputs.

### Expected Deliverables

- `InsiderAlphaEngine` fixture ingestion.
- `MarketInfluenceEngine` fixture ingestion.
- Influence signal provenance.
- Insider signal provenance.
- Rejection handling for incomplete or unsupported fixture records.
- Dashboard display of fixture-only status.

### Required Tests

- Test engines reject missing required fixture values.
- Test unsupported fixture values return `UNKNOWN` or `rejected`.
- Test no engine implies real-time or verified live data unless explicitly verified by an allowed source in a future mode.
- Test all outputs are labeled `simulated`, `calculated`, `estimated`, `forecasted`, `UNKNOWN`, or `rejected`.
- Test generated signals cannot bypass risk review.

### What Not To Build Yet

- Live insider transaction feeds.
- Social media scraping.
- News scraping.
- Paid data integration.
- Real-time market influence claims.

## Phase 6: 48-Hour Paper Trial Lab and Future Model Suggestions

### Goal

Add the beta workflow for running paper-only trials and reviewing future model suggestions without automatic promotion.

### Expected Deliverables

- 48-Hour Paper Trial Lab dashboard division.
- Trial setup controls.
- Trial run state.
- Trial metrics with provenance.
- Trial audit summaries.
- Future Model Suggestions dashboard division.
- Approval-required model promotion queue.
- Clear labels that trial outcomes are not real trading performance.

### Required Tests

- Test a model cannot be promoted without explicit approval.
- Test a model cannot be promoted outside simulated paper execution in current mode.
- Test all trial metrics have statuses.
- Test incomplete 48-hour trials cannot be marked complete.
- Test model suggestions are labeled `forecasted`, `estimated`, `calculated`, `simulated`, `UNKNOWN`, or `rejected`.
- Test approval records are audited.

### What Not To Build Yet

- Autonomous production deployment.
- Live model promotion.
- Real-money execution.
- External brokerage integration.

## Phase 7: Premium Dark Market-Intelligence Cockpit

### Goal

Polish the UI into a clean, premium, dark-first market-intelligence cockpit that is cinematic but readable and never hides simulation truth.

### Expected Deliverables

- Refined dashboard layout.
- Premium typography.
- Graphite and charcoal surface system.
- Data-dense but readable panels.
- Motion polish.
- Chart polish.
- Provenance and status display system.
- Finalized truth banner treatment.
- Responsive desktop-first and usable mobile views.

### Required Tests

- Test global truth banner remains visible on every page.
- Test text does not overflow key controls and panels.
- Test charts display status and provenance.
- Test unknown, stale, simulated, estimated, calculated, forecasted, rejected, profit, and loss colors are distinguishable.
- Test UI never labels simulated execution as real execution.
- Test dashboard divisions are present: Live Info, 48-Hour Paper Trial Lab, Future Model Suggestions.

### What Not To Build Yet

- Marketing landing page.
- Casino-style trading interactions.
- Real broker connection UI.
- Robinhood login UI.
- Live trading toggles.

## Global Non-Goals Until Explicitly Approved

- Do not create a Robinhood login flow.
- Do not store broker credentials.
- Do not connect to Robinhood.
- Do not connect to external APIs.
- Do not submit real orders.
- Do not use real account data.
- Do not scaffold unrelated packages.
- Do not build live approval mode.
- Do not build real Robinhood MCP mode.

