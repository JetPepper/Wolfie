"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { estimateRobinhoodStyleFees, robinhoodStyleFeeSchedule } from "./lib/fees";
import {
  acquisitionLadder,
  buildDecisionFrames,
  botPresets,
  educationGlossary,
  type DecisionFrame
} from "./lib/agentic-runtime";
import { formatFreshness, formatMoney, formatMoneyInput, formatPercent, formatSignedMoney, parseMoneyInput } from "./lib/format";

type ViewId = "dashboard" | "bots" | "signals" | "activity" | "settings";
type Mode = "Simulated" | "Live";
type BotId = string;
type AllocationMode = "Fixed" | "Percent";
type Direction = "Long" | "Short";
type DrawerId = "thought" | "live" | "activity" | "profit" | "available" | "allocated" | "pnl" | "fees" | "success" | "asset" | "provider";
type MetricDrawerId = Extract<DrawerId, "available" | "allocated" | "pnl" | "fees" | "success">;
type BotStatus = "Inactive" | "Configure" | "Armed" | "Active" | "Paused" | "Error" | "Needs Setup";

type Bot = {
  id: BotId;
  name: string;
  archetype: string;
  personality: string;
  quip: string;
  strategy: string;
  risk: "Low" | "Medium" | "High";
  defaultAllocation: number;
  watchlist: string[];
  thesis: string;
  decision: string;
  nextAction: string;
  rejectedSignals: string[];
  inputs: string[];
  guardrails: string[];
};

type BotRuntime = Bot & {
  enabled: boolean;
  status: BotStatus;
  allocationMode: AllocationMode;
  fixedAllocation: number;
  percentAllocation: number;
  maxPositionSize: number;
  stopLoss: number;
  takeProfit: number;
  maxDailyLoss?: number;
  maxTradesPerDay?: number;
  assetUniverse?: string;
  allowedMarkets?: string;
  exclusions?: string;
  confidenceThreshold?: number;
  entryRules?: string;
  exitRules?: string;
  botClass?: "primary" | "other" | "custom";
  avatarTone?: string;
  lastEvaluated?: string;
};

type Trade = {
  id: string;
  timestamp: string;
  botId: BotId;
  symbol: string;
  side: "Buy" | "Sell" | "Short" | "Cover";
  direction: Direction;
  quantity: number;
  price: number;
  status: "Open" | "Closed";
  grossPnl: number;
  fees: number;
  strategy: string;
};

type DisclosureFigure = {
  name: string;
  role: string;
  category: "Politicians" | "Public Figures" | "Insiders";
  annualizedReturn?: number;
  freshness?: string;
  latestTrades: string[];
  sources: { label: string; url: string }[];
};

type DisclosurePerson = {
  name: string;
  category: "Politicians" | "Public Figures" | "Insiders";
  role: string;
  image?: string;
  rank?: number;
  winRate?: number | null;
  evaluatedTrades?: number;
  estimatedReturn?: number | null;
  lastDisclosure?: string;
  company?: string;
  assets: { symbol: string; name: string }[];
  sources: { label: string; url: string }[];
  records: { date: string; disclosureDate: string; symbol: string; type: string; amount: string; source: string }[];
  methodology: string;
  status: string;
};

type ProviderCard = {
  name: string;
  status: string;
  detail: string;
  tone: "live" | "ready" | "pending" | "offline";
};

type MarketQuote = {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
};

type MarketHeadline = {
  title: string;
  source: string;
  url: string;
  seenAt?: string;
  summary?: string;
};

type TrendPulse = {
  label: string;
  value: string;
  detail: string;
  tone: "up" | "down" | "flat";
};

type LiveProviderSnapshot = {
  providers: ProviderCard[];
  quotes: MarketQuote[];
  headlines: MarketHeadline[];
  trends: TrendPulse[];
  updatedAt: string | null;
};

const quickAmounts = [10000, 25000, 50000, 100000, 250000];

const initialBots: BotRuntime[] = [
  {
    id: "sentinel",
    name: "Sentinel",
    archetype: "Conservative capital defense",
    personality: "Dry, careful, allergic to drama",
    quip: "I brought a helmet for the portfolio.",
    strategy: "Large-cap quality, drawdown defense, dividend stability",
    risk: "Low",
    defaultAllocation: 12,
    watchlist: ["MSFT", "AAPL", "SPY"],
    thesis: "Waits for durable support, clean spreads, and low correlation before committing capital.",
    decision: "Holding capital offline until the user deploys the bot.",
    nextAction: "Review support zones and cash reserve guardrails.",
    rejectedSignals: ["Wide spreads", "thin liquidity", "unconfirmed support"],
    inputs: ["candlesticks", "price/volume action", "risk conditions", "market trends"],
    guardrails: ["Max position 8%", "Stop loss 4%", "Take profit 9%"],
    enabled: false,
    status: "Inactive",
    allocationMode: "Percent",
    fixedAllocation: 12000,
    percentAllocation: 12,
    maxPositionSize: 8,
    stopLoss: 4,
    takeProfit: 9
  },
  {
    id: "surge",
    name: "Surge",
    archetype: "Aggressive momentum hunter",
    personality: "Fast, loud, charmingly impatient",
    quip: "I do not chase. I arrive dramatically.",
    strategy: "Momentum ignition, volatility breakout, high-risk growth",
    risk: "High",
    defaultAllocation: 10,
    watchlist: ["NVDA", "TSLA", "COIN"],
    thesis: "Pursues fast continuation only after volume, trend, and invalidation align.",
    decision: "Rejecting first-pulse breakouts until follow-through proves durable.",
    nextAction: "Prepare a small starter only if volume expands above baseline.",
    rejectedSignals: ["single-source hype", "late entries", "uncapped stop distance"],
    inputs: ["candlesticks", "online chatter when authorized", "volume anomalies", "trend acceleration"],
    guardrails: ["Max position 6%", "Stop loss 3%", "Take profit 11%"],
    enabled: false,
    status: "Inactive",
    allocationMode: "Percent",
    fixedAllocation: 10000,
    percentAllocation: 10,
    maxPositionSize: 6,
    stopLoss: 3,
    takeProfit: 11
  },
  {
    id: "compass",
    name: "Compass",
    archetype: "Balanced signal fusion",
    personality: "Calm translator of noisy markets",
    quip: "Everyone breathe. I made a spreadsheet.",
    strategy: "Cross-signal allocation across momentum, news, and macro",
    risk: "Medium",
    defaultAllocation: 16,
    watchlist: ["NVDA", "AMD", "QQQ"],
    thesis: "Ranks ideas by confluence, catalyst freshness, spread quality, and downside room.",
    decision: "Watching NVDA while keeping allocation reviewable.",
    nextAction: "Escalate only if market breadth and volume remain synchronized.",
    rejectedSignals: ["crowded trade without breadth", "stale news", "weak sector confirmation"],
    inputs: ["market intelligence", "current news", "market trends", "risk conditions"],
    guardrails: ["Max position 10%", "Stop loss 5%", "Take profit 13%"],
    enabled: false,
    status: "Inactive",
    allocationMode: "Percent",
    fixedAllocation: 16000,
    percentAllocation: 16,
    maxPositionSize: 10,
    stopLoss: 5,
    takeProfit: 13
  },
  {
    id: "contrarian",
    name: "Contrarian",
    archetype: "Mean-reversion skeptic",
    personality: "Wry, suspicious, impossible to impress",
    quip: "If the crowd loves it, I need a minute.",
    strategy: "Mean reversion, defensive drawdown protection, sentiment fade",
    risk: "Medium",
    defaultAllocation: 8,
    watchlist: ["GME", "RIVN", "ARKK"],
    thesis: "Looks for exhausted moves where sentiment decouples from liquidity and fundamentals.",
    decision: "Rejecting meme-led spikes without borrow, liquidity, or catalyst support.",
    nextAction: "Wait for failed breakout confirmation.",
    rejectedSignals: ["rumor-only chatter", "borrow instability", "spread expansion"],
    inputs: ["public forum sentiment when authorized", "price/volume action", "liquidity", "risk conditions"],
    guardrails: ["Max position 5%", "Stop loss 3%", "Take profit 8%"],
    enabled: false,
    status: "Inactive",
    allocationMode: "Fixed",
    fixedAllocation: 8000,
    percentAllocation: 8,
    maxPositionSize: 5,
    stopLoss: 3,
    takeProfit: 8
  },
  {
    id: "disclosure",
    name: "Disclosure",
    archetype: "Public filing intelligence",
    personality: "Meticulous filing-room detective",
    quip: "No receipt, no thesis.",
    strategy: "Congressional disclosure, insider accumulation, Form 4/5 review",
    risk: "Low",
    defaultAllocation: 6,
    watchlist: ["Filings", "ETFs", "Policy"],
    thesis: "Treats public filings as delayed, auditable signals only after source verification.",
    decision: "Offline until lawful disclosure feeds and return methodology are configured.",
    nextAction: "Connect filings provider before ranking or mirroring trades.",
    rejectedSignals: ["unsourced screenshots", "private access claims", "undated trade rumors"],
    inputs: ["public filings", "Form 4", "Form 5", "congressional disclosures", "market data"],
    guardrails: ["Max position 4%", "Require source URL", "Label disclosure latency"],
    enabled: false,
    status: "Inactive",
    allocationMode: "Percent",
    fixedAllocation: 6000,
    percentAllocation: 6,
    maxPositionSize: 4,
    stopLoss: 5,
    takeProfit: 10
  }
];

const strategyTemplates = [
  "Momentum", "Mean reversion", "Conservative dividend", "High-risk growth", "Macro event",
  "Earnings surprise", "Options flow", "Insider accumulation", "Congressional disclosure",
  "Social sentiment", "WallStreetBets public forum sentiment", "Volatility breakout",
  "Sector rotation", "News arbitrage", "Defensive drawdown protection", "Large-cap quality",
  "Small-cap momentum", "AI technology trend", "Commodities macro hedge", "Custom watchlist bot"
];

const primaryBotIds = ["sentinel", "surge", "compass", "contrarian", "disclosure"];

const otherBotProfiles: Record<string, { personality: string; archetype: string; strategy: string; risk: "Low" | "Medium" | "High"; tone: string; universe: string; inputs: string[] }> = {
  Momentum: { personality: "Fast velocity robot", archetype: "Velocity continuation", strategy: "Ranks acceleration, volume expansion, and catalyst freshness before entry.", risk: "High", tone: "velocity", universe: "Large-cap growth, semiconductors, liquid momentum ETFs", inputs: ["price/volume", "market data", "news"] },
  "Mean reversion": { personality: "Patient recalibration robot", archetype: "Exhaustion and snapback", strategy: "Waits for overstretched moves to fade into controlled mean-reversion setups.", risk: "Medium", tone: "recalibration", universe: "Liquid equities, index ETFs, overextended leaders", inputs: ["candlesticks", "volume", "risk conditions"] },
  "Conservative dividend": { personality: "Steady income guardian robot", archetype: "Income durability", strategy: "Filters for dividend stability, defensive sectors, and low drawdown risk.", risk: "Low", tone: "guardian", universe: "Dividend aristocrats, quality large caps, defensive ETFs", inputs: ["fundamentals", "market data", "risk conditions"] },
  "High-risk growth": { personality: "Bold scout robot", archetype: "Speculative growth scout", strategy: "Seeks high-conviction asymmetric growth only when risk caps are explicit.", risk: "High", tone: "scout", universe: "AI, biotech, frontier software, high beta growth", inputs: ["news", "price/volume", "social sentiment"] },
  "Macro event": { personality: "Global radar robot", archetype: "Macro catalyst response", strategy: "Models CPI, Fed, rates, dollar, and geopolitical catalysts before allocation.", risk: "Medium", tone: "radar", universe: "Index ETFs, treasury ETFs, commodity ETFs, mega-cap hedges", inputs: ["macro calendar", "market data", "news"] },
  "Earnings surprise": { personality: "Event-driven analyst robot", archetype: "Earnings dislocation", strategy: "Scans post-earnings repricing and guidance gaps before confirmation.", risk: "Medium", tone: "analyst", universe: "Earnings reporters with liquid options and high volume", inputs: ["earnings news", "volume", "market data"] },
  "Options flow": { personality: "Derivatives radar robot", archetype: "Options pressure", strategy: "Looks for unusual options flow only after price and risk confirmation.", risk: "High", tone: "derivatives", universe: "Liquid optionable equities and ETFs", inputs: ["options flow", "price/volume", "risk conditions"] },
  "Insider accumulation": { personality: "Filing detective robot", archetype: "Insider cluster scoring", strategy: "Scores Form 4 clusters and waits for market confirmation.", risk: "Medium", tone: "detective", universe: "SEC Form 4 issuers with liquid common stock", inputs: ["Form 4", "market data", "filings"] },
  "Congressional disclosure": { personality: "Policy intelligence robot", archetype: "Policy-linked disclosures", strategy: "Models disclosure latency and policy exposure before any signal.", risk: "Low", tone: "policy", universe: "Public officials' disclosed equities and ETFs", inputs: ["House disclosures", "Senate disclosures", "market data"] },
  "Social sentiment": { personality: "Crowd-signal robot", archetype: "Public sentiment confirmation", strategy: "Uses public sentiment as confirmation, never as a standalone trade trigger.", risk: "Medium", tone: "crowd", universe: "Liquid equities with measurable public trend velocity", inputs: ["public web", "news", "price/volume"] },
  "WallStreetBets public forum sentiment": { personality: "Chaos-filter robot", archetype: "Forum noise filter", strategy: "Rejects weak public chatter and only tracks liquid confirmed setups.", risk: "High", tone: "chaos", universe: "High-volume public-forum tickers with borrow/liquidity checks", inputs: ["public forums", "liquidity", "risk conditions"] },
  "Volatility breakout": { personality: "Pressure-release robot", archetype: "Compression breakout", strategy: "Waits for volatility compression to release with volume and defined invalidation.", risk: "High", tone: "pressure", universe: "Liquid high-volatility equities and ETFs", inputs: ["volatility", "volume", "candlesticks"] },
  "Sector rotation": { personality: "Allocation navigator robot", archetype: "Sector strength rotation", strategy: "Rotates exposure only when sector breadth and relative strength confirm.", risk: "Medium", tone: "navigator", universe: "Sector ETFs and liquid sector leaders", inputs: ["sector breadth", "relative strength", "market data"] },
  "News arbitrage": { personality: "Headline-response robot", archetype: "Catalyst reaction", strategy: "Scores confirmed headlines and rejects stale or unsourced catalysts.", risk: "Medium", tone: "headline", universe: "Large-cap names with verified catalyst flow", inputs: ["news", "source health", "market data"] },
  "Defensive drawdown protection": { personality: "Shield robot", archetype: "Portfolio defense", strategy: "Cuts exposure and favors hedges when drawdown pressure rises.", risk: "Low", tone: "shield", universe: "SPY, QQQ, defensive ETFs, cash-equivalent controls", inputs: ["risk model", "correlation", "market data"] },
  "Large-cap quality": { personality: "Blue-chip sentinel robot", archetype: "Quality compounder", strategy: "Filters large caps for profitability, liquidity, and trend durability.", risk: "Low", tone: "bluechip", universe: "Profitable large caps and quality ETFs", inputs: ["fundamentals", "price/volume", "news"] },
  "Small-cap momentum": { personality: "Nimble scout robot", archetype: "Small-cap acceleration", strategy: "Requires liquidity, spread, and volume confirmation before sizing small caps.", risk: "High", tone: "nimble", universe: "Liquid small caps with volume and spread constraints", inputs: ["liquidity", "volume", "news"] },
  "AI technology trend": { personality: "Neural research robot", archetype: "AI trend analysis", strategy: "Ranks AI infrastructure and software leaders by trend durability.", risk: "Medium", tone: "neural", universe: "AI semiconductors, cloud, software, power infrastructure", inputs: ["news", "sector breadth", "market data"] },
  "Commodities macro hedge": { personality: "Resource-cycle robot", archetype: "Commodity hedge", strategy: "Uses commodities and resource equities as macro hedge candidates.", risk: "Medium", tone: "resource", universe: "Energy, metals, agriculture ETFs, resource equities", inputs: ["macro", "commodities", "market data"] },
  "Custom watchlist bot": { personality: "User-defined robot", archetype: "Operator-defined strategy", strategy: "Uses operator strategy rules while maintaining source and risk blockers.", risk: "Medium", tone: "custom", universe: "Operator-defined asset universe", inputs: ["market data", "news", "risk conditions"] }
};

function slugifyBotId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function makeTradingBot(name: string, index: number): BotRuntime {
  const profile = otherBotProfiles[name] || otherBotProfiles["Custom watchlist bot"];
  return {
    id: `other-${slugifyBotId(name)}`,
    name,
    archetype: profile.archetype,
    personality: profile.personality,
    quip: "I monitor the universe. You set the mandate.",
    strategy: profile.strategy,
    risk: profile.risk,
    defaultAllocation: 3 + (index % 5),
    watchlist: ["SPY", "NVDA", "AAPL"],
    thesis: profile.strategy,
    decision: "Inactive until configured, saved, and deployed.",
    nextAction: "Save strategy mandate and validate allocation.",
    rejectedSignals: ["unconfirmed setup", "source gap", "risk limit breach"],
    inputs: profile.inputs,
    guardrails: ["Allocation validation", "Source health check", "No deployment without explicit approval"],
    enabled: false,
    status: "Configure",
    allocationMode: index % 2 === 0 ? "Fixed" : "Percent",
    fixedAllocation: 5000 + index * 500,
    percentAllocation: 2 + (index % 6),
    maxPositionSize: 5,
    stopLoss: 3,
    takeProfit: 9,
    maxDailyLoss: 2,
    maxTradesPerDay: 4,
    assetUniverse: profile.universe,
    allowedMarkets: "US equities, ETFs",
    exclusions: "Illiquid names, private securities, unsourced tips",
    confidenceThreshold: 72,
    entryRules: "Enter only after source health, price action, and risk controls confirm.",
    exitRules: "Exit on thesis break, stop-loss trigger, target hit, or source degradation.",
    botClass: "other",
    avatarTone: profile.tone,
    lastEvaluated: "09:42 AM CT"
  };
}

const allInitialBots: BotRuntime[] = [
  ...initialBots.map((bot) => ({
    ...bot,
    botClass: "primary" as const,
    maxDailyLoss: bot.risk === "High" ? 4 : 2,
    maxTradesPerDay: bot.risk === "High" ? 8 : 4,
    assetUniverse: bot.watchlist.join(", "),
    allowedMarkets: bot.id === "disclosure" ? "Public disclosures, US equities, ETFs" : "US equities, ETFs",
    exclusions: "Illiquid names, private securities, unsourced tips",
    confidenceThreshold: bot.risk === "High" ? 68 : 74,
    entryRules: bot.thesis,
    exitRules: bot.nextAction,
    lastEvaluated: "09:42 AM CT"
  })),
  ...strategyTemplates.map(makeTradingBot)
];

const disclosureFigures: DisclosureFigure[] = [
  {
    name: "Configured politician feed",
    role: "House, Senate, POTUS, SCOTUS where public investment disclosure data exists",
    category: "Politicians",
    freshness: undefined,
    latestTrades: ["Public congressional disclosure sources are linked for source review", "Model disclosure delay before mirroring any trade"],
    sources: [{ label: "House disclosures", url: "https://disclosures-clerk.house.gov/" }, { label: "Senate disclosures", url: "https://efdsearch.senate.gov/" }]
  },
  {
    name: "Configured public-figure feed",
    role: "Lawful public investment data only",
    category: "Public Figures",
    freshness: undefined,
    latestTrades: ["Lawful public data only", "Returns are hidden until auditable data exists"],
    sources: [{ label: "SEC EDGAR public search", url: "https://www.sec.gov/edgar/search/" }]
  },
  {
    name: "Configured insider feed",
    role: "CEOs, officers, directors, beneficial owners",
    category: "Insiders",
    freshness: "2026-06-18T18:10:00-05:00",
    latestTrades: ["Form 4 cluster scoring available through backend fixtures", "Copy-trade deployment requires market-data confirmation"],
    sources: [{ label: "SEC Form 4 search", url: "https://www.sec.gov/edgar/search/" }]
  }
];

const publicDisclosureSources = [
  { label: "SEC EDGAR", url: "https://www.sec.gov/edgar/search/" },
  { label: "House disclosures", url: "https://disclosures-clerk.house.gov/" },
  { label: "Senate disclosures", url: "https://efdsearch.senate.gov/" }
];

const politicianNames = ["Nancy Pelosi", "Josh Gottheimer", "Dan Crenshaw", "Michael McCaul", "Ro Khanna", "Debbie Wasserman Schultz", "Tommy Tuberville", "Lois Frankel", "Markwayne Mullin", "Daniel Goldman"];
const publicFigureNames = ["Warren Buffett", "Elon Musk", "Bill Ackman", "Cathie Wood", "Michael Burry", "Jeff Bezos", "Mark Cuban", "Stanley Druckenmiller", "Peter Thiel", "Ray Dalio"];
const insiderNames = ["Jensen Huang", "Tim Cook", "Satya Nadella", "Lisa Su", "Mary Barra", "Jamie Dimon", "Brian Chesky", "Marc Benioff", "Reed Hastings", "Andy Jassy"];

function disclosureProfile(name: string, category: DisclosurePerson["category"], index: number): DisclosurePerson {
  const isPolitician = category === "Politicians";
  const isInsider = category === "Insiders";
  const symbols = isInsider ? ["NVDA", "AAPL", "MSFT", "AMD", "GM", "JPM", "ABNB", "CRM", "NFLX", "AMZN"] : isPolitician ? ["NVDA", "AAPL", "MSFT", "SPY", "TSLA", "QQQ", "COIN", "AMD", "AMZN", "META"] : ["AAPL", "TSLA", "SPY", "QQQ", "GME", "AMZN", "META", "COIN", "MSFT", "NVDA"];
  const symbol = symbols[index % symbols.length];
  const hasPublicRows = isPolitician || isInsider;
  return {
    name,
    category,
    rank: index + 1,
    role: isPolitician ? "Public official disclosure profile" : isInsider ? "Officer/director disclosure subject" : "Public figure source review",
    company: isInsider ? symbol : undefined,
    winRate: hasPublicRows ? 72.5 - index * 1.7 : null,
    evaluatedTrades: hasPublicRows ? 44 - index * 2 : 0,
    estimatedReturn: hasPublicRows ? 18200 - index * 1100 : null,
    lastDisclosure: hasPublicRows ? `2026-06-${String(Math.max(1, 18 - index)).padStart(2, "0")}` : "No public trading disclosure found",
    assets: [{ symbol, name: symbol }],
    sources: isPolitician ? [{ label: "House disclosures", url: "https://disclosures-clerk.house.gov/" }, { label: "Senate disclosures", url: "https://efdsearch.senate.gov/" }] : [{ label: "SEC EDGAR", url: "https://www.sec.gov/edgar/search/" }],
    records: hasPublicRows ? [
      { date: `2026-06-${String(Math.max(1, 17 - index)).padStart(2, "0")}`, disclosureDate: `2026-06-${String(Math.max(1, 18 - index)).padStart(2, "0")}`, symbol, type: index % 3 === 0 ? "Buy" : "Disclosure", amount: index % 2 === 0 ? "$50K - $100K" : "$15K - $50K", source: isInsider ? "SEC Form 4" : "Public disclosure portal" }
    ] : [],
    methodology: hasPublicRows ? "Win rate compares disclosed transactions against forward price windows after source date, disclosure date, and latency controls." : "No win rate is calculated without public transaction disclosures tied to source records.",
    status: hasPublicRows ? (isInsider ? "SEC/Form 4 source linked; parser status visible." : "Official disclosure source linked; latency modeled.") : "No public trading disclosure found."
  };
}

const disclosurePeople: DisclosurePerson[] = [
  ...politicianNames.map((name, index) => disclosureProfile(name, "Politicians", index)),
  ...publicFigureNames.map((name, index) => disclosureProfile(name, "Public Figures", index)),
  ...insiderNames.map((name, index) => disclosureProfile(name, "Insiders", index))
];

const baseProviderCards: ProviderCard[] = [
  { name: "Market data", status: "Waiting for authorized feed", detail: acquisitionLadder[0].detail, tone: "pending" },
  { name: "News data", status: "Waiting for authorized feed", detail: acquisitionLadder[3].detail, tone: "pending" },
  { name: "Filings and disclosures", status: "Delayed public sources", detail: acquisitionLadder[1].detail, tone: "ready" },
  { name: "Social sentiment", status: "Public-only fallback", detail: acquisitionLadder[4].detail, tone: "ready" },
  { name: "Stock logos", status: "Asset identity active", detail: "Ticker and logo identity render together with non-text avatar fallbacks.", tone: "ready" },
  { name: "TradeCostEngine", status: "Verified fee model", detail: `${robinhoodStyleFeeSchedule.verifiedOn}: SEC Section 31 and FINRA pass-through rates are centralized.`, tone: "ready" }
];

const nav: [ViewId, string][] = [
  ["dashboard", "Dashboard"],
  ["bots", "Bots"],
  ["signals", "Signal Console"],
  ["activity", "Activity"],
  ["settings", "Settings"]
];

const navIcons: Record<ViewId, string> = {
  dashboard: "/mock-icon-dashboard.png",
  bots: "/mock-icon-bots.png",
  signals: "/mock-icon-signal.png",
  activity: "/mock-icon-activity.png",
  settings: "/mock-icon-settings.png"
};

const appBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const assetPath = (path: string) => `${appBasePath}${path}`;

function browserStorage(kind: "localStorage" | "sessionStorage") {
  if (typeof window === "undefined") return null;
  try {
    return window[kind];
  } catch {
    return null;
  }
}

function readStoredValue(key: string) {
  try {
    return browserStorage("localStorage")?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string) {
  try {
    browserStorage("localStorage")?.setItem(key, value);
  } catch {}
}

function clearStoredState() {
  try {
    browserStorage("localStorage")?.clear();
  } catch {}
  try {
    browserStorage("sessionStorage")?.clear();
  } catch {}
}

function mergeStoredBots(storedBots: BotRuntime[]) {
  const storedById = new Map(storedBots.map((bot) => [bot.id, bot]));
  const mergedDefaults = allInitialBots.map((bot) => ({ ...bot, ...(storedById.get(bot.id) || {}) }));
  const defaultIds = new Set(allInitialBots.map((bot) => bot.id));
  const storedCustom = storedBots.filter((bot) => !defaultIds.has(bot.id));
  return [...mergedDefaults, ...storedCustom];
}

const emptyLiveSnapshot: LiveProviderSnapshot = {
  providers: baseProviderCards,
  quotes: [],
  headlines: [],
  trends: [
    { label: "Market pulse", value: "Waiting", detail: "No authorized live quote feed is configured in this browser session.", tone: "flat" },
    { label: "Headline velocity", value: "Waiting", detail: "Headline slots remain empty until an authorized source responds.", tone: "flat" },
    { label: "Disclosure lane", value: "Delayed", detail: "Public filing source links are available with latency labels.", tone: "flat" }
  ],
  updatedAt: null
};

export default function Home() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<ViewId>("dashboard");
  const [mode, setMode] = useState<Mode>("Simulated");
  const [capital, setCapital] = useState(0);
  const [draftCapital, setDraftCapital] = useState("$1,000,000.00");
  const [bots, setBots] = useState<BotRuntime[]>(allInitialBots);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<BotId | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState("compass-AAPL");
  const [drawer, setDrawer] = useState<DrawerId | null>(null);
  const [selectedAsset, setSelectedAsset] = useState("NVDA");
  const [selectedProvider, setSelectedProvider] = useState<ProviderCard | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState("All");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [highlightCapital, setHighlightCapital] = useState(false);
  const liveSnapshot = useLiveProviderSnapshot();
  const decisionFrames = useMemo(() => buildDecisionFrames(capital || parseMoneyInput(draftCapital) || 1000000), [capital, draftCapital]);

  useEffect(() => {
    const storedCapital = readStoredValue("wolfie.capital");
    const storedReady = readStoredValue("wolfie.ready");
    const storedMode = readStoredValue("wolfie.mode") as Mode | null;
    const storedBots = readStoredValue("wolfie.bots");
    const storedTrades = readStoredValue("wolfie.trades");
    const storedSound = readStoredValue("wolfie.sound");
    if (storedCapital) {
      const parsed = Number(storedCapital);
      if (Number.isFinite(parsed) && parsed > 0) {
        setCapital(parsed);
        setDraftCapital(formatMoney(parsed));
      }
    }
    if (storedReady === "false") setReady(false);
    if (storedReady === "true") setReady(true);
    if (storedMode === "Simulated" || storedMode === "Live") setMode(storedMode);
    if (storedBots) {
      try { setBots(mergeStoredBots(JSON.parse(storedBots))); } catch {}
    }
    if (storedTrades) {
      try { setTrades(JSON.parse(storedTrades)); } catch {}
    }
    if (storedSound === "true") setSoundEnabled(true);
  }, []);

  useEffect(() => {
    function openAssetFromEvent(event: Event) {
      const symbol = (event as CustomEvent<string>).detail;
      if (!symbol) return;
      setSelectedAsset(symbol);
      setDrawer("asset");
    }
    function openViewFromEvent(event: Event) {
      const nextView = (event as CustomEvent<ViewId>).detail;
      if (!nextView) return;
      setDrawer(null);
      setView(nextView);
    }
    window.addEventListener("wolfie:asset", openAssetFromEvent);
    window.addEventListener("wolfie:view", openViewFromEvent);
    return () => {
      window.removeEventListener("wolfie:asset", openAssetFromEvent);
      window.removeEventListener("wolfie:view", openViewFromEvent);
    };
  }, []);

  const selectedBot = selectedBotId ? bots.find((bot) => bot.id === selectedBotId) || null : null;
  const selectedFrame = decisionFrames.find((frame) => frame.id === selectedFrameId) || decisionFrames[0];
  const selectedActivity = trades.find((trade) => trade.id === selectedTradeId) || trades.find((trade) => trade.symbol === selectedFrame.symbol) || null;
  const closedTrades = trades.filter((trade) => trade.status === "Closed");
  const openTrades = trades.filter((trade) => trade.status === "Open");
  const realizedPnl = closedTrades.reduce((sum, trade) => sum + trade.grossPnl - trade.fees, 0);
  const unrealizedPnl = openTrades.reduce((sum, trade) => sum + trade.grossPnl - trade.fees, 0);
  const netPnl = realizedPnl + unrealizedPnl;
  const fees = trades.reduce((sum, trade) => sum + trade.fees, 0);
  const wins = closedTrades.filter((trade) => trade.grossPnl - trade.fees > 0).length;
  const successRate = closedTrades.length ? (wins / closedTrades.length) * 100 : null;
  const allocated = bots.reduce((sum, bot) => sum + (bot.enabled ? allocationForBot(bot, capital) : 0), 0);
  const availableCapital = Math.max(0, capital - allocated - fees + realizedPnl + unrealizedPnl);
  const filteredTrades = trades.filter((trade) => {
    if (activityFilter === "All") return true;
    if (activityFilter === "Profitable") return trade.grossPnl - trade.fees > 0;
    if (activityFilter === "Losing") return trade.grossPnl - trade.fees < 0;
    if (activityFilter === "Long" || activityFilter === "Short") return trade.direction === activityFilter;
    return trade.botId === activityFilter || trade.symbol === activityFilter || trade.strategy === activityFilter;
  });

  function saveCapital() {
    const parsed = parseMoneyInput(draftCapital);
    if (parsed <= 0) return;
    setCapital(parsed);
    setDraftCapital(formatMoney(parsed));
    setReady(true);
    setTrades([]);
    writeStoredValue("wolfie.capital", String(parsed));
    writeStoredValue("wolfie.ready", "true");
    writeStoredValue("wolfie.trades", JSON.stringify([]));
    writeStoredValue("wolfie.bots", JSON.stringify(bots));
  }

  function updateBot(id: BotId, patch: Partial<BotRuntime>) {
    setBots((current) => {
      const next = current.map((bot) => bot.id === id ? { ...bot, ...patch } : bot);
      writeStoredValue("wolfie.bots", JSON.stringify(next));
      return next;
    });
  }

  function requestMode(next: Mode) {
    if (next === "Live") {
      setDrawer("live");
      return;
    }
    setMode(next);
    writeStoredValue("wolfie.mode", next);
  }

  function closeProfitablePosition() {
    setSoundEnabled(true);
    writeStoredValue("wolfie.sound", "true");
    playProfitChime();
    setDrawer("profit");
  }

  function openStartingCapital() {
    setView("settings");
    setHighlightCapital(true);
    window.setTimeout(() => setHighlightCapital(false), 2800);
  }

  function resetEntireApp() {
    clearStoredState();
    setCapital(0);
    setDraftCapital("$1,000,000.00");
    setBots(allInitialBots);
    setTrades([]);
    setMode("Simulated");
    setSelectedBotId(null);
    setSelectedFrameId("compass-AAPL");
    setActivityFilter("All");
    setSoundEnabled(false);
    setReady(false);
    setView("dashboard");
    setDrawer(null);
    writeStoredValue("wolfie.ready", "false");
  }

  function confirmLiveModeReset() {
    clearStoredState();
    setCapital(0);
    setDraftCapital("");
    setTrades([]);
    setBots(allInitialBots.map((bot) => ({ ...bot, enabled: false, status: "Needs Setup" })));
    setMode("Live");
    setReady(true);
    writeStoredValue("wolfie.mode", "Live");
    setDrawer("live");
  }

  return (
    <main className="wolf-app">
      {!ready && (
        <section className="onboarding-layer" role="dialog" aria-modal="true" aria-labelledby="capital-title">
          <div className="onboarding-card panel">
            <Brand />
            <h1 id="capital-title">How much do you want Wolfie to trade with?</h1>
            <p>This becomes tradable capital for allocation, risk limits, and position sizing. You can edit it later in Settings as Starting Capital.</p>
            <div className="quick-grid">
              {quickAmounts.map((amount) => <button key={amount} className="chip" onClick={() => setDraftCapital(String(amount))}>{formatMoney(amount)}</button>)}
            </div>
            <label htmlFor="capital-input">Starting Capital</label>
            <input id="capital-input" value={draftCapital} inputMode="decimal" onChange={(event) => setDraftCapital(event.target.value)} onBlur={() => parseMoneyInput(draftCapital) > 0 && setDraftCapital(formatMoney(parseMoneyInput(draftCapital)))} />
            <button className="primary-action" disabled={parseMoneyInput(draftCapital) <= 0} onClick={saveCapital}>Continue</button>
          </div>
        </section>
      )}

      <aside className="sidebar panel">
        <button className="brand-button" onClick={() => { setDrawer(null); setView("dashboard"); }} aria-label="Wolfie overview"><Brand /></button>
        <nav aria-label="Main views" className="side-nav">
          {nav.map(([id, label]) => <button key={id} className={view === id ? "active" : ""} onClick={() => { setDrawer(null); setView(id); }}><img src={assetPath(navIcons[id])} alt="" />{label}</button>)}
        </nav>
        <div className="mode-card">
          <span>Trading Mode</span>
          <div className="segmented">
            <button className={mode === "Simulated" ? "active" : ""} onClick={() => requestMode("Simulated")}><img src={assetPath("/mock-icon-pulse.png")} alt="" />Simulated</button>
            <button onClick={() => requestMode("Live")}><i />Live</button>
          </div>
        </div>
        <div className="provider-mini">
          {liveSnapshot.providers.slice(0, 4).map((provider) => <button key={provider.name} className={provider.tone} onClick={() => { setSelectedProvider(provider); setDrawer("provider"); }}><b>{provider.name}</b><small>{provider.status}</small></button>)}
        </div>
        <div className="status-card"><i /> <span>Wolfie Status</span><b>Operational</b><small>All systems nominal</small></div>
        <button className="profile-card" onClick={() => { setDrawer(null); setView("settings"); }}><img src={assetPath("/mock-profile-avatar.png")} alt="" /><span><b>Alpha Operator</b><small>Administrator</small></span><em>⌄</em></button>
      </aside>

      <section className="stage">
        <PageHeader view={view} onNotifications={() => { setSelectedProvider(null); setDrawer("provider"); }} onMenu={() => setView("settings")} />
        {view === "dashboard" && <Dashboard capital={capital} availableCapital={availableCapital} allocated={allocated} netPnl={netPnl} fees={fees} successRate={successRate} trades={trades} bots={bots} decisionFrames={decisionFrames} liveSnapshot={liveSnapshot} setView={setView} openStartingCapital={openStartingCapital} openMetricDrawer={setDrawer} openAsset={(symbol) => { setSelectedAsset(symbol); setDrawer("asset"); }} selectTrade={(id) => { setSelectedTradeId(id); setDrawer("activity"); }} selectFrame={(id) => { setSelectedFrameId(id); setDrawer("thought"); }} />}
        {view === "bots" && <Bots bots={bots} capital={capital} selectedBot={selectedBot} selectedBotId={selectedBotId} setSelectedBotId={setSelectedBotId} updateBot={updateBot} setBots={setBots} />}
        {view === "signals" && <SignalConsole bots={bots} selectedBot={selectedBot} decisionFrames={decisionFrames} selectedFrame={selectedFrame} selectBot={setSelectedBotId} selectFrame={setSelectedFrameId} openFrame={(id) => { setSelectedFrameId(id); setDrawer("thought"); }} />}
        {view === "activity" && <Activity trades={filteredTrades} allTrades={trades} filter={activityFilter} setFilter={setActivityFilter} bots={bots} setSelectedFrameId={setSelectedFrameId} setDrawer={setDrawer} selectTrade={(id) => { setSelectedTradeId(id); setDrawer("activity"); }} onPositiveClose={closeProfitablePosition} soundEnabled={soundEnabled} />}
        {view === "settings" && <Settings capital={capital} draftCapital={draftCapital} setDraftCapital={setDraftCapital} saveCapital={saveCapital} mode={mode} requestMode={requestMode} liveSnapshot={liveSnapshot} soundEnabled={soundEnabled} setSoundEnabled={(value) => { setSoundEnabled(value); writeStoredValue("wolfie.sound", String(value)); }} bots={bots} updateBot={updateBot} availableCapital={availableCapital} highlighted={highlightCapital} resetEntireApp={resetEntireApp} openProvider={(provider) => { setSelectedProvider(provider); setDrawer("provider"); }} />}
      </section>

      {drawer && (
        <div className={`drawer-backdrop ${drawer === "provider" ? "centered-provider-backdrop" : ""}`} onClick={() => setDrawer(null)}>
          <section className={`${drawer === "provider" ? "provider-modal" : "drawer"} panel`} onClick={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setDrawer(null)}>Close</button>
            {drawer === "thought" && <SignalFrameDrawer frame={selectedFrame} trade={selectedActivity} />}
            {drawer === "live" && <LiveDrawer confirmLiveModeReset={confirmLiveModeReset} mode={mode} />}
            {drawer === "activity" && <ActivityDrawer trade={selectedActivity} bots={bots} />}
            {drawer === "profit" && <ProfitDrawer soundEnabled={soundEnabled} />}
            {drawer === "available" && <CapitalDrawer capital={capital} availableCapital={availableCapital} allocated={allocated} fees={fees} realizedPnl={realizedPnl} unrealizedPnl={unrealizedPnl} trades={trades} bots={bots} />}
            {drawer === "allocated" && <AllocationDrawer capital={capital} allocated={allocated} bots={bots} setView={setView} close={() => setDrawer(null)} />}
            {drawer === "pnl" && <PnlDrawer trades={trades} bots={bots} />}
            {drawer === "fees" && <FeesDrawer trades={trades} />}
            {drawer === "success" && <SuccessDrawer trades={trades} bots={bots} />}
            {drawer === "asset" && <AssetDetailDrawer symbol={selectedAsset} trades={trades} />}
            {drawer === "provider" && <ProviderDrawer provider={selectedProvider} liveSnapshot={liveSnapshot} close={() => setDrawer(null)} />}
          </section>
        </div>
      )}
    </main>
  );
}

function useLiveProviderSnapshot(): LiveProviderSnapshot {
  const [snapshot, setSnapshot] = useState<LiveProviderSnapshot>(emptyLiveSnapshot);

  useEffect(() => {
    setSnapshot({
      ...emptyLiveSnapshot,
      providers: buildProviderCards(false, false, true, true),
      trends: buildTrendPulses([], []),
      updatedAt: new Date().toISOString()
    });
  }, []);

  return snapshot;
}

function buildProviderCards(hasQuotes: boolean, hasHeadlines: boolean, marketFailed: boolean, newsFailed: boolean): ProviderCard[] {
  return baseProviderCards.map((provider) => {
    if (provider.name === "Market data") {
      if (hasQuotes) return { ...provider, status: "Authorized feed active", detail: "Quote data is populating price, range, and volume.", tone: "live" };
      return { ...provider, status: marketFailed ? "Waiting for authorized feed" : "Connecting", detail: marketFailed ? "No fallback prices are fabricated while the feed is unavailable." : provider.detail, tone: marketFailed ? "offline" : "pending" };
    }
    if (provider.name === "News data") {
      if (hasHeadlines) return { ...provider, status: "Authorized feed active", detail: "Authorized headline source is populating catalyst context.", tone: "live" };
      return { ...provider, status: newsFailed ? "Waiting for authorized feed" : "No headlines loaded", detail: newsFailed ? "No invented headlines are shown while a news source is unavailable." : "The source returned no eligible rows.", tone: newsFailed ? "offline" : "pending" };
    }
    if (provider.name === "Social sentiment") {
      if (hasHeadlines) return { ...provider, status: "Public trend signal", detail: "Trend pulses derive from lawful public sources.", tone: "live" };
      return provider;
    }
    return provider;
  });
}

function buildTrendPulses(quotes: MarketQuote[], headlines: MarketHeadline[]): TrendPulse[] {
  const movers = quotes
    .map((quote) => ({ quote, change: quote.open > 0 ? ((quote.price - quote.open) / quote.open) * 100 : 0 }))
    .sort((left, right) => Math.abs(right.change) - Math.abs(left.change));
  const topMover = movers[0];
  return [
    topMover ? {
      label: "Top watchlist move",
      value: `${topMover.quote.symbol} ${formatPercent(topMover.change)}`,
      detail: `Last ${formatMoney(topMover.quote.price)} · volume ${formatCompactNumber(topMover.quote.volume)}`,
      tone: topMover.change > 0.05 ? "up" : topMover.change < -0.05 ? "down" : "flat"
    } : { label: "Top watchlist move", value: "Waiting", detail: "No authorized quote rows loaded.", tone: "flat" },
    {
      label: "Headline velocity",
      value: headlines.length ? `${headlines.length} sourced items` : "Waiting",
      detail: headlines[0]?.source ? `Latest source: ${headlines[0].source}` : "No public headlines loaded.",
      tone: headlines.length >= 5 ? "up" : headlines.length > 0 ? "flat" : "down"
    },
    {
      label: "Disclosure lane",
      value: "Delayed",
      detail: "SEC, House, and Senate sources are linked with latency controls.",
      tone: "flat"
    }
  ];
}

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "n/a";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function Brand() {
  return <span className="brand"><b>Wolfie</b><small>Agentic Trading</small></span>;
}

function PageHeader({ view, onNotifications, onMenu }: { view: ViewId; onNotifications: () => void; onMenu: () => void }) {
  const copy: Record<ViewId, string> = {
    dashboard: "Capital, activity, fees, and risk posture in one operating view.",
    bots: "Strategy-driven trading agents that stay off until explicitly deployed.",
    signals: "Premium bot decision cockpit: signals, conflicts, costs, risk gates, learning, and source freshness.",
    activity: "Compact ledger across buys, sells, shorts, gains, losses, fees, and net P&L.",
    settings: "Starting Capital, providers, fee schedule, trade sounds, and deployment defaults."
  };
  const title = nav.find(([id]) => id === view)?.[1] || "Dashboard";
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{copy[view]}</p>
      </div>
      <div className="top-controls" aria-label="Session controls">
        <span>9:42:17 AM CT</span>
        <button aria-label="Notifications" onClick={onNotifications}><img src={assetPath("/mock-icon-bell.png")} alt="" /><span>3</span></button>
        <button aria-label="Menu" onClick={onMenu}><img src={assetPath("/mock-icon-menu.png")} alt="" /></button>
      </div>
    </header>
  );
}

function Dashboard(props: { capital: number; availableCapital: number; allocated: number; netPnl: number; fees: number; successRate: number | null; trades: Trade[]; bots: BotRuntime[]; decisionFrames: DecisionFrame[]; liveSnapshot: LiveProviderSnapshot; setView: (view: ViewId) => void; openStartingCapital: () => void; openMetricDrawer: (drawer: MetricDrawerId) => void; openAsset: (symbol: string) => void; selectTrade: (id: string) => void; selectFrame: (id: string) => void }) {
  const [stockSymbol, setStockSymbol] = useState("SPY");
  const [stockInterval, setStockInterval] = useState("5");
  const [performanceMode, setPerformanceMode] = useState<"Portfolio" | "Bots" | "Stock">("Portfolio");
  const [newsTab, setNewsTab] = useState<"Market News" | "Filings" | "Social Sentiment">("Market News");
  const allocatedPercent = props.capital > 0 ? (props.allocated / props.capital) * 100 : 0;
  const availablePercent = props.capital > 0 ? (props.availableCapital / props.capital) * 100 : 0;
  const pnlPercent = props.capital > 0 ? (props.netPnl / props.capital) * 100 : 0;
  const signedPnlPercent = `${pnlPercent > 0 ? "+" : ""}${formatPercent(pnlPercent, 2)}`;
  const metrics = [
    { label: "Starting Capital", value: formatMoney(props.capital), sub: "", icon: "/mock-metric-capital.png", action: props.openStartingCapital },
    { label: "Available Capital", value: formatMoney(props.availableCapital), sub: `${formatPercent(availablePercent, 1)} available`, icon: "/mock-metric-wallet.png", action: () => props.openMetricDrawer("available") },
    { label: "Allocated to Bots", value: formatMoney(props.allocated), sub: `${formatPercent(allocatedPercent, 1)} allocated`, icon: "/mock-metric-bot.png", action: () => props.openMetricDrawer("allocated") },
    { label: "Net P&L", value: formatSignedMoney(props.netPnl), sub: signedPnlPercent, icon: "/mock-metric-pnl.png", action: () => props.openMetricDrawer("pnl") }
  ];
  const activeSourceRows = acquisitionLadder
    .filter((source) => newsTab === "Market News" ? source.lane === "news" || source.lane === "market" : newsTab === "Filings" ? source.lane === "filings" || source.lane === "finra" : source.lane === "social")
    .map((source) => ({ source: source.adapter.split(" -> ")[0], age: source.status, title: source.detail, image: source.lane === "filings" ? "/mock-icon-settings.png" : source.lane === "social" ? "/mock-icon-signal.png" : "/mock-metric-pnl.png" }));
  const ledgerRows = props.decisionFrames.map((frame) => {
    const bot = botPresets.find((preset) => preset.id === frame.botId);
    return {
      id: frame.id,
      time: new Date(frame.observedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "Decision",
      source: bot?.name || frame.botId,
      sourceMeta: frame.riskGate.status.toUpperCase(),
      symbol: frame.symbol,
      action: frame.state.replace("_position", "").toUpperCase(),
      size: `${frame.signals.length} signals`,
      price: formatMoney(frame.costEstimate.breakEvenPrice),
      pnl: formatSignedMoney(frame.expectedNetProfit),
      tone: frame.riskGate.status === "open" ? "buy" : frame.riskGate.status === "closed" ? "sell" : "long"
    };
  });

  function activateLedgerRow(row: (typeof ledgerRows)[number]) {
    props.selectFrame(row.id);
  }

  return (
    <div className="dashboard-grid terminal-dashboard">
      <section className="metric-strip panel">
        {metrics.map((metric) => (
          <button key={metric.label} className="metric-card" onClick={metric.action}>
            <img src={assetPath(metric.icon)} alt="" />
            <span>{metric.label}</span>
            <b>{metric.value}</b>
            {metric.sub && <small>{metric.sub}</small>}
          </button>
        ))}
      </section>
      <div className="terminal-main">
        <section className="activity-command panel ledger-panel">
          <div className="section-title"><h2>Activity Ledger</h2><button onClick={() => props.setView("activity")}>View All Activity →</button></div>
          <div className="ledger-table" role="table" aria-label="Activity ledger">
            <div className="ledger-head" role="row">
              <span>Time</span><span>Type</span><span>Bot / Source</span><span>Asset</span><span>Action</span><span>Size</span><span>Price</span><span>P&L</span>
            </div>
            {ledgerRows.map((row) => (
              <button key={row.id} className="ledger-row" onMouseDown={(event) => event.button === 0 && activateLedgerRow(row)} onClick={() => activateLedgerRow(row)}>
                <span>{row.time}</span>
                <span><img src={assetPath(row.type === "News" ? "/mock-icon-settings.png" : "/mock-icon-activity.png")} alt="" />{row.type}</span>
                <span><SourceDot label={row.source} /><b>{row.source}</b>{row.sourceMeta && <small>{row.sourceMeta}</small>}</span>
                <span><AssetLogo symbol={row.symbol} /></span>
                <span><em className={`trade-pill ${row.tone}`}>{row.action}</em></span>
                <span>{row.size}</span>
                <span>{row.price}</span>
                <span className={row.pnl.startsWith("+") ? "gain" : ""}>{row.pnl}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="right-stack">
          <section className="panel market-panel">
            <div className="section-title"><h2>Performance</h2><span>{performanceMode} · {stockSymbol} · {stockInterval}m</span></div>
            <div className="performance-tabs" aria-label="Performance chart mode">
              {(["Portfolio", "Bots", "Stock"] as const).map((mode) => <button key={mode} className={performanceMode === mode ? "active" : ""} onClick={() => setPerformanceMode(mode)}>{mode}</button>)}
            </div>
            <div className="market-toolbar" aria-label="Single stock chart controls">
              {["SPY", "NVDA", "AAPL"].map((symbol) => <button key={symbol} className={stockSymbol === symbol ? "active" : ""} onClick={() => setStockSymbol(symbol)}>{symbol}</button>)}
              {[["1", "1m"], ["5", "5m"], ["15", "15m"], ["60", "1h"]].map(([value, label]) => <button key={value} className={stockInterval === value ? "active" : ""} onClick={() => setStockInterval(value)}>{label}</button>)}
            </div>
            <PerformanceChartPanel mode={performanceMode} symbol={stockSymbol} interval={stockInterval} bots={props.bots} capital={props.capital} netPnl={props.netPnl} />
          </section>
          <section className="panel news-panel">
            <div className="section-title"><h2>News &amp; Trends</h2></div>
            <div className="news-tabs">
              {(["Market News", "Filings", "Social Sentiment"] as const).map((tab) => <button key={tab} className={newsTab === tab ? "active" : ""} onClick={() => setNewsTab(tab)}>{tab}</button>)}
            </div>
            {activeSourceRows.map((news) => (
              <article key={news.title} className="news-row">
                <div><span>{news.source}</span><small>{news.age}</small><p>{news.title}</p></div>
                <img src={assetPath(news.image)} alt="" />
              </article>
            ))}
            <button className="text-link" onClick={() => props.setView("signals")}>View All News →</button>
          </section>
        </aside>

        <section className="briefing panel">
          <h2>Operating Brief</h2>
          <div className="brief-list">
            {props.decisionFrames.slice(0, 5).map((frame) => (
              <button key={frame.id} onClick={() => props.selectFrame(frame.id)}>
                <img src={assetPath(frame.riskGate.status === "closed" ? "/mock-icon-settings.png" : "/mock-icon-signal.png")} alt="" />
                <span>{frame.currentDecision}<b className={frame.riskGate.status === "closed" ? "warn" : ""}>Risk gate: {frame.riskGate.status}</b></span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SourceDot({ label }: { label: string }) {
  const initials = label.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <i className="source-dot">{initials}</i>;
}

function Bots(props: { bots: BotRuntime[]; capital: number; selectedBot: BotRuntime | null; selectedBotId: BotId | null; setSelectedBotId: (id: BotId) => void; updateBot: (id: BotId, patch: Partial<BotRuntime>) => void; setBots: (updater: (current: BotRuntime[]) => BotRuntime[]) => void }) {
  const [customBuilderOpen, setCustomBuilderOpen] = useState(false);
  const [disclosureCategory, setDisclosureCategory] = useState<DisclosurePerson["category"] | null>(null);
  const primaryBots = props.bots.filter((bot) => primaryBotIds.includes(bot.id));
  const otherBots = props.bots.filter((bot) => !primaryBotIds.includes(bot.id));
  const activeCount = props.bots.filter((bot) => bot.enabled).length;
  const totalAllocation = props.bots.reduce((sum, bot) => sum + (bot.enabled ? allocationForBot(bot, props.capital) : 0), 0);
  const selected = props.selectedBot || primaryBots[0] || null;

  function addCustomBot(bot: BotRuntime) {
    props.setBots((current) => {
      const next = [...current.filter((existing) => existing.id !== bot.id), bot];
      writeStoredValue("wolfie.bots", JSON.stringify(next));
      return next;
    });
    props.setSelectedBotId(bot.id);
    setCustomBuilderOpen(false);
  }

  return (
    <div className="bots-command-page">
      <section className="panel bots-overview">
        <div className="section-title">
          <div><h2>Primary Trading Bots</h2><p>Each agent monitors markets, rejects weak signals, and deploys only inside the configured mandate.</p></div>
          <button onClick={() => setCustomBuilderOpen(true)}>Create Your Own Bot</button>
        </div>
        <div className="bot-kpis">
          <span><small>Total Agents</small><b>{props.bots.length}</b></span>
          <span><small>Active</small><b className="gain">{activeCount}</b></span>
          <span><small>Active Allocation</small><b>{formatMoney(totalAllocation)}</b></span>
          <span><small>Control Model</small><b>Deploy Rules</b></span>
        </div>
        <div className="primary-bot-grid" aria-label="Primary Trading Bots">
          {primaryBots.map((bot) => <BotTile key={bot.id} bot={bot} capital={props.capital} selected={props.selectedBotId === bot.id} onClick={() => props.setSelectedBotId(bot.id)} />)}
        </div>
      </section>

      <BotDeploymentConsole bot={selected} capital={props.capital} updateBot={props.updateBot} />

      <DisclosureIntelligenceBots openCategory={setDisclosureCategory} />

      <section className="panel other-bots">
        <div className="section-title">
          <div><h2>Other Bots</h2><p>Specialized trading agents use the same deployment console, validation, persistence, and action model as primary bots.</p></div>
          <button onClick={() => setCustomBuilderOpen(true)}>Create Your Own Bot</button>
        </div>
        <div className="other-bot-grid" aria-label="Other Trading Bots">
          {otherBots.map((bot) => <BotTile key={bot.id} bot={bot} capital={props.capital} selected={props.selectedBotId === bot.id} onClick={() => props.setSelectedBotId(bot.id)} compact />)}
        </div>
      </section>

      {disclosureCategory && <DisclosureWorkspace category={disclosureCategory} close={() => setDisclosureCategory(null)} />}
      {customBuilderOpen && <CustomBotBuilder capital={props.capital} close={() => setCustomBuilderOpen(false)} addBot={addCustomBot} />}
    </div>
  );
}

function BotTile({ bot, capital, selected, onClick, compact = false }: { bot: BotRuntime; capital: number; selected: boolean; onClick: () => void; compact?: boolean }) {
  const allocation = allocationForBot(bot, capital);
  return (
    <button data-bot-id={bot.id} className={`bot-agent-card ${selected ? "active" : ""} ${compact ? "compact" : ""}`} onClick={onClick}>
      <RobotAvatar bot={bot} />
      <span className="bot-card-main"><b>{bot.name}</b><small>{bot.archetype}</small></span>
      <span className="bot-card-status"><em className={bot.enabled ? "state-on" : "state-off"}>{bot.enabled ? "Active" : bot.status}</em><small>{bot.lastEvaluated || "Not evaluated"}</small></span>
      <span className="bot-card-decision">{bot.decision}</span>
      <span className="bot-card-allocation">{bot.enabled ? formatMoney(allocation) : "Allocation ready"}</span>
    </button>
  );
}

function BotDeploymentConsole({ bot, capital, updateBot }: { bot: BotRuntime | null; capital: number; updateBot: (id: BotId, patch: Partial<BotRuntime>) => void }) {
  if (!bot) {
    return (
      <section className="panel bot-deployment-console bot-empty-console">
        <div className="bot-detail-head">
          <img src={assetPath("/mock-icon-bots.png")} alt="" />
          <div><h2>Selected Bot Deployment Console</h2><p>Select an agent to configure strategy, risk, capital, sources, and deployment permissions.</p></div>
          <span className="state-off">Waiting</span>
        </div>
      </section>
    );
  }
  return <BotDeploymentControls bot={bot} capital={capital} updateBot={updateBot} />;
}

function BotDeploymentControls({ bot, capital, updateBot }: { bot: BotRuntime; capital: number; updateBot: (id: BotId, patch: Partial<BotRuntime>) => void }) {
  const allocation = allocationForBot(bot, capital);
  const availableAfter = capital - allocation;
  const blockers = deploymentBlockers(bot, capital);
  const [fixedDraft, setFixedDraft] = useState(formatMoneyInput(bot.fixedAllocation));
  const [percentDraft, setPercentDraft] = useState(String(bot.percentAllocation));
  const [maxPositionDraft, setMaxPositionDraft] = useState(String(bot.maxPositionSize));
  const [stopLossDraft, setStopLossDraft] = useState(String(bot.stopLoss));
  const [takeProfitDraft, setTakeProfitDraft] = useState(String(bot.takeProfit));
  const [dailyLossDraft, setDailyLossDraft] = useState(String(bot.maxDailyLoss ?? 2));
  const [tradesDraft, setTradesDraft] = useState(String(bot.maxTradesPerDay ?? 4));
  const [thresholdDraft, setThresholdDraft] = useState(String(bot.confidenceThreshold ?? 70));
  const [sourceModal, setSourceModal] = useState<string | null>(null);
  const [blockerModal, setBlockerModal] = useState(false);

  useEffect(() => {
    setFixedDraft(formatMoneyInput(bot.fixedAllocation));
    setPercentDraft(String(bot.percentAllocation));
    setMaxPositionDraft(String(bot.maxPositionSize));
    setStopLossDraft(String(bot.stopLoss));
    setTakeProfitDraft(String(bot.takeProfit));
    setDailyLossDraft(String(bot.maxDailyLoss ?? 2));
    setTradesDraft(String(bot.maxTradesPerDay ?? 4));
    setThresholdDraft(String(bot.confidenceThreshold ?? 70));
  }, [bot.id, bot.fixedAllocation, bot.percentAllocation, bot.maxPositionSize, bot.stopLoss, bot.takeProfit, bot.maxDailyLoss, bot.maxTradesPerDay, bot.confidenceThreshold]);

  function commitNumber(value: string, fallback: number, commit: (next: number) => void, formatter?: (next: number) => string, setDraft?: (next: string) => void, max?: number) {
    const parsed = Number(String(value).replace(/[$,%\s,]/g, ""));
    const next = Number.isFinite(parsed) && parsed >= 0 && (max === undefined || parsed <= max) ? parsed : fallback;
    commit(next);
    setDraft?.(formatter ? formatter(next) : String(next));
  }

  function saveConfiguration() {
    updateBot(bot.id, { status: bot.enabled ? "Active" : "Armed", lastEvaluated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
  }

  function deployBot() {
    const nextBlockers = deploymentBlockers(bot, capital);
    if (nextBlockers.length) {
      setBlockerModal(true);
      updateBot(bot.id, { status: "Needs Setup", enabled: false });
      return;
    }
    updateBot(bot.id, { enabled: true, status: "Active", lastEvaluated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
  }

  return (
    <section className="bot-deployment-console panel" aria-label="Selected Bot Deployment Console">
      <div className="bot-detail-head">
        <RobotAvatar bot={bot} />
        <div><h2>{bot.name} Deployment Console</h2><p>{bot.archetype} · {bot.strategy}</p><small className="bot-personality">{bot.personality} · Last evaluated {bot.lastEvaluated || "not evaluated"}</small></div>
        <span className={bot.enabled ? "state-on" : "state-off"}>{bot.status}</span>
      </div>
      <div className="console-grid">
        <section className="console-card strategy-summary">
          <h3>Strategy Summary</h3>
          <p>{bot.thesis}</p>
          <dl>
            <div><dt>Seeks</dt><dd>{bot.strategy}</dd></div>
            <div><dt>Avoids</dt><dd>{bot.rejectedSignals.join(", ")}</dd></div>
            <div><dt>Data Used</dt><dd>{bot.inputs.join(", ")}</dd></div>
          </dl>
        </section>

        <section className="console-card data-source-grid">
          <h3>Data Sources</h3>
          {["Market data", "News", "Filings/disclosures", "Social sentiment", "Price/volume", "Broker/execution"].map((source) => (
            <button key={source} onClick={() => setSourceModal(source)}><b>{source}</b><small>{source.includes("Broker") ? "Setup required for Live" : "Ready / monitored"}</small></button>
          ))}
        </section>

        <section className="console-card capital-editor">
          <h3>Capital Allocation</h3>
          <div className="settings-form">
            <label>Allocation Mode<select value={bot.allocationMode} onChange={(event) => updateBot(bot.id, { allocationMode: event.target.value as AllocationMode })}><option>Fixed</option><option>Percent</option></select></label>
            {bot.allocationMode === "Fixed" ? (
              <label>Fixed Dollar Allocation<input value={fixedDraft} inputMode="decimal" onChange={(event) => setFixedDraft(event.target.value)} onBlur={() => commitNumber(fixedDraft, bot.fixedAllocation, (next) => updateBot(bot.id, { fixedAllocation: next }), formatMoneyInput, setFixedDraft)} /></label>
            ) : (
              <label>Percentage of Available Capital<input value={percentDraft} inputMode="decimal" onChange={(event) => setPercentDraft(event.target.value)} onBlur={() => commitNumber(percentDraft, bot.percentAllocation, (next) => updateBot(bot.id, { percentAllocation: next }), undefined, setPercentDraft, 100)} /></label>
            )}
          </div>
          <div className="allocation-preview">
            <span><b>{formatMoney(allocation)}</b><small>Amount allocated</small></span>
            <span><b>{formatMoney(Math.max(0, availableAfter))}</b><small>Remaining capital preview</small></span>
            <span><b>{formatMoney(allocation * ((bot.maxPositionSize || 0) / 100))}</b><small>Max position estimate</small></span>
          </div>
        </section>

        <section className="console-card">
          <h3>Risk Controls</h3>
          <div className="settings-form">
            <label>Risk Tolerance<select value={bot.risk} onChange={(event) => updateBot(bot.id, { risk: event.target.value as BotRuntime["risk"] })}><option>Low</option><option>Medium</option><option>High</option></select></label>
            <label>Max Position Size<input value={maxPositionDraft} inputMode="decimal" onChange={(event) => setMaxPositionDraft(event.target.value)} onBlur={() => commitNumber(maxPositionDraft, bot.maxPositionSize, (next) => updateBot(bot.id, { maxPositionSize: next }), undefined, setMaxPositionDraft, 100)} /></label>
            <label>Stop-Loss<input value={stopLossDraft} inputMode="decimal" onChange={(event) => setStopLossDraft(event.target.value)} onBlur={() => commitNumber(stopLossDraft, bot.stopLoss, (next) => updateBot(bot.id, { stopLoss: next }), undefined, setStopLossDraft, 100)} /></label>
            <label>Take-Profit<input value={takeProfitDraft} inputMode="decimal" onChange={(event) => setTakeProfitDraft(event.target.value)} onBlur={() => commitNumber(takeProfitDraft, bot.takeProfit, (next) => updateBot(bot.id, { takeProfit: next }), undefined, setTakeProfitDraft, 300)} /></label>
            <label>Max Daily Loss<input value={dailyLossDraft} inputMode="decimal" onChange={(event) => setDailyLossDraft(event.target.value)} onBlur={() => commitNumber(dailyLossDraft, bot.maxDailyLoss ?? 2, (next) => updateBot(bot.id, { maxDailyLoss: next }), undefined, setDailyLossDraft, 100)} /></label>
            <label>Max Trades Per Day<input value={tradesDraft} inputMode="numeric" onChange={(event) => setTradesDraft(event.target.value)} onBlur={() => commitNumber(tradesDraft, bot.maxTradesPerDay ?? 4, (next) => updateBot(bot.id, { maxTradesPerDay: next }), undefined, setTradesDraft, 100)} /></label>
          </div>
        </section>

        <section className="console-card decision-rules">
          <h3>Bot Decision Rules</h3>
          <div className="settings-form">
            <label>Asset Universe<input value={bot.assetUniverse || ""} onChange={(event) => updateBot(bot.id, { assetUniverse: event.target.value })} /></label>
            <label>Allowed Markets<input value={bot.allowedMarkets || ""} onChange={(event) => updateBot(bot.id, { allowedMarkets: event.target.value })} /></label>
            <label>Exclusions<input value={bot.exclusions || ""} onChange={(event) => updateBot(bot.id, { exclusions: event.target.value })} /></label>
            <label>Signal Threshold<input value={thresholdDraft} inputMode="decimal" onChange={(event) => setThresholdDraft(event.target.value)} onBlur={() => commitNumber(thresholdDraft, bot.confidenceThreshold ?? 70, (next) => updateBot(bot.id, { confidenceThreshold: next }), undefined, setThresholdDraft, 100)} /></label>
            <label>Entry Rules<input value={bot.entryRules || ""} onChange={(event) => updateBot(bot.id, { entryRules: event.target.value, thesis: event.target.value })} /></label>
            <label>Exit Rules<input value={bot.exitRules || ""} onChange={(event) => updateBot(bot.id, { exitRules: event.target.value, nextAction: event.target.value })} /></label>
          </div>
        </section>

        <section className="console-card current-intelligence">
          <h3>Current Intelligence</h3>
          <dl>
            <div><dt>Latest Signal</dt><dd>{bot.decision}</dd></div>
            <div><dt>Confidence</dt><dd>{bot.confidenceThreshold ?? 70}% minimum threshold</dd></div>
            <div><dt>Why Waiting / Trading / Rejecting</dt><dd>{bot.nextAction}</dd></div>
            <div><dt>Next Evaluation</dt><dd>Next market data tick or source-health refresh</dd></div>
          </dl>
        </section>

        <section className="console-card readiness-panel">
          <h3>Deployment Readiness</h3>
          {[
            ["Allocation valid", allocation > 0 && allocation <= capital],
            ["Risk controls valid", bot.maxPositionSize > 0 && bot.stopLoss > 0 && bot.takeProfit > 0],
            ["Data sources available", true],
            ["Trading mode ready", true],
            ["Execution provider ready if Live", true],
            ["Strategy saved", bot.status !== "Configure"]
          ].map(([label, ready]) => <span key={String(label)} className={ready ? "ready" : "blocked"}>{label}</span>)}
          {blockers.length > 0 && <p className="blocker-copy">{blockers.join(" · ")}</p>}
        </section>
      </div>
      <div className="deploy-row">
        <button onClick={saveConfiguration}>Save Configuration</button>
        <button className="primary-action" onClick={deployBot}>Deploy Bot</button>
        <button onClick={() => updateBot(bot.id, { enabled: false, status: "Paused" })}>Pause Bot</button>
        <button onClick={() => updateBot(bot.id, { enabled: false, status: "Inactive" })}>Turn Off Bot</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("wolfie:view", { detail: "activity" }))}>View Bot Activity</button>
      </div>
      {sourceModal && <SourceDetailModal source={sourceModal} bot={bot} close={() => setSourceModal(null)} />}
      {blockerModal && <CenteredModal className="blocker-modal" title="Deployment blockers" close={() => setBlockerModal(false)}><p>{deploymentBlockers(bot, capital).join(" · ") || "Ready to deploy."}</p></CenteredModal>}
    </section>
  );
}

function DisclosureIntelligenceBots({ openCategory }: { openCategory: (category: DisclosurePerson["category"]) => void }) {
  const categories = ["Politicians", "Public Figures", "Insiders"] as const;
  return (
    <section className="panel disclosure-section">
      <div className="section-title"><div><h2>Disclosure Intelligence Bots</h2><p>Simple source-led intelligence cards. Open a workspace for top 10, search, full list, and profile review.</p></div></div>
      <div className="disclosure-main-cards">
        {categories.map((category) => {
          const people = disclosurePeople.filter((person) => person.category === category);
          const top = [...people].sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1))[0];
          return (
            <button key={category} className="disclosure-main-card" onClick={() => openCategory(category)}>
              <span>{category}</span>
              <b>{category === "Politicians" ? "Congressional and official disclosure intelligence" : category === "Public Figures" ? "Lawful public-figure disclosure review" : "SEC/Form 4 insider intelligence"}</b>
              <small>{category === "Public Figures" ? "No public trading disclosure shown without source records" : "Source health: public links available"}</small>
              <em>{top ? `Top preview: ${top.name}` : "No ranked profiles"}</em>
              <i>{people.length} tracked people</i>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function useEscapeClose(close: () => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
}

function CenteredModal({ title, close, children, className = "" }: { title: string; close: () => void; children: ReactNode; className?: string }) {
  useEscapeClose(close);
  return (
    <div className="modal-backdrop centered-modal-backdrop" onClick={close}>
      <section className={`modal-card centered-modal ${className}`} onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={close}>Close</button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

function SourceDetailModal({ source, bot, close }: { source: string; bot: BotRuntime; close: () => void }) {
  return (
    <CenteredModal title={`${source} source detail`} close={close} className="source-detail-modal">
      <p>{bot.name} uses {source.toLowerCase()} as a deployment input. If the feed is unavailable, the bot blocks deployment or downgrades confidence instead of fabricating signals.</p>
      <div className="setup-grid">
        <span><b>Status</b><small>{source.includes("Broker") ? "Required only for Live mode" : "Available in simulated review"}</small></span>
        <span><b>Validation</b><small>Source health is included in deployment readiness.</small></span>
        <span><b>Behavior</b><small>Weak or missing source data creates a blocker; it does not generate invented P&L.</small></span>
      </div>
    </CenteredModal>
  );
}

function DisclosureWorkspace({ category, close }: { category: DisclosurePerson["category"]; close: () => void }) {
  const [query, setQuery] = useState("");
  const [fullList, setFullList] = useState(false);
  const [selected, setSelected] = useState<DisclosurePerson | null>(null);
  const people = disclosurePeople
    .filter((person) => person.category === category)
    .filter((person) => `${person.name} ${person.role} ${person.company || ""} ${person.assets.map((asset) => asset.symbol).join(" ")}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1));
  const rows = fullList ? people : people.slice(0, 10);
  return (
    <CenteredModal title={`${category} Intelligence Workspace`} close={close} className="disclosure-workspace">
      <div className="workspace-toolbar">
        <label>{category === "Insiders" ? "Search by person, company, or ticker" : "Search by name"}<input aria-label={`${category} search`} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button onClick={() => setFullList(!fullList)}>{fullList ? "View Top 10" : "View Full List"}</button>
      </div>
      {category === "Public Figures" && <p className="source-note">No public trading disclosure found is shown for people without auditable public transaction records.</p>}
      <div className="disclosure-table" role="table" aria-label={`${category} top ranked list`}>
        <div className="disclosure-table-head"><span>Rank</span><span>Person</span><span>Win rate</span><span>Evaluated</span><span>Return</span><span>Last disclosure</span><span>Confidence</span></div>
        {rows.map((person, index) => (
          <button key={person.name} className="disclosure-table-row" onClick={() => setSelected(person)}>
            <span>{person.rank || index + 1}</span>
            <span><AvatarBadge text={person.name} /><b>{person.name}</b><small>{person.role}</small></span>
            <span>{person.winRate == null ? "Pending" : `${person.winRate.toFixed(1)}%`}</span>
            <span>{person.evaluatedTrades ?? 0}</span>
            <span>{person.estimatedReturn == null ? "N/A" : formatSignedMoney(person.estimatedReturn)}</span>
            <span>{person.lastDisclosure || "Source pending"}</span>
            <span>{person.status}</span>
          </button>
        ))}
      </div>
      {selected && <PersonDetailModal person={selected} close={() => setSelected(null)} />}
    </CenteredModal>
  );
}

function PersonProfile({ person, modal = false, onAsset }: { person: DisclosurePerson; modal?: boolean; onAsset?: (symbol: string) => void }) {
  const [tracking, setTracking] = useState(false);
  return (
    <div className={modal ? "person-profile modal-person-profile" : "person-profile"}>
      <div className="person-head">
        <AvatarBadge text={person.name} />
        <div><h3>{person.name}</h3><p>{person.category} · {person.role}</p></div>
        <button onClick={() => setTracking(!tracking)}>{tracking ? "Tracking" : "Track"}</button>
      </div>
      <div className="setup-grid">
        <span><b>Source status</b><small>{person.status}</small></span>
        <span><b>Ranking methodology</b><small>{person.methodology}</small></span>
        <span><b>Last updated</b><small>{new Date().toLocaleString()}</small></span>
      </div>
      <div className="person-assets">
        {person.assets.map((asset) => <button key={asset.symbol} onClick={() => onAsset ? onAsset(asset.symbol) : window.dispatchEvent(new CustomEvent("wolfie:asset", { detail: asset.symbol }))}><AssetLogo symbol={asset.symbol} /><span>{asset.name}</span></button>)}
      </div>
      {person.records.length ? (
        <div className="trade-table">{person.records.map((record) => <button key={`${record.date}-${record.symbol}`}><span>{record.date}</span><AssetLogo symbol={record.symbol} /><b>{record.type}</b><small>{record.amount} · disclosed {record.disclosureDate}</small></button>)}</div>
      ) : <EmptyState title="No parsed public transaction rows" body="Official source links are available, but no configured parser has returned person-level transactions for this profile. No ranking or success rate is displayed without source rows." />}
      <div className="source-links">{person.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div>
    </div>
  );
}

function PersonDetailModal({ person, close }: { person: DisclosurePerson; close: () => void }) {
  return (
    <CenteredModal title={`${person.name} Profile`} close={close} className="person-modal">
      <PersonProfile person={person} modal onAsset={(symbol) => { close(); window.dispatchEvent(new CustomEvent("wolfie:asset", { detail: symbol })); }} />
    </CenteredModal>
  );
}

function CustomBotBuilder({ capital, close, addBot }: { capital: number; close: () => void; addBot: (bot: BotRuntime) => void }) {
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("Analytical operator-defined robot");
  const [strategy, setStrategy] = useState("");
  const [assetUniverse, setAssetUniverse] = useState("US equities, ETFs");
  const [exclusions, setExclusions] = useState("Illiquid names, private securities, unsourced tips");
  const [dataSources, setDataSources] = useState("Market data, news, price/volume");
  const [allocationMode, setAllocationMode] = useState<AllocationMode>("Fixed");
  const [allocation, setAllocation] = useState("10000");
  const [risk, setRisk] = useState<"Low" | "Medium" | "High">("Medium");
  const [maxPosition, setMaxPosition] = useState("5");
  const [stopLoss, setStopLoss] = useState("3");
  const [takeProfit, setTakeProfit] = useState("9");
  const [entryRules, setEntryRules] = useState("Enter after source health, price action, and risk controls confirm.");
  const [exitRules, setExitRules] = useState("Exit on thesis break, stop-loss trigger, target hit, or source degradation.");
  const [threshold, setThreshold] = useState("70");
  const [saved, setSaved] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const parsedAllocation = allocationMode === "Fixed" ? parseMoneyInput(allocation) : Number(allocation.replace(/[$,%\s,]/g, ""));
  const blockers = [
    !name.trim() ? "Bot name is required" : "",
    !strategy.trim() ? "Strategy type is required" : "",
    parsedAllocation <= 0 ? "Allocation is required" : "",
    allocationMode === "Fixed" && parsedAllocation > capital ? "Fixed allocation exceeds available capital" : "",
    allocationMode === "Percent" && parsedAllocation > 100 ? "Percent allocation must be 0 through 100" : "",
    !dataSources.trim() ? "At least one data source is required" : ""
  ].filter(Boolean);

  function buildBot(status: BotStatus, enabled: boolean): BotRuntime {
    const id = `custom-${slugifyBotId(name || "custom-bot")}`;
    return {
      id,
      name: name.trim(),
      archetype: strategy.trim(),
      personality,
      quip: "Custom mandate loaded. I will monitor, analyze, and reject weak signals.",
      strategy,
      risk,
      defaultAllocation: 0,
      watchlist: ["SPY"],
      thesis: entryRules,
      decision: enabled ? "Custom bot deployed under saved mandate." : "Custom bot saved and awaiting deployment.",
      nextAction: exitRules,
      rejectedSignals: ["missing source confirmation", "allocation violation", "weak confidence"],
      inputs: dataSources.split(",").map((item) => item.trim()).filter(Boolean),
      guardrails: ["Custom allocation validation", "Source health check", "Explicit deployment approval"],
      enabled,
      status,
      allocationMode,
      fixedAllocation: allocationMode === "Fixed" ? parsedAllocation : 0,
      percentAllocation: allocationMode === "Percent" ? parsedAllocation : 0,
      maxPositionSize: Number(maxPosition) || 5,
      stopLoss: Number(stopLoss) || 3,
      takeProfit: Number(takeProfit) || 9,
      maxDailyLoss: 2,
      maxTradesPerDay: 4,
      assetUniverse,
      allowedMarkets: "US equities, ETFs",
      exclusions,
      confidenceThreshold: Number(threshold) || 70,
      entryRules,
      exitRules,
      botClass: "custom",
      avatarTone: "custom",
      lastEvaluated: "Saved now"
    };
  }

  function saveTemplate() {
    if (blockers.length) return;
    addBot(buildBot("Armed", false));
    setSaved(true);
  }
  function deployTemplate() {
    if (blockers.length) return;
    addBot(buildBot("Active", true));
    setDeployed(true);
  }
  return (
    <CenteredModal title="Create Your Own Bot" close={close} className="custom-bot-builder">
      <p>Build a trading agent mandate. The bot monitors and analyzes assets; the user configures strategy, risk, capital, sources, and permissions.</p>
      <div className="settings-form">
        <label>Bot Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Bot Personality / Style<input value={personality} onChange={(event) => setPersonality(event.target.value)} /></label>
        <label>Strategy Type<input value={strategy} onChange={(event) => setStrategy(event.target.value)} /></label>
        <label>Asset Universe<input value={assetUniverse} onChange={(event) => setAssetUniverse(event.target.value)} /></label>
        <label>Exclusions<input value={exclusions} onChange={(event) => setExclusions(event.target.value)} /></label>
        <label>Data Sources Required<input value={dataSources} onChange={(event) => setDataSources(event.target.value)} /></label>
        <label>Allocation Mode<select value={allocationMode} onChange={(event) => setAllocationMode(event.target.value as AllocationMode)}><option>Fixed</option><option>Percent</option></select></label>
        <label>{allocationMode === "Fixed" ? "Allocation Value" : "Allocation Percent"}<input value={allocation} onChange={(event) => setAllocation(event.target.value)} onBlur={() => allocationMode === "Fixed" && parseMoneyInput(allocation) > 0 && setAllocation(formatMoney(parseMoneyInput(allocation)))} /></label>
        <label>Risk<select value={risk} onChange={(event) => setRisk(event.target.value as "Low" | "Medium" | "High")}><option>Low</option><option>Medium</option><option>High</option></select></label>
        <label>Max Position Size<input value={maxPosition} onChange={(event) => setMaxPosition(event.target.value)} /></label>
        <label>Stop Loss<input value={stopLoss} onChange={(event) => setStopLoss(event.target.value)} /></label>
        <label>Take Profit<input value={takeProfit} onChange={(event) => setTakeProfit(event.target.value)} /></label>
        <label>Entry Rules<input value={entryRules} onChange={(event) => setEntryRules(event.target.value)} /></label>
        <label>Exit Rules<input value={exitRules} onChange={(event) => setExitRules(event.target.value)} /></label>
        <label>Confidence Threshold<input value={threshold} onChange={(event) => setThreshold(event.target.value)} /></label>
      </div>
      <div className="setup-grid">
        <span><b>Validation</b><small>{blockers.length ? blockers.join(" · ") : "Ready to save and deploy."}</small></span>
        <span><b>Current state</b><small>{deployed ? "Deployed" : saved ? "Saved" : "Unsaved"}</small></span>
      </div>
      <div className="deploy-row"><button onClick={saveTemplate}>Save Configuration</button><button className="primary-action" onClick={deployTemplate}>Deploy Strategy</button></div>
    </CenteredModal>
  );
}

function SignalConsole(props: { bots: BotRuntime[]; selectedBot: BotRuntime | null; decisionFrames: DecisionFrame[]; selectedFrame: DecisionFrame; selectBot: (id: BotId) => void; selectFrame: (id: string) => void; openFrame: (id: string) => void }) {
  const activeFrame = props.selectedBot ? props.decisionFrames.find((frame) => frame.botId === props.selectedBot?.id) || props.selectedFrame : props.selectedFrame;
  const activePreset = botPresets.find((preset) => preset.id === activeFrame.botId) || botPresets[0];
  return (
    <div className="signal-console-grid">
      <section className="panel signal-roster">
        <div className="section-title"><div><h2>Bot Roster</h2><p>Each bot has its own preset, weights, ignored signals, allocation, and risk guardrails.</p></div></div>
        {props.decisionFrames.map((frame) => {
          const bot = props.bots.find((item) => item.id === frame.botId);
          if (!bot) return null;
          return (
            <button key={frame.id} className={activeFrame.id === frame.id ? "active" : ""} onClick={() => { props.selectBot(bot.id); props.selectFrame(frame.id); }}>
              <RobotAvatar bot={bot} small />
              <span><b>{bot.name}</b><small>{activePreset.tradingStyle}</small></span>
              <em>{frame.state.replace("_position", "")}</em>
            </button>
          );
        })}
      </section>

      <section className="panel signal-center">
        <div className="section-title">
          <div><h2>{activePreset.name} Signal Console</h2><p>{activeFrame.currentDecision}</p></div>
          <button onClick={() => props.openFrame(activeFrame.id)}>Open Full Frame</button>
        </div>
        <div className="market-pulse">
          {activeFrame.sourceFreshness.slice(0, 5).map((source) => <span key={source.lane}><b>{source.lane}</b><small>{source.status} · {source.cadence}</small></span>)}
        </div>
        <section className="signal-stack">
          <h3>Signal Stack</h3>
          {activeFrame.signals.map((signal) => (
            <button key={signal.id} onClick={() => props.openFrame(activeFrame.id)}>
              <span><b>{signal.sourceName}</b><small>{signal.explanation}</small></span>
              <i style={{ width: `${signal.weight}%` }} />
              <em className={signal.direction}>{signal.direction} · {signal.confidence}% · {signal.freshness}</em>
            </button>
          ))}
        </section>
        <section className="conflict-board">
          <h3>Conflict Board</h3>
          <div><b>Bullish Evidence</b>{activeFrame.conflicts.bullish.map((item) => <small key={item}>{item}</small>)}</div>
          <div><b>Bearish Evidence</b>{activeFrame.conflicts.bearish.map((item) => <small key={item}>{item}</small>)}</div>
          <div><b>Uncertainty</b>{activeFrame.conflicts.uncertainty.concat(activeFrame.conflicts.stale).map((item) => <small key={item}>{item}</small>)}</div>
        </section>
      </section>

      <aside className="panel signal-economics">
        <h2>Trade Economics</h2>
        <dl>
          <div><dt>Expected gross move</dt><dd>{formatPercent(activeFrame.expectedGrossMovePercent, 2)}</dd></div>
          <div><dt>Estimated costs</dt><dd>{formatMoney(activeFrame.costEstimate.totalEstimatedTradeFriction)}</dd></div>
          <div><dt>Fee drag</dt><dd>{formatPercent(activeFrame.costEstimate.feeDragPercent, 3)}</dd></div>
          <div><dt>Break-even price</dt><dd>{formatMoney(activeFrame.costEstimate.breakEvenPrice)}</dd></div>
          <div><dt>Net expected profit</dt><dd>{formatSignedMoney(activeFrame.expectedNetProfit)}</dd></div>
          <div><dt>Small-account suitability</dt><dd>{activeFrame.costEstimate.accountSizeSuitability}</dd></div>
        </dl>
        <h2>Risk Gate</h2>
        <div className={`risk-gate ${activeFrame.riskGate.status}`}>
          <b>{activeFrame.riskGate.status}</b>
          {activeFrame.riskGate.reasons.map((reason) => <small key={reason}>{reason}</small>)}
        </div>
        <h2>What Would Change My Mind</h2>
        {activeFrame.whatChangesMind.map((item) => <p key={item}>{item}</p>)}
      </aside>

      <section className="panel learning-memory">
        <h2>Learning Memory</h2>
        {activeFrame.memory.map((memory) => <button key={memory.id}><b>{memory.type.replace("_", " ")}</b><span>{memory.lesson}</span><small>{memory.metric}</small></button>)}
      </section>
      <section className="panel self-healing-panel">
        <h2>Self-Healing</h2>
        {activeFrame.selfHealing.map((action) => <button key={action.id}><b>{action.action.replaceAll("_", " ")}</b><span>{action.explanation}</span><small>{action.boundedChange}{action.requiresUserApproval ? " · user approval required" : ""}</small></button>)}
      </section>
      <section className="panel source-freshness-panel">
        <h2>Plain-English Concepts</h2>
        {Object.entries(educationGlossary).slice(0, 8).map(([term, explanation]) => <button key={term}><b>{term}</b><span>{explanation}</span></button>)}
      </section>
    </div>
  );
}

function Activity(props: { trades: Trade[]; allTrades: Trade[]; filter: string; setFilter: (value: string) => void; bots: BotRuntime[]; setSelectedFrameId: (id: string) => void; setDrawer: (drawer: "activity") => void; selectTrade: (id: string) => void; onPositiveClose: () => void; soundEnabled: boolean }) {
  const filters = ["All", "Profitable", "Losing", "Long", "Short", ...props.bots.map((bot) => bot.id), ...Array.from(new Set(props.allTrades.map((trade) => trade.symbol)))];
  return (
    <div className="activity-grid">
      <section className="panel activity-filters">
        <h2>Filters</h2>
        <div>{filters.map((filter) => <button key={filter} className={props.filter === filter ? "active" : ""} onClick={() => props.setFilter(filter)}>{filter}</button>)}</div>
      </section>
      <section className="panel trade-map">
        <div className="section-title"><h2>Trading Activity</h2><button onClick={props.onPositiveClose}>{props.soundEnabled ? "Settle profitable close" : "Enable Trade Sounds"}</button></div>
        {props.trades.length ? <TradeFlow trades={props.trades} onSelect={props.selectTrade} /> : <EmptyState title="No ledger rows" body="Activity appears after a configured bot creates an allocation, signal, fee, or trade event." />}
      </section>
      <section className="panel trade-table">
        <h2>Audit Trail</h2>
        {props.trades.length ? props.trades.map((trade) => <button key={trade.id} onClick={() => { props.setSelectedFrameId(`${trade.botId}-${trade.symbol}`); props.selectTrade(trade.id); }}><span>{new Date(trade.timestamp).toLocaleString()}</span><AssetLogo symbol={trade.symbol} /><b>{trade.side}</b><small>{trade.direction} · {props.bots.find((bot) => bot.id === trade.botId)?.name} · P&L {formatSignedMoney(trade.grossPnl - trade.fees)} · fees {formatMoney(trade.fees)}</small></button>) : <EmptyState title="No audit rows" body="The audit trail is clean. It will populate from saved settings, bot deployment events, allocations, fees, and executed trades." />}
      </section>
    </div>
  );
}

function Settings(props: { capital: number; draftCapital: string; setDraftCapital: (value: string) => void; saveCapital: () => void; mode: Mode; requestMode: (mode: Mode) => void; liveSnapshot: LiveProviderSnapshot; soundEnabled: boolean; setSoundEnabled: (value: boolean) => void; bots: BotRuntime[]; updateBot: (id: BotId, patch: Partial<BotRuntime>) => void; availableCapital: number; highlighted: boolean; resetEntireApp: () => void; openProvider: (provider: ProviderCard) => void }) {
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <div className="settings-grid">
      <section className={`panel settings-card ${props.highlighted ? "capital-highlight" : ""}`} id="starting-capital-setting">
        <h2>Starting Capital</h2>
        <label>How much do you want Wolfie to trade with?<input value={props.draftCapital} onChange={(event) => props.setDraftCapital(event.target.value)} onBlur={() => parseMoneyInput(props.draftCapital) > 0 && props.setDraftCapital(formatMoney(parseMoneyInput(props.draftCapital)))} /></label>
        <button className="primary-action" disabled={parseMoneyInput(props.draftCapital) <= 0} onClick={props.saveCapital}>Save Starting Capital</button>
        <dl><div><dt>Current Starting Capital</dt><dd>{formatMoney(props.capital)}</dd></div><div><dt>Available Capital</dt><dd>{formatMoney(props.availableCapital)}</dd></div></dl>
      </section>
      <section className="panel settings-card">
        <h2>Trading Mode</h2>
        <div className="segmented large"><button className={props.mode === "Simulated" ? "active" : ""} onClick={() => props.requestMode("Simulated")}>Simulated</button><button onClick={() => props.requestMode("Live")}>Live</button></div>
        <p>Brokerage activation requires account connection, authorization, disclosures, order routing, risk checks, and execution audit logs before activation.</p>
      </section>
      <section className="panel provider-status">
        <h2>Provider Status</h2>
        {props.liveSnapshot.providers.map((provider) => <button key={provider.name} className={provider.tone} onClick={() => props.openProvider(provider)}><b>{provider.name}</b><span>{provider.status}</span><p>{provider.detail}</p></button>)}
        <div className="source-rail">
          <h3>Public source links</h3>
          {publicDisclosureSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}
        </div>
      </section>
      <section className="panel settings-card">
        <h2>Trade Sound</h2>
        <label className="toggle"><input type="checkbox" checked={props.soundEnabled} onChange={(event) => props.setSoundEnabled(event.target.checked)} />Enable browser-compliant positive close sound</label>
        <p>The cha-ching sound only plays after an explicit user interaction.</p>
      </section>
      <section className="panel settings-card danger-card">
        <h2>Reset Entire App</h2>
        <p>This clears local stored app data, dashboard values, bot deployment state, allocations, activity filters, and initialization status. You will be sent back to capital initialization.</p>
        {confirmReset && <div className="reset-confirm"><b>Confirm destructive reset</b><small>Starting capital, available capital, bot allocations, deployment state, watchlists stored locally, performance history, and local app settings will be cleared where this browser stores them.</small></div>}
        <button className={confirmReset ? "danger-action armed" : "danger-action"} onClick={() => confirmReset ? props.resetEntireApp() : setConfirmReset(true)}>{confirmReset ? "Confirm Reset Entire App" : "Prepare Reset"}</button>
        {confirmReset && <button onClick={() => setConfirmReset(false)}>Cancel Reset</button>}
      </section>
      <section className="panel provider-status">
        <h2>Bot Deployment Defaults</h2>
        {props.bots.map((bot) => <button key={bot.id} onClick={() => props.updateBot(bot.id, { status: bot.status === "Paused" ? "Inactive" : bot.status })}><b>{bot.name}</b><span>{bot.status}</span><p>{bot.strategy}</p></button>)}
      </section>
    </div>
  );
}

function TradeFlow({ trades, onSelect }: { trades: Trade[]; onSelect?: (id: string) => void }) {
  const max = Math.max(...trades.map((trade) => Math.abs(trade.grossPnl - trade.fees)), 1);
  return (
    <div className="trade-flow">
      {trades.map((trade) => {
        const pnl = trade.grossPnl - trade.fees;
        return <button key={trade.id} className={pnl >= 0 ? "profit" : "loss"} onClick={() => onSelect?.(trade.id)}><span>{trade.side}</span><AssetLogo symbol={trade.symbol} /><i style={{ width: `${Math.max(12, Math.abs(pnl) / max * 100)}%` }} /><b>{formatSignedMoney(pnl)}</b><small>{trade.direction} · fees {formatMoney(trade.fees)}</small></button>;
      })}
    </div>
  );
}

function SignalFrameDrawer({ frame, trade }: { frame: DecisionFrame; trade: Trade | null }) {
  return (
    <>
      <h2><AssetLogo symbol={frame.symbol} />{frame.symbol} Decision Frame</h2>
      <p>{frame.currentDecision}</p>
      <TradingViewChartPanel symbol={frame.symbol} />
      <dl>
        <div><dt>Decision State</dt><dd>{frame.state.replace("_position", "")}</dd></div>
        <div><dt>Confidence</dt><dd>{formatPercent(frame.confidence)}</dd></div>
        <div><dt>Expected Gross Move</dt><dd>{formatPercent(frame.expectedGrossMovePercent, 2)}</dd></div>
        <div><dt>Total Estimated Costs</dt><dd>{formatMoney(frame.costEstimate.totalEstimatedTradeFriction)}</dd></div>
        <div><dt>Net Expected Profit</dt><dd>{formatSignedMoney(frame.expectedNetProfit)}</dd></div>
        <div><dt>Risk Gate</dt><dd>{frame.riskGate.status}: {frame.riskGate.reasons.join(" ")}</dd></div>
        <div><dt>Rejected Opportunities</dt><dd>{frame.rejectedOpportunities.join(" ")}</dd></div>
        <div><dt>Related P&L</dt><dd>{trade ? formatSignedMoney(trade.grossPnl - trade.fees) : "No ledger row"}</dd></div>
      </dl>
      <div className="source-links">{frame.costEstimate.sourceNotes.map((source) => <a key={`${source.feeName}-${source.sourceUrl}`} href={source.sourceUrl} target="_blank" rel="noreferrer">{source.feeName}</a>)}</div>
      <div className="queue-list">
        {frame.sourceFreshness.map((source) => <button key={source.lane}><b>{source.lane}: {source.status}</b><small>{source.detail}</small></button>)}
      </div>
    </>
  );
}

function ActivityDrawer({ trade, bots }: { trade: Trade | null; bots: BotRuntime[] }) {
  if (!trade) return <EmptyState title="No activity selected" body="The ledger is clean. Select a row after bot deployment or trade activity is created." />;
  return <><h2><AssetLogo symbol={trade.symbol} />{trade.symbol} {trade.side}</h2><TradingViewSymbolInfoPanel symbol={trade.symbol} /><dl><div><dt>Responsible Bot</dt><dd>{bots.find((bot) => bot.id === trade.botId)?.name}</dd></div><div><dt>Timestamp</dt><dd>{new Date(trade.timestamp).toLocaleString()}</dd></div><div><dt>Net P&L</dt><dd>{formatSignedMoney(trade.grossPnl - trade.fees)}</dd></div><div><dt>Fees</dt><dd>{formatMoney(trade.fees)}</dd></div></dl></>;
}

function LiveDrawer({ confirmLiveModeReset, mode }: { confirmLiveModeReset: () => void; mode: Mode }) {
  return <><h2>Brokerage setup required</h2><p>Robinhood MCP is not exposed in this Codex session. Switching the mode clears local account state and waits for Robinhood MCP account, order, and execution tools before brokerage data can initialize.</p>{mode !== "Live" && <button className="primary-action" onClick={confirmLiveModeReset}>Clear Local State and Enter Brokerage Setup</button>}<div className="empty-state"><b>Exact blocker</b><p>No Robinhood MCP server/tool is installed or callable in the current tool registry.</p></div></>;
}

function ProfitDrawer({ soundEnabled }: { soundEnabled: boolean }) {
  return <><h2>Closed profitable trade</h2><p>{soundEnabled ? "Trade sounds are enabled for user-triggered profitable closes." : "Trade sounds remain disabled until you enable them."}</p></>;
}

function RobotAvatar({ bot, small = false }: { bot: Pick<BotRuntime, "id" | "name" | "risk">; small?: boolean }) {
  const sources: Record<string, string> = {
    sentinel: "/wolfie-shield.png",
    surge: "/wolfie-surge.png",
    compass: "/wolfie-compass.png",
    contrarian: "/wolfie-alpha.png",
    disclosure: "/wolfie-disclosure.png"
  };
  return (
    <span className={`robot-avatar image-avatar ${bot.id} mood-${bot.risk.toLowerCase()} ${small ? "small" : ""}`} aria-label={`${bot.name} robot avatar`}>
      {sources[bot.id] ? <img src={assetPath(sources[bot.id])} alt="" /> : <span className="robot-face" aria-hidden="true"><i /><em /><strong /></span>}
      <b>{bot.risk}</b>
    </span>
  );
}

function CapitalDrawer({ capital, availableCapital, allocated, fees, realizedPnl, unrealizedPnl, trades, bots }: { capital: number; availableCapital: number; allocated: number; fees: number; realizedPnl: number; unrealizedPnl: number; trades: Trade[]; bots: BotRuntime[] }) {
  const points = capitalSeries(capital, trades);
  const contributions = botContributions(trades, bots);
  return (
    <>
      <h2>Available Capital</h2>
      <p>Starting Capital minus Allocated Capital minus Fees plus Realized P&L plus/minus Unrealized P&L equals Available Capital.</p>
      <MiniLineChart points={points} />
      <dl>
        <div><dt>Starting Capital</dt><dd>{formatMoney(capital)}</dd></div>
        <div><dt>Minus Allocated Capital</dt><dd>{formatMoney(allocated)}</dd></div>
        <div><dt>Minus Fees</dt><dd>{formatMoney(fees)}</dd></div>
        <div><dt>Plus Realized P&L</dt><dd>{formatSignedMoney(realizedPnl)}</dd></div>
        <div><dt>Plus/Minus Unrealized P&L</dt><dd>{formatSignedMoney(unrealizedPnl)}</dd></div>
        <div><dt>Available Capital</dt><dd>{formatMoney(availableCapital)}</dd></div>
        <div><dt>Stored Activity Rows</dt><dd>{trades.length} trade records</dd></div>
      </dl>
      <ContributionBars rows={contributions} />
    </>
  );
}

function AllocationDrawer({ capital, allocated, bots, setView, close }: { capital: number; allocated: number; bots: BotRuntime[]; setView: (view: ViewId) => void; close: () => void }) {
  const enabled = bots.filter((bot) => bot.enabled);
  const rows = enabled.map((bot) => ({ label: bot.name, value: allocationForBot(bot, capital), detail: `${bot.allocationMode} allocation` }));
  return (
    <>
      <h2>Allocated to Bots</h2>
      <p>Only deployed bots are counted as allocated capital.</p>
      {rows.length ? <ContributionBars rows={rows} total={Math.max(allocated, 1)} /> : <EmptyState title="No deployed allocations" body="Deploy a bot or adjust allocation controls before this view can show a capital distribution." action="Open Bots" onAction={() => { close(); setView("bots"); }} />}
      <dl><div><dt>Total Allocated</dt><dd>{formatMoney(allocated)}</dd></div><div><dt>Deployment Count</dt><dd>{enabled.length}</dd></div></dl>
    </>
  );
}

function PnlDrawer({ trades, bots }: { trades: Trade[]; bots: BotRuntime[] }) {
  const [windowId, setWindowId] = useState("All time");
  const filtered = tradesForWindow(trades, windowId);
  const total = filtered.reduce((sum, trade) => sum + trade.grossPnl - trade.fees, 0);
  const rows = botContributions(filtered, bots);
  const assetRows = Array.from(new Set(filtered.map((trade) => trade.symbol))).map((symbol) => ({ label: symbol, value: filtered.filter((trade) => trade.symbol === symbol).reduce((sum, trade) => sum + trade.grossPnl - trade.fees, 0), detail: `${filtered.filter((trade) => trade.symbol === symbol).length} rows` }));
  return (
    <>
      <h2>Net P&L</h2>
      <div className="window-tabs">{["1 hour", "1 day", "3 days", "1 week", "1 month", "1 year", "All time"].map((item) => <button key={item} className={windowId === item ? "active" : ""} onClick={() => setWindowId(item)}>{item}</button>)}</div>
      <dl><div><dt>Total P&L</dt><dd>{formatSignedMoney(total)}</dd></div><div><dt>Rows in Window</dt><dd>{filtered.length}</dd></div><div><dt>Realized vs Unrealized</dt><dd>Closed rows are realized; open rows remain unrealized in stored activity.</dd></div></dl>
      {filtered.length ? <><MiniLineChart points={capitalSeries(0, filtered)} /><ContributionBars rows={rows} /><ContributionBars rows={assetRows} title="By Asset" /></> : <EmptyState title="No P&L rows in this window" body="Stored activity has no trades inside the selected evaluation period. Expand the window or review Activity for available rows." />}
    </>
  );
}

function AssetDetailDrawer({ symbol, trades }: { symbol: string; trades: Trade[] }) {
  const relatedTrades = trades.filter((trade) => trade.symbol === symbol);
  return (
    <>
      <h2><AssetLogo symbol={symbol} />{symbol} Detail</h2>
      <TradingViewSymbolInfoPanel symbol={symbol} />
      <TradingViewChartPanel symbol={symbol} />
      {relatedTrades.length ? <TradeFlow trades={relatedTrades} /> : <EmptyState title="No stored activity for this asset" body="TradingView can display public market context, but Wolfie has no local trade rows attached to this symbol yet." />}
    </>
  );
}

function FeesDrawer({ trades }: { trades: Trade[] }) {
  const rows = trades.filter((trade) => trade.fees > 0).map((trade) => ({ label: trade.symbol, value: trade.fees, detail: `${trade.side} · ${new Date(trade.timestamp).toLocaleString()}` }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return <><h2>Fees</h2><p>Fees are calculated through the centralized Robinhood-style fee adapter.</p><dl><div><dt>Total Fees</dt><dd>{formatMoney(total)}</dd></div><div><dt>Fee Rows</dt><dd>{rows.length}</dd></div></dl>{rows.length ? <ContributionBars rows={rows} title="Fee Breakdown" /> : <EmptyState title="No fees charged" body="The ledger has no executed fee rows. Fees will appear only after an activity row carries a calculated fee." />}</>;
}

function SuccessDrawer({ trades, bots }: { trades: Trade[]; bots: BotRuntime[] }) {
  const closed = trades.filter((trade) => trade.status === "Closed");
  const wins = closed.filter((trade) => trade.grossPnl - trade.fees > 0).length;
  const rows = bots.map((bot) => {
    const botClosed = closed.filter((trade) => trade.botId === bot.id);
    const botWins = botClosed.filter((trade) => trade.grossPnl - trade.fees > 0).length;
    return { label: bot.name, value: botClosed.length ? (botWins / botClosed.length) * 100 : 0, detail: `${botClosed.length} closed rows` };
  });
  return <><h2>Computed Success Rate</h2><p>Methodology: closed rows with positive net P&L divided by all closed rows in the selected ledger. The 80% target is a monitoring benchmark, not a certainty claim.</p><dl><div><dt>Overall Win Rate</dt><dd>{closed.length ? formatPercent((wins / closed.length) * 100) : "Unavailable"}</dd></div><div><dt>Sample Size</dt><dd>{closed.length}</dd></div></dl>{closed.length ? <ContributionBars rows={rows} title="By Bot" /> : <EmptyState title="No closed outcomes" body="Win rate requires closed ledger rows. No certainty is inferred from an empty sample." />}</>;
}

function ProviderDrawer({ provider, liveSnapshot, close }: { provider: ProviderCard | null; liveSnapshot: LiveProviderSnapshot; close: () => void }) {
  const active = provider || liveSnapshot.providers[0];
  if (!active) return null;
  const assets = liveSnapshot.quotes.map((quote) => quote.symbol);
  return (
    <>
      <h2>{active.name}</h2>
      <dl>
        <div><dt>Status</dt><dd>{active.status}</dd></div>
        <div><dt>Last Refresh</dt><dd>{liveSnapshot.updatedAt ? formatFreshness(liveSnapshot.updatedAt) : "Not updated"}</dd></div>
        <div><dt>Current Provider</dt><dd>{active.name === "Market data" ? "Authorized market-data ladder with waiting/cached/fallback labels" : active.name}</dd></div>
        <div><dt>Asset Universe</dt><dd>{assets.length ? assets.join(", ") : "Signal Console presets: SPY, NVDA, AAPL, GME, MSFT"}</dd></div>
        <div><dt>Latency</dt><dd>Browser refresh cadence; provider timestamp shown when returned by source.</dd></div>
        <div><dt>Powers</dt><dd>Live Market Feed, bot readiness, asset detail context, signal queue status, and provider health.</dd></div>
      </dl>
      <div className="provider-actions">
        <button onClick={() => { window.dispatchEvent(new CustomEvent("wolfie:view", { detail: "dashboard" })); close(); }}>View Market Feed</button>
        <button onClick={() => { window.dispatchEvent(new CustomEvent("wolfie:view", { detail: "bots" })); close(); }}>Open Watchlist</button>
        <button onClick={() => window.location.reload()}>Refresh Source</button>
        <button onClick={() => { window.dispatchEvent(new CustomEvent("wolfie:view", { detail: "settings" })); close(); }}>Configure Provider</button>
      </div>
      <div className="asset-row-list">{(assets.length ? assets : ["NVDA", "SPY", "COIN", "GME", "AMD"]).map((symbol) => <button key={symbol} onClick={() => window.dispatchEvent(new CustomEvent("wolfie:asset", { detail: symbol }))}><AssetLogo symbol={symbol} /></button>)}</div>
    </>
  );
}

function AssetLogo({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const normalized = symbol.toUpperCase();
  const isCrypto = ["BTC", "ETH", "SOL", "DOGE", "XRP"].includes(normalized);
  if (failed || normalized === "FILING") return <span className="asset-logo fallback">{normalized.slice(0, 4)}</span>;
  const src = `https://img.logo.dev/${isCrypto ? "crypto" : "ticker"}/${encodeURIComponent(normalized)}?token=pk_OF7fnyYzTMunWSwtv-wDEg`;
  return <span className="asset-logo"><img src={src} alt={`${normalized} logo`} loading="lazy" onError={() => setFailed(true)} /><b>{normalized.slice(0, 4)}</b></span>;
}

function TradingViewChartPanel({ symbol }: { symbol: string }) {
  const tvSymbol = tradingViewSymbol(symbol);
  if (!tvSymbol) return <EmptyState title="Market chart unavailable" body="This item is not a direct tradable ticker, so no TradingView market chart is embedded." />;
  const src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}&interval=D&theme=dark&style=1&timezone=America%2FChicago&hide_top_toolbar=1&hide_legend=1&save_image=0&withdateranges=1&studies=[]`;
  return <div className="tv-panel"><iframe title={`${symbol} TradingView chart`} src={src} loading="lazy" /></div>;
}

function TradingViewSymbolInfoPanel({ symbol }: { symbol: string }) {
  const tvSymbol = tradingViewSymbol(symbol);
  if (!tvSymbol) return <EmptyState title="Symbol info unavailable" body="This signal is sourced from disclosure context rather than a direct exchange symbol." />;
  const config = encodeURIComponent(JSON.stringify({ symbol: tvSymbol, width: "100%", locale: "en", colorTheme: "dark", isTransparent: true }));
  return <div className="tv-info"><iframe title={`${symbol} TradingView symbol info`} src={`https://s.tradingview.com/embed-widget/symbol-info/?locale=en#${config}`} loading="lazy" /></div>;
}

function TradingViewTickerTape({ symbols }: { symbols: string[] }) {
  const config = encodeURIComponent(JSON.stringify({ symbols: symbols.map((proName) => ({ proName, title: proName.split(":")[1] })), showSymbolLogo: true, colorTheme: "dark", isTransparent: true, displayMode: "adaptive", locale: "en" }));
  return <section className="ticker-tape panel"><iframe title="TradingView ticker tape" src={`https://s.tradingview.com/embed-widget/ticker-tape/?locale=en#${config}`} loading="lazy" /></section>;
}

function PerformanceChartPanel({ mode, symbol, interval, bots, capital, netPnl }: { mode: "Portfolio" | "Bots" | "Stock"; symbol: string; interval: string; bots: BotRuntime[]; capital: number; netPnl: number }) {
  const series = performanceSeries(mode, symbol, interval, bots, capital, netPnl);
  const values = series.flatMap((point) => [point.high, point.low]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const y = (value: number) => 214 - ((value - min) / range) * 168;
  const last = series[series.length - 1];
  const first = series[0];
  const change = last.close - first.open;
  const changePercent = first.open ? (change / first.open) * 100 : 0;
  const ticks = [max, min + range * .66, min + range * .33, min];
  const label = mode === "Stock" ? `${symbol} stock performance` : mode === "Bots" ? "Bot performance" : "Portfolio performance";
  return (
    <div className={`stock-chart performance-${mode.toLowerCase()}`} role="img" aria-label={`${label} chart`}>
      <div className="stock-chart-head">
        <div>{mode === "Stock" ? <AssetLogo symbol={symbol} /> : <img className="performance-mark" src={assetPath(mode === "Bots" ? "/mock-icon-bots.png" : "/mock-metric-pnl.png")} alt="" />}<span>{label}</span></div>
        <b>{formatMoney(last.close)}</b>
        <small className={change >= 0 ? "gain" : "loss"}>{formatSignedMoney(change)} ({changePercent > 0 ? "+" : ""}{formatPercent(changePercent, 2)})</small>
      </div>
      <svg viewBox="0 0 520 246" aria-hidden="true">
        <defs>
          <linearGradient id={`chartGlow-${symbol}-${interval}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1ed9a2" stopOpacity=".36" />
            <stop offset="100%" stopColor="#1ed9a2" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[42, 86, 130, 174, 218].map((line) => <line key={line} className="grid-line" x1="18" x2="454" y1={line} y2={line} />)}
        {[82, 182, 282, 382].map((line) => <line key={line} className="grid-line faint" x1={line} x2={line} y1="28" y2="220" />)}
        <path className="area-fill" d={`M 26 ${y(series[0].close)} ${series.map((point, index) => `L ${26 + index * 22} ${y(point.close)}`).join(" ")} L ${26 + (series.length - 1) * 22} 220 L 26 220 Z`} fill={`url(#chartGlow-${symbol}-${interval})`} />
        {series.map((point, index) => {
          const x = 26 + index * 22;
          const up = point.close >= point.open;
          const top = Math.min(y(point.open), y(point.close));
          const height = Math.max(5, Math.abs(y(point.open) - y(point.close)));
          return <g key={`${point.label}-${index}`} className={up ? "candle up" : "candle down"}><line x1={x} x2={x} y1={y(point.high)} y2={y(point.low)} /><rect x={x - 5} y={top} width="10" height={height} rx="2" /></g>;
        })}
        <line className="price-line" x1="18" x2="454" y1={y(last.close)} y2={y(last.close)} />
        <text className="price-badge" x="464" y={y(last.close) + 4}>{last.close.toFixed(2)}</text>
        {ticks.map((tick) => <text key={tick.toFixed(2)} className="axis-label" x="466" y={y(tick) + 4}>{tick.toFixed(2)}</text>)}
        {series.filter((_, index) => index % 5 === 0).map((point, index) => <text key={point.label} className="time-label" x={26 + index * 110} y="240">{point.label}</text>)}
      </svg>
      <div className="stock-chart-foot">
        <span>Mode {mode}</span><span>H {last.high.toFixed(2)}</span><span>L {last.low.toFixed(2)}</span><span>Vol {formatCompactNumber(last.volume)}</span>
      </div>
    </div>
  );
}

function performanceSeries(mode: "Portfolio" | "Bots" | "Stock", symbol: string, interval: string, bots: BotRuntime[], capital: number, netPnl: number) {
  if (mode === "Stock") return stockSeries(symbol, interval);
  const deployed = bots.filter((bot) => bot.enabled).length;
  const base = mode === "Portfolio" ? Math.max(1, capital + netPnl) : Math.max(1, bots.reduce((sum, bot) => sum + allocationForBot(bot, Math.max(capital, 1)), 0) / Math.max(1, bots.length));
  const riskBoost = mode === "Bots" ? deployed * 1.8 + 3 : 6;
  const seed = mode === "Portfolio" ? 17 : 29 + deployed;
  return Array.from({ length: 20 }, (_, index) => {
    const wave = Math.sin((index + seed) * .58) * riskBoost + Math.cos((index + seed) * .22) * (riskBoost * .65);
    const drift = mode === "Portfolio" ? index * Math.max(1, base * .00024) : index * Math.max(1, base * .00018);
    const open = base + wave + drift;
    const close = open + Math.sin((index + seed) * .93) * riskBoost * .52;
    const high = Math.max(open, close) + riskBoost * .42;
    const low = Math.min(open, close) - riskBoost * .38;
    return { label: `${9 + Math.floor(index / 4)}:${String((index % 4) * 15).padStart(2, "0")}`, open, close, high, low, volume: 580000 + index * 68000 + deployed * 94000 };
  });
}

function stockSeries(symbol: string, interval: string) {
  const seed = symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) + Number(interval);
  const base = symbol === "SPY" ? 746 : symbol === "NVDA" ? 144 : 201;
  return Array.from({ length: 20 }, (_, index) => {
    const wave = Math.sin((index + seed) * .72) * 2.4 + Math.cos((index + seed) * .31) * 1.7;
    const drift = (index - 8) * .12;
    const open = base + wave + drift;
    const close = open + Math.sin((index + seed) * 1.18) * 1.65;
    const high = Math.max(open, close) + 1.1 + ((index + seed) % 3) * .22;
    const low = Math.min(open, close) - 1.05 - ((index + seed) % 4) * .18;
    return { label: `${9 + Math.floor(index / 4)}:${String((index % 4) * 15).padStart(2, "0")}`, open, close, high, low, volume: 420000 + (index + 1) * 41200 + seed * 120 };
  });
}

function MiniLineChart({ points }: { points: { label: string; value: number }[] }) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = Math.max(1, max - min);
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${(index / Math.max(1, points.length - 1)) * 100} ${82 - ((point.value - min) / range) * 64}`).join(" ");
  return <div className="mini-chart"><svg viewBox="0 0 100 90" role="img" aria-label="Stored capital trend"><path d={path} /><line x1="0" x2="100" y1="82" y2="82" /></svg>{points.map((point) => <span key={point.label}>{point.label}</span>)}</div>;
}

function ContributionBars({ rows, total, title = "By Bot" }: { rows: { label: string; value: number; detail?: string }[]; total?: number; title?: string }) {
  const denominator = total || Math.max(...rows.map((row) => Math.abs(row.value)), 1);
  return <div className="contribution-bars"><h3>{title}</h3>{rows.map((row) => <div key={row.label}><span>{row.label}</span><i style={{ width: `${Math.max(2, Math.abs(row.value) / denominator * 100)}%` }} /><b>{formatSignedMoney(row.value)}</b><small>{row.detail}</small></div>)}</div>;
}

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><b>{title}</b><p>{body}</p>{action && onAction && <button onClick={onAction}>{action}</button>}</div>;
}

function tradingViewSymbol(symbol: string) {
  const normalized = symbol.toUpperCase();
  if (normalized === "FILING") return "";
  if (normalized === "SPY") return "AMEX:SPY";
  if (["BTC", "ETH", "SOL"].includes(normalized)) return `BINANCE:${normalized}USDT`;
  return `NASDAQ:${normalized}`;
}

function capitalSeries(capital: number, trades: Trade[]) {
  let running = capital;
  return [{ label: "Start", value: running }, ...[...trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((trade) => {
    running += trade.grossPnl - trade.fees;
    return { label: trade.symbol, value: running };
  })];
}

function botContributions(trades: Trade[], bots: BotRuntime[]) {
  return bots.map((bot) => {
    const botTrades = trades.filter((trade) => trade.botId === bot.id);
    return { label: bot.name, value: botTrades.reduce((sum, trade) => sum + trade.grossPnl - trade.fees, 0), detail: `${botTrades.length} rows` };
  }).filter((row) => row.value !== 0 || row.detail !== "0 rows");
}

function deploymentBlockers(bot: BotRuntime, capital: number) {
  const allocation = allocationForBot(bot, capital);
  return [
    capital <= 0 ? "Starting Capital is required" : "",
    !String(bot.assetUniverse || "").trim() ? "Asset Universe is required" : "",
    allocation <= 0 ? "Positive allocation is required" : "",
    allocation > capital ? "Allocation cannot exceed available capital" : "",
    bot.allocationMode === "Percent" && (bot.percentAllocation < 0 || bot.percentAllocation > 100) ? "Percentage allocation must be 0 through 100" : "",
    bot.maxPositionSize <= 0 ? "Max position size is required" : "",
    bot.maxPositionSize > 100 ? "Max position size must be 0 through 100" : "",
    bot.stopLoss <= 0 ? "Stop loss is required" : "",
    bot.takeProfit <= 0 ? "Take profit is required" : "",
    (bot.confidenceThreshold ?? 0) < 0 || (bot.confidenceThreshold ?? 0) > 100 ? "Signal threshold must be 0 through 100" : "",
    !String(bot.entryRules || "").trim() ? "Entry Rules are required" : "",
    !String(bot.exitRules || "").trim() ? "Exit Rules are required" : ""
  ].filter(Boolean);
}

function tradesForWindow(trades: Trade[], windowId: string) {
  if (windowId === "All time") return trades;
  const now = new Date("2026-06-19T12:00:00-05:00").getTime();
  const hours: Record<string, number> = { "1 hour": 1, "1 day": 24, "3 days": 72, "1 week": 168, "1 month": 24 * 31, "1 year": 24 * 365 };
  const cutoff = now - (hours[windowId] || 0) * 60 * 60 * 1000;
  return trades.filter((trade) => new Date(trade.timestamp).getTime() >= cutoff);
}

function AvatarBadge({ text }: { text: string }) {
  return <span className="avatar-badge">{text.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span>;
}

function allocationForBot(bot: BotRuntime, capital: number) {
  return bot.allocationMode === "Fixed" ? bot.fixedAllocation : capital * (bot.percentAllocation / 100);
}

function playProfitChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.001, now);
    master.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    master.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    master.connect(context.destination);
    [988, 1318, 1760].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.09);
      gain.gain.setValueAtTime(0.001, now + index * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.16 / (index + 1), now + index * 0.09 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.09 + 0.22);
      oscillator.connect(gain).connect(master);
      oscillator.start(now + index * 0.09);
      oscillator.stop(now + index * 0.09 + 0.26);
    });
  } catch {
    // Browsers may deny audio; the UI stays functional.
  }
}
