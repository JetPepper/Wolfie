# Zero Trade Data Cloud Policy

Wolfie Cloud can see login metadata, subscription/billing status, entitlement refresh metadata, hashed device activation identifiers, app version metadata, release metadata, and signed entitlement issuance data.

Wolfie Cloud must never see what the user trades, owns, watches, configures, risks, routes, or executes. This includes trades, orders, order intents, positions, portfolio values, balances, P&L, broker fields, broker tokens, Robinhood account numbers, Agent Mandates, bot settings, risk settings, watchlists, source weights, strategy details, decision logs, execution results, fills, quantity, shares, symbol, or price when bundled with trading context.

The policy is enforced in `apps/web/app/lib/runtime/zero-trade-cloud-policy.ts`. The Wolfie Cloud wrapper in `apps/web/app/lib/runtime/wolfie-cloud-client.ts` calls the policy before network calls. Direct Wolfie Cloud fetch usage outside that wrapper is blocked by the architecture scan.

This is a framework/stub for the web runtime. Production desktop work must keep the same policy at native runtime and network boundary layers.
