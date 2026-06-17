# Wolfie Trading Bot

Wolfie is a localhost-first trading bot beta for `SIMULATED_LIVE_MCP_LOCAL` mode.

In the current beta, Wolfie interacts with a Robinhood-compatible MCP simulation, but every trade routes into a local `PaperExchange`. There is no Robinhood login, no broker credential flow, no real account data, no external market-data ingestion, no live order path, and no real money at risk.

## Current Mode

```text
Environment: SIMULATED_LIVE_MCP_LOCAL
Broker interface: Robinhood-compatible MCP simulation
Execution: PaperExchange
Real Robinhood connected: false
Robinhood login required: false
Live order submitted: false
Real money at risk: false
```

## Phase 1 Includes

- FastAPI backend scaffold.
- Local SQLite audit log at `data/wolfie.sqlite3`.
- `RobinhoodSimMCPServer` module with live-like local methods.
- `PaperExchange` with default starting cash of `25000`.
- Simulated AAPL quote fixture.
- Data integrity service with explicit statuses.
- Order preview and simulated order placement.
- Immediate simulated fills for valid Phase 1 limit orders.
- Next.js and Tailwind frontend scaffold.
- Premium dark dashboard skeleton with:
  - Live Info.
  - 48-Hour Paper Trial Lab placeholder.
  - Future Model Suggestions placeholder.
  - Global truth banner.
- Pytest backend safety tests.

## Phase 2 Includes

- Live-like `RobinhoodSimMCPServer` tools:
  - `get_account`
  - `get_positions`
  - `get_quote`
  - `get_market_data`
  - `get_historical_candles`
  - `get_instrument`
  - `get_trading_hours`
  - `get_fee_schedule`
  - `preview_order`
  - `place_order`
  - `cancel_order`
  - `replace_order`
  - `get_order`
  - `list_orders`
- `MCPContractAdapter` with only `SIMULATED_LIVE_MCP_LOCAL` enabled.
- Disabled future stubs for `ROBINHOOD_MCP_PAPER_ONLY` and `ROBINHOOD_LIVE_APPROVAL`.
- Simulated order lifecycle states:
  - `created`
  - `accepted`
  - `pending`
  - `partially_filled`
  - `filled`
  - `cancelled`
  - `rejected`
  - `expired`
  - `replaced`
- Paper order preview, placement, lookup, listing, cancellation, and replacement.
- Deterministic simulated full and partial fills.
- Simulated rejection reasons such as insufficient buying power, missing quote, stale quote, wide spread, untradeable symbol, invalid order type, and order size too large.
- Simulated account portfolio fields for cash, buying power, equity, realized P&L, unrealized P&L, day P&L, positions, open orders, and closed orders.
- A simulated fee schedule with cost fields labeled `simulated`, `estimated`, `calculated`, or `UNKNOWN`.
- Historical AAPL candle fixture.
- Simulated instrument metadata and trading hours.
- Expanded backend API endpoints for MCP tools, instruments, candles, trading hours, fees, order lookup, cancel, and replace.
- Dashboard panels for MCP status, available tools, account, positions, open/closed orders, quote, instrument metadata, trading hours, fee schedule, lifecycle audit events, and order lifecycle timeline.
- Backend tests covering Phase 2 lifecycle and safety behavior.

## Phase 3 Includes

- `CostModel` with configurable commission, slippage, spread, regulatory fee placeholders, and minimum net edge.
- Cost previews for estimated commission, spread cost, slippage, regulatory fees, total estimated cost, break-even price, gross P&L, net P&L after costs, and minimum required price move.
- `RiskManager` with hard blocks for market orders, options, margin, shorting, missing required inputs, and symbols outside `allowed_symbols`.
- Standard strategy signal schema with status, provenance, required inputs, input data points, and machine-readable reasons.
- `TradeSetupClassifier` setup types for the initial strategy family.
- `ConfluenceScorer` with deterministic 0-100 scoring and action thresholds.
- `DynamicPositionSizer` for simulated quantity sizing.
- `ExecutionPlanner` that creates limit-order-only plans, previews before placement, requires risk approval, attaches costs, and routes paper submissions through `MCPContractAdapter`.
- `StrategyOrchestrator` for manual strategy runs.
- Initial simulated-data-only strategies:
  - RSI mean reversion.
  - Moving average crossover.
  - 20-day breakout.
  - VWAP reclaim.
  - Opening range breakout.
  - Relative strength continuation.
- Backend endpoints for strategies, scoring, risk checks, execution planning, paper submission, settings, and recent signals.
- Dashboard sections for Strategy Status, Signal Feed, Risk Blocks, Cost Preview, Execution Plan Preview, and Recent Paper Signals.

## Phase 4 Includes

- `FixtureLoader` for JSON fixtures from quotes, candles, form4, news, social, and scenarios.
- `ScenarioEngine` with the required Phase 4 scenario catalog.
- Scenario fixtures for MissingSpreadReject, MissingPriceReject, WideSpreadReject, OpeningRangeBreakoutWinner, OpeningRangeBreakoutFailure, VWAPReclaimWinner, VWAPReclaimFailure, SocialHypeFade, LowLiquidityTrap, ConflictingBotSignals, and CandidateModelOverfits.
- `SyntheticMarketGenerator` with deterministic seed-based regimes.
- `ReplayEngine` with instant replay.
- `ScenarioValidator` for expected paper trades, blocked trades, UNKNOWN values, risk blocks, audit expectations, live-order failures, and verified-label failures.
- Data integrity support for `SIM_REPLAY_DATA` and `SIM_SYNTHETIC_DATA` provenance.
- `MARKET_DATA_MODE` support for static fixture, replay, and synthetic modes.
- Backend endpoints for scenarios, replay runs, and synthetic generation.
- Dashboard sections for Scenario Lab, Replay Controls, Scenario Result Panel, Data Integrity Violations, and Replay Decision Timeline.

## Phase 5 Includes

- `InsiderAlphaEngine` using simulated Form 4 fixtures only.
- `InsiderSignalScorer` with deterministic 0-100 scoring, grades, recommended actions, missing-input reporting, and provenance.
- `ClusterBuyingDetector` for simulated purchase clusters within a default 10-day window.
- `InsiderLeaderboard` labeled `simulated/replay-derived`.
- `InsiderMarketContextAnalyzer` that returns `UNKNOWN` when quote, volume, spread, or VWAP context is unavailable.
- `MarketInfluenceEngine` using simulated news and social fixtures only.
- `TickerMentionExtractor`, deterministic `SentimentScorer`, `EngagementVelocityTracker`, `RumorRiskFilter`, `MarketReactionAnalyzer`, and `InfluenceScorer`.
- `SignalFusionEngine` that combines insider, cluster, influence, technical, market, cost, and risk context while letting risk and missing, stale, or wide-spread data block paper signals.
- Simulated/replay fixtures for Form 4 purchase winner/failure, award downweighting, cluster buying, news breakout/fade, social hype/fade, rumor no-trade, and low-liquidity pump chatter.
- Backend endpoints for insider events, fixture ingestion, leaderboards, clusters, alerts, influence feeds, source stats, signal fusion, and fused-signal listing.
- Dashboard sections for Insider Radar, Simulated Top 20 Insiders, Cluster Buying Panel, Market Influence Feed, Ticker Attention Radar, Source Influence Panel, and Fused Signal Feed.
- Audit events for insider ingestion/scoring, influence ingestion/scoring, and signal fusion/rejection.

All Phase 5 insider, news, social, chatter, and fused signal outputs are simulated/replay-derived beta artifacts. They are not verified real-world filings, news, social posts, market data, or trading recommendations.

## Phase 1 Does Not Include

- Real Robinhood integration.
- Robinhood login.
- Broker credentials.
- Live trading.
- Live order submission.
- Real account data.
- External API connections.
- Paid services.
- Real market-data ingestion.
- Advanced strategies.
- Scenario, replay, fixture generator, insider, or market influence engines.
- Model promotion.

## Phase 2 Does Not Include

- Advanced strategies.
- Signal intelligence.
- Strategy orchestration.
- Risk engine beyond local order validation.
- Scenario engine.
- Replay engine.
- Synthetic market generator.
- Insider alpha engine.
- Market influence engine.
- Model suggestions beyond placeholders.
- Real Robinhood MCP.
- Robinhood login.
- Broker credentials.
- Live approval mode.
- Live trading.
- Real market-data ingestion.

## Phase 3 Does Not Include

- Phase 4 scenario engine.
- Replay engine.
- Synthetic market generator.
- Insider alpha engine.
- Market influence engine.
- Scheduled strategy automation.
- Real Robinhood MCP.
- Robinhood login.
- Broker credentials.
- Live approval mode.
- Live trading.
- Options, margin, shorting, or market orders.
- Real market-data ingestion.

## Phase 4 Does Not Include

- Phase 5 insider alpha engine was not included in Phase 4.
- Market influence engine was not included in Phase 4.
- Real Robinhood MCP.
- Robinhood login.
- Broker credentials.
- Live approval mode.
- Live trading.
- Options, margin, shorting, or market orders.
- Real market-data ingestion.
- Realtime replay execution beyond scaffolded speed labels.
- Real market validation. Scenario, replay, and synthetic outputs are local beta testing artifacts only.

## Phase 5 Does Not Include

- Live insider transaction feeds.
- News scraping.
- Social media scraping.
- Paid data integration.
- Real-time market influence claims.
- Real Robinhood MCP.
- Robinhood login.
- Broker credentials.
- Live approval mode.
- Live trading.
- Options, margin, shorting, or market orders.
- Real market-data ingestion.
- 48-hour paper trial lab implementation.
- Future model suggestion promotion workflows.

## Backend Setup

From the repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r apps/api/requirements.txt
```

Run the backend:

```bash
uvicorn apps.api.main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```

## One-Command Local Browser Launch

From the repo root:

```bash
bash scripts/dev-local.sh
```

Then open Wolfie in a normal browser window:

```text
http://localhost:3000
```

The helper starts the FastAPI backend on `http://localhost:8000` and the Next.js frontend on `http://localhost:3000`. It sets `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` unless you override it.

## Frontend Setup

From `apps/web`:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The frontend reads the API from `NEXT_PUBLIC_API_BASE_URL`, defaulting to `http://localhost:8000`.

To point the web UI at another local backend:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```

## Local Web UI Workflows

Start the backend and frontend, then open `http://localhost:3000`.

Use the `Paper Account` section to test simulated order flow from the UI. The form is limited to simulated limit orders and calls the local FastAPI backend, which routes preview and placement through the simulated MCP interface into `PaperExchange`.

Use the `Scenario Lab` section to load and replay a scenario from the UI. Scenario actions remain local replay actions and use `SIM_REPLAY_DATA` provenance.

Use the `Audit Log` section to inspect audit log from the UI. The audit view shows `source_mode`, `execution_engine`, timestamps, summaries, and `live_order_submitted=false` for order-related events.

## Manual Strategy Run

Run the backend, then call:

```bash
curl -X POST http://localhost:8000/api/strategies/run \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"AAPL","submit":false}'
```

To submit approved plans as simulated paper orders only:

```bash
curl -X POST http://localhost:8000/api/strategies/run \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"AAPL","submit":true}'
```

Even with `submit:true`, orders route through `MCPContractAdapter` into `RobinhoodSimMCPServer` and then `PaperExchange`. `live_order_submitted` remains `false`.

## Scenario Lab

List scenarios:

```bash
curl http://localhost:8000/api/scenarios
```

Load a scenario into replay mode:

```bash
curl -X POST http://localhost:8000/api/scenarios/MissingSpreadReject/load
```

Run instant replay:

```bash
curl -X POST http://localhost:8000/api/scenarios/MissingSpreadReject/replay
```

Read validation results:

```bash
curl http://localhost:8000/api/scenarios/MissingSpreadReject/results
```

Generate deterministic synthetic market data:

```bash
curl -X POST http://localhost:8000/api/synthetic/generate \
  -H 'Content-Type: application/json' \
  -d '{"seed":7,"regime":"breakout","symbol":"AAPL","points":5}'
```

Scenario validation compares replay behavior against expected paper trades, blocked trades, UNKNOWN values, risk blocks, audit events, dashboard statuses, live-order attempts, and verified-label violations. Any `live_order_submitted=true` fails validation immediately.

## Phase 5 Fixture Ingestion

Run the backend, then ingest simulated insider fixtures:

```bash
curl -X POST http://localhost:8000/api/insiders/ingest-fixture \
  -H 'Content-Type: application/json' \
  -d '{"fixture":"open_market_purchase_winner.json"}'
```

Ingest simulated news or social fixtures:

```bash
curl -X POST http://localhost:8000/api/influence/ingest-fixture \
  -H 'Content-Type: application/json' \
  -d '{"fixture":"news_breakout_continuation.json"}'
```

View simulated signals:

```bash
curl http://localhost:8000/api/insiders/alerts
curl http://localhost:8000/api/influence/alerts
curl http://localhost:8000/api/signals/fused
```

Fuse simulated signals:

```bash
curl -X POST http://localhost:8000/api/signals/fuse \
  -H 'Content-Type: application/json' \
  -d '{
    "insider_signal": {"insider_signal_score": 82, "status": "simulated"},
    "cluster_signal": {"cluster_detected": true, "cluster_score": 75, "status": "simulated"},
    "influence_signal": {"influence_score": 80, "recommended_action": "paper_trade_signal", "status": "simulated"},
    "technical_signal": {"confidence_score": 70, "status": "simulated"},
    "market_context": {"market_confirmation": true, "spread_bps": 12, "quote_status": "simulated"},
    "cost_risk_context": {"risk": {"passed": true}}
  }'
```

Every endpoint preserves non-real provenance. Form 4, news, social, and chatter fixtures are `SIM_REPLAY_DATA`; missing context returns `UNKNOWN`; no signal path submits a live order.

## Tests

From the repo root:

```bash
python -m pytest tests/test_phase1_backend.py tests/test_phase2_mcp_lifecycle.py tests/test_phase3_strategy_core.py tests/test_phase4_scenarios_replay.py tests/test_phase5_insider_influence.py tests/test_frontend_contract.py -q
```

The backend tests prove:

- `/health` returns `ok`.
- The app starts without Robinhood login.
- The app starts without broker credentials.
- Simulated quotes are labeled `simulated`.
- Missing required values return `UNKNOWN`.
- Simulated `place_order` updates paper positions.
- Simulated `place_order` never submits a live order.
- `live_order_submitted` is always `false`.
- The audit log records simulated order placement.
- Simulated data is never labeled `verified`.
- MCP tools list includes the Phase 2 simulated tools.
- Future real Robinhood modes are disabled stubs.
- Buy and sell limit order fill rules are enforced.
- Non-marketable limit orders remain pending.
- Insufficient buying power rejects orders.
- Missing quotes return `UNKNOWN` or `rejected`.
- Pending orders can be cancelled.
- Replacement orders preserve the original-to-replacement relationship.
- Buying power updates after simulated fills.
- Lifecycle events are recorded in the audit log.
- CostModel calculates estimated costs and break-even values without labeling estimates as verified.
- RiskManager blocks market orders, options, margin, shorting, missing required inputs, and disallowed symbols.
- Strategies return `UNKNOWN` rather than guessed values when required inputs are missing.
- Initial strategies produce deterministic fixture-based signals.
- ConfluenceScorer returns documented action thresholds.
- DynamicPositionSizer returns `UNKNOWN` when entry or stop price is missing.
- ExecutionPlanner creates limit-only plans and refuses risk-failed submissions.
- Paper submissions still show `live_order_submitted=false`.
- Strategy, risk, cost, and execution events are audited.
- FixtureLoader loads valid fixtures and returns `UNKNOWN` for missing required fields.
- ScenarioEngine lists required Phase 4 scenarios.
- SyntheticMarketGenerator is deterministic by seed.
- ReplayEngine preserves event order and completes instant replay.
- Required scenarios validate expected simulated behavior.
- ScenarioValidator fails live-order attempts and verified replay labels.
- Scenario, replay, synthetic, and validation events are audited.
- Insider purchase fixtures score above sale and award fixtures.
- `UNKNOWN` transaction codes do not create trading signals.
- Cluster buying and leaderboard outputs are labeled simulated/replay-derived.
- Missing insider market context returns `UNKNOWN`.
- Ticker extraction avoids common uppercase false positives.
- Sentiment, engagement velocity, rumor risk, influence scoring, and market reaction are deterministic.
- Social-only rumor fixtures cannot auto-trade without confirmation.
- Signal fusion boosts confirmed insider/news/market alignment and rejects missing, stale, wide-spread, risk-blocked, or live-order-flagged inputs.
- Phase 5 API endpoints preserve provenance/status and never label simulated data as verified.
- The localhost web UI exposes the required sections, truth banner, backend status, simulated order-only controls, UNKNOWN states, and local launch instructions.

## Beta Safety Notes

Wolfie may believe it is trading through a live-like Robinhood-compatible MCP surface, but the UI and audit layer must always reveal simulated execution.

Order tools appear functional to Wolfie, but all order behavior is local paper simulation. Any missing required data must be returned as `UNKNOWN`. Simulated data must be labeled `simulated`. No code path may submit a live order or connect to Robinhood in the current mode.

All strategy outputs are simulated or calculated from local fixtures and local paper state. Missing inputs become `UNKNOWN` or `rejected`; Wolfie must not infer unavailable prices, spreads, volume, costs, or risk values. Forecasted or estimated values must not be displayed as verified facts.

Scenario, replay, and synthetic data are not real market validation. They are local torture-test inputs for beta logic only and must be labeled `simulated`, `SIM_REPLAY_DATA`, or `SIM_SYNTHETIC_DATA`; they must never be labeled verified real market data.

Insider, news, social, chatter, and fused signals in Phase 5 are also local beta testing artifacts only. They are generated from fixtures, replay-style inputs, deterministic calculations, and simulated context. They must never be treated as verified filings, verified news, verified social activity, or real market recommendations.
