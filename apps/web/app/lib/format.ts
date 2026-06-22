export function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatSignedMoney(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatMoney(value)}`;
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function parseMoneyInput(value: string) {
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoneyInput(value: string | number) {
  const raw = String(value).replace(/[^\d.]/g, "");
  if (!raw) return "";
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? formatMoney(parsed) : "";
}

export function formatFreshness(isoTimestamp: string) {
  const then = new Date(isoTimestamp).getTime();
  const now = Date.now();
  if (!Number.isFinite(then)) return "Freshness unavailable";
  const minutes = Math.max(0, Math.round((now - then) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} days ago`;
}
