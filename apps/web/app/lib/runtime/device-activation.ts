import type { EntitlementTokenPayload } from "./entitlement-types";

export type DeviceActivationStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

const DEVICE_ID_KEY = "wolfie.runtime.deviceId";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `wolfie-device-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

async function sha256(input: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) hash = (hash * 31 + input.charCodeAt(index)) | 0;
  return `devhash-${Math.abs(hash)}`;
}

export function getOrCreateDeviceId(store: DeviceActivationStore): string {
  const existing = store.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const created = randomId();
  store.setItem(DEVICE_ID_KEY, created);
  return created;
}

export async function getDeviceIdHash(store: DeviceActivationStore): Promise<string> {
  return sha256(getOrCreateDeviceId(store));
}

export async function validateDeviceBinding(entitlement: EntitlementTokenPayload, store: DeviceActivationStore): Promise<boolean> {
  return entitlement.deviceIdHash === await getDeviceIdHash(store);
}

export function resetDeviceActivation(store: DeviceActivationStore): void {
  store.removeItem?.(DEVICE_ID_KEY);
}
