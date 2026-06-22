# Entitlement Tokenization

Wolfie entitlement tokens prove that a user, account, license, and device may unlock the full local Wolfie runtime.

Token fields:

- subject/user id
- account id
- license id
- device id hash
- access level: `FULL_WOLFIE`
- issued at
- expires at
- offline grace expires at
- app channel
- minimum app version
- entitlement version
- issuer
- audience
- token id
- optional revocation nonce/version

Tokens must not include trades, positions, balances, P&L, broker tokens, broker account numbers, order history, order intents, Agent Mandates, bot configs, watchlists, source weights, risk settings, strategy details, or local decision logs.

The first-pass validator lives in `apps/web/app/lib/runtime/entitlement-validator.ts`. Development/test builds use deterministic signed test tokens from `dev-entitlement-provider.ts`. Production private signing is not implemented and no private key is present in the repo. Production validation fails closed when public verification material or real signature verification is unavailable.

Device binding is handled through `device-activation.ts`, which creates a local install id and exposes a hashed id for entitlement binding. It intentionally avoids hardware fingerprinting and never derives identity from broker credentials.
