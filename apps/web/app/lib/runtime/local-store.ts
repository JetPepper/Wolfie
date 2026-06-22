export type RuntimeStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
};

// Browser localStorage is temporary web-runtime backing, not production desktop secure storage.
export function getBrowserRuntimeStorage(): RuntimeStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readLocalRuntimeValue(key: string, storage = getBrowserRuntimeStorage()): string | null {
  return storage?.getItem(key) ?? null;
}

export function writeLocalRuntimeValue(key: string, value: string, storage = getBrowserRuntimeStorage()): void {
  storage?.setItem(key, value);
}

export function clearLocalRuntimeState(storage = getBrowserRuntimeStorage()): void {
  storage?.clear();
}
