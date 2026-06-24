import { readLocalRuntimeValue, writeLocalRuntimeValue, type RuntimeStorage } from "./local-store";

const TRADE_KEY = "wolfie.trades";

export function readLocalTrades<T>(storage?: RuntimeStorage): T[] {
  const raw = readLocalRuntimeValue(TRADE_KEY, storage);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function writeLocalTrades<T>(trades: T[], storage?: RuntimeStorage): void {
  writeLocalRuntimeValue(TRADE_KEY, JSON.stringify(trades), storage);
}
