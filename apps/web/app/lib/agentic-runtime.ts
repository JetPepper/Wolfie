import { estimateTradeCosts, type TradeCostEstimate } from "./fees";

export type SourceFreshnessState = "live" | "delayed" | "stale" | "fallback" | "cached" | "waiting" | "unavailable";
export type SignalDirection = "bullish" | "bearish" | "neutral";
export type DecisionState = "ignore" | "watch" | "investigate" | "prepare" | "enter_position" | "reduce_position" | "exit_position" | "block" | "cooldown";

export type SignalEvent = {
  id: string;
  sourceType: "market" | "filing" | "finra" | "news" | "social" | "risk" | "execution";
  sourceName: string;
  sourceUrl?: string;
  symbol: string;
  observedAt: string;
  freshness: SourceFreshnessState;
  direction: SignalDirection;
  confidence: number;
  weight: number;
  explanation: string;
};

export type BotPreset = {
  id: string;
  name: string;
  avatarId: string;
  tradingStyle: string;
  riskTolerance: "Low" | "Medium" | "High";
  allocationMode: "Fixed" | "Percent";
  fixedAllocation: number;
  percentAllocation: number;
  attention: string[];
  ignores: string[];
  signalWeights: Record<string, number>;
  tradeFrequencyLimits: { maxTradesPerDay: number; cooldownMinutes: number };
  stopLossPercent: number;
  takeProfitPercent: number;
  maxDailyLossPercent: number;
  confirmationRules: string[];
  learningRules: string[];
  selfHealingRules: string[];
  education: Record<string, string>;
};

export type RiskGateResult = {
  status: "open" | "caution" | "closed";
  reasons: string[];
  netExpectancyPass: boolean;
  smallAccountProtection: boolean;
  strategySuitabilityScore: number;
};

export type BotMemory = {
  id: string;
  botId: string;
  observedAt: string;
  type: "closed_trade" | "rejected_trade" | "source_quality" | "preset_adjustment";
  lesson: string;
  metric: string;
};

export type SelfHealingAction = {
  id: string;
  botId: string;
  observedAt: string;
  trigger: string;
  action: "pause_trading" | "fallback_source" | "lower_source_confidence" | "reduce_position_size" | "raise_threshold" | "cooldown" | "watch_only" | "request_approval";
  explanation: string;
  boundedChange: string;
  requiresUserApproval: boolean;
};

export type AcquisitionSource = {
  lane: "market" | "filings" | "finra" | "news" | "social";
  adapter: string;
  cadence: string;
  status: SourceFreshnessState;
  lastCheckedAt: string | null;
  detail: string;
};

export type DecisionFrame = {
  id: string;
  botId: string;
  symbol: string;
  observedAt: string;
  state: DecisionState;
  confidence: number;
  expectedGrossMovePercent: number;
  expectedNetProfit: number;
  currentDecision: string;
  rejectedOpportunities: string[];
  whatChangesMind: string[];
  signals: SignalEvent[];
  conflicts: { bullish: string[]; bearish: string[]; uncertainty: string[]; stale: string[] };
  costEstimate: TradeCostEstimate;
  riskGate: RiskGateResult;
  memory: BotMemory[];
  selfHealing: SelfHealingAction[];
  sourceFreshness: AcquisitionSource[];
  unavailableSources: string[];
  staleSources: string[];
  fallbackSources: string[];
  truthConfidence: number;
  tradeConfidence: number;
};

export const educationGlossary = {
  "volume confirmation": "Volume confirmation means price is moving with enough trading activity to make the move harder to dismiss.",
  spread: "Spread is the gap between the price buyers bid and sellers ask. Wider spreads make trades more expensive.",
  slippage: "Slippage is the difference between the price expected and the price actually received.",
  candlestick: "A candlestick summarizes price movement for one time window: open, high, low, and close.",
  volatility: "Volatility is how much and how quickly price moves.",
  "risk/reward": "Risk/reward compares the loss accepted if wrong against the gain targeted if right.",
  "net expectancy": "Net expectancy asks whether the likely gain still makes sense after fees, spread, slippage, and risk.",
  "stop loss": "A stop loss is the price or rule that exits a bad trade before damage grows.",
  "take profit": "Take profit is the planned exit area for locking in gains.",
  "position size": "Position size is how much capital the bot puts into one trade.",
  "fee drag": "Fee drag is how much trading cost eats into the expected move.",
  liquidity: "Liquidity describes whether enough buyers and sellers exist to enter or exit without distorting price.",
  confidence: "Confidence is the bot's weighted conviction after signals, conflicts, source quality, and costs.",
  "signal conflict": "Signal conflict means different inputs disagree, such as bullish price action but poor liquidity.",
  cooldown: "Cooldown means the bot pauses after churn, stale data, or poor execution quality.",
  "politician disclosure delay": "Disclosure delay is the gap between a public official's trade date and the date it becomes publicly available.",
  "insider activity": "Insider activity refers to public filings from officers, directors, or major holders.",
  "options contract": "An options contract gives exposure to 100 shares in most cases and has product-specific fees and risks.",
  "margin interest": "Margin interest is borrowing cost when a position uses borrowed funds."
};

export const acquisitionLadder: AcquisitionSource[] = [
  { lane: "market", adapter: "Local real-data cache -> official/public sources -> public feeds -> public pages -> optional APIs -> UNKNOWN", cadence: "request-driven", status: "waiting", lastCheckedAt: null, detail: "No symbol has been supplied yet. Wolfie waits for a watchlist, bot configuration, scanner discovery, paper position, or explicit request." },
  { lane: "filings", adapter: "SEC EDGAR submissions/company facts -> parser -> cached reviewed filing", cadence: "1-5m for SEC/company filings", status: "delayed", lastCheckedAt: "2026-06-22T09:40:00-05:00", detail: "Disclosure signals are latency-aware and never treated as real-time copy trades." },
  { lane: "finra", adapter: "FINRA datasets/APIs -> publication cadence cache", cadence: "publication cadence", status: "delayed", lastCheckedAt: "2026-06-22T09:30:00-05:00", detail: "Short and market-structure signals are marked delayed." },
  { lane: "news", adapter: "Licensed/authorized API -> public feeds/RSS/pages where allowed", cadence: "30s-2m where authorized", status: "waiting", lastCheckedAt: null, detail: "No invented headlines are generated when a feed is unavailable." },
  { lane: "social", adapter: "Public social sources where allowed -> uncertainty/source-quality labels", cadence: "30s-5m where allowed", status: "fallback", lastCheckedAt: "2026-06-22T09:36:00-05:00", detail: "Private groups, paywalls, and login-gated sources are excluded." }
];

export const botPresets: BotPreset[] = [
  {
    id: "sentinel",
    name: "Sentinel",
    avatarId: "wolfie-shield",
    tradingStyle: "Capital defense and liquid large-cap review",
    riskTolerance: "Low",
    allocationMode: "Percent",
    fixedAllocation: 12000,
    percentAllocation: 12,
    attention: ["liquidity", "spread", "market trend", "drawdown risk"],
    ignores: ["single-source hype", "wide-spread microcaps", "unverified social claims"],
    signalWeights: { market: 34, risk: 28, execution: 24, news: 8, filing: 6 },
    tradeFrequencyLimits: { maxTradesPerDay: 3, cooldownMinutes: 45 },
    stopLossPercent: 4,
    takeProfitPercent: 9,
    maxDailyLossPercent: 2,
    confirmationRules: ["spread must be controlled", "price must hold support", "source freshness cannot be stale"],
    learningRules: ["raise threshold after stale-source losses", "reduce size after execution quality decay"],
    selfHealingRules: ["pause on stale market data", "fallback to cached review when live provider fails"],
    education: educationGlossary,
  },
  {
    id: "surge",
    name: "Surge",
    avatarId: "wolfie-surge",
    tradingStyle: "Momentum ignition with tight churn control",
    riskTolerance: "High",
    allocationMode: "Percent",
    fixedAllocation: 10000,
    percentAllocation: 10,
    attention: ["volume expansion", "trend acceleration", "liquidity", "catalyst freshness"],
    ignores: ["late entries", "stale headlines", "low-float noise"],
    signalWeights: { market: 31, news: 21, execution: 18, risk: 18, social: 12 },
    tradeFrequencyLimits: { maxTradesPerDay: 6, cooldownMinutes: 20 },
    stopLossPercent: 3,
    takeProfitPercent: 11,
    maxDailyLossPercent: 4,
    confirmationRules: ["volume must expand", "spread must clear cost threshold", "trend cannot be late-stage exhaustion"],
    learningRules: ["downgrade social after false positives", "cool down after churn"],
    selfHealingRules: ["raise threshold when spread widens", "watch-only noisy social signals"],
    education: educationGlossary,
  },
  {
    id: "compass",
    name: "Compass",
    avatarId: "wolfie-compass",
    tradingStyle: "Balanced signal fusion across market, risk, and source freshness",
    riskTolerance: "Medium",
    allocationMode: "Percent",
    fixedAllocation: 16000,
    percentAllocation: 16,
    attention: ["signal agreement", "sector breadth", "net expectancy", "freshness"],
    ignores: ["crowded trades without breadth", "unpriced fee drag", "unsourced catalyst claims"],
    signalWeights: { market: 27, news: 18, risk: 22, execution: 21, filing: 12 },
    tradeFrequencyLimits: { maxTradesPerDay: 4, cooldownMinutes: 30 },
    stopLossPercent: 5,
    takeProfitPercent: 13,
    maxDailyLossPercent: 3,
    confirmationRules: ["two independent signal families must agree", "net expectancy must clear costs", "risk gate must be open or caution"],
    learningRules: ["track rejected-trade quality", "lower stale news weight"],
    selfHealingRules: ["fallback source after source failure", "request approval for major preset changes"],
    education: educationGlossary,
  },
  {
    id: "contrarian",
    name: "Contrarian",
    avatarId: "wolfie-alpha",
    tradingStyle: "Mean reversion and crowd-exhaustion review",
    riskTolerance: "Medium",
    allocationMode: "Fixed",
    fixedAllocation: 8000,
    percentAllocation: 8,
    attention: ["failed breakouts", "borrow/liquidity proxy", "sentiment exhaustion", "risk/reward"],
    ignores: ["crowd enthusiasm without failed price action", "private community claims", "uncosted shorts"],
    signalWeights: { market: 30, social: 15, execution: 25, risk: 24, news: 6 },
    tradeFrequencyLimits: { maxTradesPerDay: 3, cooldownMinutes: 50 },
    stopLossPercent: 3,
    takeProfitPercent: 8,
    maxDailyLossPercent: 3,
    confirmationRules: ["breakout must fail", "spread must not impair exit", "risk/reward must be positive after costs"],
    learningRules: ["record missed reversals", "raise threshold after false fades"],
    selfHealingRules: ["cooldown after confidence collapse", "reduce size after repeated losses"],
    education: educationGlossary,
  },
  {
    id: "disclosure",
    name: "Disclosure",
    avatarId: "wolfie-disclosure",
    tradingStyle: "Public filing intelligence with disclosure-delay controls",
    riskTolerance: "Low",
    allocationMode: "Percent",
    fixedAllocation: 6000,
    percentAllocation: 6,
    attention: ["SEC filings", "official disclosure latency", "company confirmation", "market liquidity"],
    ignores: ["screenshots", "private tips", "real-time copy-trade claims"],
    signalWeights: { filing: 38, market: 21, execution: 18, risk: 16, news: 7 },
    tradeFrequencyLimits: { maxTradesPerDay: 2, cooldownMinutes: 90 },
    stopLossPercent: 5,
    takeProfitPercent: 10,
    maxDailyLossPercent: 2,
    confirmationRules: ["official source link required", "filing date and trade date separated", "market confirmation required"],
    learningRules: ["separate thesis quality from disclosure delay", "track avoided stale filing trades"],
    selfHealingRules: ["pause when parser stale", "request approval before mirror-style changes"],
    education: educationGlossary,
  }
];

export function allocationForPreset(preset: BotPreset, capital: number) {
  return preset.allocationMode === "Fixed" ? preset.fixedAllocation : capital * (preset.percentAllocation / 100);
}

export function buildDecisionFrames(capital: number, symbols: string[] = [], nowIso = "2026-06-22T09:42:17-05:00"): DecisionFrame[] {
  const uniqueSymbols = Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)));
  if (!uniqueSymbols.length) return [];
  return botPresets.flatMap((preset, index) => uniqueSymbols.slice(0, 3).map((symbol) => buildDecisionFrame(preset, capital, nowIso, index, symbol)));
}

function buildDecisionFrame(preset: BotPreset, capital: number, nowIso: string, index: number, symbol: string): DecisionFrame {
  const allocation = allocationForPreset(preset, capital);
  const smallAccount = capital <= 1500;
  const turnoverPenalty = preset.tradeFrequencyLimits.maxTradesPerDay > 4 ? 0.14 : 0.04;
  const expectedGrossMovePercent = 0;
  const price = 0;
  const shares = 0;
  const exitPrice = price * (1 + expectedGrossMovePercent / 100);
  const costEstimate = estimateTradeCosts({
    side: "sell",
    shares,
    price,
    exitPrice,
    assetType: "equity",
    accountCapital: capital,
    expectedGrossMovePercent,
    expectedSpreadPercent: preset.id === "surge" ? 0.16 : preset.id === "contrarian" ? 0.22 : 0.08,
    expectedSlippagePercent: preset.id === "surge" ? 0.12 : 0.06,
    holdingDays: preset.id === "surge" ? 1 : 4
  });
  const expectedNetProfit = costEstimate.netPnl;
  const signals = buildSignals(preset, nowIso, expectedGrossMovePercent, smallAccount, symbol);
  const staleSignals = signals.filter((signal) => signal.freshness === "stale" || signal.freshness === "waiting").map((signal) => `${signal.sourceName}: ${signal.explanation}`);
  const confidence = Math.round(signals.reduce((sum, signal) => sum + signal.confidence * (signal.weight / 100), 0));
  const netExpectancyPass = false;
  const smallAccountProtection = smallAccount && (preset.tradeFrequencyLimits.maxTradesPerDay > 3 || turnoverPenalty > 0.1);
  const riskGate: RiskGateResult = {
    status: smallAccountProtection || !netExpectancyPass || staleSignals.length > 1 ? "closed" : staleSignals.length || costEstimate.accountSizeSuitability === "Caution" ? "caution" : "open",
    reasons: [
      "Net expectancy is unavailable until real quote, spread, volume, and candle inputs are acquired.",
      smallAccountProtection ? "Small-account protection blocks high-churn or low-margin entries." : "Account size is suitable for this turnover profile.",
      "Source acquisition has not produced enough evidence for a paper trade."
    ],
    netExpectancyPass,
    smallAccountProtection,
    strategySuitabilityScore: Math.max(12, Math.round(92 - costEstimate.feeDragPercent * 120 - (smallAccountProtection ? 42 : 0) - staleSignals.length * 8))
  };
  const state: DecisionState = riskGate.status === "closed" ? (smallAccountProtection ? "cooldown" : "block") : confidence >= 74 && riskGate.status === "open" ? "prepare" : "watch";
  return {
    id: `${preset.id}-${symbol}`,
    botId: preset.id,
    symbol,
    observedAt: nowIso,
    state,
    confidence,
    expectedGrossMovePercent,
    expectedNetProfit,
    currentDecision: decisionCopy(preset, state, costEstimate, riskGate),
    rejectedOpportunities: [
      `Rejected ${symbol} paper entry until spread and slippage leave positive net expectancy.`,
      `Rejected position expansion without ${preset.confirmationRules[0].toLowerCase()}.`
    ],
    whatChangesMind: [
      `Expected net profit must exceed ${formatRuntimeMoney(Math.max(2, allocation * 0.0015))} after estimated costs.`,
      `Source freshness must move from waiting/stale to delayed or live for the active lanes.`,
      `${preset.confirmationRules[0]}.`
    ],
    signals,
    conflicts: {
      bullish: signals.filter((signal) => signal.direction === "bullish").map((signal) => signal.explanation),
      bearish: signals.filter((signal) => signal.direction === "bearish").map((signal) => signal.explanation),
      uncertainty: signals.filter((signal) => signal.direction === "neutral").map((signal) => signal.explanation),
      stale: staleSignals
    },
    costEstimate,
    riskGate,
    memory: [
      { id: `${preset.id}-m1`, botId: preset.id, observedAt: nowIso, type: "rejected_trade", lesson: `Recent review favored waiting when ${preset.ignores[0]} appeared.`, metric: "avoided weak setup" },
      { id: `${preset.id}-m2`, botId: preset.id, observedAt: nowIso, type: "source_quality", lesson: `Freshness penalties are applied before confidence can trigger ${state}.`, metric: `self-trust ${riskGate.strategySuitabilityScore}%` }
    ],
    selfHealing: [
      {
        id: `${preset.id}-h1`,
        botId: preset.id,
        observedAt: nowIso,
        trigger: staleSignals.length ? "Source lane not fresh enough" : "Execution quality watch",
        action: staleSignals.length ? "lower_source_confidence" : "raise_threshold",
        explanation: staleSignals.length ? "The bot lowered confidence for stale or waiting lanes instead of inventing a live signal." : "The bot keeps threshold elevated until cost-adjusted quality improves.",
        boundedChange: "Maximum signal-weight change is 5 points per review window.",
        requiresUserApproval: preset.id === "disclosure"
      }
    ],
    sourceFreshness: acquisitionLadder,
    unavailableSources: ["market consensus", "bid/ask spread", "source-confirmed catalyst"],
    staleSources: staleSignals,
    fallbackSources: acquisitionLadder.filter((source) => source.status === "fallback").map((source) => source.lane),
    truthConfidence: confidence / 100,
    tradeConfidence: 0
  };
}

function buildSignals(preset: BotPreset, nowIso: string, expectedGrossMovePercent: number, smallAccount: boolean, symbol: string): SignalEvent[] {
  const weighted = Object.entries(preset.signalWeights).sort((left, right) => right[1] - left[1]);
  return weighted.map(([source, weight], index) => ({
    id: `${preset.id}-${source}`,
    sourceType: source as SignalEvent["sourceType"],
    sourceName: source === "market" ? "Market/candle ladder" : source === "filing" ? "SEC and disclosure ladder" : source === "execution" ? "TradeCostEngine execution quality" : source === "risk" ? "Risk and capital gate" : source === "social" ? "Public social uncertainty filter" : "Authorized news/public feed ladder",
    sourceUrl: source === "filing" ? "https://www.sec.gov/edgar/search/" : source === "risk" || source === "execution" ? undefined : "https://www.finra.org/rules-guidance/guidance/trading-activity-fee",
    symbol,
    observedAt: nowIso,
    freshness: source === "market" || source === "news" ? "waiting" : source === "filing" || source === "finra" ? "delayed" : source === "social" ? "fallback" : "unavailable",
    direction: smallAccount && source === "risk" ? "bearish" : "neutral",
    confidence: Math.max(18, Math.min(62, 38 + weight - index * 3 - (smallAccount && source !== "risk" ? 9 : 0))),
    weight,
    explanation: source === "execution"
      ? "Estimated spread, slippage, and fees are included before any trade state can advance."
      : source === "risk"
        ? smallAccount ? "Capital size makes high-turnover economics fragile." : "Capital and position limits are inside the preset guardrails."
        : `${preset.name} weights ${source} because it watches ${preset.attention.slice(0, 2).join(" and ")}.`
  }));
}

function decisionCopy(preset: BotPreset, state: DecisionState, costs: TradeCostEstimate, gate: RiskGateResult) {
  if (state === "cooldown") return `${preset.name} is in cooldown because this account size makes fee drag and execution friction too expensive for the current turnover profile.`;
  if (state === "block") return `${preset.name} blocks the setup: direction is not enough because expected net profit is ${formatRuntimeMoney(costs.netPnl)} after estimated costs.`;
  if (state === "prepare") return `${preset.name} is preparing only after net expectancy, source freshness, and risk gates clear.`;
  return `${preset.name} is watching. The setup needs stronger confirmation before capital is committed.`;
}

function formatRuntimeMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
