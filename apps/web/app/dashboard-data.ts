export type Environment = {
  environment: string;
  broker_interface: string;
  execution: string;
  real_robinhood_connected: boolean;
  robinhood_login_required: boolean;
  live_order_submitted: boolean;
  real_money_at_risk: boolean;
  market_data_mode?: string;
};

export type DashboardData = {
  backendStatus: { status: string };
  environment: Environment;
  capabilities: { status: string; capabilities: Record<string, string | boolean | number> };
  tools: { status: string; tools: string[] };
  account: Record<string, any>;
  positions: Array<Record<string, any>>;
  quote: Record<string, any>;
  orders: Array<Record<string, any>>;
  audit: Array<Record<string, any>>;
  instrument: Record<string, any>;
  tradingHours: Record<string, any>;
  fees: Record<string, any>;
  strategies: { status: string; strategies: Array<Record<string, any>> };
  recent: Record<string, any>;
  scenarios: { status: string; scenarios: Array<Record<string, any>> };
  replayRuns: { status: string; runs: Array<Record<string, any>> };
  insiderEvents: { status: string; events: Array<Record<string, any>> };
  insiderLeaderboard: Record<string, any>;
  insiderClusters: Record<string, any>;
  insiderAlerts: { status: string; alerts: Array<Record<string, any>> };
  influenceFeed: { status: string; feed: Array<Record<string, any>> };
  influenceAlerts: { status: string; alerts: Array<Record<string, any>> };
  influenceSourceStats: { status: string; source_stats: Array<Record<string, any>> };
  fusedSignals: { status: string; signals: Array<Record<string, any>> };
  costSettings: Record<string, any>;
  riskSettings: Record<string, any>;
};

export const fallbackDashboardData: DashboardData = {
  backendStatus: { status: "disconnected" },
  environment: {
    environment: "SIMULATED_LIVE_MCP_LOCAL",
    broker_interface: "Robinhood-compatible MCP simulation",
    execution: "PaperExchange",
    real_robinhood_connected: false,
    robinhood_login_required: false,
    live_order_submitted: false,
    real_money_at_risk: false,
    market_data_mode: "SIM_STATIC_FIXTURE"
  },
  capabilities: { status: "UNKNOWN", capabilities: {} },
  tools: { status: "UNKNOWN", tools: [] },
  account: { equity: "UNKNOWN", cash: "UNKNOWN", buying_power: "UNKNOWN", realized_pnl: "UNKNOWN", unrealized_pnl: "UNKNOWN", day_pnl: "UNKNOWN", status: "UNKNOWN" },
  positions: [],
  quote: { symbol: "AAPL", bid: "UNKNOWN", ask: "UNKNOWN", last: "UNKNOWN", volume: "UNKNOWN", timestamp: "UNKNOWN", source_mode: "UNKNOWN", status: "UNKNOWN" },
  orders: [],
  audit: [],
  instrument: { symbol: "AAPL", name: "UNKNOWN", asset_type: "UNKNOWN", tradeable: false, marginable: false, shortable: false, options_enabled: false, status: "UNKNOWN" },
  tradingHours: { market_open: "UNKNOWN", market_close: "UNKNOWN", is_open: false, timezone: "UNKNOWN", status: "UNKNOWN" },
  fees: {
    status: "UNKNOWN",
    commission_per_order: { value: "UNKNOWN", status: "UNKNOWN" },
    slippage_bps: { value: "UNKNOWN", status: "UNKNOWN" },
    spread_bps: { value: "UNKNOWN", status: "UNKNOWN" },
    sec_fee_bps: { value: "UNKNOWN", status: "UNKNOWN" },
    taf_fee_per_share: { value: "UNKNOWN", status: "UNKNOWN" }
  },
  strategies: { status: "UNKNOWN", strategies: [] },
  recent: { status: "UNKNOWN", signals: [], scores: [], risk_checks: [], cost_previews: [], execution_plans: [], submissions: [] },
  scenarios: { status: "UNKNOWN", scenarios: [] },
  replayRuns: { status: "UNKNOWN", runs: [] },
  insiderEvents: { status: "UNKNOWN", events: [] },
  insiderLeaderboard: { label: "simulated/replay-derived", status: "UNKNOWN", top_buyers: [], top_sellers: [], cluster_buying_issuers: [], source_mode: "SIM_REPLAY_DATA" },
  insiderClusters: { cluster_detected: false, ticker: "UNKNOWN", insiders: [], total_dollar_value: 0, cluster_score: 0, status: "UNKNOWN", source_mode: "SIM_REPLAY_DATA" },
  insiderAlerts: { status: "UNKNOWN", alerts: [] },
  influenceFeed: { status: "UNKNOWN", feed: [] },
  influenceAlerts: { status: "UNKNOWN", alerts: [] },
  influenceSourceStats: { status: "UNKNOWN", source_stats: [] },
  fusedSignals: { status: "UNKNOWN", signals: [] },
  costSettings: { status: "UNKNOWN", settings: {} },
  riskSettings: { status: "UNKNOWN", settings: {} }
};
