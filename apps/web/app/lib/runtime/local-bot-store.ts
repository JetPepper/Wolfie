import { readLocalRuntimeValue, writeLocalRuntimeValue, type RuntimeStorage } from "./local-store";

const BOT_KEY = "wolfie.bots";

export function readLocalBots<T>(fallback: T[], storage?: RuntimeStorage): T[] {
  const raw = readLocalRuntimeValue(BOT_KEY, storage);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

export function writeLocalBots<T>(bots: T[], storage?: RuntimeStorage): void {
  writeLocalRuntimeValue(BOT_KEY, JSON.stringify(bots), storage);
}
