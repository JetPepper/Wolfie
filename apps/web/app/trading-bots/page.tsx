import { fallbackDashboardData } from "../dashboard-data";
import WolfieDashboard from "../wolfie-dashboard";

export default function TradingBotsRoute() {
  return <WolfieDashboard initialData={fallbackDashboardData} apiBaseUrl="" initialSection="Trading Bots" />;
}
