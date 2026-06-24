import { readLocalRuntimeValue, writeLocalRuntimeValue, type RuntimeStorage } from "./local-store";

const MANDATE_KEY_PREFIX = "wolfie.mandate.";

export type LocalAgentMandate = {
  id: string;
  version: string;
  botId: string;
  text: string;
  savedAt: string;
};

export function readLocalMandate(botId: string, storage?: RuntimeStorage): LocalAgentMandate | null {
  const raw = readLocalRuntimeValue(`${MANDATE_KEY_PREFIX}${botId}`, storage);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalAgentMandate;
  } catch {
    return null;
  }
}

export function writeLocalMandate(mandate: LocalAgentMandate, storage?: RuntimeStorage): void {
  writeLocalRuntimeValue(`${MANDATE_KEY_PREFIX}${mandate.botId}`, JSON.stringify(mandate), storage);
}
