"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ViewId = "overview" | "bots" | "signals" | "activity" | "settings";
type Mode = "Simulated" | "Live";
type BotId = "alpha" | "shield" | "compass" | "surge";
type ThoughtState = "Invested" | "Considering" | "Avoiding" | "Neutral";

type ThoughtNode = {
  id: string;
  label: string;
  subtitle: string;
  state: ThoughtState;
  confidence: number;
  x: number;
  y: number;
  size: "xl" | "lg" | "md" | "sm";
  tone: "green" | "gold" | "red" | "blue" | "silver";
  factors: string[];
  thesis: string;
  company?: string;
  logo?: string;
  plainLanguage?: string[];
  signals?: string[];
};

type Bot = {
  id: BotId;
  name: string;
  role: string;
  avatar: string;
  mood: string;
  capital: number;
  confidence: number;
  status: string;
  focus: string[];
};

type Activity = {
  id: string;
  time: string;
  bot: string;
  ticker: string;
  event: string;
  status: string;
  summary: string;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const quickAmounts = [10000, 25000, 50000, 100000, 250000];

function assetPath(name: string) {
  return `${basePath}/${name}`.replace(/\/+/g, "/");
}

const bots: Bot[] = [
  {
    id: "alpha",
    name: "Wolfie Alpha",
    role: "Adaptive · Relentless",
    avatar: assetPath("wolfie-logo.svg"),
    mood: "Orbiting the highest conviction thought cluster.",
    capital: 250000,
    confidence: 72,
    status: "Invested",
    focus: ["NVDA", "SPY", "META", "Cash"]
  },
  {
    id: "shield",
    name: "Wolfie Shield",
    role: "Capital defense",
    avatar: assetPath("wolfie-shield-conservative.svg"),
    mood: "Protecting capital while scanning clean support zones.",
    capital: 30000,
    confidence: 68,
    status: "Considering",
    focus: ["MSFT", "AAPL", "SPY"]
  },
  {
    id: "compass",
    name: "Wolfie Compass",
    role: "Balanced signal fusion",
    avatar: assetPath("wolfie-compass-balanced.svg"),
    mood: "Balancing momentum, risk, and options flow.",
    capital: 62500,
    confidence: 81,
    status: "Invested",
    focus: ["NVDA", "AMD", "QQQ"]
  },
  {
    id: "surge",
    name: "Wolfie Surge",
    role: "Momentum acceleration",
    avatar: assetPath("wolfie-surge-aggressive.svg"),
    mood: "Waiting for a second ignition pulse before chasing speed.",
    capital: 20000,
    confidence: 59,
    status: "Avoiding",
    focus: ["COIN", "GME", "TSLA"]
  }
];

const thoughtNodes: ThoughtNode[] = [
  {
    id: "nvda",
    label: "NVDA",
    subtitle: "Position",
    state: "Invested",
    confidence: 81,
    x: 28,
    y: 25,
    size: "xl",
    tone: "green",
    factors: ["Volume Above Avg", "Semiconductor Leadership", "Earnings Beat Streak", "Data Center Demand", "Technical Breakout"],
    thesis: "Structural uptrend intact with strong volume and improving fundamentals. Holding core position while risk nodes remain contained.",
    company: "NVIDIA",
    logo: "https://logo.clearbit.com/nvidia.com",
    plainLanguage: [
      "Wolfie already owns this thought because price, volume, and sector leadership are all pointing in the same direction.",
      "The risk is not that NVDA is weak. The risk is that too many traders are crowded into the same idea, so position size matters.",
      "If volume fades or the broader semiconductor group rolls over, this thought should shrink instead of getting new capital."
    ],
    signals: ["Volume expanded above baseline", "Sector peers are confirming", "Breakout remains above invalidation"]
  },
  {
    id: "amd",
    label: "AMD",
    subtitle: "Watch",
    state: "Considering",
    confidence: 67,
    x: 51,
    y: 22,
    size: "lg",
    tone: "gold",
    factors: ["AI Chip Demand", "Channel Checks", "Relative Strength", "Margin Expansion", "Option Flow"],
    thesis: "Momentum is building but confirmation quality is lower than NVDA. Wolfie is watching for volume follow-through.",
    company: "Advanced Micro Devices",
    logo: "https://logo.clearbit.com/amd.com",
    plainLanguage: [
      "AMD is interesting, but it has not earned the same conviction as NVDA yet.",
      "Wolfie is waiting for demand signals and channel checks to line up before treating it like a position.",
      "A watch thought means: keep it close, but do not chase without confirmation."
    ],
    signals: ["Relative strength improving", "Options interest rising", "Margin story still being verified"]
  },
  {
    id: "spy",
    label: "SPY",
    subtitle: "Hedge",
    state: "Invested",
    confidence: 74,
    x: 74,
    y: 26,
    size: "lg",
    tone: "green",
    factors: ["Macro Uncertainty", "Correlation High", "Put Spread Opportunity", "Beta Management"],
    thesis: "Index hedge offsets concentrated semiconductor exposure while upside participation remains intact.",
    company: "SPDR S&P 500 ETF",
    logo: "https://logo.clearbit.com/ssga.com",
    plainLanguage: [
      "SPY is not the main opportunity; it is the stabilizer around the opportunity.",
      "When multiple tech thoughts move together, a hedge helps protect the portfolio from one broad market shock.",
      "Wolfie keeps this thought active when correlation is high and downside risk is rising."
    ],
    signals: ["Correlation elevated", "Put-spread hedge useful", "Macro uncertainty active"]
  },
  {
    id: "gme",
    label: "GME",
    subtitle: "Avoid",
    state: "Avoiding",
    confidence: 42,
    x: 81,
    y: 50,
    size: "md",
    tone: "red",
    factors: ["Social Hype", "Pump Pattern", "No Fundamental Edge", "Volatility Spike Risk"],
    thesis: "Signal quality is too unstable. Wolfie is explicitly avoiding the setup until fundamentals or liquidity improve.",
    company: "GameStop",
    logo: "https://logo.clearbit.com/gamestop.com",
    plainLanguage: [
      "This thought is bright because it is noisy, not because it is good.",
      "Social attention can move price fast, but Wolfie does not treat attention as edge by itself.",
      "Avoiding is an active decision: the bot is protecting capital from a low-quality setup."
    ],
    signals: ["Social hype elevated", "Fundamental edge weak", "Volatility risk high"]
  },
  {
    id: "meta",
    label: "META",
    subtitle: "Earnings Catalyst",
    state: "Considering",
    confidence: 69,
    x: 81,
    y: 72,
    size: "lg",
    tone: "green",
    factors: ["Ad Revenue Rebound", "AI Product Catalyst", "Cost Cuts Impacting", "Guidance Watch"],
    thesis: "Earnings catalyst is credible, but position sizing waits for guidance clarity.",
    company: "Meta Platforms",
    logo: "https://logo.clearbit.com/meta.com",
    plainLanguage: [
      "META has a real catalyst, but earnings events can punish sloppy timing.",
      "Wolfie is processing ad revenue, AI product momentum, and guidance risk before upgrading the thought.",
      "The thought grows only if the post-earnings path is clearer than the pre-earnings hype."
    ],
    signals: ["Ad revenue rebound", "AI catalyst active", "Guidance still uncertain"]
  },
  {
    id: "cash",
    label: "Cash",
    subtitle: "Reserve",
    state: "Neutral",
    confidence: 88,
    x: 66,
    y: 82,
    size: "lg",
    tone: "blue",
    factors: ["Keep Dry Powder", "Wait For Edge", "Protect Capital", "Reduce Overtrading"],
    thesis: "Cash reserve is deliberately high so bots can act when a high-quality edge appears."
  },
  {
    id: "sector",
    label: "AI Sector",
    subtitle: "Rotation",
    state: "Considering",
    confidence: 63,
    x: 49,
    y: 83,
    size: "lg",
    tone: "gold",
    factors: ["Compute Demand", "Leader Strength", "Multiple Expansion", "Capex Cycle"],
    thesis: "Sector rotation remains constructive but crowded. Wolfie is tracking breadth and valuation pressure."
  },
  {
    id: "liquidity",
    label: "Liquidity",
    subtitle: "Concern",
    state: "Neutral",
    confidence: 54,
    x: 24,
    y: 72,
    size: "md",
    tone: "blue",
    factors: ["Market Depth Thin", "Bid Ask Widening", "Funding Costs Up", "Stress Signals"],
    thesis: "Liquidity is acceptable in leaders and weaker in speculative names. Trade size is capped."
  },
  {
    id: "coin",
    label: "COIN",
    subtitle: "Volatility Check",
    state: "Avoiding",
    confidence: 46,
    x: 21,
    y: 51,
    size: "lg",
    tone: "red",
    factors: ["High Vol Regime", "Exchange Outflows", "Sensitive to BTC", "Event Risk"],
    thesis: "Volatility is too regime-dependent for current bots. Wolfie will only re-evaluate after market depth improves.",
    company: "Coinbase",
    logo: "https://logo.clearbit.com/coinbase.com",
    plainLanguage: [
      "COIN can move sharply, but right now the move depends too much on crypto regime behavior.",
      "Wolfie needs cleaner liquidity and lower event risk before this thought becomes actionable.",
      "This is a good example of a thought dying slowly: still monitored, but losing priority."
    ],
    signals: ["Market depth thin", "Event risk elevated", "BTC sensitivity high"]
  }
];

const activities: Activity[] = [
  { id: "h1", time: "12:42", bot: "Wolfie Alpha", ticker: "NVDA", event: "Thought upgraded", status: "Invested", summary: "Volume surge moved NVDA into the core thought cluster." },
  { id: "h2", time: "12:18", bot: "Wolfie Shield", ticker: "SPY", event: "Hedge reviewed", status: "Open", summary: "Index hedge remains useful while semiconductor correlation is elevated." },
  { id: "h3", time: "11:56", bot: "Wolfie Surge", ticker: "GME", event: "Setup rejected", status: "Rejected", summary: "Social velocity rose without enough fundamental edge." },
  { id: "h4", time: "11:20", bot: "Wolfie Compass", ticker: "META", event: "Catalyst watch", status: "Considering", summary: "Earnings setup added to the signal rail for review." }
];

function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function parseCapital(value: string) {
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCapitalInput(value: string | number) {
  const raw = String(value).replace(/[^\d.]/g, "");
  if (!raw) return "";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return "";
  return parsed.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function playIntroSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
    master.connect(context.destination);

    [130.81, 196, 329.63, 493.88].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index % 2 ? "triangle" : "sine";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.035);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.62, now + 0.62 + index * 0.02);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12 / (index + 1), now + 0.09 + index * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.86);
      oscillator.connect(gain).connect(master);
      oscillator.start(now + index * 0.035);
      oscillator.stop(now + 1.08);
    });
  } catch {
    // Audio is enhancement-only and may be blocked by browser settings.
  }
}

export default function Home() {
  const [capital, setCapital] = useState(250000);
  const [draftCapital, setDraftCapital] = useState("$250,000");
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<ViewId>("overview");
  const [selectedNodeId, setSelectedNodeId] = useState("nvda");
  const [selectedBotId, setSelectedBotId] = useState<BotId>("alpha");
  const [mode, setMode] = useState<Mode>("Simulated");
  const [panel, setPanel] = useState<"node" | "bot" | "activity" | "live" | "card" | null>(null);
  const [cardId, setCardId] = useState("balance");
  const [orbit, setOrbit] = useState(true);
  const [tickerFilter, setTickerFilter] = useState("All");

  useEffect(() => {
    const storedCapital = window.localStorage.getItem("wolfie.capital");
    const storedReady = window.localStorage.getItem("wolfie.ready");
    const storedView = window.localStorage.getItem("wolfie.view") as ViewId | null;
    const storedMode = window.localStorage.getItem("wolfie.mode") as Mode | null;
    if (storedCapital) {
      const parsed = Number(storedCapital);
      if (Number.isFinite(parsed) && parsed > 0) {
        setCapital(parsed);
        setDraftCapital(formatCapitalInput(parsed));
      }
    }
    if (storedReady === "true") setReady(true);
    if (storedView && ["overview", "bots", "signals", "activity", "settings"].includes(storedView)) setView(storedView);
    if (storedMode === "Simulated") setMode(storedMode);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("wolfie.view", view);
  }, [view]);

  const selectedNode = thoughtNodes.find((node) => node.id === selectedNodeId) || thoughtNodes[0];
  const selectedBot = bots.find((bot) => bot.id === selectedBotId) || bots[0];
  const buyingPower = Math.round(capital * 0.74972);
  const netPnl = Math.round(capital * 0.0749);
  const thoughtCounts = useMemo(() => {
    return thoughtNodes.reduce<Record<ThoughtState, number>>((acc, node) => {
      acc[node.state] += 1;
      return acc;
    }, { Invested: 0, Considering: 0, Avoiding: 0, Neutral: 0 });
  }, []);

  function saveCapital() {
    const parsed = parseCapital(draftCapital);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const next = Math.round(parsed);
    setCapital(next);
    setDraftCapital(formatCapitalInput(next));
    setReady(true);
    playIntroSound();
    window.localStorage.setItem("wolfie.capital", String(next));
    window.localStorage.setItem("wolfie.ready", "true");
  }

  function requestMode(next: Mode) {
    if (next === "Live") {
      setPanel("live");
      return;
    }
    setMode(next);
    window.localStorage.setItem("wolfie.mode", next);
  }

  function selectNode(id: string) {
    setSelectedNodeId(id);
    setPanel("node");
  }

  function openCard(id: string) {
    setCardId(id);
    setPanel("card");
  }

  const invalidCapital = parseCapital(draftCapital) <= 0;

  return (
    <main className={`wolf-app ${orbit ? "is-orbiting" : ""}`}>
      {!ready && (
        <section className="onboarding-layer" aria-modal="true" role="dialog" aria-labelledby="capital-title">
          <div className="onboarding-card metal-panel">
            <img className="onboarding-logo" src={assetPath("wolfie-logo.svg")} alt="Wolfie" />
            <p className="micro-label">First step</p>
            <h1 id="capital-title">How much do you want Wolfie to trade with?</h1>
            <p>This sets your starting trading capital. Wolfie uses it to size positions, track buying power, and calculate P/L.</p>
            <div className="quick-grid">
              {quickAmounts.map((amount) => <button key={amount} className="metal-chip" onClick={() => setDraftCapital(formatCapitalInput(amount))}>{money(amount)}</button>)}
            </div>
            <label htmlFor="capital-input">Starting trading capital</label>
            <input id="capital-input" value={draftCapital} inputMode="decimal" placeholder="$10,000" onChange={(event) => setDraftCapital(formatCapitalInput(event.target.value))} />
            <button className="primary-action" disabled={invalidCapital} onClick={saveCapital}>Continue</button>
          </div>
        </section>
      )}

      <aside className="app-sidebar metal-panel">
        <button className="brand-mark" onClick={() => setView("overview")} aria-label="Wolfie overview">
          <img src={assetPath("wolfie-logo.svg")} alt="Wolfie" />
          <span><b>WOLFIE</b><small>Agentic Trading</small></span>
        </button>
        <nav className="side-nav-list" aria-label="Main views">
          {([
            ["overview", "Overview"],
            ["bots", "Trading Bots"],
            ["signals", "Signal Intelligence"],
            ["activity", "Activity"],
            ["settings", "Settings"]
          ] as [ViewId, string][]).map(([id, label]) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>{label}</button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="trading-mode-card">
          <p className="micro-label">Trading Mode</p>
          <div className="mode-switch" aria-label="Trading Mode">
            <button className={mode === "Simulated" ? "active" : ""} onClick={() => requestMode("Simulated")}>Simulated</button>
            <button onClick={() => requestMode("Live")}>Live</button>
          </div>
        </div>
        <div className="selected-bot-mini">
          <BotCharacter bot={selectedBot} />
          <span><b>{selectedBot.name}</b><small>{selectedBot.role}</small></span>
        </div>
      </aside>

      <section className="stage dashboard-stage">
        <DashboardHeader view={view} selectedBot={selectedBot} setView={setView} />
        {view === "overview" && <OverviewDashboard capital={capital} buyingPower={buyingPower} netPnl={netPnl} selectedBot={selectedBot} selectedNode={selectedNode} openCard={openCard} setView={setView} selectNode={selectNode} />}
        {view === "bots" && <BotsDashboard selectedBot={selectedBot} selectedBotId={selectedBotId} setSelectedBotId={setSelectedBotId} setPanel={setPanel} />}
        {view === "signals" && <SignalsView onSelect={selectNode} />}
        {view === "activity" && <HistoryView />}
        {view === "settings" && <RiskView draftCapital={draftCapital} setDraftCapital={setDraftCapital} invalidCapital={invalidCapital} saveCapital={saveCapital} mode={mode} requestMode={requestMode} selectedBot={selectedBot} setSelectedBotId={setSelectedBotId} />}
      </section>

      <aside className="right-rail">
        <SelectedThought node={selectedNode} />
        <FieldNavigator selectedId={selectedNodeId} onSelect={selectNode} />
      </aside>

      <footer className="bottom-console">
        <Timeline />
        <div className="control-dock metal-panel">
          {[
            { label: "Orbit", action: () => setOrbit(!orbit), active: orbit },
            { label: "Focus", action: () => setPanel("node"), active: false },
            { label: "Zoom", action: () => setView("signals"), active: false },
            { label: "Pan", action: () => setView("signals"), active: false },
            { label: "Filter", action: () => setTickerFilter(tickerFilter === "All" ? "Invested" : "All"), active: tickerFilter !== "All" },
            { label: "Pause", action: () => setOrbit(!orbit), active: !orbit }
          ].map((control) => <button key={control.label} className={control.active ? "active" : ""} onClick={control.action}><span>{control.label}</span></button>)}
        </div>
        <div className="time-scrub metal-panel"><span>Time Scrub</span><input aria-label="Time scrub" type="range" min="0" max="100" defaultValue="72" /><b>12:42:37</b><b>1.0x</b></div>
      </footer>

      <StatusTicker filter={tickerFilter} />

      {panel && (
        <div className="drawer-backdrop" onClick={() => setPanel(null)}>
          <section className="detail-drawer metal-panel" onClick={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setPanel(null)}>Close</button>
            {panel === "node" && <NodeDrawer node={selectedNode} />}
            {panel === "bot" && <BotDrawer bot={selectedBot} />}
            {panel === "activity" && <ActivityDrawer />}
            {panel === "live" && <LiveDrawer />}
            {panel === "card" && <CardDrawer cardId={cardId} capital={capital} buyingPower={buyingPower} netPnl={netPnl} selectedNode={selectedNode} selectedBot={selectedBot} />}
          </section>
        </div>
      )}
    </main>
  );
}

function MetricSpark({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-spark">
      <span>{label}</span>
      <strong>{value}</strong>
      <svg viewBox="0 0 160 50" aria-hidden="true">
        <polyline points="0,42 12,39 24,41 36,35 48,36 60,31 72,34 84,26 96,32 108,18 120,29 132,20 144,24 160,10" />
      </svg>
    </div>
  );
}

function BotCharacter({ bot }: { bot: Bot }) {
  return (
    <span className={`bot-character bot-${bot.id}`} aria-hidden="true">
      <img src={bot.avatar} alt="" />
      <i className="bot-eye left" />
      <i className="bot-eye right" />
      <i className="bot-antenna" />
    </span>
  );
}

function DashboardHeader({ view, selectedBot, setView }: { view: ViewId; selectedBot: Bot; setView: (view: ViewId) => void }) {
  const titles: Record<ViewId, { title: string; copy: string }> = {
    overview: { title: "Wolfie Command Dashboard", copy: "Capital, bots, market thoughts, and execution readiness in one operating view." },
    bots: { title: "Trading Bots", copy: "Each bot is a character with a different risk personality, signal lens, and capital behavior." },
    signals: { title: "Signal Intelligence", copy: "A live-style processing room for market inputs, bot thoughts, risk, catalysts, and opportunity clusters." },
    activity: { title: "Activity", copy: "Recent thought changes, bot actions, and status transitions." },
    settings: { title: "Settings", copy: "Capital, mode, bot lens, and operating guardrails." }
  };
  return (
    <header className="dashboard-header">
      <div>
        <p className="micro-label">{view === "overview" ? "Overview" : view}</p>
        <h1>{titles[view].title}</h1>
        <p>{titles[view].copy}</p>
      </div>
      <div className="header-bot-card metal-panel">
        <BotCharacter bot={selectedBot} />
        <span><b>Active bot: {selectedBot.name}</b><small>{selectedBot.mood}</small></span>
        <button onClick={() => setView("settings")}>Settings</button>
      </div>
    </header>
  );
}

function OverviewDashboard({ capital, buyingPower, netPnl, selectedBot, selectedNode, openCard, setView, selectNode }: { capital: number; buyingPower: number; netPnl: number; selectedBot: Bot; selectedNode: ThoughtNode; openCard: (id: string) => void; setView: (view: ViewId) => void; selectNode: (id: string) => void }) {
  const allocated = Math.round(capital * 0.4);
  const cards = [
    { id: "balance", label: "Trading Balance", value: money(capital), detail: "Starting capital and equity baseline.", tone: "" },
    { id: "buying-power", label: "Buying Power", value: money(buyingPower), detail: "Capital Wolfie can still deploy.", tone: "" },
    { id: "allocated", label: "Allocated to Bots", value: money(allocated), detail: "Assigned across active bot characters.", tone: "" },
    { id: "pnl", label: "Net P/L", value: `+${money(netPnl)}`, detail: "Current session performance.", tone: "positive" },
    { id: "thoughts", label: "Active Thoughts", value: String(thoughtNodes.length), detail: "Invested, watching, avoiding, and neutral.", tone: "" },
    { id: "confidence", label: "Top Confidence", value: `${selectedNode.confidence}%`, detail: `${selectedNode.label} ${selectedNode.subtitle}`, tone: "positive" }
  ];
  return (
    <div className="overview-grid">
      <section className="metric-board metal-panel">
        <div className="section-head"><p className="micro-label">At A Glance</p><button onClick={() => setView("activity")}>View activity</button></div>
        <div className="dashboard-card-grid">
          {cards.map((card) => <button key={card.id} className={`dashboard-card ${card.tone}`} onClick={() => openCard(card.id)}><span>{card.label}</span><b>{card.value}</b><small>{card.detail}</small></button>)}
        </div>
      </section>
      <section className="next-opportunity metal-panel">
        <div className="section-head"><p className="micro-label">Next Opportunity</p><button onClick={() => selectNode(selectedNode.id)}>Open thought</button></div>
        <div className="opportunity-body">
          <StockIdentity node={selectedNode} />
          <div className="confidence-badge"><span>Confidence</span><b>{selectedNode.confidence}</b><small>/100</small></div>
          <h2>{selectedNode.label} {selectedNode.subtitle}</h2>
          <p>{selectedNode.thesis}</p>
          <div className="opportunity-actions"><button onClick={() => selectNode(selectedNode.id)}>Review Opportunity</button><button onClick={() => setView("signals")}>Signal Intelligence</button></div>
        </div>
      </section>
      <section className="thought-preview metal-panel">
        <div className="section-head"><p className="micro-label">Bot Thought Preview</p><button onClick={() => setView("signals")}>Expand 3D</button></div>
        <ThoughtField selectedId={selectedNode.id} onSelect={selectNode} selectedBot={selectedBot} />
      </section>
      <section className="activity-panel metal-panel">
        <div className="section-head"><p className="micro-label">Recent Activity</p><button onClick={() => setView("activity")}>View all</button></div>
        <div className="activity-list compact">{activities.map((item) => {
          const node = thoughtNodes.find((thought) => thought.label === item.ticker);
          return <button key={item.id} onClick={() => node && selectNode(node.id)}><b>{item.time}</b>{node ? <StockInline node={node} /> : <strong>{item.ticker}</strong>}<span>{item.event}</span><p>{item.summary}</p></button>;
        })}</div>
      </section>
    </div>
  );
}

function BotsDashboard({ selectedBot, selectedBotId, setSelectedBotId, setPanel }: { selectedBot: Bot; selectedBotId: BotId; setSelectedBotId: (id: BotId) => void; setPanel: (panel: "bot") => void }) {
  return (
    <div className="bots-dashboard">
      {bots.map((bot) => <button key={bot.id} className={`bot-profile-card metal-panel ${selectedBotId === bot.id ? "active" : ""}`} onClick={() => { setSelectedBotId(bot.id); setPanel("bot"); }}><BotCharacter bot={bot} /><span className="micro-label">{bot.role}</span><h2>{bot.name}</h2><p>{bot.mood}</p><div className="bot-focus">{bot.focus.map((ticker) => {
        const node = thoughtNodes.find((thought) => thought.label === ticker);
        return node ? <StockInline key={ticker} node={node} /> : <span key={ticker}>{ticker}</span>;
      })}</div><strong>{bot.confidence}% confidence</strong></button>)}
      <section className="metal-panel bot-deep-panel"><p className="micro-label">Selected Character</p><BotCharacter bot={selectedBot} /><h2>{selectedBot.name}</h2><p>{selectedBot.mood}</p><ul>{selectedBot.focus.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </div>
  );
}

function ThoughtField({ selectedId, onSelect, selectedBot }: { selectedId: string; onSelect: (id: string) => void; selectedBot: Bot }) {
  return (
    <div className="thought-field" aria-label="Bot Thought intelligence field">
      <ThreeThoughtScene selectedId={selectedId} onSelect={onSelect} />
      <button className="alpha-core" onClick={() => onSelect(selectedId)} aria-label={`${selectedBot.name} core`}>
        <img src={selectedBot.avatar} alt={selectedBot.name} />
        <span>{selectedBot.name}</span>
      </button>
      {thoughtNodes.map((node) => (
        <button key={node.id} className={`thought-node ${node.tone} ${node.size} ${node.id === selectedId ? "selected" : ""}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={() => onSelect(node.id)}>
          {node.logo && <img className="stock-logo" src={node.logo} alt={`${node.company} logo`} />}
          <span>{node.label}</span>
          <small>{node.subtitle}</small>
          {node.factors.slice(0, 4).map((factor, index) => <em key={factor} className={`satellite s${index}`}>{factor}</em>)}
        </button>
      ))}
    </div>
  );
}

function ThreeThoughtScene({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cleanup = () => {};
    let cancelled = false;

    async function boot() {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (cancelled || !mountRef.current) return;

      const mount = mountRef.current;
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020509, 0.045);

      const camera = new THREE.PerspectiveCamera(54, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 1000);
      camera.position.set(0, 7.5, 18);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.055;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.34;
      controls.minDistance = 9;
      controls.maxDistance = 34;

      scene.add(new THREE.AmbientLight(0x9fe8ff, 0.6));
      const key = new THREE.PointLight(0x6fffbb, 2.3, 80);
      key.position.set(0, 6, 6);
      scene.add(key);
      const rim = new THREE.PointLight(0xffbd55, 1.4, 80);
      rim.position.set(-8, 3, -6);
      scene.add(rim);

      const colorMap = { green: 0x47f49c, gold: 0xffbd55, red: 0xff4d61, blue: 0x8cc9ff, silver: 0xcfd8e3 };
      const group = new THREE.Group();
      scene.add(group);

      const core = new THREE.Mesh(
        new THREE.SphereGeometry(1.45, 48, 48),
        new THREE.MeshStandardMaterial({ color: 0x07111a, metalness: 0.82, roughness: 0.2, emissive: 0x0b3126, emissiveIntensity: 0.7 })
      );
      group.add(core);

      const clickable: Array<any> = [];
      const linkMaterial = new THREE.LineBasicMaterial({ color: 0x8cc9ff, transparent: true, opacity: 0.34 });
      thoughtNodes.forEach((node, index) => {
        const radius = node.size === "xl" ? 1.16 : node.size === "lg" ? 0.92 : node.size === "md" ? 0.72 : 0.54;
        const theta = (node.x / 100) * Math.PI * 2;
        const phi = ((node.y - 50) / 50) * 0.82;
        const orbitRadius = 5.6 + (index % 4) * 1.34;
        const base = new THREE.Vector3(Math.cos(theta) * orbitRadius, Math.sin(phi) * 3.4, Math.sin(theta) * orbitRadius);
        const material = new THREE.MeshStandardMaterial({
          color: colorMap[node.tone],
          metalness: 0.72,
          roughness: 0.18,
          emissive: colorMap[node.tone],
          emissiveIntensity: node.id === selectedId ? 0.66 : 0.34,
          transparent: true,
          opacity: node.state === "Avoiding" ? 0.78 : 0.94
        });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 48), material) as any;
        mesh.position.copy(base);
        mesh.userData = { id: node.id, base, speed: 0.15 + index * 0.015, phase: index * 0.9 };
        clickable.push(mesh);
        group.add(mesh);

        const points = [new THREE.Vector3(0, 0, 0), base.clone()];
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), linkMaterial));

        node.factors.slice(0, 4).forEach((_, satelliteIndex) => {
          const sat = new THREE.Mesh(
            new THREE.SphereGeometry(radius * 0.16, 18, 18),
            new THREE.MeshStandardMaterial({ color: colorMap[node.tone], emissive: colorMap[node.tone], emissiveIntensity: 0.55, metalness: 0.55, roughness: 0.22 })
          );
          sat.position.copy(base.clone().add(new THREE.Vector3(Math.cos(satelliteIndex * 1.6) * (radius + 0.78), Math.sin(satelliteIndex * 1.2) * 0.55, Math.sin(satelliteIndex * 1.6) * (radius + 0.78))));
          group.add(sat);
        });
      });

      const lifecycle = new THREE.Group();
      scene.add(lifecycle);
      for (let i = 0; i < 34; i += 1) {
        const dying = i % 5 === 0;
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(dying ? 0.055 : 0.08, 10, 10),
          new THREE.MeshBasicMaterial({ color: dying ? 0xff4d61 : 0x8cc9ff, transparent: true, opacity: dying ? 0.22 : 0.55 })
        );
        particle.position.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 22);
        lifecycle.add(particle);
      }

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      function handlePointer(event: PointerEvent) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(clickable, false)[0];
        if (hit?.object.userData.id) onSelectRef.current(hit.object.userData.id);
      }
      renderer.domElement.addEventListener("pointerdown", handlePointer);

      function resize() {
        if (!mount.clientWidth || !mount.clientHeight) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      }
      window.addEventListener("resize", resize);

      let frame = 0;
      let raf = 0;
      const clock = new THREE.Clock();
      function animate() {
        const t = clock.getElapsedTime();
        frame += 1;
        core.rotation.y += 0.006;
        clickable.forEach((mesh) => {
          const { base, speed, phase } = mesh.userData;
          const angle = t * speed + phase;
          mesh.position.set(
            base.x * Math.cos(angle) - base.z * Math.sin(angle),
            base.y + Math.sin(t * 0.8 + phase) * 0.32,
            base.x * Math.sin(angle) + base.z * Math.cos(angle)
          );
          mesh.scale.setScalar(mesh.userData.id === selectedId ? 1.16 + Math.sin(t * 2.2) * 0.035 : 1);
        });
        lifecycle.children.forEach((child, index) => {
          child.position.y += Math.sin(t + index) * 0.0025;
          child.rotation.y += 0.004;
        });
        group.rotation.y += 0.0012;
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      }
      animate();

      cleanup = () => {
        cancelAnimationFrame(raf);
        renderer.domElement.removeEventListener("pointerdown", handlePointer);
        window.removeEventListener("resize", resize);
        controls.dispose();
        renderer.dispose();
        mount.removeChild(renderer.domElement);
      };
    }

    boot();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [selectedId]);

  return <div ref={mountRef} className="three-stage" aria-label="Interactive 3D thought solar system" />;
}

function SelectedThought({ node }: { node: ThoughtNode }) {
  return (
    <section className="selected-panel metal-panel">
      <p className="micro-label">Selected Thought</p>
      <StockIdentity node={node} />
      <h2>{node.label} {node.subtitle}</h2>
      <div className="confidence-row"><span>State <b className={node.state.toLowerCase()}>{node.state}</b></span><span>Confidence <b>{node.confidence}%</b><i style={{ width: `${node.confidence}%` }} /></span></div>
      <p className="micro-label">Thesis</p>
      <p>{node.thesis}</p>
      <p className="micro-label">Plain English Read</p>
      <div className="education-copy">{node.plainLanguage?.map((item) => <p key={item}>{item}</p>)}</div>
      <p className="micro-label">Key Factors</p>
      <ul className="factor-list">{node.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
      <button className="panel-action">View Details</button>
    </section>
  );
}

function FieldNavigator({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <section className="navigator-panel metal-panel">
      <p className="micro-label">Field Navigator</p>
      <div className="mini-cube">
        {thoughtNodes.map((node) => <button key={node.id} className={`${node.tone} ${node.id === selectedId ? "active" : ""}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={() => onSelect(node.id)} aria-label={node.label} />)}
      </div>
      <div className="navigator-actions"><button>Center</button><button>Orbit Mode</button></div>
    </section>
  );
}

function SignalsView({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="view-grid">
      <section className="wide-panel metal-panel">
        <p className="micro-label">Signals</p>
        <h1>Signal field ranked by conviction</h1>
        <p className="analysis-lede">Wolfie is processing price action, volume, sector leadership, options activity, catalyst risk, liquidity, and portfolio exposure. The scene below shows what is strengthening, weakening, emerging, or dying.</p>
        <ThoughtField selectedId="nvda" onSelect={onSelect} selectedBot={bots[1]} />
      </section>
      <section className="wide-panel metal-panel">
        <p className="micro-label">Market Processing Queue</p>
        <div className="signal-list">{thoughtNodes.map((node) => <button key={node.id} onClick={() => onSelect(node.id)}><StockIdentity node={node} /><span>{node.subtitle}</span><i>{node.confidence}%</i><small>{node.signals?.join(" · ")}</small></button>)}</div>
      </section>
      <section className="metal-panel"><p className="micro-label">Signal Quality</p><h2>81%</h2><p>Highest conviction is concentrated in <StockInline node={thoughtNodes[0]} />, with hedge support from <StockInline node={thoughtNodes[2]} /> and reserve discipline from Cash.</p></section>
      <section className="metal-panel"><p className="micro-label">Bot Lens</p><div className="bot-lens-list">{bots.map((bot) => <button key={bot.id}><img src={bot.avatar} alt={bot.name} /><span><b>{bot.name}</b><small>{bot.mood}</small></span></button>)}</div></section>
    </div>
  );
}

function PortfolioView({ capital, buyingPower, netPnl }: { capital: number; buyingPower: number; netPnl: number }) {
  return (
    <div className="view-grid portfolio-grid">
      {[["Trading Balance", money(capital)], ["Buying Power", money(buyingPower)], ["Net P/L", `+${money(netPnl)}`], ["Open Thoughts", String(thoughtNodes.length)]].map(([label, value]) => <section key={label} className="metal-panel big-stat"><p className="micro-label">{label}</p><h2>{value}</h2></section>)}
      <section className="wide-panel metal-panel"><p className="micro-label">Portfolio Allocation</p><h1>Capital is concentrated where thought confidence is strongest.</h1><div className="allocation-bars">{thoughtNodes.slice(0, 6).map((node) => <div key={node.id}><span>{node.label}</span><i style={{ width: `${node.confidence}%` }} /></div>)}</div></section>
    </div>
  );
}

function RiskView(props: { draftCapital: string; setDraftCapital: (value: string) => void; invalidCapital: boolean; saveCapital: () => void; mode: Mode; requestMode: (mode: Mode) => void; selectedBot: Bot; setSelectedBotId: (id: BotId) => void }) {
  return (
    <div className="view-grid">
      <section className="metal-panel settings-panel"><p className="micro-label">Capital</p><h1>Risk and operating controls</h1><input value={props.draftCapital} onChange={(event) => props.setDraftCapital(formatCapitalInput(event.target.value))} /><button className="primary-action" disabled={props.invalidCapital} onClick={props.saveCapital}>Save capital</button></section>
      <section className="metal-panel settings-panel"><p className="micro-label">Mode</p><div className="mode-switch inline"><button className={props.mode === "Simulated" ? "active" : ""} onClick={() => props.requestMode("Simulated")}>SIMULATED</button><button onClick={() => props.requestMode("Live")}>LIVE</button></div><p>Live remains locked until account connection and explicit approval are implemented.</p></section>
      <section className="wide-panel metal-panel"><p className="micro-label">Bot Avatars</p><div className="bot-character-grid">{bots.map((bot) => <button key={bot.id} className={props.selectedBot.id === bot.id ? "active" : ""} onClick={() => props.setSelectedBotId(bot.id)}><img src={bot.avatar} alt={bot.name} /><b>{bot.name}</b><span>{bot.mood}</span></button>)}</div></section>
    </div>
  );
}

function HistoryView() {
  return (
    <div className="view-grid">
      <section className="wide-panel metal-panel"><p className="micro-label">History</p><h1>Thought timeline and audit trail</h1><div className="activity-list">{activities.map((item) => {
        const node = thoughtNodes.find((thought) => thought.label === item.ticker);
        return <button key={item.id}><b>{item.time}</b><span>{item.bot}</span>{node ? <StockInline node={node} /> : <strong>{item.ticker}</strong>}<em>{item.event}</em><p>{item.summary}</p></button>;
      })}</div></section>
      <section className="metal-panel"><p className="micro-label">Today</p><h2>{activities.length}</h2><p>Significant thought-state changes recorded in this session.</p></section>
    </div>
  );
}

function Timeline() {
  return <div className="timeline" aria-label="Thought timeline">{Array.from({ length: 84 }, (_, index) => <i key={index} style={{ height: `${8 + ((index * 17) % 32)}px`, background: index > 58 ? "#ff4d61" : index > 38 ? "#f2b84b" : index > 18 ? "#46e59b" : "#70c8ff" }} />)}</div>;
}

function StatusTicker({ filter }: { filter: string }) {
  const chips = [
    "NVDA Position · Invested · 81%",
    "SPY Hedge · Active",
    "AMD Watch · Channel checks",
    "Cash Reserve · Wait for edge",
    "META Catalyst · Earnings",
    "GME Avoid · No edge",
    "Liquidity Concern · Size capped"
  ].filter((item) => filter === "All" || item.includes(filter));
  return <div className="ticker-rail" aria-label="Status ticker"><div>{[...chips, ...chips].map((chip, index) => <button key={`${chip}-${index}`}>{chip}</button>)}</div></div>;
}

function NodeDrawer({ node }: { node: ThoughtNode }) {
  return <><p className="micro-label">Thought Detail</p><StockIdentity node={node} /><h2>{node.label} {node.subtitle}</h2><p>{node.thesis}</p><div className="education-copy">{node.plainLanguage?.map((item) => <p key={item}>{item}</p>)}</div><dl><dt>Confidence</dt><dd>{node.confidence}%</dd><dt>State</dt><dd>{node.state}</dd><dt>What Wolfie is processing</dt><dd>{node.signals?.join(", ")}</dd><dt>Factors</dt><dd>{node.factors.join(", ")}</dd></dl></>;
}

function CardDrawer({ cardId, capital, buyingPower, netPnl, selectedNode, selectedBot }: { cardId: string; capital: number; buyingPower: number; netPnl: number; selectedNode: ThoughtNode; selectedBot: Bot }) {
  const allocated = Math.round(capital * 0.4);
  const details: Record<string, { title: string; lede: string; rows: [string, string][]; notes: string[] }> = {
    balance: {
      title: "Trading Balance",
      lede: "This is the capital baseline Wolfie uses for sizing, risk checks, and dashboard calculations.",
      rows: [["Current balance", money(capital)], ["Selected bot", selectedBot.name], ["Mode", "Simulated"]],
      notes: ["Changing capital updates buying power and bot allocation context.", "This app does not connect to real brokerage funds."]
    },
    "buying-power": {
      title: "Buying Power",
      lede: "Buying power is the portion of capital available for new paper-trade ideas after current allocation.",
      rows: [["Buying power", money(buyingPower)], ["Reserved capital", money(Math.max(0, capital - buyingPower))], ["Active bot", selectedBot.name]],
      notes: ["Wolfie should prefer ideas that leave room for risk controls.", "Large ideas should explain why they deserve more capital."]
    },
    allocated: {
      title: "Allocated to Bots",
      lede: "Capital is distributed across bot characters so each one can process a different style of opportunity.",
      rows: [["Allocated", money(allocated)], ["Bot count", String(bots.length)], ["Largest allocation", money(Math.max(...bots.map((bot) => bot.capital)))]],
      notes: bots.map((bot) => `${bot.name}: ${money(bot.capital)} focused on ${bot.focus.join(", ")}.`)
    },
    pnl: {
      title: "Net P/L",
      lede: "This summarizes the current paper-performance read for the session.",
      rows: [["Net P/L", `+${money(netPnl)}`], ["Return", `${((netPnl / Math.max(1, capital)) * 100).toFixed(2)}%`], ["Status", "Paper calculation"]],
      notes: ["Positive P/L should not increase risk automatically.", "Wolfie still needs source, signal, and risk evidence before proposing action."]
    },
    thoughts: {
      title: "Active Thoughts",
      lede: "Thoughts are market ideas Wolfie is actively monitoring, avoiding, or using as portfolio context.",
      rows: [["Thought count", String(thoughtNodes.length)], ["Invested", String(thoughtNodes.filter((node) => node.state === "Invested").length)], ["Avoiding", String(thoughtNodes.filter((node) => node.state === "Avoiding").length)]],
      notes: thoughtNodes.slice(0, 5).map((node) => `${node.label}: ${node.subtitle} with ${node.confidence}% confidence.`)
    },
    confidence: {
      title: "Top Confidence",
      lede: "The strongest current thought gets elevated, but high confidence still needs risk review.",
      rows: [["Ticker", selectedNode.label], ["Company", selectedNode.company || "UNKNOWN"], ["Confidence", `${selectedNode.confidence}%`]],
      notes: selectedNode.plainLanguage || [selectedNode.thesis]
    }
  };
  const detail = details[cardId] || details.balance;
  return (
    <>
      <p className="micro-label">Dashboard Card</p>
      <h2>{detail.title}</h2>
      <p>{detail.lede}</p>
      {cardId === "confidence" && <StockIdentity node={selectedNode} />}
      <dl>{detail.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div className="education-copy">{detail.notes.map((note) => <p key={note}>{note}</p>)}</div>
    </>
  );
}

function BotDrawer({ bot }: { bot: Bot }) {
  return <><BotCharacter bot={bot} /><p className="micro-label">Bot Character</p><h2>{bot.name}</h2><p>{bot.mood}</p><dl><dt>Capital</dt><dd>{money(bot.capital)}</dd><dt>Focus</dt><dd>{bot.focus.join(", ")}</dd><dt>Confidence</dt><dd>{bot.confidence}%</dd></dl><div className="education-copy"><p>{bot.name} is tuned for {bot.role.toLowerCase()} and reviews {bot.focus.join(", ")} before it proposes an action.</p><p>Use this character view to understand why a bot is cautious, aggressive, defensive, or balanced before trusting its next proposal.</p></div></>;
}

function ActivityDrawer() {
  return <><p className="micro-label">Activity</p><h2>Recent thought changes</h2>{activities.map((item) => <p key={item.id}><b>{item.ticker}</b> · {item.summary}</p>)}</>;
}

function LiveDrawer() {
  return <><p className="micro-label">Live mode locked</p><h2>Live trading is not enabled.</h2><p>Wolfie will not activate Live until account connection, order routing, disclosures, and explicit confirmation exist.</p><ul><li>Account connection not configured</li><li>Risk disclosure not accepted</li><li>Live order routing not implemented</li><li>Current mode remains active</li></ul></>;
}

function StockIdentity({ node }: { node: ThoughtNode }) {
  if (!node.logo) return <span className="stock-identity text-only"><b>{node.label}</b></span>;
  return <span className="stock-identity"><img src={node.logo} alt={`${node.company} logo`} /><b>{node.label}</b><small>{node.company}</small></span>;
}

function StockInline({ node }: { node: ThoughtNode }) {
  return <span className="stock-inline">{node.logo && <img src={node.logo} alt={`${node.company} logo`} />}<b>{node.label}</b></span>;
}
