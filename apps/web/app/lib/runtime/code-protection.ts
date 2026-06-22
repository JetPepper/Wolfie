import type { WolfieEnvironment } from "./runtime-types";

export type RuntimeTrustState = {
  trustedForLive: boolean;
  tamperState: "unknown" | "trusted" | "suspicious";
  reasons: string[];
};

export function verifyReleaseManifestSignature(options: { environment: WolfieEnvironment; publicKey?: string; manifest?: unknown; signature?: string }): boolean {
  if (options.environment === "production") return Boolean(options.publicKey && options.manifest && options.signature) && false;
  return true;
}

export function verifyRuntimeIntegrityManifest(options: { environment: WolfieEnvironment; manifest?: unknown; signature?: string }): boolean {
  if (options.environment === "production") return Boolean(options.manifest && options.signature) && false;
  return true;
}

export function getRuntimeTrustState(environment: WolfieEnvironment): RuntimeTrustState {
  if (environment === "production") {
    return {
      trustedForLive: false,
      tamperState: "unknown",
      reasons: ["production_integrity_manifest_verification_not_implemented"],
    };
  }
  return { trustedForLive: true, tamperState: "trusted", reasons: ["dev_test_trust_stub"] };
}

export function assertTrustedRuntimeForLive(environment: WolfieEnvironment): void {
  const trust = getRuntimeTrustState(environment);
  if (!trust.trustedForLive) throw new Error(`Runtime not trusted for live execution: ${trust.reasons.join(", ")}`);
}
