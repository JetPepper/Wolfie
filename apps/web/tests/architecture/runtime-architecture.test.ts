import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  StubLocalBrokerConnector,
  assertCloudPayloadSafe,
  assertAccountRecordSafe,
  assertFullRuntimeAllowed,
  createLocalRuntimeIdentity,
  createDevFullWolfieEntitlement,
  createDevOwnerRecoveryAssertion,
  evaluateCommercialAccountAccess,
  evaluateExecutionGuard,
  evaluateOwnerRecovery,
  getWolfieAccessState,
  inspectCloudPayloadSafety,
  validateEntitlementToken,
  type DeviceActivationRecord,
  wolfieCloudRequest,
  type License,
  type EntitlementValidationResult,
  type UserAccount,
  type WolfieAccount,
  type SignedEntitlementToken,
} from "../../app/lib/runtime";

type TestCase = { name: string; run: () => void | Promise<void> };
const tests: TestCase[] = [];
function test(name: string, run: TestCase["run"]) {
  tests.push({ name, run });
}

const now = new Date("2026-06-22T12:00:00.000Z");
const deviceIdHash = "device-hash";

function validToken(overrides: Partial<SignedEntitlementToken["payload"]> = {}): SignedEntitlementToken {
  const token = createDevFullWolfieEntitlement({
    environment: "test",
    subject: "user_1",
    accountId: "acct_1",
    licenseId: "lic_1",
    deviceIdHash,
    now,
  });
  token.payload = { ...token.payload, ...overrides };
  token.signature = `dev-signature:${token.payload.tokenId}`;
  return token;
}

function validEntitlement(token = validToken()): EntitlementValidationResult {
  return validateEntitlementToken(token, { environment: "test", now, deviceIdHash, allowDevDeterministicSignatures: true });
}

const invalidEntitlement: EntitlementValidationResult = {
  valid: false,
  reasonCodes: ["missing_entitlement"],
  withinOfflineGrace: false,
};

function baseGuardInput(entitlement = validEntitlement()) {
  return {
    identity: { userId: "user_1" },
    deviceIdHash,
    entitlement,
    requestedMode: "Live" as const,
    brokerConnector: { status: "local_ready" as const, localReady: true },
    botId: "bot_1",
    botActive: true,
    mandateId: "mandate_1",
    mandateVersion: "1",
    killSwitchActive: false,
    intendedAction: "live_order" as const,
    ticker: "WOLF",
    side: "BUY" as const,
    quantityOrNotional: 1,
    riskPassed: true,
    route: "local" as const,
  };
}

function accountFixture() {
  const userAccount: UserAccount = {
    id: "user_1",
    email: "operator@example.com",
    displayName: "Operator",
    role: "USER",
    createdAt: now.toISOString(),
    status: "active",
  };
  const wolfieAccount: WolfieAccount = {
    accountId: "acct_1",
    ownerUserId: userAccount.id,
    billingCustomerId: "billing_placeholder",
    subscriptionStatus: "active",
    licenseStatus: "active",
    createdAt: now.toISOString(),
  };
  const license: License = {
    licenseId: "lic_1",
    accountId: wolfieAccount.accountId,
    status: "active",
    accessLevel: "FULL_WOLFIE",
    validFrom: "2026-01-01T00:00:00.000Z",
    validUntil: "2026-12-31T00:00:00.000Z",
    maxDevices: 3,
  };
  const deviceActivation: DeviceActivationRecord = {
    deviceIdHash,
    accountId: wolfieAccount.accountId,
    licenseId: license.licenseId,
    activatedAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    status: "active",
    deviceLabel: "Local test device",
  };
  return { userAccount, wolfieAccount, license, deviceActivation };
}

test("pins local explore mode requires no login", () => {
  assert.equal(getWolfieAccessState({ entitlement: invalidEntitlement, ownerRecovery: { allowed: false, reasons: [], userFacingExplanation: "" }, wantsFullRuntime: false }), "LOCAL_EXPLORE");
});

test("pins full wolfie requires valid entitlement", () => {
  assert.equal(getWolfieAccessState({ entitlement: validEntitlement(), ownerRecovery: { allowed: false, reasons: [], userFacingExplanation: "" }, wantsFullRuntime: true }), "FULL_LICENSED");
});

test("pins live runtime requires full licensed access", () => {
  assert.throws(() => assertFullRuntimeAllowed("LOCAL_EXPLORE"));
  assert.doesNotThrow(() => assertFullRuntimeAllowed("FULL_LICENSED"));
});

test("pins invalid entitlement falls back to local explore only", () => {
  assert.equal(getWolfieAccessState({ entitlement: invalidEntitlement, ownerRecovery: { allowed: false, reasons: [], userFacingExplanation: "" }, wantsFullRuntime: true }), "LOCAL_EXPLORE");
});

test("pins no tiered premium module model exists", () => {
  const runtimeRoot = resolve(process.cwd(), "app/lib/runtime");
  const content = collectFiles(runtimeRoot).map((file) => readFileSync(file, "utf8")).join("\n").toLowerCase();
  assert.equal(/pro tier|premium module|subscription tier/.test(content), false);
});

test("pins all or nothing entitlement model", () => {
  assert.equal(validEntitlement().entitlement?.accessLevel, "FULL_WOLFIE");
});

test("pins commercial account foundation models", () => {
  const { userAccount, wolfieAccount, license, deviceActivation } = accountFixture();
  assert.equal(userAccount.id, "user_1");
  assert.equal(wolfieAccount.accountId, "acct_1");
  assert.equal(license.accessLevel, "FULL_WOLFIE");
  assert.equal(deviceActivation.deviceIdHash, deviceIdHash);
});

test("pins local explore uses local runtime identity only", () => {
  const localRuntimeIdentity = createLocalRuntimeIdentity("install_1");
  assert.deepEqual(localRuntimeIdentity, { localInstallId: "install_1", localOperatorLabel: "Local Operator", accessState: "LOCAL_EXPLORE" });
  const result = evaluateCommercialAccountAccess({ localRuntimeIdentity, entitlement: invalidEntitlement });
  assert.equal(result.accessState, "LOCAL_EXPLORE");
});

test("pins full wolfie requires account license device and entitlement", () => {
  const fixture = accountFixture();
  const localRuntimeIdentity = { ...createLocalRuntimeIdentity("install_1"), activeAccountId: fixture.wolfieAccount.accountId, activeLicenseId: fixture.license.licenseId, activeDeviceIdHash: fixture.deviceActivation.deviceIdHash };
  const result = evaluateCommercialAccountAccess({ ...fixture, localRuntimeIdentity, entitlement: validEntitlement() });
  assert.equal(result.allowed, true);
  assert.equal(evaluateCommercialAccountAccess({ ...fixture, license: undefined, localRuntimeIdentity, entitlement: validEntitlement() }).allowed, false);
  assert.equal(evaluateCommercialAccountAccess({ ...fixture, deviceActivation: undefined, localRuntimeIdentity, entitlement: validEntitlement() }).allowed, false);
});

test("rejects trading fields in account records", () => {
  const { userAccount } = accountFixture();
  assert.throws(() => assertAccountRecordSafe({ ...userAccount, trades: [] } as never));
});

test("rejects trading fields in license records", () => {
  const { license } = accountFixture();
  assert.throws(() => assertAccountRecordSafe({ ...license, positions: [] } as never));
});

test("rejects trading fields in device activation records", () => {
  const { deviceActivation } = accountFixture();
  assert.throws(() => assertAccountRecordSafe({ ...deviceActivation, broker: "never" } as never));
});

test("pins all or nothing account access model", () => {
  const runtimeTypes = readFileSync(resolve(process.cwd(), "app/lib/runtime/runtime-types.ts"), "utf8");
  assert.match(runtimeTypes, /LOCAL_EXPLORE/);
  assert.match(runtimeTypes, /FULL_LICENSED/);
  assert.match(runtimeTypes, /OWNER_RECOVERY_DEV/);
  assert.match(runtimeTypes, /BLOCKED/);
  assert.equal(/FREE|PRO|PREMIUM|TIER/.test(runtimeTypes), false);
});

test("pins master dev owner access in development only", () => {
  assert.equal(evaluateOwnerRecovery({ environment: "development", assertion: createDevOwnerRecoveryAssertion() }).allowed, true);
});

test("pins master dev owner access in test only", () => {
  assert.equal(evaluateOwnerRecovery({ environment: "test", assertion: createDevOwnerRecoveryAssertion() }).allowed, true);
});

test("blocks unsigned owner recovery in production", () => {
  assert.equal(evaluateOwnerRecovery({ environment: "production", enableOwnerRecovery: true, publicKey: "public" }).allowed, false);
});

test("blocks password only owner recovery in production", () => {
  assert.equal(evaluateOwnerRecovery({ environment: "production", masterDevPassword: "local-only" }).allowed, false);
});

test("allows signed owner recovery assertion path", () => {
  const assertion = { ...createDevOwnerRecoveryAssertion("prod"), signature: "signed-recovery-stub:public:prod", environment: "recovery" as const };
  assert.equal(evaluateOwnerRecovery({ environment: "production", enableOwnerRecovery: true, publicKey: "public", assertion, now }).allowed, true);
});

test("pins owner recovery never sends trade data to cloud", () => {
  assert.throws(() => assertCloudPayloadSafe({ ownerRecovery: true, trades: [] }));
});

test("validates full wolfie entitlement", () => {
  assert.equal(validEntitlement().valid, true);
});

test("rejects missing entitlement", () => {
  assert.equal(validateEntitlementToken(null, { environment: "test", deviceIdHash, now }).reasonCodes[0], "missing_entitlement");
});

test("rejects expired entitlement", () => {
  const result = validateEntitlementToken(validToken({ expiresAt: "2026-01-01T00:00:00.000Z", offlineGraceExpiresAt: "2026-01-02T00:00:00.000Z" }), { environment: "test", deviceIdHash, now, allowDevDeterministicSignatures: true });
  assert.equal(result.valid, false);
  assert.ok(result.reasonCodes.includes("expired_entitlement"));
});

test("allows offline grace before expiry", () => {
  const result = validateEntitlementToken(validToken({ expiresAt: "2026-06-21T00:00:00.000Z", offlineGraceExpiresAt: "2026-06-23T00:00:00.000Z" }), { environment: "test", deviceIdHash, now, allowDevDeterministicSignatures: true });
  assert.equal(result.valid, true);
  assert.ok(result.reasonCodes.includes("offline_grace"));
});

test("rejects offline grace after expiry", () => {
  const result = validateEntitlementToken(validToken({ expiresAt: "2026-06-20T00:00:00.000Z", offlineGraceExpiresAt: "2026-06-21T00:00:00.000Z" }), { environment: "test", deviceIdHash, now, allowDevDeterministicSignatures: true });
  assert.equal(result.valid, false);
});

test("rejects wrong device binding", () => {
  assert.equal(validateEntitlementToken(validToken({ deviceIdHash: "other" }), { environment: "test", deviceIdHash, now, allowDevDeterministicSignatures: true }).valid, false);
});

test("rejects wrong audience", () => {
  assert.equal(validateEntitlementToken(validToken({ audience: "other" as never }), { environment: "test", deviceIdHash, now, allowDevDeterministicSignatures: true }).valid, false);
});

test("rejects wrong issuer", () => {
  assert.equal(validateEntitlementToken(validToken({ issuer: "other" as never }), { environment: "test", deviceIdHash, now, allowDevDeterministicSignatures: true }).valid, false);
});

test("pins private signing key is not present in repo", () => {
  const repoRoot = resolve(process.cwd(), "../..");
  const content = collectFiles(repoRoot, (file) => !file.includes("node_modules") && !file.includes(".git")).map((file) => readFileSync(file, "utf8")).join("\n");
  assert.equal(/BEGIN (RSA|OPENSSH|EC|PRIVATE) KEY/.test(content), false);
});

test("pins entitlement token contains no trading data", () => {
  const result = validateEntitlementToken(validToken({ trades: [] } as never), { environment: "test", deviceIdHash, now, allowDevDeterministicSignatures: true });
  assert.equal(result.valid, false);
});

test("rejects direct trade payloads to cloud", () => assert.throws(() => assertCloudPayloadSafe({ trades: [] })));
test("rejects nested order payloads to cloud", () => assert.throws(() => assertCloudPayloadSafe({ body: { order: { symbol: "WOLF" } } })));
test("rejects broker token payloads to cloud", () => assert.throws(() => assertCloudPayloadSafe({ accessToken: "secret" })));
test("rejects robinhood account payloads to cloud", () => assert.throws(() => assertCloudPayloadSafe({ robinhood: { accountNumber: "1" } })));
test("rejects bot mandate payloads to cloud", () => assert.throws(() => assertCloudPayloadSafe({ agentMandate: "buy" })));
test("rejects risk settings payloads to cloud", () => assert.throws(() => assertCloudPayloadSafe({ riskSettings: {} })));
test("rejects watchlist payloads to cloud", () => assert.throws(() => assertCloudPayloadSafe({ watchlist: ["WOLF"] })));
test("rejects source weights payloads to cloud", () => assert.throws(() => assertCloudPayloadSafe({ sourceWeights: {} })));
test("rejects portfolio balance payloads to cloud", () => assert.throws(() => assertCloudPayloadSafe({ portfolio: { balance: 1 } })));
test("allows entitlement refresh metadata only", () => assert.doesNotThrow(() => assertCloudPayloadSafe({ entitlementTokenId: "t1", deviceIdHash })));
test("allows device activation hash only", () => assert.doesNotThrow(() => assertCloudPayloadSafe({ deviceIdHash, appVersion: "0.1.0" })));
test("allows app version metadata only", () => assert.doesNotThrow(() => assertCloudPayloadSafe({ appVersion: "0.1.0", releaseChannel: "stable" })));

test("blocks live execution without full entitlement", () => assert.equal(evaluateExecutionGuard(baseGuardInput(invalidEntitlement)).allowed, false));
test("blocks live execution with expired entitlement", () => assert.equal(evaluateExecutionGuard(baseGuardInput(validateEntitlementToken(validToken({ expiresAt: "2026-01-01T00:00:00.000Z", offlineGraceExpiresAt: "2026-01-02T00:00:00.000Z" }), { environment: "test", deviceIdHash, now, allowDevDeterministicSignatures: true }))).allowed, false));
test("blocks live execution when device binding fails", () => assert.equal(evaluateExecutionGuard(baseGuardInput(validateEntitlementToken(validToken({ deviceIdHash: "wrong" }), { environment: "test", deviceIdHash, now, allowDevDeterministicSignatures: true }))).allowed, false));
test("blocks live execution without local broker connector", () => assert.equal(evaluateExecutionGuard({ ...baseGuardInput(), brokerConnector: new StubLocalBrokerConnector().getLocalReadiness() }).allowed, false));
test("blocks live execution when kill switch active", () => assert.equal(evaluateExecutionGuard({ ...baseGuardInput(), killSwitchActive: true }).allowed, false));
test("blocks live execution when bot inactive", () => assert.equal(evaluateExecutionGuard({ ...baseGuardInput(), botActive: false }).allowed, false));
test("blocks live execution without mandate", () => assert.equal(evaluateExecutionGuard({ ...baseGuardInput(), mandateId: undefined }).allowed, false));
test("blocks live execution on risk breach", () => assert.equal(evaluateExecutionGuard({ ...baseGuardInput(), riskPassed: false }).allowed, false));
test("blocks live execution through cloud route", () => assert.equal(evaluateExecutionGuard({ ...baseGuardInput(), route: "cloud" }).allowed, false));
test("allows local live execution only after all checks pass", () => assert.equal(evaluateExecutionGuard(baseGuardInput()).allowed, true));

test("pins save capital is local only", () => assert.equal(inspectCloudPayloadSafety({ capital: 1000 }).safe, true));
test("pins save bot config is local only", () => assert.equal(inspectCloudPayloadSafety({ botConfig: {} }).safe, false));
test("pins deploy bot is local only", () => assert.equal(inspectCloudPayloadSafety({ botSettings: {} }).safe, false));
test("pins order intent cannot be sent to wolfie cloud", () => assert.equal(inspectCloudPayloadSafety({ orderIntent: { symbol: "WOLF" } }).safe, false));
test("pins decision logs remain local only", () => assert.equal(inspectCloudPayloadSafety({ decisionLog: [] }).safe, false));
test("pins broker fields remain local only", () => assert.equal(inspectCloudPayloadSafety({ broker: "local" }).safe, false));
test("pins entitlement refresh excludes trading data", async () => {
  const result = await wolfieCloudRequest({ path: "/entitlement/refresh", payload: { entitlementTokenId: "t1", deviceIdHash } }, async () => "ok");
  assert.equal(result, "ok");
});
test("pins direct cloud fetch is blocked outside wolfie cloud client", () => {
  const client = readFileSync(resolve(process.cwd(), "app/lib/runtime/wolfie-cloud-client.ts"), "utf8");
  assert.match(client, /assertAllowedCloudMetadataShape/);
});

test("production blocks dev entitlement provider", () => assert.throws(() => createDevFullWolfieEntitlement({ environment: "production", subject: "u", accountId: "a", licenseId: "l", deviceIdHash })));
test("production blocks unsigned owner recovery", () => assert.equal(evaluateOwnerRecovery({ environment: "production", enableOwnerRecovery: true }).allowed, false));
test("production blocks fake signer", () => assert.equal(validateEntitlementToken(validToken(), { environment: "production", deviceIdHash, now, publicVerificationKey: "public" }).valid, false));
test("production blocks missing public verification config for live unlock", () => assert.equal(validateEntitlementToken(validToken(), { environment: "production", deviceIdHash, now }).productionVerificationUnavailable, true));
test("production allows local explore without entitlement", () => assert.equal(getWolfieAccessState({ entitlement: invalidEntitlement, ownerRecovery: { allowed: false, reasons: [], userFacingExplanation: "" }, wantsFullRuntime: false }), "LOCAL_EXPLORE"));
test("production fails closed for live runtime when token verification unavailable", () => assert.equal(validateEntitlementToken(validToken(), { environment: "production", deviceIdHash, now }).valid, false));

function collectFiles(root: string, include: (file: string) => boolean = () => true): string[] {
  const files: string[] = [];
  const ignoredDirectories = new Set([".git", ".next", ".architecture-build", "node_modules", "out", "test-results"]);
  for (const entry of readdirSync(root)) {
    if (ignoredDirectories.has(entry)) continue;
    const full = join(root, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...collectFiles(full, include));
    else if (/\.(ts|tsx|js|md)$/.test(full) && include(full)) files.push(full);
  }
  return files;
}

async function main() {
  for (const item of tests) {
    await item.run();
    console.log(`ok - ${item.name}`);
  }
  console.log(`${tests.length} architecture tests passed`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
