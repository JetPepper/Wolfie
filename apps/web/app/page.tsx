import { fallbackDashboardData } from "./dashboard-data";
import type { DashboardData } from "./dashboard-data";
import WolfieDashboard from "./wolfie-dashboard";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, { cache: "no-store" });
    if (!response.ok) {
      return fallback;
    }
    return response.json();
  } catch {
    return fallback;
  }
}

export default async function Home() {
  const data: DashboardData = {
    backendStatus: await getJson("/health", fallbackDashboardData.backendStatus),
    environment: await getJson("/api/environment", fallbackDashboardData.environment),
    capabilities: await getJson("/api/mcp/capabilities", fallbackDashboardData.capabilities),
    tools: await getJson("/api/mcp/tools", fallbackDashboardData.tools),
    account: await getJson("/api/paper/account", fallbackDashboardData.account),
    positions: await getJson("/api/paper/positions", fallbackDashboardData.positions),
    quote: await getJson("/api/market/quote/AAPL", fallbackDashboardData.quote),
    orders: await getJson("/api/orders", fallbackDashboardData.orders),
    audit: await getJson("/api/audit", fallbackDashboardData.audit),
    instrument: await getJson("/api/instruments/AAPL", fallbackDashboardData.instrument),
    tradingHours: await getJson("/api/trading-hours", fallbackDashboardData.tradingHours),
    fees: await getJson("/api/fees", fallbackDashboardData.fees),
    strategies: await getJson("/api/strategies", fallbackDashboardData.strategies),
    recent: await getJson("/api/signals/recent", fallbackDashboardData.recent),
    scenarios: await getJson("/api/scenarios", fallbackDashboardData.scenarios),
    replayRuns: await getJson("/api/replay/runs", fallbackDashboardData.replayRuns),
    insiderEvents: await getJson("/api/insiders/events", fallbackDashboardData.insiderEvents),
    insiderLeaderboard: await getJson("/api/insiders/leaderboard", fallbackDashboardData.insiderLeaderboard),
    insiderClusters: await getJson("/api/insiders/clusters", fallbackDashboardData.insiderClusters),
    insiderAlerts: await getJson("/api/insiders/alerts", fallbackDashboardData.insiderAlerts),
    influenceFeed: await getJson("/api/influence/feed", fallbackDashboardData.influenceFeed),
    influenceAlerts: await getJson("/api/influence/alerts", fallbackDashboardData.influenceAlerts),
    influenceSourceStats: await getJson("/api/influence/source-stats", fallbackDashboardData.influenceSourceStats),
    fusedSignals: await getJson("/api/signals/fused", fallbackDashboardData.fusedSignals),
    costSettings: await getJson("/api/cost-settings", fallbackDashboardData.costSettings),
    riskSettings: await getJson("/api/risk-settings", fallbackDashboardData.riskSettings)
  };

  return <WolfieDashboard initialData={data} apiBaseUrl={apiBaseUrl} />;
}
