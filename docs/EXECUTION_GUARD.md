# Execution Guard

The local execution guard is the runtime gate for live actions. It does not implement real broker trading in this pass.

The guard blocks live execution when:

- no valid `FULL_WOLFIE` entitlement exists
- entitlement is expired and offline grace is expired
- device binding fails
- local broker connector is not ready
- kill switch is active
- bot is inactive
- Agent Mandate is missing
- risk checks fail
- route is cloud
- an order intent would be sent to Wolfie Cloud
- current mode is Paper but action requests live broker execution
- current mode is Live but entitlement is invalid

It allows local live execution only when entitlement, device binding, Live mode, local broker readiness, active bot, mandate, risk, kill switch, and local route checks all pass.

The broker connector abstraction in `broker-connector.ts` is a fail-closed local stub. Future Robinhood MCP or other broker integration must keep credentials, sessions, order intents, and execution results local-only. There is no Wolfie Cloud broker proxy and no cloud order route.

Production hardening still requires native storage, keychain integration, connector implementation, signed runtime integrity checks, code signing, and notarization.
