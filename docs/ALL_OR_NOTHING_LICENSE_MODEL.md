# All-Or-Nothing License Model

Wolfie has no partial paid module model and no feature tiers. The access states are:

- `LOCAL_EXPLORE`: no login, no entitlement, local-only exploration, paper/simulation behavior, no live broker execution, no full live agent runtime.
- `FULL_LICENSED`: login plus valid signed `FULL_WOLFIE` entitlement, valid device binding, and local acknowledgements unlock the full Wolfie runtime locally.
- `OWNER_RECOVERY_DEV`: founder/operator development, QA, entitlement tests, and recovery path under strict dev/test or signed recovery conditions.
- `BLOCKED`: live/full runtime is blocked, while Local Explore remains available.

The UI can display access state, but it is not the security source of truth. Runtime entitlement validation, owner recovery checks, device binding, runtime trust checks, broker connector readiness, and the execution guard enforce the boundary.

Production signing is not implemented in this pass. Production live/full runtime fails closed when public verification material or production verification is unavailable.
