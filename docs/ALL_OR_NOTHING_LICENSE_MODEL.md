# All-Or-Nothing License Model

Wolfie has no partial paid module model and no feature tiers. The access states are:

- `LOCAL_EXPLORE`: no login, no entitlement, local-only exploration, paper/simulation behavior, no live broker execution, no full live agent runtime.
- `FULL_LICENSED`: login plus valid signed `FULL_WOLFIE` entitlement, valid device binding, and local acknowledgements unlock the full Wolfie runtime locally.
- `OWNER_RECOVERY_DEV`: founder/operator development, QA, entitlement tests, and recovery path under strict dev/test or signed recovery conditions.
- `BLOCKED`: live/full runtime is blocked, while Local Explore remains available.

The UI can display access state, but it is not the security source of truth. Runtime entitlement validation, owner recovery checks, device binding, runtime trust checks, broker connector readiness, and the execution guard enforce the boundary.

Commercial account foundation:

- `UserAccount`: id, email, display name, role, creation time, status
- `WolfieAccount`: account id, owner user id, billing customer placeholder, subscription status, license status, creation time
- `License`: license id, account id, `FULL_WOLFIE`, validity window, max devices, optional revocation data
- `DeviceActivation`: device hash, account id, license id, activation/last seen timestamps, status, optional device label
- `LocalRuntimeIdentity`: local install id, local operator label, active account/license/device ids, access state

Local Explore uses only `LocalRuntimeIdentity`. Full Licensed Wolfie requires account, license, device activation, and entitlement to agree. These records are metadata only and must not carry trades, positions, broker credentials, Agent Mandates, risk settings, watchlists, source weights, P&L, order intents, or execution results.

Production signing is not implemented in this pass. Production live/full runtime fails closed when public verification material or production verification is unavailable.
