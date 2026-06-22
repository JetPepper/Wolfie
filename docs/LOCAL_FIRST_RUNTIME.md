# Local-First Runtime

Wolfie is a local-first trading intelligence runtime. The app opens in Local Explore Mode without login so users can set simulated capital, configure bots, build custom bots, review Signal Console behavior, use paper mode, and reset local state.

The local runtime owns user trading data, bot configuration, Agent Mandates, source weights, risk settings, broker/MCP connection state, broker tokens, positions, trades, balances, P&L, order intents, execution results, local learning history, decision logs, entitlement validation, and the execution guard.

Wolfie Cloud is limited to account login, subscription status, billing status, license entitlement issuance, device activation metadata, signed release metadata, and all-or-nothing entitlement verification. Cloud must not receive trade data, broker data, strategy data, mandate data, watchlists, risk settings, order data, source weights, P&L, balances, or decision logs.

Wolfie separates five identities:

- local operator identity: local display/operator label for Local Explore
- Wolfie cloud account identity: account login and owner account metadata
- subscription/license identity: all-or-nothing `FULL_WOLFIE` license metadata
- device/install identity: local install id and hashed activation record
- local trading runtime identity: local install/operator/access state binding used by the runtime

Local Explore Mode may use only `LocalRuntimeIdentity`. Full Licensed Wolfie requires `UserAccount`, `WolfieAccount`, `License`, `DeviceActivation`, and a valid entitlement. Account/license/device records may exist in Wolfie Cloud, but `LocalRuntimeIdentity` exists locally and trading data must never be stored on cloud account, license, or device records.

Current web-runtime local persistence still uses browser `localStorage` behind runtime local-store wrappers. Browser localStorage is temporary web-runtime backing, not production desktop secure storage. Production desktop hardening still needs SQLCipher or equivalent encrypted local storage, OS keychain/token storage, native filesystem adapters, code signing, notarization, and a desktop runtime such as Tauri/Rust.
