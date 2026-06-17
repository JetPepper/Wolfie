"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import type { DashboardData, Environment } from "./dashboard-data";

const navigation = [
  "Live Info",
  "MCP Simulation",
  "Paper Account",
  "Strategy Signals",
  "Scenario Lab",
  "Insider Radar",
  "Market Influence",
  "Fused Signals",
  "Audit Log",
  "Settings"
] as const;

const orderPreviewPath = "/api/orders/preview";
const orderPlacePath = "/api/orders/place";
const metallicPanel = "metallic-panel border border-white/[0.09] bg-[linear-gradient(145deg,rgba(244,247,250,0.075)_0%,rgba(21,27,38,0.96)_28%,rgba(8,10,15,0.98)_68%,rgba(110,231,249,0.06)_100%)] shadow-[0_24px_90px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.07)]";
const metallicCard = "metallic-card border border-white/[0.1] bg-[linear-gradient(150deg,rgba(244,247,250,0.09),rgba(21,27,38,0.95)_30%,rgba(16,20,28,0.9)_72%,rgba(167,139,250,0.08))] shadow-[0_24px_90px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)]";
const spectralRail = "bg-gradient-to-r from-[#6EE7F9] via-[#A78BFA] to-[#FBBF24]";
const fieldChrome = "min-w-0 border border-white/[0.1] bg-[linear-gradient(145deg,rgba(21,27,38,0.98),rgba(8,10,15,0.95))] px-3 py-2 font-mono text-sm text-[#F4F7FA] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_36px_rgba(0,0,0,0.2)] outline-none focus:border-[#6EE7F9]/60";
const primaryButton = "min-w-0 border border-[#6EE7F9]/45 bg-[linear-gradient(135deg,rgba(110,231,249,0.2),rgba(167,139,250,0.12))] px-4 py-2 text-sm text-[#F4F7FA] shadow-[0_16px_44px_rgba(110,231,249,0.12),inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-[#6EE7F9]/70";
const secondaryButton = "min-w-0 border border-[#A78BFA]/45 bg-[linear-gradient(135deg,rgba(167,139,250,0.18),rgba(251,191,36,0.08))] px-4 py-2 text-sm text-[#F4F7FA] shadow-[0_16px_44px_rgba(167,139,250,0.11),inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-[#A78BFA]/70";
const warningButton = "min-w-0 border border-[#FBBF24]/45 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(255,92,122,0.08))] px-4 py-2 text-sm text-[#F4F7FA] shadow-[0_16px_44px_rgba(251,191,36,0.1),inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-[#FBBF24]/70";

type Section = (typeof navigation)[number];

export default function WolfieDashboard({ initialData, apiBaseUrl }: { initialData: DashboardData; apiBaseUrl: string }) {
  return <AppShell initialData={initialData} apiBaseUrl={apiBaseUrl} />;
}

function AppShell({ initialData, apiBaseUrl }: { initialData: DashboardData; apiBaseUrl: string }) {
  const [activeSection, setActiveSection] = useState<Section>("Live Info");
  const [data, setData] = useState(initialData);
  const [command, setCommand] = useState("");
  const [actionMessage, setActionMessage] = useState("UNKNOWN");
  const filteredAudit = useMemo(() => filterAudit(data.audit, command), [data.audit, command]);

  async function refresh(paths?: Partial<DashboardData>) {
    setData({ ...data, ...(paths || {}) });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_-10%,rgba(110,231,249,0.16),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(167,139,250,0.14),transparent_32%),linear-gradient(180deg,#080A0F_0%,#0B0E14_48%,#080A0F_100%)] text-[#F4F7FA]">
      <TruthBanner environment={data.environment} backendStatus={data.backendStatus} marketDataMode={String(data.capabilities.capabilities?.market_data_mode ?? data.environment.market_data_mode ?? "UNKNOWN")} sourceMode={data.quote.source_mode ?? data.capabilities.status ?? "UNKNOWN"} />
      <div className="grid min-h-[calc(100vh-88px)] lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/[0.08] bg-[linear-gradient(180deg,rgba(21,27,38,0.96)_0%,rgba(8,10,15,0.98)_72%)] p-4 shadow-[18px_0_80px_rgba(0,0,0,0.28)]">
          <div className={`${metallicPanel} mb-5 overflow-hidden p-4`}>
            <div className={`${spectralRail} mb-4 h-px w-full opacity-80`} />
            <div className="break-words font-display text-lg tracking-wide">Wolfie</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <EnvironmentBadge label={data.environment.environment} status="simulated" />
              <EnvironmentBadge label={data.environment.execution} status="simulated" />
              <BackendStatusBadge status={data.backendStatus.status === "ok" ? "connected" : "disconnected"} />
            </div>
          </div>
          <nav className="grid gap-1">
            {navigation.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveSection(item)}
                className={`w-full min-w-0 border px-3 py-2 text-left text-sm transition ${activeSection === item ? "border-[#6EE7F9]/50 bg-[linear-gradient(90deg,rgba(110,231,249,0.13),rgba(167,139,250,0.07))] text-[#F4F7FA] shadow-[inset_2px_0_0_#6EE7F9,0_14px_40px_rgba(0,0,0,0.22)]" : "border-transparent text-[#9BA6B2] hover:border-white/[0.08] hover:bg-white/[0.03]"}`}
              >
                <span className="block whitespace-normal break-words">{item}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <CommandBar value={command} onChange={setCommand} activeSection={activeSection} actionMessage={actionMessage} />
          <div className="mx-auto max-w-7xl px-5 py-6">
            {data.backendStatus.status !== "ok" && <ErrorState title="Backend disconnected" body="Wolfie is showing UNKNOWN fallback data until the local FastAPI backend responds at the configured API base URL." />}
            {activeSection === "Live Info" && <LiveInfoPage data={data} />}
            {activeSection === "MCP Simulation" && <MCPSimulationPage data={data} />}
            {activeSection === "Paper Account" && <PaperAccountPage data={data} apiBaseUrl={apiBaseUrl} onData={refresh} onMessage={setActionMessage} />}
            {activeSection === "Strategy Signals" && <StrategySignalsPage data={data} apiBaseUrl={apiBaseUrl} onData={refresh} onMessage={setActionMessage} />}
            {activeSection === "Scenario Lab" && <ScenarioLabPage data={data} apiBaseUrl={apiBaseUrl} onData={refresh} onMessage={setActionMessage} />}
            {activeSection === "Insider Radar" && <InsiderRadarPage data={data} apiBaseUrl={apiBaseUrl} onData={refresh} onMessage={setActionMessage} />}
            {activeSection === "Market Influence" && <MarketInfluencePage data={data} apiBaseUrl={apiBaseUrl} onData={refresh} onMessage={setActionMessage} />}
            {activeSection === "Fused Signals" && <FusedSignalsPage data={data} apiBaseUrl={apiBaseUrl} onData={refresh} onMessage={setActionMessage} />}
            {activeSection === "Audit Log" && <AuditLogPage audit={filteredAudit} query={command} />}
            {activeSection === "Settings" && <SettingsPage data={data} apiBaseUrl={apiBaseUrl} onData={refresh} onMessage={setActionMessage} />}
          </div>
        </section>
      </div>
    </main>
  );
}

function CommandBar({ value, onChange, activeSection, actionMessage }: { value: string; onChange: (value: string) => void; activeSection: string; actionMessage: string }) {
  return (
    <div className="sticky top-0 z-20 border-b border-white/[0.08] bg-[linear-gradient(180deg,rgba(8,10,15,0.98),rgba(8,10,15,0.88))] px-5 py-4 shadow-[0_18px_70px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-[#6EE7F9]">SIMULATED_LIVE_MCP_LOCAL</div>
          <h1 className="mt-1 break-words font-display text-2xl text-[#F4F7FA]">{activeSection}</h1>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:max-w-2xl">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Filter audit, source_mode, symbol, strategy, order id"
            className="min-w-0 flex-1 border border-white/[0.1] bg-[linear-gradient(145deg,rgba(21,27,38,0.94),rgba(8,10,15,0.96))] px-3 py-2 font-mono text-sm text-[#F4F7FA] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_50px_rgba(0,0,0,0.22)] outline-none focus:border-[#6EE7F9]/60"
          />
          <DataProvenanceChip status="simulated" sourceMode={actionMessage} />
        </div>
      </div>
    </div>
  );
}

function TruthBanner({ environment, backendStatus, marketDataMode, sourceMode }: { environment: Environment; backendStatus: { status: string }; marketDataMode: string; sourceMode: string }) {
  const items = [
    ["Environment", "SIMULATED_LIVE_MCP_LOCAL"],
    ["Broker interface", "Robinhood-compatible MCP simulation"],
    ["Execution", "PaperExchange"],
    ["Real Robinhood connected", String(environment.real_robinhood_connected)],
    ["Robinhood login required", String(environment.robinhood_login_required)],
    ["Live order submitted", String(environment.live_order_submitted)],
    ["Real money at risk", String(environment.real_money_at_risk)],
    ["Backend status", backendStatus.status === "ok" ? "connected" : "disconnected"],
    ["Market data mode", marketDataMode],
    ["Current source mode", sourceMode]
  ];
  return (
    <div className="border-b border-white/[0.08] bg-[linear-gradient(100deg,rgba(110,231,249,0.16),rgba(21,27,38,0.98)_28%,rgba(167,139,250,0.14)_70%,rgba(251,191,36,0.08))] px-4 py-3 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
      <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-5 xl:grid-cols-10">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#9BA6B2]">{label}</div>
            <div className="mt-1 whitespace-normal break-words font-mono text-xs text-[#F4F7FA]">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnvironmentBadge({ label, status }: { label: string; status: string }) {
  return <DataProvenanceChip status={status} sourceMode={label} />;
}

function BackendStatusBadge({ status }: { status: string }) {
  const connected = status === "connected";
  return (
    <span className={`inline-flex items-center gap-2 border px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${connected ? "border-[#38D996]/30 bg-[#38D996]/10 text-[#38D996]" : "border-[#FF5C7A]/30 bg-[#FF5C7A]/10 text-[#FF5C7A]"}`}>
      <span className={`h-1.5 w-1.5 ${connected ? "bg-[#38D996]" : "bg-[#FF5C7A]"}`} />
      Backend {status}
    </span>
  );
}

function DataProvenanceChip({ status, sourceMode }: { status?: string; sourceMode?: string }) {
  const normalized = status || "UNKNOWN";
  const source = sourceMode || "UNKNOWN";
  const showStatus = normalized !== "simulated";
  const showSourceMode = source !== "simulated";
  const color = normalized === "UNKNOWN" ? "text-[#8B95A1]" : normalized === "rejected" ? "text-[#FF5C7A]" : normalized === "stale" ? "text-[#FBBF24]" : "text-[#6EE7F9]";
  if (!showStatus && !showSourceMode) return null;
  return (
    <span className={`inline-flex max-w-full min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 border border-white/[0.1] bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025))] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] shadow-[0_10px_32px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] ${color}`}>
      {showStatus && <span className="min-w-0 whitespace-normal break-words">{normalized}</span>}
      {showSourceMode && <span className="min-w-0 whitespace-normal break-words text-[#9BA6B2]">{source}</span>}
    </span>
  );
}

function MetricCard({ label, value, status, sourceMode }: { label: string; value: any; status?: string; sourceMode?: string }) {
  return (
    <div className={`${metallicCard} min-w-0 overflow-hidden p-4`}>
      <div className="mb-3 grid min-w-0 gap-2">
        <span className="min-w-0 whitespace-normal break-words text-xs uppercase tracking-[0.18em] text-[#9BA6B2]">{label}</span>
        <DataProvenanceChip status={status} sourceMode={sourceMode} />
      </div>
      <div className="min-w-0 whitespace-normal break-words font-mono text-2xl text-[#F4F7FA]">{display(value)}</div>
    </div>
  );
}

function Panel({ title, children, status, sourceMode }: { title: string; children: ReactNode; status?: string; sourceMode?: string }) {
  return (
    <section className={`${metallicPanel} min-w-0 overflow-hidden`}>
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4">
        <h2 className="min-w-0 whitespace-normal break-words font-display text-sm uppercase tracking-[0.2em] text-[#F4F7FA]">{title}</h2>
        {(status || sourceMode) && <DataProvenanceChip status={status} sourceMode={sourceMode} />}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function LiveInfoPage({ data }: { data: DashboardData }) {
  const openOrders = data.orders.filter((order) => !isClosedOrder(order));
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Paper account value" value={data.account.equity} status={data.account.status} sourceMode={data.account.source_mode} />
        <MetricCard label="Cash" value={data.account.cash} status={data.account.status} sourceMode={data.account.source_mode} />
        <MetricCard label="Buying power" value={data.account.buying_power} status={data.account.status} sourceMode={data.account.source_mode} />
        <MetricCard label="Daily P&L" value={data.account.day_pnl ?? "UNKNOWN"} status={data.account.status ?? "UNKNOWN"} sourceMode={data.account.source_mode} />
        <MetricCard label="Latest quote" value={data.quote.last} status={data.quote.status} sourceMode={data.quote.source_mode} />
        <MetricCard label="Open orders" value={openOrders.length} status="calculated" sourceMode="PaperExchange" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Open Positions" status="simulated" sourceMode="PaperExchange">{data.positions.length ? data.positions.map((position) => <PositionCard key={position.symbol} position={position} />) : <UnknownDataState />}</Panel>
        <Panel title="Recent Orders" status="simulated" sourceMode="PaperExchange"><OrderTable orders={data.orders.slice(-6)} /></Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Recent Signals" status={data.recent.status} sourceMode="SignalIntelligenceEngine"><SignalFeed signals={(data.recent.signals || []).slice(-5)} /></Panel>
        <Panel title="Recent Risk Blocks" status="calculated" sourceMode="RiskManager">{(data.recent.risk_checks || []).slice(-4).map((risk: any, index: number) => <RiskBlockCard key={index} risk={risk} />)}</Panel>
        <Panel title="Recent Audit Events" status="simulated" sourceMode="AuditLog"><AuditRows audit={data.audit.slice(-5)} /></Panel>
      </div>
    </div>
  );
}

function MCPSimulationPage({ data }: { data: DashboardData }) {
  const toolCalls = data.audit.filter((event) => event.event_type === "mcp_tool_call").slice(-8);
  const failedCalls = data.audit.filter((event) => ["missing_data", "data_integrity_violation", "order_rejected"].includes(event.event_type)).slice(-8);
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="MCP server status" value={data.capabilities.status} status={data.capabilities.status} sourceMode="RobinhoodSimMCPServer" />
        <MetricCard label="Market data mode" value={data.capabilities.capabilities?.market_data_mode ?? data.environment.market_data_mode ?? "UNKNOWN"} status="simulated" sourceMode="SIM_STATIC_FIXTURE" />
        <MetricCard label="Available tools" value={data.tools.tools.length} status={data.tools.status} sourceMode="RobinhoodSimMCPServer" />
      </div>
      <Panel title="Available Tools" status={data.tools.status} sourceMode="RobinhoodSimMCPServer">
        <div className="flex flex-wrap gap-2">{data.tools.tools.length ? data.tools.tools.map((tool) => <DataProvenanceChip key={tool} status="simulated" sourceMode={tool} />) : <UnknownDataState />}</div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Latest Tool Calls" status="simulated" sourceMode="AuditLog"><AuditRows audit={toolCalls} /></Panel>
        <Panel title="Latest Blocked Or Failed Calls" status={failedCalls.length ? "rejected" : "UNKNOWN"} sourceMode="AuditLog"><AuditRows audit={failedCalls} /></Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <InfoCard title="Quote Data" rows={objectRows(data.quote, ["symbol", "bid", "ask", "last", "volume", "timestamp"])} status={data.quote.status} sourceMode={data.quote.source_mode} />
        <InfoCard title="Instrument Data" rows={objectRows(data.instrument, ["symbol", "name", "asset_type", "tradeable", "marginable", "shortable", "options_enabled"])} status={data.instrument.status} sourceMode={data.instrument.source_mode} />
        <InfoCard title="Trading Hours" rows={objectRows(data.tradingHours, ["market_open", "market_close", "is_open", "timezone"])} status={data.tradingHours.status} sourceMode={data.tradingHours.source_mode} />
      </div>
      <Panel title="Fee Schedule" status={data.fees.status} sourceMode={data.fees.source_mode}><FeeRows fees={data.fees} /></Panel>
    </div>
  );
}

function PaperAccountPage({ data, apiBaseUrl, onData, onMessage }: ActionPageProps) {
  const openOrders = data.orders.filter((order) => !isClosedOrder(order));
  const closedOrders = data.orders.filter(isClosedOrder);
  const latestOrder = data.orders[data.orders.length - 1];
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Equity" value={data.account.equity} status={data.account.status} sourceMode="PaperExchange" />
        <MetricCard label="Cash" value={data.account.cash} status={data.account.status} sourceMode="PaperExchange" />
        <MetricCard label="Buying power" value={data.account.buying_power} status={data.account.status} sourceMode="PaperExchange" />
        <MetricCard label="Realized P&L" value={data.account.realized_pnl} status={data.account.status} sourceMode="PaperExchange" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Manual Limit Order" status="simulated" sourceMode="PaperExchange">
          <ManualTestOrderForm apiBaseUrl={apiBaseUrl} onMessage={onMessage} />
        </Panel>
        <Panel title="Order Lifecycle Timeline" status={latestOrder?.status ?? "UNKNOWN"} sourceMode="PaperExchange">
          <OrderLifecycleTimeline status={latestOrder?.status ?? "UNKNOWN"} />
        </Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Open Orders" status="simulated" sourceMode="PaperExchange">
          <OrderTable orders={openOrders} />
          <OrderControls apiBaseUrl={apiBaseUrl} orders={openOrders} onData={onData} onMessage={onMessage} />
        </Panel>
        <Panel title="Closed Orders" status="simulated" sourceMode="PaperExchange"><OrderTable orders={closedOrders.slice(-8)} /></Panel>
      </div>
      <Panel title="Positions" status="simulated" sourceMode="PaperExchange">{data.positions.length ? data.positions.map((position) => <PositionCard key={position.symbol} position={position} />) : <UnknownDataState />}</Panel>
    </div>
  );
}

type ActionPageProps = {
  data: DashboardData;
  apiBaseUrl: string;
  onData: (data: Partial<DashboardData>) => void;
  onMessage: (message: string) => void;
};

function ManualTestOrderForm({ apiBaseUrl, onMessage }: { apiBaseUrl: string; onMessage: (message: string) => void }) {
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState({ symbol: "AAPL", side: "buy", quantity: "1", limit_price: "200" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runOrderAction(action: "preview" | "place") {
    const body = {
      symbol: form.symbol.toUpperCase(),
      side: form.side,
      "order_type": "limit",
      quantity: Number(form.quantity),
      limit_price: Number(form.limit_price)
    };
    const path = action === "preview" ? orderPreviewPath : orderPlacePath;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      setResult(payload);
      onMessage(`${action}:${payload.status ?? "UNKNOWN"}`);
    } catch {
      setError("Order action failed. Backend status is UNKNOWN.");
      onMessage(`${action}:UNKNOWN`);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runOrderAction("preview");
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-[#F4F7FA]">Limit orders only</div>
        <DataProvenanceChip status="simulated" sourceMode="PaperExchange" />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Symbol" value={form.symbol} onChange={(value) => setForm({ ...form, symbol: value })} />
        <label className="grid gap-2 text-xs uppercase tracking-[0.16em] text-[#9BA6B2]">
          Side
          <select value={form.side} onChange={(event) => setForm({ ...form, side: event.target.value })} className={fieldChrome}>
            <option value="buy">buy</option>
            <option value="sell">sell</option>
          </select>
        </label>
        <Field label="Quantity" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: value })} />
        <Field label="Limit price" value={form.limit_price} onChange={(value) => setForm({ ...form, limit_price: value })} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryButton}>Preview order</button>
        <button type="button" onClick={() => runOrderAction("place")} className={secondaryButton}>Place order</button>
      </div>
      {loading && <LoadingState label="Routing simulated order through PaperExchange" />}
      {error && <ErrorState title="Order action error" body={error} />}
      {result ? <InfoCard title="Order Preview Result" rows={objectRows(result, ["symbol", "side", "order_type", "requested_quantity", "filled_quantity", "remaining_quantity", "status", "live_order_submitted"])} status={result.status} sourceMode={result.source_mode} /> : <UnknownDataState />}
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-xs uppercase tracking-[0.16em] text-[#9BA6B2]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className={fieldChrome} />
    </label>
  );
}

function OrderControls({ apiBaseUrl, orders, onData, onMessage }: { apiBaseUrl: string; orders: Array<Record<string, any>>; onData: (data: Partial<DashboardData>) => void; onMessage: (message: string) => void }) {
  const firstOrder = orders[0];
  async function post(path: string, body: Record<string, any>) {
    const response = await fetch(`${apiBaseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    const refreshed = await fetch(`${apiBaseUrl}/api/orders`).then((item) => item.json());
    onData({ orders: refreshed });
    onMessage(`${path}:${payload.status ?? "UNKNOWN"}`);
  }
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button disabled={!firstOrder} onClick={() => firstOrder && post("/api/orders/cancel", { order_id: firstOrder.order_id })} className={`${warningButton} disabled:border-white/[0.08] disabled:bg-white/[0.03] disabled:text-[#5F6B7A] disabled:shadow-none`}>Cancel first open order</button>
      <button disabled={!firstOrder} onClick={() => firstOrder && post("/api/orders/replace", { order_id: firstOrder.order_id, quantity: firstOrder.remaining_quantity, limit_price: firstOrder.limit_price })} className={`${secondaryButton} disabled:border-white/[0.08] disabled:bg-white/[0.03] disabled:text-[#5F6B7A] disabled:shadow-none`}>Replace first open order</button>
    </div>
  );
}

function StrategySignalsPage({ data, apiBaseUrl, onData, onMessage }: ActionPageProps) {
  async function runStrategies() {
    const result = await fetch(`${apiBaseUrl}/api/strategies/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol: "AAPL", submit: false }) }).then((response) => response.json());
    const recent = await fetch(`${apiBaseUrl}/api/signals/recent`).then((response) => response.json());
    onData({ recent });
    onMessage(`strategies:${result.status ?? "simulated"}`);
  }
  return (
    <div className="grid gap-5">
      <div className="flex justify-end"><button onClick={runStrategies} className={primaryButton}>Run strategies</button></div>
      <Panel title="Enabled Strategies" status={data.strategies.status} sourceMode="StrategyOrchestrator"><DataRows rows={(data.strategies.strategies || []).map((strategy) => [strategy.strategy_name, strategy.setup_type, String(strategy.enabled), data.strategies.status])} headers={["Strategy", "Setup", "Enabled", "Status"]} /></Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Generated Signals" status={data.recent.status} sourceMode="SignalIntelligenceEngine"><SignalFeed signals={data.recent.signals || []} /></Panel>
        <Panel title="Confluence Scores" status="calculated" sourceMode="ConfluenceScorer"><DataRows rows={(data.recent.scores || []).map((score: any) => [score.score, score.action, score.status])} headers={["Score", "Action", "Status"]} /></Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Cost Previews" status="estimated" sourceMode="CostModel">{(data.recent.cost_previews || []).map((cost: any, index: number) => <CostPreviewCard key={index} cost={cost} />)}</Panel>
        <Panel title="Risk Checks And Blocks" status="calculated" sourceMode="RiskManager">{(data.recent.risk_checks || []).map((risk: any, index: number) => <RiskBlockCard key={index} risk={risk} />)}</Panel>
        <Panel title="Execution Plans" status="simulated" sourceMode="ExecutionPlanner"><DataRows rows={(data.recent.execution_plans || []).map((plan: any) => [plan.symbol ?? "UNKNOWN", plan.side ?? "UNKNOWN", plan.order_type ?? "UNKNOWN", plan.quantity ?? "UNKNOWN", plan.status])} headers={["Symbol", "Side", "Type", "Qty", "Status"]} /></Panel>
      </div>
    </div>
  );
}

function ScenarioLabPage({ data, apiBaseUrl, onData, onMessage }: ActionPageProps) {
  const [selected, setSelected] = useState(data.scenarios.scenarios[0]?.scenario_id ?? "UNKNOWN");
  const scenario = data.scenarios.scenarios.find((item) => item.scenario_id === selected) || data.scenarios.scenarios[0];
  async function scenarioAction(action: "load" | "replay") {
    if (!scenario) return;
    const result = await fetch(`${apiBaseUrl}/api/scenarios/${scenario.scenario_id}/${action}`, { method: "POST" }).then((response) => response.json());
    const replayRuns = await fetch(`${apiBaseUrl}/api/replay/runs`).then((response) => response.json());
    onData({ replayRuns });
    onMessage(`${action}:${result.status ?? "simulated"}`);
  }
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Available Scenarios" status={data.scenarios.status} sourceMode="SIM_REPLAY_DATA">
          <div className="grid gap-2">{data.scenarios.scenarios.map((item) => <ScenarioCard key={item.scenario_id} scenario={item} active={item.scenario_id === selected} onSelect={() => setSelected(item.scenario_id)} />)}</div>
        </Panel>
        <Panel title="Scenario Details" status={scenario?.status ?? "UNKNOWN"} sourceMode={scenario?.source_mode ?? "SIM_REPLAY_DATA"}>
          {scenario ? <InfoCard title={scenario.scenario_name} rows={objectRows(scenario, ["scenario_id", "description", "expected_behavior", "source_mode", "status"])} status={scenario.status} sourceMode={scenario.source_mode} /> : <UnknownDataState />}
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => scenarioAction("load")} className={secondaryButton}>Load scenario</button>
            <button onClick={() => scenarioAction("replay")} className={primaryButton}>Instant replay</button>
          </div>
        </Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Replay Run History" status={data.replayRuns.status} sourceMode="ReplayEngine"><ReplayTimeline runs={data.replayRuns.runs || []} /></Panel>
        <Panel title="Scenario Validation Result" status="UNKNOWN" sourceMode="ScenarioValidator"><UnknownDataState /></Panel>
        <Panel title="Expected Vs Actual Behavior" status={scenario?.status ?? "UNKNOWN"} sourceMode="SIM_REPLAY_DATA"><DataRows rows={[[scenario?.expected_behavior ?? "UNKNOWN", "UNKNOWN"]]} headers={["Expected", "Actual"]} /></Panel>
      </div>
      <Panel title="Data Integrity Violations" status="UNKNOWN" sourceMode="AuditLog"><AuditRows audit={data.audit.filter((event) => event.event_type === "data_integrity_violation")} /></Panel>
    </div>
  );
}

function InsiderRadarPage({ data, apiBaseUrl, onData, onMessage }: ActionPageProps) {
  async function ingestFixture() {
    const result = await fetch(`${apiBaseUrl}/api/insiders/ingest-fixture`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixture: "open_market_purchase_winner.json" }) }).then((response) => response.json());
    const [insiderEvents, insiderAlerts, insiderLeaderboard, insiderClusters] = await Promise.all([
      fetch(`${apiBaseUrl}/api/insiders/events`).then((response) => response.json()),
      fetch(`${apiBaseUrl}/api/insiders/alerts`).then((response) => response.json()),
      fetch(`${apiBaseUrl}/api/insiders/leaderboard`).then((response) => response.json()),
      fetch(`${apiBaseUrl}/api/insiders/clusters`).then((response) => response.json())
    ]);
    onData({ insiderEvents, insiderAlerts, insiderLeaderboard, insiderClusters });
    onMessage(`insider:${result.status ?? "simulated"}`);
  }
  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <DataProvenanceChip status="simulated" sourceMode="simulated/replay/fixture derived" />
        <button onClick={ingestFixture} className={primaryButton}>Ingest Form 4 fixture</button>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Form 4 Events" status={data.insiderEvents.status} sourceMode="SIM_REPLAY_DATA">{data.insiderEvents.events.length ? data.insiderEvents.events.map((event, index) => <InsiderEventCard key={index} event={event} />) : <UnknownDataState />}</Panel>
        <Panel title="Insider Alerts" status={data.insiderAlerts.status} sourceMode="SIM_REPLAY_DATA"><DataRows rows={(data.insiderAlerts.alerts || []).map((alert) => [alert.ticker, alert.owner_name, alert.insider_signal_score, alert.signal_grade, alert.recommended_action, alert.status])} headers={["Ticker", "Owner", "Score", "Grade", "Action", "Status"]} /></Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Top 20 Insiders" status={data.insiderLeaderboard.status} sourceMode={data.insiderLeaderboard.source_mode}><DataRows rows={[...(data.insiderLeaderboard.top_buyers || []), ...(data.insiderLeaderboard.top_sellers || [])].slice(0, 20).map((row: any) => [row.owner_name, row.total_dollar_value, data.insiderLeaderboard.label, row.status])} headers={["Insider", "Dollar Value", "Label", "Status"]} /></Panel>
        <Panel title="Cluster Buying Panel" status={data.insiderClusters.status} sourceMode={data.insiderClusters.source_mode}><InfoCard title="Cluster" rows={objectRows(data.insiderClusters, ["cluster_detected", "ticker", "insiders", "total_dollar_value", "cluster_score"])} status={data.insiderClusters.status} sourceMode={data.insiderClusters.source_mode} /></Panel>
      </div>
    </div>
  );
}

function MarketInfluencePage({ data, apiBaseUrl, onData, onMessage }: ActionPageProps) {
  async function ingestFixture() {
    const result = await fetch(`${apiBaseUrl}/api/influence/ingest-fixture`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixture: "news_breakout_continuation.json" }) }).then((response) => response.json());
    const [influenceFeed, influenceAlerts, influenceSourceStats] = await Promise.all([
      fetch(`${apiBaseUrl}/api/influence/feed`).then((response) => response.json()),
      fetch(`${apiBaseUrl}/api/influence/alerts`).then((response) => response.json()),
      fetch(`${apiBaseUrl}/api/influence/source-stats`).then((response) => response.json())
    ]);
    onData({ influenceFeed, influenceAlerts, influenceSourceStats });
    onMessage(`influence:${result.status ?? "simulated"}`);
  }
  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <DataProvenanceChip status="simulated" sourceMode="simulated/replay/fixture derived" />
        <button onClick={ingestFixture} className={primaryButton}>Ingest influence fixture</button>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="News Social Chatter Feed" status={data.influenceFeed.status} sourceMode="SIM_REPLAY_DATA">{data.influenceFeed.feed.length ? data.influenceFeed.feed.map((event, index) => <InfluenceEventCard key={index} event={event} />) : <UnknownDataState />}</Panel>
        <Panel title="Ticker Attention Radar" status={data.influenceAlerts.status} sourceMode="MarketInfluenceEngine"><DataRows rows={(data.influenceAlerts.alerts || []).map((alert) => [alert.ticker, alert.influence_score, alert.signal_type, alert.recommended_action, alert.status])} headers={["Ticker", "Score", "Signal", "Action", "Status"]} /></Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Sentiment Urgency Novelty" status="calculated" sourceMode="SentimentScorer"><MiniBarChart values={(data.influenceAlerts.alerts || []).map((alert) => alert.influence_score || 0)} /></Panel>
        <Panel title="Rumor Risk" status="calculated" sourceMode="RumorRiskFilter"><UnknownDataState /></Panel>
        <Panel title="Source Influence Panel" status={data.influenceSourceStats.status} sourceMode="MarketInfluenceEngine"><DataRows rows={(data.influenceSourceStats.source_stats || []).map((source) => [source.source_type, source.count, source.status])} headers={["Source", "Count", "Status"]} /></Panel>
      </div>
      <Panel title="Market Confirmation" status="calculated" sourceMode="MarketReactionAnalyzer"><DataRows rows={(data.influenceAlerts.alerts || []).map((alert) => [alert.ticker, alert.recommended_action, alert.status])} headers={["Ticker", "Action", "Status"]} /></Panel>
    </div>
  );
}

function FusedSignalsPage({ data, apiBaseUrl, onData, onMessage }: ActionPageProps) {
  async function fuseSignals() {
    const insider = data.insiderAlerts.alerts[0] || { insider_signal_score: 0, status: "UNKNOWN" };
    const influence = data.influenceAlerts.alerts[0] || { influence_score: 0, status: "UNKNOWN" };
    const result = await fetch(`${apiBaseUrl}/api/signals/fuse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        insider_signal: insider,
        influence_signal: influence,
        market_context: { market_confirmation: true, spread_bps: 12, quote_status: "simulated" },
        cost_risk_context: { risk: { passed: true } }
      })
    }).then((response) => response.json());
    const fusedSignals = await fetch(`${apiBaseUrl}/api/signals/fused`).then((response) => response.json());
    onData({ fusedSignals });
    onMessage(`fused:${result.status ?? "UNKNOWN"}`);
  }
  return (
    <div className="grid gap-5">
      <div className="flex justify-end"><button onClick={fuseSignals} className={primaryButton}>Fuse current signals</button></div>
      <Panel title="Fused Signal Feed" status={data.fusedSignals.status} sourceMode="SignalFusionEngine">{data.fusedSignals.signals.length ? data.fusedSignals.signals.map((signal, index) => <FusedSignalCard key={index} signal={signal} />) : <UnknownDataState />}</Panel>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Contributing Signals" status="simulated" sourceMode="SignalFusionEngine"><SignalFeed signals={[...(data.insiderAlerts.alerts || []), ...(data.influenceAlerts.alerts || [])]} /></Panel>
        <Panel title="Risk Readiness" status="calculated" sourceMode="RiskManager">{(data.recent.risk_checks || []).slice(-3).map((risk: any, index: number) => <RiskBlockCard key={index} risk={risk} />)}</Panel>
        <Panel title="Paper Trade Candidate" status="simulated" sourceMode="PaperExchange"><DataRows rows={(data.fusedSignals.signals || []).map((signal) => [signal.signal_type, signal.recommended_action, String(signal.recommended_action || "").includes("paper_trade_signal"), signal.status])} headers={["Signal", "Action", "Candidate", "Status"]} /></Panel>
      </div>
    </div>
  );
}

function AuditLogPage({ audit, query }: { audit: Array<Record<string, any>>; query: string }) {
  return (
    <div className="grid gap-5">
      <Panel title="Audit Filters" status="calculated" sourceMode={query || "event type source_mode symbol strategy order id"}>
        <DataRows rows={[["event type", "source_mode", "symbol", "strategy", "order id"]]} headers={["Filter", "Mode", "Symbol", "Strategy", "Order"]} />
      </Panel>
      <Panel title="Searchable Audit Events" status="simulated" sourceMode="AuditLog">
        {audit.length ? audit.map((event, index) => <AuditEventRow key={index} event={event} />) : <UnknownDataState />}
      </Panel>
    </div>
  );
}

function SettingsPage({ data, apiBaseUrl, onData, onMessage }: ActionPageProps) {
  async function resetPaperAccount() {
    const result = await fetch(`${apiBaseUrl}/api/paper/reset`, { method: "POST" }).then((response) => response.json());
    const account = await fetch(`${apiBaseUrl}/api/paper/account`).then((response) => response.json());
    const orders = await fetch(`${apiBaseUrl}/api/orders`).then((response) => response.json());
    onData({ account, orders, positions: [] });
    onMessage(`reset:${result.status ?? "simulated"}`);
  }
  return (
    <div className="grid gap-5">
      <Panel title="Paper Account Reset" status="simulated" sourceMode="PaperExchange">
        <button onClick={resetPaperAccount} className={warningButton}>Reset paper account</button>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        <SettingsPanel title="Cost Model Settings" settings={data.costSettings.settings || {}} status={data.costSettings.status} />
        <SettingsPanel title="Risk Settings" settings={data.riskSettings.settings || {}} status={data.riskSettings.status} />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <InfoCard title="Allowed Symbols" rows={[["allowed_symbols", (data.riskSettings.settings?.allowed_symbols || ["UNKNOWN"]).join(", ")]]} status={data.riskSettings.status} sourceMode="RiskManager" />
        <InfoCard title="Market Data Mode" rows={[["market_data_mode", data.capabilities.capabilities?.market_data_mode ?? "UNKNOWN"]]} status="simulated" sourceMode="RobinhoodSimMCPServer" />
        <InfoCard title="Read-Only Safety Configuration" rows={[["environment mode", "SIMULATED_LIVE_MCP_LOCAL"], ["live trading disabled", "true"], ["starting cash", 25000]]} status="simulated" sourceMode="ProductRules" />
      </div>
    </div>
  );
}

function PositionCard({ position }: { position: Record<string, any> }) {
  return <InfoCard title={position.symbol ?? "UNKNOWN"} rows={objectRows(position, ["quantity", "avg_entry_price", "market_price", "market_value", "unrealized_pnl", "realized_pnl"])} status={position.status} sourceMode={position.source_mode} />;
}

function OrderLifecycleTimeline({ status }: { status: string }) {
  const states = ["previewed", "accepted", "pending", "partially_filled", "filled", "cancelled", "replaced", "rejected"];
  return (
    <div className="grid gap-3">
      {states.map((state, index) => (
        <div key={state} className="flex min-w-0 items-center gap-3">
          <div className={`h-2.5 w-2.5 shrink-0 border border-white/20 shadow-[0_0_26px_rgba(110,231,249,0.18)] ${state === status ? "bg-gradient-to-br from-[#6EE7F9] via-[#A78BFA] to-[#FBBF24]" : index % 3 === 0 ? "bg-[#151B26]" : index % 3 === 1 ? "bg-[#1B2030]" : "bg-[#201D2E]"}`} />
          <span className={`min-w-0 whitespace-normal break-words font-mono text-xs uppercase tracking-[0.14em] ${state === status ? "text-[#F4F7FA]" : "text-[#5F6B7A]"}`}>{state}</span>
        </div>
      ))}
      <DataProvenanceChip status={status} sourceMode="PaperExchange" />
    </div>
  );
}

function SignalFeed({ signals }: { signals: Array<Record<string, any>> }) {
  if (!signals.length) return <EmptyState title="No signals yet" body="Run strategies or ingest simulated fixtures to populate this feed." />;
  return <DataRows rows={signals.map((signal) => [signal.strategy_name || signal.ticker || signal.signal_type || "UNKNOWN", signal.symbol || signal.ticker || "UNKNOWN", signal.side || signal.recommended_action || "UNKNOWN", signal.confidence_score || signal.insider_signal_score || signal.influence_score || "UNKNOWN", signal.status || "UNKNOWN"])} headers={["Source", "Symbol", "Action", "Score", "Status"]} />;
}

function RiskBlockCard({ risk }: { risk: Record<string, any> }) {
  return <InfoCard title={risk.reason_code ?? "UNKNOWN"} rows={objectRows(risk, ["passed", "severity", "reason_code", "missing_inputs", "status"])} status={risk.status} sourceMode="RiskManager" />;
}

function CostPreviewCard({ cost }: { cost: Record<string, any> }) {
  return <InfoCard title="Cost Preview" rows={[["total_estimated_cost", cost.total_estimated_cost?.value ?? "UNKNOWN"], ["cost_status", cost.total_estimated_cost?.status ?? "UNKNOWN"], ["net_pnl_after_costs", cost.net_pnl_after_costs?.value ?? "UNKNOWN"], ["status", cost.status ?? "UNKNOWN"]]} status={cost.status} sourceMode="CostModel" />;
}

function ScenarioCard({ scenario, active, onSelect }: { scenario: Record<string, any>; active: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`min-w-0 border p-4 text-left shadow-[0_14px_44px_rgba(0,0,0,0.18)] transition ${active ? "border-[#6EE7F9]/50 bg-[linear-gradient(135deg,rgba(110,231,249,0.13),rgba(167,139,250,0.08))]" : "border-white/[0.08] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] hover:border-white/[0.14]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="whitespace-normal break-words font-display text-sm text-[#F4F7FA]">{scenario.scenario_name}</div>
          <div className="mt-2 whitespace-normal break-words font-mono text-xs text-[#9BA6B2]">{scenario.scenario_id}</div>
        </div>
        <DataProvenanceChip status={scenario.status} sourceMode={scenario.source_mode} />
      </div>
    </button>
  );
}

function ReplayTimeline({ runs }: { runs: Array<Record<string, any>> }) {
  if (!runs.length) return <EmptyState title="No replay runs" body="Load a scenario and run instant replay to populate the decision timeline." />;
  return <DataRows rows={runs.slice(-8).map((run) => [run.scenario_id, run.replay_id, run.speed, run.status])} headers={["Scenario", "Replay", "Speed", "Status"]} />;
}

function InsiderEventCard({ event }: { event: Record<string, any> }) {
  return <InfoCard title={`${event.ticker ?? "UNKNOWN"} ${event.transaction_code ?? "UNKNOWN"}`} rows={objectRows(event, ["owner_name", "owner_role", "transaction_code", "dollar_value", "source_mode", "status"])} status={event.status} sourceMode={event.source_mode} />;
}

function InfluenceEventCard({ event }: { event: Record<string, any> }) {
  return <InfoCard title={event.headline ?? "UNKNOWN"} rows={objectRows(event, ["ticker", "source_type", "source_mode", "status"])} status={event.status} sourceMode={event.source_mode} />;
}

function FusedSignalCard({ signal }: { signal: Record<string, any> }) {
  return <InfoCard title={signal.signal_type ?? "UNKNOWN"} rows={objectRows(signal, ["fused_score", "recommended_action", "missing_inputs", "source_mode", "status"])} status={signal.status} sourceMode={signal.source_mode} />;
}

function AuditEventRow({ event }: { event: Record<string, any> }) {
  const payload = event.payload || {};
  return (
    <div className="grid min-w-0 gap-3 border-b border-white/[0.06] py-3 lg:grid-cols-[1fr_1fr_1fr_1fr_2fr]">
      <div className="min-w-0 whitespace-normal break-words font-mono text-xs text-[#F4F7FA]">{event.timestamp ?? "UNKNOWN"}</div>
      <div className="min-w-0"><DataProvenanceChip status={event.event_type ?? "UNKNOWN"} sourceMode={event.source_mode ?? "UNKNOWN"} /></div>
      <div className="min-w-0 whitespace-normal break-words font-mono text-xs text-[#9BA6B2]">live_order_submitted=false {String(event.live_order_submitted)}</div>
      <div className="min-w-0 whitespace-normal break-words font-mono text-xs text-[#9BA6B2]">execution_engine {event.execution_engine ?? "UNKNOWN"}</div>
      <div className="min-w-0 whitespace-normal break-words text-sm text-[#F4F7FA]">{event.summary ?? payload.summary ?? "UNKNOWN"}</div>
    </div>
  );
}

function UnknownDataState() {
  return <div className="min-w-0 border border-white/[0.08] bg-[linear-gradient(135deg,rgba(139,149,161,0.12),rgba(21,27,38,0.72))] p-4 font-mono text-sm text-[#8B95A1] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"><span className="whitespace-normal break-words">UNKNOWN</span></div>;
}

function EmptyState({ title = "No data yet", body = "This panel will populate after a simulated local action runs." }: { title?: string; body?: string }) {
  return (
    <div className="min-w-0 border border-dashed border-white/[0.12] bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(110,231,249,0.035),rgba(167,139,250,0.025))] p-5 shadow-[0_14px_46px_rgba(0,0,0,0.18)]">
      <div className="whitespace-normal break-words text-sm text-[#F4F7FA]">{title}</div>
      <div className="mt-2 whitespace-normal break-words text-sm leading-6 text-[#8B95A1]">{body}</div>
      <div className="mt-3"><DataProvenanceChip status="UNKNOWN" sourceMode="local UI state" /></div>
    </div>
  );
}

function LoadingState({ label = "Loading simulated local data" }: { label?: string }) {
  return (
    <div className="min-w-0 border border-[#6EE7F9]/24 bg-[linear-gradient(135deg,rgba(110,231,249,0.1),rgba(167,139,250,0.05))] p-4 font-mono text-xs uppercase tracking-[0.16em] text-[#6EE7F9] shadow-[0_16px_48px_rgba(110,231,249,0.1)] whitespace-normal break-words">
      {label}
    </div>
  );
}

function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-5 min-w-0 border border-[#FF5C7A]/30 bg-[linear-gradient(135deg,rgba(255,92,122,0.12),rgba(251,191,36,0.04))] p-4 shadow-[0_18px_54px_rgba(255,92,122,0.08)]">
      <div className="whitespace-normal break-words font-display text-sm uppercase tracking-[0.18em] text-[#FF5C7A]">{title}</div>
      <div className="mt-2 whitespace-normal break-words text-sm leading-6 text-[#F4F7FA]">{body}</div>
    </div>
  );
}

function SettingsPanel({ title, settings, status }: { title: string; settings: Record<string, any>; status: string }) {
  return (
    <Panel title={title} status={status} sourceMode={title}>
      <DataRows rows={Object.entries(settings).map(([key, value]) => [key, Array.isArray(value) ? value.join(", ") : String(value)])} headers={["Setting", "Value"]} />
    </Panel>
  );
}

function InfoCard({ title, rows, status, sourceMode }: { title: string; rows: Array<[string, any]>; status?: string; sourceMode?: string }) {
  return (
    <div className={`${metallicCard} mb-3 min-w-0 overflow-hidden p-4 last:mb-0`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="min-w-0 whitespace-normal break-words text-sm text-[#F4F7FA]">{title}</h3>
        <DataProvenanceChip status={status} sourceMode={sourceMode} />
      </div>
      <dl className="grid min-w-0 grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="contents min-w-0">
            <dt className="min-w-0 whitespace-normal break-words text-[#9BA6B2]">{label}</dt>
            <dd className="min-w-0 whitespace-normal break-words text-left text-[#F4F7FA] sm:text-right">{display(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DataRows({ headers, rows }: { headers: string[]; rows: Array<Array<any>> }) {
  if (!rows.length) return <EmptyState />;
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="min-w-full text-left font-mono text-xs">
        <thead className="text-[#9BA6B2]">
          <tr>{headers.map((header) => <th key={header} className="max-w-[220px] border-b border-white/[0.08] pb-2 pr-4 align-bottom font-normal"><span className="block whitespace-normal break-words">{header}</span></th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="text-[#F4F7FA]">{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="max-w-[260px] border-b border-white/[0.05] py-3 pr-4 align-top"><span className="block whitespace-normal break-words">{display(cell)}</span></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderTable({ orders }: { orders: Array<Record<string, any>> }) {
  return <DataRows rows={orders.map((order) => [order.order_id, order.symbol, order.side, order.requested_quantity, order.filled_quantity, order.remaining_quantity, order.status, String(order.live_order_submitted)])} headers={["Order", "Symbol", "Side", "Requested", "Filled", "Remaining", "Status", "Live"]} />;
}

function AuditRows({ audit }: { audit: Array<Record<string, any>> }) {
  if (!audit.length) return <EmptyState title="No matching audit events" body="Audit events will appear after local simulated actions or tool calls." />;
  return <div>{audit.map((event, index) => <AuditEventRow key={index} event={event} />)}</div>;
}

function FeeRows({ fees }: { fees: Record<string, any> }) {
  return <DataRows rows={[
    ["commission_per_order", fees.commission_per_order?.value ?? "UNKNOWN", fees.commission_per_order?.status ?? "UNKNOWN"],
    ["slippage_bps", fees.slippage_bps?.value ?? "UNKNOWN", fees.slippage_bps?.status ?? "UNKNOWN"],
    ["spread_bps", fees.spread_bps?.value ?? "UNKNOWN", fees.spread_bps?.status ?? "UNKNOWN"],
    ["sec_fee_bps", fees.sec_fee_bps?.value ?? "UNKNOWN", fees.sec_fee_bps?.status ?? "UNKNOWN"],
    ["taf_fee_per_share", fees.taf_fee_per_share?.value ?? "UNKNOWN", fees.taf_fee_per_share?.status ?? "UNKNOWN"]
  ]} headers={["Fee", "Value", "Status"]} />;
}

function MiniBarChart({ values }: { values: number[] }) {
  const chartValues = values.length ? values : [0];
  const barColors = [
    "from-[#6EE7F9]/80 via-[#A78BFA]/50 to-[#FBBF24]/55",
    "from-[#A78BFA]/80 via-[#6EE7F9]/45 to-[#38D996]/55",
    "from-[#FBBF24]/70 via-[#A78BFA]/45 to-[#FF5C7A]/45"
  ];
  return (
    <div className="flex h-28 min-w-0 items-end gap-2 border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      {chartValues.map((value, index) => <div key={index} className={`w-full bg-gradient-to-t ${barColors[index % barColors.length]} shadow-[0_10px_30px_rgba(110,231,249,0.12)]`} style={{ height: `${Math.max(6, Math.min(100, value))}%` }} />)}
    </div>
  );
}

function filterAudit(audit: Array<Record<string, any>>, query: string) {
  if (!query.trim()) return audit;
  const needle = query.toLowerCase();
  return audit.filter((event) => JSON.stringify(event).toLowerCase().includes(needle));
}

function objectRows(source: Record<string, any>, keys: string[]): Array<[string, any]> {
  return keys.map((key) => [key, source?.[key] ?? "UNKNOWN"]);
}

function isClosedOrder(order: Record<string, any>) {
  return ["filled", "cancelled", "rejected", "expired", "replaced"].includes(order.status);
}

function display(value: any) {
  if (value === undefined || value === null || value === "") return "UNKNOWN";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "UNKNOWN";
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}
