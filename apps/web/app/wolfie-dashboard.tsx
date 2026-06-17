"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import type { DashboardData } from "./dashboard-data";

type Section = "Overview" | "Trading Bots" | "Signal Intelligence" | "Activity" | "Settings";
type TradingMode = "Simulated" | "Live";
type AllocationMode = "Fixed" | "Relative";
type BotRisk = "conservative" | "balanced" | "aggressive" | "politician";
type Toast = { id: number; symbol: string; amount: number; botName: string };

type Bot = {
  id: string;
  name: string;
  group: "Conservative" | "Stable / Balanced" | "Aggressive" | "Politicians";
  risk: BotRisk;
  active: boolean;
  paused: boolean;
  approvalRequired: boolean;
  allocationAmount: number;
  allocationPercent: number;
  allocationMode: AllocationMode;
  maxPositionSize: number;
  maxTradesPerDay: number;
  minimumConfidence: number;
  dailyLossGuardrail: number;
  summary: string;
  explanation: string;
};

type Position = {
  symbol: string;
  company: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  botName: string;
  status: "Open" | "Closed";
};

type Activity = {
  id: number;
  time: string;
  botName: string;
  action: string;
  symbol: string;
  company: string;
  quantity: number;
  amount: number;
  pnl?: number;
  status: "Filled" | "Closed" | "Open" | "Pending" | "Rejected";
  reason?: string;
};

type SigSubject = {
  id: string;
  headline: string;
  symbol: string;
  company: string;
  score: number;
  kind: string;
  sourceUrl: string;
  explanation: string;
  pulse: "green" | "blue" | "amber" | "red";
};

const professionalMetricGrid = "grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]";
const navItems: Section[] = ["Overview", "Trading Bots", "Signal Intelligence", "Activity", "Settings"];
const storageCapitalKey = "wolfie.tradingCapital";
const storageModeKey = "wolfie.tradingMode";
const tickerCategories = ["Positions", "P/L", "Bot Activity", "Recent Trades", "Signal Intelligence", "Portfolio Status", "Closed Position Results"] as const;

const defaultBots: Bot[] = [
  {
    id: "conservative",
    name: "Wolfie Shield",
    group: "Conservative",
    risk: "conservative",
    active: true,
    paused: false,
    approvalRequired: true,
    allocationAmount: 2500,
    allocationPercent: 25,
    allocationMode: "Relative",
    maxPositionSize: 1200,
    maxTradesPerDay: 3,
    minimumConfidence: 76,
    dailyLossGuardrail: 500,
    summary: "Cautious setups, cleaner confirmation, fewer hype spikes.",
    explanation: "Wolfie Shield waits for cleaner evidence, avoids sudden attention spikes, and sizes trades conservatively."
  },
  {
    id: "balanced",
    name: "Wolfie Compass",
    group: "Stable / Balanced",
    risk: "balanced",
    active: true,
    paused: false,
    approvalRequired: true,
    allocationAmount: 3500,
    allocationPercent: 35,
    allocationMode: "Relative",
    maxPositionSize: 1800,
    maxTradesPerDay: 5,
    minimumConfidence: 70,
    dailyLossGuardrail: 900,
    summary: "Balanced scanning across momentum, news, and risk.",
    explanation: "Wolfie Compass looks for opportunities where price movement, attention, and risk line up. It waits when signals are messy."
  },
  {
    id: "aggressive",
    name: "Wolfie Surge",
    group: "Aggressive",
    risk: "aggressive",
    active: true,
    paused: false,
    approvalRequired: false,
    allocationAmount: 4000,
    allocationPercent: 40,
    allocationMode: "Relative",
    maxPositionSize: 2500,
    maxTradesPerDay: 8,
    minimumConfidence: 64,
    dailyLossGuardrail: 1200,
    summary: "Faster momentum opportunities with clear guardrails.",
    explanation: "Wolfie Surge reacts to stronger momentum and unusual attention, but still blocks trades outside risk rules."
  }
];

const libraryBots: Bot[] = [
  {
    id: "public-disclosure-tracker",
    name: "Public Disclosure Tracker",
    group: "Politicians",
    risk: "politician",
    active: false,
    paused: true,
    approvalRequired: true,
    allocationAmount: 0,
    allocationPercent: 0,
    allocationMode: "Relative",
    maxPositionSize: 1000,
    maxTradesPerDay: 2,
    minimumConfidence: 80,
    dailyLossGuardrail: 350,
    summary: "Watches public trade disclosures grouped by politician.",
    explanation: "This bot follows publicly disclosed trades after they appear in public data. It does not use private or illegal information. Waiting for fresh public disclosure data."
  }
];

const sigSubjects: SigSubject[] = [
  {
    id: "nvda-resistance-volume",
    headline: "NVDA volume cluster tests resistance with elevated options attention.",
    symbol: "NVDA",
    company: "NVIDIA Corporation",
    score: 78,
    kind: "Momentum",
    sourceUrl: "https://www.sec.gov/edgar/search/",
    explanation: "Wolfie sees price, volume, and volatility aligning around a resistance area. This is a review candidate, not an instruction.",
    pulse: "green"
  },
  {
    id: "volume-breakout",
    headline: "Volume anomaly forms around NVDA resistance test.",
    symbol: "NVDA",
    company: "NVIDIA Corporation",
    score: 74,
    kind: "Momentum",
    sourceUrl: "https://www.nasdaq.com/market-activity/stocks/nvda",
    explanation: "Price, volume, and volatility are moving together. Wolfie marks this as a review candidate, not an instruction.",
    pulse: "blue"
  },
  {
    id: "earnings-heat",
    headline: "Earnings chatter lifts volatility expectations in TSLA.",
    symbol: "TSLA",
    company: "Tesla, Inc.",
    score: 63,
    kind: "Event",
    sourceUrl: "https://www.nasdaq.com/market-activity/stocks/tsla/earnings",
    explanation: "Event attention is rising. Wolfie waits for risk confirmation before any bot can act.",
    pulse: "amber"
  }
];

const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

function assetPath(name: string) {
  return `${assetBasePath}/${name}`.replace(/\/+/g, "/");
}

export default function WolfieDashboard({ initialData, initialSection = "Overview" }: { initialData: DashboardData; apiBaseUrl: string; initialSection?: Section }) {
  return <WolfieApp initialData={initialData} initialSection={initialSection} />;
}

function WolfieApp({ initialData, initialSection }: { initialData: DashboardData; initialSection: Section }) {
  const initialCapital = numberOr(initialData.account.equity, 0);
  const [activeSection, setActiveSection] = useState<Section>(initialSection);
  const [tradingMode, setTradingMode] = useState<TradingMode>("Simulated");
  const [liveModeMessage, setLiveModeMessage] = useState("");
  const [capitalAmount, setCapitalAmount] = useState(initialCapital);
  const [onboarded, setOnboarded] = useState(false);
  const [cash, setCash] = useState(initialCapital || 10000);
  const [positions, setPositions] = useState<Position[]>(initialPositions(initialData));
  const [activity, setActivity] = useState<Activity[]>(initialActivity());
  const [bots, setBots] = useState<Bot[]>(defaultBots);
  const [selectedBotId, setSelectedBotId] = useState(defaultBots[1].id);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [sigIntPreview, setSigIntPreview] = useState<SigSubject | null>(null);
  const [tickerEditorOpen, setTickerEditorOpen] = useState(false);
  const [enabledTickerCategories, setEnabledTickerCategories] = useState<Record<string, boolean>>(() => Object.fromEntries(tickerCategories.map((item) => [item, true])));
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const storedCapital = window.localStorage.getItem(storageCapitalKey);
    const storedMode = window.localStorage.getItem(storageModeKey) as TradingMode | null;
    if (storedMode === "Simulated" || storedMode === "Live") setTradingMode(storedMode);
    if (storedCapital) {
      const parsed = parseCapitalInput(storedCapital);
      if (parsed && parsed > 0) {
        setCapitalAmount(parsed);
        setCash(parsed);
        setOnboarded(true);
      }
    } else if (initialCapital > 0) {
      setCapitalAmount(initialCapital);
      setCash(initialCapital);
    }
  }, [initialCapital]);

  useEffect(() => {
    window.localStorage.setItem(storageModeKey, tradingMode);
  }, [tradingMode]);

  const selectedBot = bots.find((bot) => bot.id === selectedBotId) || bots[0];
  const equity = cash + positions.reduce((sum, position) => sum + position.quantity * position.currentPrice, 0);
  const realizedPnl = activity.reduce((sum, item) => sum + (item.pnl || 0), 0);
  const unrealizedPnl = positions.reduce((sum, position) => sum + (position.currentPrice - position.entryPrice) * position.quantity, 0);

  function completeOnboarding(amount: number) {
    setCapitalAmount(amount);
    setCash(amount);
    setOnboarded(true);
    window.localStorage.setItem(storageCapitalKey, String(amount));
  }

  function updateSelectedBot(patch: Partial<Bot>) {
    setBots((current) => current.map((bot) => bot.id === selectedBot.id ? { ...bot, ...patch } : bot));
  }

  function activateLibraryBot(bot: Bot) {
    if (bots.some((item) => item.id === bot.id)) return;
    const activated = { ...bot, active: true, paused: false, allocationAmount: Math.min(1000, cash), allocationPercent: cash > 0 ? Math.min(100, 1000 / cash * 100) : 0 };
    setBots((current) => [...current, activated]);
    setSelectedBotId(activated.id);
  }

  function executeBotTrade(bot = selectedBot, subject = sigSubjects[0]) {
    if (!bot.active || bot.paused) {
      addActivity(bot, subject, "Trade rejected", 0, 0, "Rejected", "Bot is paused");
      return;
    }
    if (subject.score < bot.minimumConfidence) {
      addActivity(bot, subject, "Trade rejected", 0, 0, "Rejected", "Confidence below bot threshold");
      return;
    }
    const tradeAmount = Math.min(bot.maxPositionSize, bot.allocationAmount || cash * 0.1);
    if (cash < tradeAmount || tradeAmount <= 0) {
      addActivity(bot, subject, "Trade rejected", 0, 0, "Rejected", "Available capital is insufficient");
      return;
    }
    const price = subject.symbol === "NVDA" ? 195.2 : subject.symbol === "TSLA" ? 175.43 : 182.35;
    const quantity = Math.max(1, Math.floor(tradeAmount / price));
    const amount = quantity * price;
    setCash((value) => value - amount);
    setPositions((current) => {
      const existing = current.find((position) => position.symbol === subject.symbol);
      if (!existing) {
        return [...current, { symbol: subject.symbol, company: subject.company, quantity, entryPrice: price, currentPrice: price * 1.013, botName: bot.name, status: "Open" }];
      }
      return current.map((position) => position.symbol === subject.symbol ? { ...position, quantity: position.quantity + quantity, currentPrice: price * 1.013 } : position);
    });
    addActivity(bot, subject, "Position opened", quantity, amount, "Filled", "Rules passed");
    setActiveSection("Activity");
  }

  function closePosition(position: Position) {
    const pnl = (position.currentPrice - position.entryPrice) * position.quantity;
    const closeAmount = position.currentPrice * position.quantity;
    setCash((value) => value + closeAmount);
    setPositions((current) => current.filter((item) => item.symbol !== position.symbol));
    const bot = bots.find((item) => item.name === position.botName) || selectedBot;
    const subject = sigSubjects.find((item) => item.symbol === position.symbol) || sigSubjects[0];
    addActivity(bot, subject, "Position closed", position.quantity, closeAmount, "Closed", pnl >= 0 ? "Realized profit" : "Realized loss", pnl);
    setToast({ id: Date.now(), symbol: position.symbol, amount: pnl, botName: position.botName });
    if (pnl > 0) playProfitChime();
  }

  function addActivity(bot: Bot, subject: SigSubject, action: string, quantity: number, amount: number, status: Activity["status"], reason?: string, pnl?: number) {
    setActivity((current) => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      botName: bot.name,
      action,
      symbol: subject.symbol,
      company: subject.company,
      quantity,
      amount,
      pnl,
      status,
      reason
    }, ...current].slice(0, 18));
  }

  if (!onboarded) {
    return <OnboardingCapitalStep defaultValue={capitalAmount || 10000} onContinue={completeOnboarding} />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_24%_-8%,rgba(96,165,250,0.18),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(124,58,237,0.14),transparent_32%),linear-gradient(180deg,#02050B_0%,#07101D_48%,#050913_100%)] pb-16 text-[#F8FAFC]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <LeftNav activeSection={activeSection} setActiveSection={setActiveSection} tradingMode={tradingMode} setTradingMode={setTradingMode} liveModeMessage={liveModeMessage} setLiveModeMessage={setLiveModeMessage} />
        <section className="min-w-0">
          <Header activeSection={activeSection} setActiveSection={setActiveSection} selectedBot={selectedBot} />
          <div className="mx-auto max-w-[1600px] px-5 py-5">
            {activeSection === "Overview" && (
              <OverviewPage
                cash={cash}
                equity={equity}
                realizedPnl={realizedPnl}
                unrealizedPnl={unrealizedPnl}
                positions={positions}
                activity={activity}
                bots={bots}
                expandedCard={expandedCard}
                setExpandedCard={setExpandedCard}
                setActiveSection={setActiveSection}
                setSigIntPreview={setSigIntPreview}
                executeBotTrade={executeBotTrade}
                closePosition={closePosition}
              />
            )}
            {activeSection === "Trading Bots" && (
              <TradingBotsPage
                cash={cash}
                bots={bots}
                selectedBot={selectedBot}
                setSelectedBotId={setSelectedBotId}
                updateSelectedBot={updateSelectedBot}
                activateLibraryBot={activateLibraryBot}
                executeBotTrade={executeBotTrade}
              />
            )}
            {activeSection === "Signal Intelligence" && <SignalIntelligencePage setSigIntPreview={setSigIntPreview} executeBotTrade={() => executeBotTrade(selectedBot, sigSubjects[0])} />}
            {activeSection === "Activity" && <ActivityPage activity={activity} positions={positions} closePosition={closePosition} />}
            {activeSection === "Settings" && <SettingsPage capitalAmount={capitalAmount} onCapitalChange={completeOnboarding} tradingMode={tradingMode} setTradingMode={setTradingMode} liveModeMessage={liveModeMessage} setLiveModeMessage={setLiveModeMessage} />}
          </div>
        </section>
      </div>
      <EditableScrollingTicker
        cash={cash}
        equity={equity}
        positions={positions}
        activity={activity}
        enabled={enabledTickerCategories}
        setEnabled={setEnabledTickerCategories}
        tickerEditorOpen={tickerEditorOpen}
        setTickerEditorOpen={setTickerEditorOpen}
      />
      {expandedCard && <ExpandedCardDialog cardId={expandedCard} close={() => setExpandedCard(null)} cash={cash} equity={equity} positions={positions} activity={activity} />}
      {sigIntPreview && <SigINTPreviewPanel subject={sigIntPreview} onClose={() => setSigIntPreview(null)} onRun={() => executeBotTrade(selectedBot, sigIntPreview)} />}
      {toast && <ProfitLossToast toast={toast} onClose={() => setToast(null)} />}
    </main>
  );
}

function OnboardingCapitalStep({ defaultValue, onContinue }: { defaultValue: number; onContinue: (amount: number) => void }) {
  const [raw, setRaw] = useState(defaultValue ? money(defaultValue) : "");
  const parsed = parseCapitalInput(raw);
  const valid = Boolean(parsed && parsed > 0);
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.22),transparent_36%),linear-gradient(180deg,#030712,#07101D)] px-5 text-white">
      <section className="w-full max-w-xl rounded-2xl border border-white/[0.1] bg-[#0F172A]/85 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <WolfieMark large />
        <h1 className="mt-8 text-3xl font-black tracking-tight">How much do you want Wolfie to trade with?</h1>
        <p className="mt-3 text-[#CBD5E1]">This sets your starting trading capital. Wolfie uses it to size positions, track buying power, and calculate P/L.</p>
        <label className="mt-7 grid gap-2">
          <span className="text-sm text-[#94A3B8]">Starting trading capital</span>
          <input value={raw} onChange={(event) => setRaw(event.target.value)} placeholder="$10,000" className="rounded-xl border border-white/[0.12] bg-[#020617] px-4 py-4 font-mono text-2xl tabular-nums text-white outline-none focus:border-[#8B5CF6]" />
        </label>
        <button disabled={!valid} onClick={() => parsed && onContinue(parsed)} className="mt-6 w-full rounded-xl bg-[#7C3AED] px-5 py-4 font-bold text-white shadow-[0_20px_60px_rgba(124,58,237,0.28)] disabled:cursor-not-allowed disabled:bg-[#334155] disabled:text-[#94A3B8]">Continue</button>
      </section>
    </main>
  );
}

function LeftNav({ activeSection, setActiveSection, tradingMode, setTradingMode, liveModeMessage, setLiveModeMessage }: { activeSection: Section; setActiveSection: (section: Section) => void; tradingMode: TradingMode; setTradingMode: (mode: TradingMode) => void; liveModeMessage: string; setLiveModeMessage: (message: string) => void }) {
  function chooseTradingMode(mode: TradingMode) {
    if (mode === "Live") {
      setTradingMode("Simulated");
      setLiveModeMessage("Live trading setup is not connected yet.");
      return;
    }
    setTradingMode(mode);
    setLiveModeMessage("");
  }
  return (
    <aside className="border-r border-white/[0.08] bg-[#030712]/95 px-5 py-7">
      <WolfieMark />
      <nav className="mt-12 grid gap-2">
        {(["Overview", "Trading Bots", "Signal Intelligence", "Activity", "Settings"] as Section[]).map((item) => (
          <button key={item} onClick={() => setActiveSection(item)} className={`min-w-0 rounded-xl border px-4 py-4 text-left text-base transition hover:-translate-y-0.5 ${activeSection === item ? "border-[#8B5CF6]/45 bg-[#8B5CF6]/18 text-[#DDD6FE]" : "border-transparent text-[#CBD5E1] hover:bg-white/[0.04]"}`}>
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{item}</span>
          </button>
        ))}
      </nav>
      <div className="mt-12 border-t border-white/[0.08] pt-6">
        <div className="text-xs uppercase tracking-[0.18em] text-[#94A3B8]">Trading Mode</div>
        <div className="mt-3 grid grid-cols-2 rounded-xl border border-white/[0.1] bg-[#0F172A] p-1">
          {(["Simulated", "Live"] as TradingMode[]).map((mode) => (
            <button key={mode} data-testid={mode === "Simulated" ? "trading-mode-simulated" : "trading-mode-live"} onClick={() => chooseTradingMode(mode)} aria-pressed={tradingMode === mode} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${tradingMode === mode ? "bg-[#16A34A] text-white" : "text-[#94A3B8] hover:bg-white/[0.06]"}`}>{mode}</button>
          ))}
        </div>
        {liveModeMessage && <p className="mt-3 text-sm leading-relaxed text-[#FBBF24]">{liveModeMessage}</p>}
      </div>
    </aside>
  );
}

function Header({ activeSection, setActiveSection, selectedBot }: { activeSection: Section; setActiveSection: (section: Section) => void; selectedBot: Bot }) {
  return (
    <header className="border-b border-white/[0.08] bg-[#030712]/72 px-6 py-7 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h1 className="overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,4vw,3.6rem)] font-black tracking-tight">{activeSection === "Overview" ? "Welcome back, Wolfie is on the hunt." : activeSection}</h1>
          <p className="mt-2 max-w-3xl text-lg text-[#CBD5E1]">{activeSection === "Trading Bots" ? "Configure bots that scan opportunities, manage risk, and act on your selected capital rules." : "Live agent overview and opportunity intelligence."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl border border-white/[0.09] bg-[#0F172A] px-4 py-3 font-mono text-sm text-[#C4B5FD]">Active bot: {selectedBot.name}</span>
          <button onClick={() => setActiveSection("Settings")} className="rounded-xl border border-white/[0.12] bg-[#1E293B] px-5 py-3 font-bold hover:border-[#8B5CF6]">Settings +</button>
        </div>
      </div>
    </header>
  );
}

function OverviewPage(props: {
  cash: number;
  equity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  positions: Position[];
  activity: Activity[];
  bots: Bot[];
  expandedCard: string | null;
  setExpandedCard: (id: string) => void;
  setActiveSection: (section: Section) => void;
  setSigIntPreview: (subject: SigSubject) => void;
  executeBotTrade: () => void;
  closePosition: (position: Position) => void;
}) {
  const activeBots = props.bots.filter((bot) => bot.active && !bot.paused).length;
  return (
    <div className="grid gap-5">
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <Panel title="At A Glance">
          <div className={professionalMetricGrid}>
            <OverviewCard id="equity" label="Trading Balance" value={money(props.equity)} detail="Current equity" icon="▣" onOpen={props.setExpandedCard} />
            <OverviewCard id="cash" label="Available Capital" value={money(props.cash)} detail="Ready to deploy" icon="$" onOpen={props.setExpandedCard} />
            <OverviewCard id="allocated" label="Allocated to Bots" value={money(props.bots.reduce((sum, bot) => sum + bot.allocationAmount, 0))} detail="Across active bots" icon="▦" onOpen={props.setExpandedCard} />
            <OverviewCard id="realized" label="Realized P/L" value={signedMoney(props.realizedPnl)} detail="Closed positions" icon="↗" onOpen={props.setExpandedCard} />
            <OverviewCard id="unrealized" label="Unrealized P/L" value={signedMoney(props.unrealizedPnl)} detail="Open positions" icon="◇" onOpen={props.setExpandedCard} />
            <OverviewCard id="positions" label="Open Positions" value={String(props.positions.length)} detail="Click to inspect" icon="□" onOpen={props.setExpandedCard} />
            <OverviewCard id="bots" label="Active Bots" value={String(activeBots)} detail="Running" icon="◎" onOpen={props.setExpandedCard} />
            <OverviewCard id="approval" label="Approval Required" value={String(props.bots.filter((bot) => bot.approvalRequired).length)} detail="Bots asking first" icon="✓" onOpen={props.setExpandedCard} />
          </div>
        </Panel>
        <Panel title="Next Opportunity">
          <div className="grid gap-5">
            <button onClick={() => props.setSigIntPreview(sigSubjects[0])} className="rounded-xl border border-white/[0.08] bg-[#0F172A] p-5 text-left hover:border-[#38D996]/45">
              <div className="flex items-start justify-between gap-4">
                <CompanyLogo symbol="NVDA" />
                <div className="text-right">
                  <div className="text-sm text-[#CBD5E1]">Confidence</div>
                  <div className="font-mono text-5xl font-black text-[#38D996] tabular-nums">78<span className="text-lg text-[#CBD5E1]"> /100</span></div>
                </div>
              </div>
              <h3 className="mt-5 text-4xl font-black">NVDA <span className="rounded-full bg-[#16A34A]/20 px-3 py-1 text-sm text-[#86EFAC]">LONG</span></h3>
              <p className="mt-4 text-[#CBD5E1]">Bullish breakout above resistance with strong volume. Review the intelligence, source, and risk notes before acting.</p>
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => props.setSigIntPreview(sigSubjects[0])} className="rounded-xl bg-[#7C3AED] px-5 py-3 font-bold">Review Opportunity</button>
              <button onClick={props.executeBotTrade} className="rounded-xl border border-white/[0.12] px-5 py-3 font-bold">Run Selected Bot</button>
            </div>
          </div>
        </Panel>
      </section>
      <section className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <Panel title="Signal Intelligence">
          <SignalIntelligenceGraph setSigIntPreview={props.setSigIntPreview} />
          <SigINTScroller setSigIntPreview={props.setSigIntPreview} />
        </Panel>
        <BotThoughtPanel bots={props.bots} />
      </section>
      <section className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <Panel title="Recent Activity" action={<button onClick={() => props.setActiveSection("Activity")} className="text-sm text-[#93C5FD]">View all activity</button>}>
          <ActivityList activity={props.activity.slice(0, 5)} />
        </Panel>
      </section>
      <Panel title="Open Positions" action={<button onClick={() => props.setExpandedCard("positions")} className="text-sm text-[#93C5FD]">View All Positions</button>}>
        <div className="grid gap-4 lg:grid-cols-3">
          {props.positions.map((position) => <PositionCard key={position.symbol} position={position} onClose={() => props.closePosition(position)} />)}
          {!props.positions.length && <EmptyState title="No open positions" body="Run a bot from an opportunity or Trading Bots to open a position." />}
        </div>
      </Panel>
    </div>
  );
}

function OverviewCard({ id, label, value, detail, icon, onOpen }: { id: string; label: string; value: string; detail: string; icon: string; onOpen: (id: string) => void }) {
  const cardTestIds: Record<string, string> = {
    equity: "overview-card-trading-balance",
    cash: "overview-card-available-capital",
    realized: "overview-card-realized-pnl",
    positions: "overview-card-open-positions"
  };
  return (
    <button data-testid={cardTestIds[id]} onClick={() => onOpen(id)} onKeyDown={(event) => event.key === "Escape" && event.currentTarget.blur()} className="min-w-0 rounded-xl border border-white/[0.09] bg-[linear-gradient(145deg,rgba(30,41,59,0.76),rgba(15,23,42,0.94))] p-5 text-left shadow-[0_20px_70px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:border-[#8B5CF6]/45 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]">
      <div className="flex min-w-0 items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-2xl text-[#A78BFA]">{icon}</span>
        <div className="min-w-0">
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold text-[#CBD5E1]" title={label}>{label}</div>
          <div className="mt-2 overflow-hidden text-ellipsis font-mono text-[clamp(1.35rem,2vw,2rem)] font-black leading-tight tabular-nums whitespace-nowrap text-white" title={value}>{value}</div>
          <div className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[#94A3B8]" title={detail}>{detail}</div>
        </div>
      </div>
    </button>
  );
}

function ExpandedCardDialog({ cardId, close, cash, equity, positions, activity }: { cardId: string; close: () => void; cash: number; equity: number; positions: Position[]; activity: Activity[] }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  const cardDetails: Record<string, { title: string; body: string; metrics: Array<{ label: string; value: string; tone?: "good" | "bad" }> }> = {
    equity: { title: "Trading Balance", body: "Total account value based on available capital plus the current value of open positions.", metrics: [{ label: "Equity", value: money(equity) }, { label: "Available capital", value: money(cash) }] },
    cash: { title: "Available Capital", body: "Capital not currently deployed into open positions or reserved by bot allocation rules.", metrics: [{ label: "Available capital", value: money(cash) }, { label: "Open positions", value: String(positions.length) }] },
    allocated: { title: "Allocated to Bots", body: "Capital assigned to active bots. A bot still needs its own rules and approval state before it can act.", metrics: [{ label: "Recent actions", value: String(activity.length) }, { label: "Open positions", value: String(positions.length) }] },
    realized: { title: "Realized Profit / Loss", body: "Closed-position performance from activity currently held in the app session.", metrics: [{ label: "Realized P/L", value: signedMoney(activity.reduce((sum, item) => sum + (item.pnl || 0), 0)), tone: activity.reduce((sum, item) => sum + (item.pnl || 0), 0) >= 0 ? "good" : "bad" }, { label: "Closed actions", value: String(activity.filter((item) => item.status === "Closed").length) }] },
    unrealized: { title: "Unrealized Profit / Loss", body: "Open-position mark-to-market movement from current app state.", metrics: [{ label: "Open positions", value: String(positions.length) }, { label: "Current exposure", value: money(positions.reduce((sum, position) => sum + position.currentPrice * position.quantity, 0)) }] },
    positions: { title: "Open Positions", body: "Positions currently tracked by Wolfie. Each card can be closed from the Activity or Open Positions sections.", metrics: [{ label: "Open positions", value: String(positions.length) }, { label: "Current exposure", value: money(positions.reduce((sum, position) => sum + position.currentPrice * position.quantity, 0)) }] },
    bots: { title: "Active Bots", body: "Bots currently enabled and not paused. Their risk controls remain editable in Trading Bots.", metrics: [{ label: "Recent actions", value: String(activity.length) }, { label: "Open positions", value: String(positions.length) }] },
    approval: { title: "Approval Required", body: "Bots in this group must request confirmation before opening a position.", metrics: [{ label: "Recent actions", value: String(activity.length) }, { label: "Available capital", value: money(cash) }] }
  };
  const details = cardDetails[cardId] || cardDetails.equity;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5 backdrop-blur">
      <section className="w-full max-w-2xl rounded-2xl border border-white/[0.12] bg-[#0F172A] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">{details.title}</h2>
            <p className="mt-2 text-[#CBD5E1]">{details.body}</p>
          </div>
          <button onClick={close} className="rounded-lg border border-white/[0.12] px-3 py-2">Close</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {details.metrics.map((metric) => <Fact key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />)}
        </div>
      </section>
    </div>
  );
}

function TradingBotsPage({ cash, bots, selectedBot, setSelectedBotId, updateSelectedBot, activateLibraryBot, executeBotTrade }: { cash: number; bots: Bot[]; selectedBot: Bot; setSelectedBotId: (id: string) => void; updateSelectedBot: (patch: Partial<Bot>) => void; activateLibraryBot: (bot: Bot) => void; executeBotTrade: (bot?: Bot, subject?: SigSubject) => void }) {
  const [additionalOpen, setAdditionalOpen] = useState(false);
  function setAllocationAmount(amount: number) {
    const clean = Math.max(0, amount);
    updateSelectedBot({ allocationAmount: clean, allocationPercent: cash > 0 ? Math.min(100, clean / cash * 100) : 0 });
  }
  function setAllocationPercent(percent: number) {
    const clean = Math.min(100, Math.max(0, percent));
    updateSelectedBot({ allocationPercent: clean, allocationAmount: cash * clean / 100 });
  }
  return (
    <div className="grid gap-5">
      <Panel title="Active Trading Bots">
        <div className="grid gap-4 md:grid-cols-3">
          {bots.map((bot) => <BotCard key={bot.id} bot={bot} selected={bot.id === selectedBot.id} onClick={() => setSelectedBotId(bot.id)} />)}
        </div>
      </Panel>
      <Panel title={selectedBot.name}>
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div>
            <BotAvatar risk={selectedBot.risk} name={selectedBot.name} active={!selectedBot.paused} />
            <p className="mt-5 text-lg text-[#CBD5E1]">{selectedBot.explanation}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Pill>{selectedBot.group}</Pill>
              <Pill>{selectedBot.approvalRequired ? "Require Approval" : "Autopilot"}</Pill>
              <Pill>{selectedBot.paused ? "Paused" : "Active"}</Pill>
            </div>
          </div>
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span>Bot trading amount <InfoTooltip>Capital allocation: How much buying power this bot is allowed to use.</InfoTooltip></span>
              <input type="number" value={Math.round(selectedBot.allocationAmount)} onChange={(event) => setAllocationAmount(Number(event.target.value))} className="wolf-input" />
            </label>
            <label className="grid gap-2">
              <span>Available capital percentage</span>
              <input type="range" min={0} max={100} value={selectedBot.allocationPercent} onChange={(event) => setAllocationPercent(Number(event.target.value))} />
              <strong className="font-mono tabular-nums">{selectedBot.allocationPercent.toFixed(1)}%</strong>
            </label>
            <fieldset className="grid gap-2">
              <legend>Allocation mode <InfoTooltip>Allocation mode: Fixed keeps this bot at a set dollar amount. Relative keeps it at a percentage of available capital.</InfoTooltip></legend>
              <div className="flex gap-3">
                {(["Fixed", "Relative"] as AllocationMode[]).map((mode) => <label key={mode} className="rounded-lg border border-white/[0.12] px-3 py-2"><input type="radio" checked={selectedBot.allocationMode === mode} onChange={() => updateSelectedBot({ allocationMode: mode })} /> {mode}</label>)}
              </div>
            </fieldset>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => updateSelectedBot({ approvalRequired: !selectedBot.approvalRequired })} className="wolf-secondary">{selectedBot.approvalRequired ? "Require Approval" : "Autopilot"}</button>
              <button onClick={() => updateSelectedBot({ paused: !selectedBot.paused })} className="wolf-secondary">{selectedBot.paused ? "Resume Bot" : "Pause Bot"}</button>
              <button onClick={() => executeBotTrade(selectedBot, sigSubjects[0])} className="wolf-primary">{selectedBot.active ? "Update Bot" : "Activate Bot"}</button>
            </div>
          </div>
        </div>
        <button onClick={() => setAdditionalOpen((value) => !value)} aria-expanded={additionalOpen} className="mt-6 wolf-secondary">Additional Settings</button>
        {additionalOpen && (
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <SettingInput label="Max position size" value={selectedBot.maxPositionSize} onChange={(value) => updateSelectedBot({ maxPositionSize: value })}>Max position size: The most this bot can put into a single trade.</SettingInput>
            <SettingInput label="Max trades per day" value={selectedBot.maxTradesPerDay} onChange={(value) => updateSelectedBot({ maxTradesPerDay: value })}>Max trades per day: The maximum number of trades this bot may open in one day.</SettingInput>
            <SettingInput label="Minimum confidence" value={selectedBot.minimumConfidence} onChange={(value) => updateSelectedBot({ minimumConfidence: value })}>Minimum confidence: The signal strength required before this bot can act.</SettingInput>
            <SettingInput label="Daily loss guardrail" value={selectedBot.dailyLossGuardrail} onChange={(value) => updateSelectedBot({ dailyLossGuardrail: value })}>Daily loss guardrail: The loss limit that pauses this bot for the day.</SettingInput>
          </div>
        )}
      </Panel>
      <Panel title="Bot Library">
        <h3 className="mb-3 text-lg font-bold">Politicians</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {libraryBots.filter((bot) => !bots.some((active) => active.id === bot.id)).map((bot) => (
            <BotCard key={bot.id} bot={bot} selected={false} onClick={() => activateLibraryBot(bot)} action="Activate" />
          ))}
          {!libraryBots.filter((bot) => !bots.some((active) => active.id === bot.id)).length && <EmptyState title="All library bots active" body="New bot styles will appear here as source-backed models are added." />}
        </div>
      </Panel>
    </div>
  );
}

function SignalIntelligencePage({ setSigIntPreview, executeBotTrade }: { setSigIntPreview: (subject: SigSubject) => void; executeBotTrade: () => void }) {
  return (
    <div className="grid gap-5">
      <Panel title="Signal Intelligence Graph"><SignalIntelligenceGraph setSigIntPreview={setSigIntPreview} /></Panel>
      <Panel title="SigINT Rail"><SigINTScroller setSigIntPreview={setSigIntPreview} /><button onClick={executeBotTrade} className="mt-5 wolf-primary">Run selected bot against top subject</button></Panel>
    </div>
  );
}

function ActivityPage({ activity, positions, closePosition }: { activity: Activity[]; positions: Position[]; closePosition: (position: Position) => void }) {
  return (
    <div className="grid gap-5">
      <Panel title="Open Positions"><div className="grid gap-4 md:grid-cols-3">{positions.map((position) => <PositionCard key={position.symbol} position={position} onClose={() => closePosition(position)} />)}</div></Panel>
      <Panel title="Trade Activity"><ActivityList activity={activity} /></Panel>
    </div>
  );
}

function SettingsPage({ capitalAmount, onCapitalChange, tradingMode, setTradingMode, liveModeMessage, setLiveModeMessage }: { capitalAmount: number; onCapitalChange: (value: number) => void; tradingMode: TradingMode; setTradingMode: (mode: TradingMode) => void; liveModeMessage: string; setLiveModeMessage: (message: string) => void }) {
  const [raw, setRaw] = useState(money(capitalAmount));
  const parsed = parseCapitalInput(raw);
  function chooseMode(mode: TradingMode) {
    if (mode === "Live") {
      setTradingMode("Simulated");
      setLiveModeMessage("Live trading setup is not connected yet.");
      return;
    }
    setTradingMode(mode);
    setLiveModeMessage("");
  }
  return (
    <Panel title="Settings">
      <div className="grid max-w-xl gap-5">
        <label className="grid gap-2">
          <span>Trading capital</span>
          <input value={raw} onChange={(event) => setRaw(event.target.value)} className="wolf-input" />
        </label>
        <button disabled={!parsed} onClick={() => parsed && onCapitalChange(parsed)} className="wolf-primary disabled:opacity-50">Update capital</button>
        <div>
          <div className="mb-2 text-sm uppercase tracking-[0.18em] text-[#94A3B8]">Trading Mode</div>
          <div className="flex gap-2">
            <button data-testid="trading-mode-simulated" onClick={() => chooseMode("Simulated")} className={tradingMode === "Simulated" ? "wolf-primary" : "wolf-secondary"}>Simulated</button>
            <button data-testid="trading-mode-live" onClick={() => chooseMode("Live")} className="wolf-secondary">Live</button>
          </div>
          {liveModeMessage && <p className="mt-3 text-sm text-[#FBBF24]">{liveModeMessage}</p>}
        </div>
      </div>
    </Panel>
  );
}

function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.09] bg-[linear-gradient(145deg,rgba(15,23,42,0.9),rgba(2,6,23,0.96))] shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
      <header className="flex min-w-0 items-center justify-between gap-4 border-b border-white/[0.08] px-6 py-5">
        <h2 className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-black uppercase tracking-[0.18em] text-[#E2E8F0]">{title}</h2>
        {action}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

function SignalIntelligenceGraph({ setSigIntPreview }: { setSigIntPreview: (subject: SigSubject) => void }) {
  const nodes = [
    { label: "NVDA", x: "left-[44%] top-[38%]", color: "bg-[#38D996]" },
    { label: "Volume", x: "left-[20%] top-[24%]", color: "bg-[#60A5FA]" },
    { label: "Risk", x: "left-[68%] top-[20%]", color: "bg-[#F97316]" },
    { label: "Macro", x: "left-[64%] top-[62%]", color: "bg-[#A78BFA]" },
    { label: "News", x: "left-[28%] top-[66%]", color: "bg-[#FBBF24]" }
  ];
  return (
    <div className="relative h-72 overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(circle_at_50%_40%,rgba(56,217,150,0.14),transparent_32%),#020617]">
      <div className="absolute inset-8 rounded-full border border-white/[0.06]" />
      <div className="absolute inset-16 rounded-full border border-white/[0.05]" />
      {nodes.map((node, index) => (
        <button key={node.label} onClick={() => setSigIntPreview(sigSubjects[index % sigSubjects.length])} className={`absolute ${node.x} grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ${node.color} text-xs font-black text-[#020617] shadow-[0_0_40px_rgba(255,255,255,0.18)] transition hover:scale-110`}>
          {node.label}
        </button>
      ))}
    </div>
  );
}

function SigINTScroller({ setSigIntPreview }: { setSigIntPreview: (subject: SigSubject) => void }) {
  return (
    <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
      {sigSubjects.map((subject) => (
        <button key={subject.id} onClick={() => setSigIntPreview(subject)} className="min-w-[300px] rounded-xl border border-white/[0.08] bg-[#0F172A] p-4 text-left hover:border-[#38D996]/45">
          <div className="flex items-center gap-3"><CompanyLogo symbol={subject.symbol} /><span className="font-mono">{subject.symbol}</span><Pill>{subject.kind}</Pill></div>
          <p className="mt-3 line-clamp-3 text-[#CBD5E1]">{subject.headline}</p>
        </button>
      ))}
    </div>
  );
}

function BotThoughtPanel({ bots }: { bots: Bot[] }) {
  const [selectedThoughtBotId, setSelectedThoughtBotId] = useState(bots[0]?.id || "balanced");
  const selected = bots.find((bot) => bot.id === selectedThoughtBotId) || bots[0];
  const thoughtNodes = [
    { label: "Capital fit", detail: selected ? money(selected.allocationAmount) : "UNKNOWN", tone: "text-[#38D996]" },
    { label: "Risk check", detail: selected?.approvalRequired ? "Approval required" : "Autopilot rules", tone: "text-[#A78BFA]" },
    { label: "Signal focus", detail: sigSubjects[0].symbol, tone: "text-[#60A5FA]" },
    { label: "Current action", detail: selected?.paused ? "Waiting" : "Scanning", tone: "text-[#FBBF24]" }
  ];
  return (
    <Panel title="Bot Thought">
      <div data-testid="bot-thought-map" className="grid gap-5">
        <div className="flex flex-wrap gap-2">
          {bots.map((bot) => (
            <button key={bot.id} onClick={() => setSelectedThoughtBotId(bot.id)} className={`rounded-full border px-3 py-2 text-sm font-bold transition ${selectedThoughtBotId === bot.id ? "border-[#A78BFA] bg-[#7C3AED]/24 text-white" : "border-white/[0.1] text-[#CBD5E1] hover:bg-white/[0.05]"}`}>{bot.name}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {thoughtNodes.map((node) => (
            <div key={node.label} className="rounded-xl border border-white/[0.08] bg-[#0B1220] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="text-xs uppercase tracking-[0.16em] text-[#94A3B8]">{node.label}</div>
              <div className={`mt-2 break-words font-mono text-lg font-black ${node.tone}`}>{node.detail}</div>
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-[#CBD5E1]">{selected?.name || "Wolfie"} is comparing signal strength, capital limits, approval rules, and open exposure before proposing the next action.</p>
      </div>
    </Panel>
  );
}

function SigINTPreviewPanel({ subject, onClose, onRun }: { subject: SigSubject; onClose: () => void; onRun: () => void }) {
  return (
    <aside className="fixed bottom-16 right-5 top-5 z-50 w-full max-w-[420px] rounded-2xl border border-white/[0.12] bg-[#0F172A]/96 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <CompanyLogo symbol={subject.symbol} />
        <button onClick={onClose} className="rounded-lg border border-white/[0.12] px-3 py-2">Close</button>
      </div>
      <h2 className="mt-6 text-2xl font-black">{subject.headline}</h2>
      <p className="mt-4 text-[#CBD5E1]">{subject.explanation}</p>
      <a href={subject.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 block text-[#93C5FD] underline">Open source</a>
      <button onClick={onRun} className="mt-6 w-full wolf-primary">Run selected bot</button>
    </aside>
  );
}

function EditableScrollingTicker({ cash, equity, positions, activity, enabled, setEnabled, tickerEditorOpen, setTickerEditorOpen }: { cash: number; equity: number; positions: Position[]; activity: Activity[]; enabled: Record<string, boolean>; setEnabled: (value: Record<string, boolean>) => void; tickerEditorOpen: boolean; setTickerEditorOpen: (value: boolean) => void }) {
  const items = [
    { category: "Portfolio Status", label: `Equity ${money(equity)} · Available ${money(cash)}` },
    ...positions.map((position) => ({ category: "Positions", label: `${position.symbol} ${position.quantity} shares · ${signedMoney((position.currentPrice - position.entryPrice) * position.quantity)}` })),
    ...activity.slice(0, 5).map((item) => ({ category: item.status === "Closed" ? "Closed Position Results" : "Recent Trades", label: `${item.botName} ${item.action} ${item.symbol} · ${item.status}` })),
    { category: "Signal Intelligence", label: sigSubjects[0].headline },
    { category: "Bot Activity", label: "Wolfie Compass scanning momentum and risk alignment" },
    { category: "P/L", label: `Session realized ${signedMoney(activity.reduce((sum, item) => sum + (item.pnl || 0), 0))}` }
  ].filter((item) => enabled[item.category]);
  const loop = items.length ? [...items, ...items, ...items] : [{ category: "Bot Activity", label: "No trading activity yet. Active bots will appear here once they begin scanning." }];
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-12 overflow-hidden border-t border-white/[0.1] bg-[#020617]/95 backdrop-blur">
      <button data-testid="ticker-settings" onClick={() => setTickerEditorOpen(!tickerEditorOpen)} className="absolute right-3 top-2 z-10 rounded-lg border border-white/[0.12] bg-[#0F172A] px-3 py-1 text-xs">Ticker</button>
      {tickerEditorOpen && (
        <div className="absolute bottom-14 right-3 z-20 rounded-xl border border-white/[0.12] bg-[#0F172A] p-4 shadow-2xl">
          {tickerCategories.map((category) => <label key={category} className="block py-1 text-sm"><input type="checkbox" checked={enabled[category]} onChange={(event) => setEnabled({ ...enabled, [category]: event.target.checked })} /> {category}</label>)}
        </div>
      )}
      <div className="ticker-track flex h-full w-max items-center gap-10 whitespace-nowrap pl-[100%] text-sm text-[#CBD5E1]">
        {loop.map((item, index) => <span key={`${item.category}-${index}`}>{item.label}</span>)}
      </div>
    </footer>
  );
}

function ProfitLossToast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(id);
  }, [onClose]);
  return (
    <div className="fixed right-5 top-5 z-[60] w-[280px] rounded-2xl border border-white/[0.14] bg-[#0F172A]/88 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="flex items-center gap-3"><BotAvatar risk="balanced" name={toast.botName} active /><div><div className="font-bold">{toast.symbol} closed</div><div className={toast.amount >= 0 ? "font-mono text-[#38D996]" : "font-mono text-[#FF5C7A]"}>{signedMoney(toast.amount)}</div></div><button onClick={onClose} className="ml-auto">×</button></div>
    </div>
  );
}

function BotCard({ bot, selected, onClick, action }: { bot: Bot; selected: boolean; onClick: () => void; action?: string }) {
  return (
    <button onClick={onClick} className={`min-w-0 rounded-2xl border p-5 text-left transition hover:-translate-y-1 ${selected ? "border-[#8B5CF6] bg-[#7C3AED]/15" : "border-white/[0.09] bg-[#0F172A]"}`}>
      <BotAvatar risk={bot.risk} name={bot.name} active={!bot.paused} />
      <h3 className="mt-4 overflow-hidden text-ellipsis whitespace-nowrap text-xl font-black">{bot.name}</h3>
      <Pill>{bot.group}</Pill>
      <p className="mt-3 line-clamp-3 text-[#CBD5E1]">{bot.summary}</p>
      <div className="mt-4 font-mono text-xl tabular-nums">{action || money(bot.allocationAmount)}</div>
    </button>
  );
}

function PositionCard({ position, onClose }: { position: Position; onClose: () => void }) {
  const pnl = (position.currentPrice - position.entryPrice) * position.quantity;
  return (
    <div className="rounded-2xl border border-white/[0.09] bg-[#0F172A] p-5">
      <div className="flex items-center gap-3"><BotAvatar risk="balanced" name={position.botName} active size="sm" /><CompanyLogo symbol={position.symbol} /><div className="min-w-0"><h3 className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xl font-black">{position.symbol}</h3><p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[#94A3B8]">{position.company}</p></div></div>
      <div className="mt-4 grid gap-2 text-sm"><Fact label="Quantity" value={`${position.quantity}`} /><Fact label="Entry" value={money(position.entryPrice)} /><Fact label="Current value" value={money(position.currentPrice * position.quantity)} /><Fact label="Unrealized P/L" value={signedMoney(pnl)} tone={pnl >= 0 ? "good" : "bad"} /></div>
      <button onClick={onClose} className="mt-4 w-full wolf-secondary">Close position</button>
    </div>
  );
}

function ActivityList({ activity }: { activity: Activity[] }) {
  if (!activity.length) return <EmptyState title="No trade activity" body="Activity appears when bots open, reject, or close positions." />;
  return <div className="grid gap-2">{activity.map((item) => <div key={item.id} className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 md:grid-cols-[auto_1fr_auto] md:items-center"><BotAvatar risk="balanced" name={item.botName} active size="sm" /><div className="min-w-0"><div className="flex flex-wrap gap-2"><strong>{item.action}</strong><CompanyLogo symbol={item.symbol} /><span className="font-mono">{item.symbol}</span><Pill>{item.status}</Pill></div><p className="mt-1 text-sm text-[#94A3B8]">{item.botName} · {item.quantity || "No"} shares · {item.reason}</p></div><div className="text-right font-mono"><div>{item.amount ? money(item.amount) : "—"}</div>{item.pnl !== undefined && <div className={item.pnl >= 0 ? "text-[#38D996]" : "text-[#FF5C7A]"}>{signedMoney(item.pnl)}</div>}<div className="text-xs text-[#94A3B8]">{item.time}</div></div></div>)}</div>;
}

function SettingInput({ label, value, onChange, children }: { label: string; value: number; onChange: (value: number) => void; children: ReactNode }) {
  return <label className="grid gap-2"><span>{label} <InfoTooltip>{children}</InfoTooltip></span><input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="wolf-input" /></label>;
}

function InfoTooltip({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <span className="relative inline-block"><button type="button" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} className="ml-1 rounded-full border border-white/[0.2] px-1 text-xs">i</button>{open && <span role="tooltip" className="absolute left-0 top-7 z-20 w-64 rounded-lg border border-white/[0.12] bg-[#020617] p-3 text-xs text-[#CBD5E1] shadow-xl">{children}</span>}</span>;
}

function BotAvatar({ risk, name, active, size = "md" }: { risk: BotRisk | "balanced"; name: string; active?: boolean; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-9 w-9" : "h-14 w-14";
  const assets: Record<string, { file: string; testId: string }> = {
    conservative: { file: "wolfie-shield-conservative.svg", testId: "bot-avatar-wolfie-shield" },
    balanced: { file: "wolfie-compass-balanced.svg", testId: "bot-avatar-wolfie-compass" },
    aggressive: { file: "wolfie-surge-aggressive.svg", testId: "bot-avatar-wolfie-surge" },
    politician: { file: "wolfie-politician-public-disclosure.svg", testId: "bot-avatar-politician-public-disclosure" }
  };
  const avatar = assets[risk] || assets.balanced;
  return (
    <div className={`relative grid ${dims} shrink-0 place-items-center rounded-2xl border border-white/[0.12] bg-[#0B1220] shadow-[0_0_32px_rgba(99,102,241,0.25)]`}>
      <img data-testid={avatar.testId} src={assetPath(avatar.file)} alt={`${name} avatar`} className="h-full w-full rounded-2xl object-cover" />
      {active && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-[#020617] bg-[#38D996]" />}
    </div>
  );
}

function CompanyLogo({ symbol }: { symbol: string }) {
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] font-mono text-xs font-black text-white">{symbol.slice(0, 2)}</span>;
}

function WolfieMark({ large = false }: { large?: boolean }) {
  return <div className="flex items-center gap-4"><img data-testid="wolfie-logo" src={assetPath("wolfie-logo.svg")} alt="Wolfie logo" className={`${large ? "h-16 w-16" : "h-14 w-14"} rounded-2xl shadow-[0_0_35px_rgba(167,139,250,0.18)]`} /><div><div className="text-3xl font-black leading-none">WOLFIE</div><div className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-[#A78BFA]">Agentic Trading</div></div></div>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-xl border border-dashed border-white/[0.12] p-5 text-[#94A3B8]"><strong className="text-white">{title}</strong><p className="mt-2">{body}</p></div>;
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return <div className="flex min-w-0 justify-between gap-4 border-b border-white/[0.06] py-2 last:border-b-0"><span className="text-[#94A3B8]">{label}</span><span className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-right font-mono tabular-nums ${tone === "good" ? "text-[#38D996]" : tone === "bad" ? "text-[#FF5C7A]" : "text-white"}`}>{value}</span></div>;
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full border border-white/[0.1] bg-white/[0.05] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#CBD5E1]">{children}</span>;
}

function parseCapitalInput(value: string) {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function initialPositions(data: DashboardData): Position[] {
  if (data.positions.length) return data.positions.map((item) => ({ symbol: item.symbol || "UNKNOWN", company: item.name || item.symbol || "UNKNOWN", quantity: Number(item.quantity || 1), entryPrice: Number(item.avg_entry_price || item.market_price || 100), currentPrice: Number(item.market_price || 101), botName: "Wolfie Compass", status: "Open" }));
  return [];
}

function initialActivity(): Activity[] {
  return [{ id: 1, time: "14:32", botName: "Wolfie Compass", action: "Signal detected", symbol: "NVDA", company: "NVIDIA Corporation", quantity: 0, amount: 0, status: "Pending", reason: "Awaiting review" }];
}

function numberOr(value: any, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function signedMoney(value: number) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function playProfitChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      gain.connect(context.destination);
      gain.gain.setValueAtTime(0.001, context.currentTime + index * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + index * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + index * 0.09 + 0.18);
      oscillator.start(context.currentTime + index * 0.09);
      oscillator.stop(context.currentTime + index * 0.09 + 0.2);
    });
  } catch {
    // Audio is optional and may be blocked by the browser.
  }
}
