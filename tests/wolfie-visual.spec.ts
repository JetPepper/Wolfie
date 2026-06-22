import { expect, test } from "@playwright/test";

async function onboard(page: any) {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  const onboarding = page.getByRole("heading", { name: "How much do you want Wolfie to trade with?" });
  if (await onboarding.isVisible().catch(() => false)) {
    await page.locator("#capital-input").fill("250000");
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await expect(page.getByLabel("Main views").getByRole("button", { name: "Dashboard", exact: true })).toBeVisible();
}

test("Wolfie premium dashboard renders and core controls work", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 940 });
  await onboard(page);

  const mainNav = page.getByLabel("Main views");
  await expect(mainNav.getByRole("button", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(mainNav.getByRole("button", { name: "Bots", exact: true })).toBeVisible();
  await expect(mainNav.getByRole("button", { name: "Signal Console", exact: true })).toBeVisible();
  await expect(mainNav.getByRole("button")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Starting Capital")).toBeVisible();
  await expect(page.getByText("Activity Ledger")).toBeVisible();
  await expect(page.locator(".terminal-dashboard")).not.toContainText(/Nancy|Pelosi/i);
  await expect(page.locator(".terminal-dashboard")).toContainText("Decision");
  await expect(page.getByText("Wolfie Alpha")).toHaveCount(0);
  await expect(page.getByText("Active bot")).toHaveCount(0);
  await expect(page.getByText("Selected Thought")).toHaveCount(0);
  await expect(page.getByText("Field Navigator")).toHaveCount(0);

  const metricValues = await page.locator(".metric-card b").allTextContents();
  expect(metricValues.some((value) => /\$\d{1,3}(,\d{3})*\.\d{2}/.test(value))).toBeTruthy();
  await expect(page.locator(".metric-card").first()).toContainText("$250,000.00");

  const stockChart = page.locator(".stock-chart");
  await expect(stockChart).toBeVisible();
  await expect(stockChart).toContainText("Portfolio performance");
  const chartBox = await stockChart.boundingBox();
  expect(chartBox?.width).toBeGreaterThan(300);
  expect(chartBox?.height).toBeLessThanOrEqual(330);
  if (!chartBox) throw new Error("Compact stock chart did not expose a bounding box");
  await page.mouse.click(chartBox.x + chartBox.width * 0.5, chartBox.y + chartBox.height * 0.45);
  await expect(stockChart).toBeVisible();

  await page.getByLabel("Performance chart mode").getByRole("button", { name: "Bots", exact: true }).click();
  await expect(stockChart).toContainText("Bot performance");
  await page.getByLabel("Performance chart mode").getByRole("button", { name: "Stock", exact: true }).click();
  await expect(stockChart).toContainText("SPY stock performance");
  await page.locator(".market-toolbar").getByRole("button", { name: "NVDA", exact: true }).click();
  await expect(stockChart).toContainText("NVDA stock performance");
  await page.locator(".market-toolbar").getByRole("button", { name: "15m", exact: true }).click();
  await expect(page.locator(".market-panel")).toContainText("NVDA · 15m");
  await page.locator(".market-toolbar").getByRole("button", { name: "SPY", exact: true }).click();
  await page.locator(".market-toolbar").getByRole("button", { name: "5m", exact: true }).click();
  await expect(stockChart).toContainText("SPY stock performance");
  await expect(page.locator(".market-panel")).toContainText("SPY · 5m");

  const marketButtonsContained = await page.locator(".market-panel").evaluate((panel) => {
    const panelBox = panel.getBoundingClientRect();
    return [...panel.querySelectorAll(".market-toolbar button")].every((button) => {
      const box = button.getBoundingClientRect();
      return box.left >= panelBox.left && box.right <= panelBox.right && box.width <= 80 && box.height <= 32;
    });
  });
  expect(marketButtonsContained).toBeTruthy();

  await mainNav.getByRole("button", { name: "Bots", exact: true }).click();
  await expect(page.locator("h1", { hasText: "Bots" })).toBeVisible();
  await expect(page.getByText("Primary Trading Bots")).toBeVisible();
  await expect(page.locator(".primary-bot-grid .bot-agent-card")).toHaveCount(5);
  const primaryCardsAligned = await page.locator(".primary-bot-grid").evaluate((grid) => {
    const cards = [...grid.querySelectorAll(".bot-agent-card")];
    const heights = cards.map((card) => Math.round(card.getBoundingClientRect().height));
    return new Set(heights).size <= 1;
  });
  expect(primaryCardsAligned).toBeTruthy();
  await expect(page.getByText("Disclosure Intelligence Bots")).toBeVisible();
  await expect(page.getByText("Other Bots")).toBeVisible();
  await expect(page.locator(".bot-deployment-console")).not.toContainText("Watchlist");
  await expect(page.getByRole("button", { name: /Deploy Compass/ })).toHaveCount(0);
  await page.locator(".primary-bot-grid .bot-agent-card").filter({ hasText: "Compass" }).click();
  await expect(page.getByRole("heading", { name: "Compass Deployment Console" })).toBeVisible();
  await page.locator(".settings-form label", { hasText: "Allocation Mode" }).locator("select").selectOption("Fixed");
  await page.locator(".settings-form label", { hasText: "Fixed Dollar Allocation" }).locator("input").fill("34000");
  await page.locator(".settings-form label", { hasText: "Max Position Size" }).locator("input").fill("7.25");
  await page.locator(".settings-form label", { hasText: "Stop-Loss" }).locator("input").fill("2.5");
  await page.locator(".settings-form label", { hasText: "Take-Profit" }).locator("input").fill("10.75");
  await page.locator(".settings-form label", { hasText: "Exit Rules" }).locator("input").focus();
  await expect(page.locator(".settings-form label", { hasText: "Fixed Dollar Allocation" }).locator("input")).toHaveValue("$34,000.00");
  await expect(page.locator(".settings-form label", { hasText: "Max Position Size" }).locator("input")).toHaveValue("7.25");
  await expect(page.locator(".settings-form label", { hasText: "Stop-Loss" }).locator("input")).toHaveValue("2.5");
  await expect(page.locator(".settings-form label", { hasText: "Take-Profit" }).locator("input")).toHaveValue("10.75");
  await page.getByRole("button", { name: "Save Configuration", exact: true }).click();
  await page.getByRole("button", { name: "Deploy Bot", exact: true }).click();
  await expect(page.locator(".primary-bot-grid .bot-agent-card").filter({ hasText: "Compass" })).toContainText("Active");

  await mainNav.getByRole("button", { name: "Signal Console", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Signal Console", exact: true })).toBeVisible();
  await expect(page.locator(".signal-console-grid")).toContainText("Trade Economics");
  await expect(page.locator(".signal-console-grid")).toContainText("Risk Gate");
  await expect(page.locator(".signal-console-grid")).toContainText("Learning Memory");
  await expect(page.locator(".signal-console-grid")).toContainText("Self-Healing");
  await expect(page.locator(".three-stage canvas")).toHaveCount(0);
  await page.locator(".signal-stack button").first().click();
  await expect(page.locator(".drawer").getByRole("heading", { name: /Decision Frame/ })).toBeVisible();
  await page.locator(".drawer").getByRole("button", { name: "Close", exact: true }).click();

  await mainNav.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Trading Activity" })).toBeVisible();
  await page.getByRole("button", { name: "Enable Trade Sounds" }).click();
  await expect(page.getByRole("heading", { name: "Closed profitable trade" })).toBeVisible();
  await page.locator(".drawer").getByRole("button", { name: "Close", exact: true }).click();

  await mainNav.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Starting Capital" })).toBeVisible();
  await page.locator(".settings-card input").first().fill("$125,000.00");
  await page.getByRole("button", { name: "Save Starting Capital" }).click();
  await expect(page.locator(".settings-card input").first()).toHaveValue("$125,000.00");
  await mainNav.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(page.locator(".metric-card").first()).toContainText("$125,000.00");
  await expect(page.locator(".metric-card").filter({ hasText: "Net P&L" })).toContainText("$0.00");
  await mainNav.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Live" }).first().click();
  await expect(page.getByRole("heading", { name: "Brokerage setup required" })).toBeVisible();
  await page.locator(".drawer").getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Prepare Reset" }).click();
  await page.getByRole("button", { name: "Confirm Reset Entire App" }).click();
  await expect(page.locator("#capital-input")).toBeVisible();
  await page.reload();
  await expect(page.locator("#capital-input")).toBeVisible();
  await page.screenshot({ path: "artifacts/wolfie-desktop.png", fullPage: true });
});

test("Wolfie premium dashboard scales on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  const mainNav = page.getByLabel("Main views");
  await expect(mainNav.getByRole("button", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(mainNav.getByRole("button", { name: "Bots", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await mainNav.getByRole("button", { name: "Signal Console", exact: true }).click();
  await expect(page.locator(".signal-console-grid")).toBeVisible();
  await expect(page.getByLabel("Interactive 3D thought engine")).toHaveCount(0);
  await page.screenshot({ path: "artifacts/wolfie-mobile.png", fullPage: true });
});

test("Wolfie Signal Console blocks uneconomic small-account churn", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 940 });
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.locator("#capital-input").fill("1000");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Main views").getByRole("button", { name: "Signal Console", exact: true }).click();
  await page.locator(".signal-roster").getByRole("button", { name: /Surge/ }).click();
  await expect(page.locator(".signal-center")).toContainText("Surge Signal Console");
  await expect(page.locator(".signal-economics")).toContainText("Trade Economics");
  await expect(page.locator(".signal-economics")).toContainText("Poor");
  await expect(page.locator(".risk-gate")).toContainText("Small-account protection blocks high-churn or low-margin entries.");
  await expect(page.locator(".signal-center")).toContainText("cooldown");
});

test("Wolfie full field and interaction audit", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 940 });
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  const capitalInput = page.locator("#capital-input");
  await expect(capitalInput).toBeVisible();
  for (const value of ["1000", "10000", "50,000", "$50,000", "$50,000.00", "50000.00"]) {
    await capitalInput.fill(value);
    await expect(capitalInput).toHaveValue(value);
  }
  await page.getByRole("button", { name: "$250,000.00" }).click();
  await expect(capitalInput).toHaveValue("250000");
  await capitalInput.fill("$500,000.00");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator(".metric-card").first()).toContainText("$500,000.00");

  const mainNav = page.getByLabel("Main views");
  await expect(page.locator(".terminal-dashboard")).not.toContainText(/Nancy|Pelosi/i);

  await page.getByRole("button", { name: "Available Capital" }).click();
  await expect(page.locator(".drawer")).toContainText("Available Capital");
  await page.locator(".drawer").getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Allocated to Bots" }).click();
  await expect(page.locator(".drawer")).toContainText("Allocated to Bots");
  await page.locator(".drawer").getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Net P&L" }).click();
  await expect(page.locator(".drawer")).toContainText("Net P&L");
  await page.locator(".window-tabs").getByRole("button", { name: "1 month", exact: true }).click();
  await expect(page.locator(".window-tabs").getByRole("button", { name: "1 month", exact: true })).toHaveClass(/active/);
  await page.locator(".drawer").getByRole("button", { name: "Close", exact: true }).click();

  await page.getByLabel("Performance chart mode").getByRole("button", { name: "Bots", exact: true }).click();
  await expect(page.locator(".stock-chart")).toContainText("Bot performance");
  await page.getByLabel("Performance chart mode").getByRole("button", { name: "Stock", exact: true }).click();
  await page.getByLabel("Single stock chart controls").getByRole("button", { name: "AAPL", exact: true }).click();
  await page.getByLabel("Single stock chart controls").getByRole("button", { name: "1h", exact: true }).click();
  await expect(page.locator(".market-panel")).toContainText("Stock · AAPL · 60m");
  await expect(page.locator(".stock-chart")).toContainText("AAPL stock performance");

  await page.locator(".news-tabs").getByRole("button", { name: "Filings", exact: true }).click();
  await expect(page.locator(".news-panel")).toContainText("SEC EDGAR");
  await page.locator(".news-tabs").getByRole("button", { name: "Social Sentiment", exact: true }).click();
  await expect(page.locator(".news-panel")).toContainText("Public social sources");

  await page.getByRole("button", { name: /Market data/ }).click();
  await expect(page.locator(".provider-modal")).toBeVisible();
  const providerBox = await page.locator(".provider-modal").boundingBox();
  expect(providerBox?.x).toBeGreaterThan(250);
  await expect(page.locator(".provider-modal")).toContainText("Current Provider");
  await page.locator(".provider-modal").getByRole("button", { name: "Open Watchlist", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bots", exact: true })).toBeVisible();

  await mainNav.getByRole("button", { name: "Bots", exact: true }).click();
  await page.locator(".primary-bot-grid .bot-agent-card").filter({ hasText: "Compass" }).click();
  const botDetail = page.locator(".bot-deployment-console");
  await expect(botDetail).toBeVisible();
  await expect(botDetail.locator(".robot-avatar img")).toHaveAttribute("src", /wolfie-compass/);
  await botDetail.locator("label", { hasText: "Risk Tolerance" }).locator("select").selectOption("High");
  await botDetail.locator("label", { hasText: "Allocation Mode" }).locator("select").selectOption("Fixed");
  await botDetail.locator("label", { hasText: "Fixed Dollar Allocation" }).locator("input").fill("34000");
  await expect(botDetail.locator("label", { hasText: "Percentage of Available Capital" })).toHaveCount(0);
  await botDetail.locator("label", { hasText: "Allocation Mode" }).locator("select").selectOption("Percent");
  await botDetail.locator("label", { hasText: "Percentage of Available Capital" }).locator("input").fill("13.5");
  await expect(botDetail.locator("label", { hasText: "Fixed Dollar Allocation" })).toHaveCount(0);
  await botDetail.locator("label", { hasText: "Max Position Size" }).locator("input").fill("7.25");
  await botDetail.locator("label", { hasText: "Stop-Loss" }).locator("input").fill("2.5");
  await botDetail.locator("label", { hasText: "Take-Profit" }).locator("input").fill("10.75");
  await botDetail.locator("label", { hasText: "Max Daily Loss" }).locator("input").fill("2.25");
  await botDetail.locator("label", { hasText: "Max Trades Per Day" }).locator("input").fill("6");
  await botDetail.locator("label", { hasText: "Asset Universe" }).locator("input").fill("US equities, ETFs, AI leaders");
  await botDetail.locator("label", { hasText: "Allowed Markets" }).locator("input").fill("US equities and ETFs");
  await botDetail.locator("label", { hasText: "Exclusions" }).locator("input").fill("Illiquid names");
  await botDetail.locator("label", { hasText: "Signal Threshold" }).locator("input").fill("77");
  await botDetail.locator("label", { hasText: "Entry Rules" }).locator("input").fill("Confluence, liquidity, and controlled spread");
  await botDetail.locator("label", { hasText: "Exit Rules" }).locator("input").fill("Exit when thesis breaks or target hits");
  await botDetail.locator("label", { hasText: "Exit Rules" }).locator("input").press("Tab");
  await expect(botDetail.locator("label", { hasText: "Percentage of Available Capital" }).locator("input")).toHaveValue("13.5");
  await expect(botDetail.locator("label", { hasText: "Entry Rules" }).locator("input")).toHaveValue("Confluence, liquidity, and controlled spread");
  await botDetail.getByRole("button", { name: "Market data" }).click();
  await expect(page.locator(".source-detail-modal")).toBeVisible();
  await page.locator(".source-detail-modal").getByRole("button", { name: "Close", exact: true }).click();
  await botDetail.getByRole("button", { name: "Save Configuration", exact: true }).click();
  await expect(botDetail).toContainText("Armed");
  await botDetail.getByRole("button", { name: "Deploy Bot", exact: true }).click();
  await expect(page.locator(".primary-bot-grid .bot-agent-card").filter({ hasText: "Compass" })).toContainText("Active");
  await botDetail.getByRole("button", { name: "Pause Bot", exact: true }).click();
  await expect(botDetail).toContainText("Paused");
  await botDetail.getByRole("button", { name: "Turn Off Bot", exact: true }).click();
  await expect(page.locator(".primary-bot-grid .bot-agent-card").filter({ hasText: "Compass" })).toContainText("Inactive");

  await page.locator(".disclosure-main-card").filter({ hasText: "Politicians" }).click();
  await expect(page.locator(".disclosure-workspace")).toContainText("Nancy Pelosi");
  await page.getByLabel("Politicians search").fill("Nancy");
  await page.locator(".disclosure-table-row").filter({ hasText: "Nancy Pelosi" }).click();
  await expect(page.locator(".person-modal")).toContainText("Nancy Pelosi");
  await page.locator(".person-modal").getByRole("button", { name: "Track", exact: true }).click();
  await expect(page.locator(".person-modal")).toContainText("Tracking");
  await page.locator(".person-modal").getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".disclosure-workspace").getByRole("button", { name: "Close", exact: true }).click();

  await page.locator(".disclosure-main-card").filter({ hasText: "Public Figures" }).click();
  await expect(page.locator(".disclosure-workspace")).toContainText("No public trading disclosure found");
  await page.getByLabel("Public Figures search").fill("Warren");
  await page.locator(".disclosure-table-row").filter({ hasText: "Warren Buffett" }).click();
  await expect(page.locator(".person-modal")).toContainText("No public trading disclosure found");
  await page.locator(".person-modal").getByRole("button", { name: "Track", exact: true }).click();
  await page.locator(".person-modal").getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".disclosure-workspace").getByRole("button", { name: "Close", exact: true }).click();

  await page.locator(".disclosure-main-card").filter({ hasText: "Insiders" }).click();
  await page.getByLabel("Insiders search").fill("Jensen");
  await page.locator(".disclosure-table-row").filter({ hasText: "Jensen Huang" }).click();
  await expect(page.locator(".person-modal")).toContainText("SEC/Form 4");
  await page.locator(".person-modal").getByRole("button", { name: "Track", exact: true }).click();
  await page.locator(".person-modal").getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".disclosure-workspace").getByRole("button", { name: "Close", exact: true }).click();

  await page.getByRole("button", { name: "Create Your Own Bot", exact: true }).first().click();
  const builder = page.locator(".custom-bot-builder");
  await expect(builder).toBeVisible();
  await builder.getByRole("button", { name: "Deploy Strategy", exact: true }).click();
  await expect(builder).toContainText("Bot name is required");
  await builder.locator("label", { hasText: "Bot Name" }).locator("input").fill("Custom Alpha");
  await builder.locator("label", { hasText: "Bot Personality" }).locator("input").fill("Patient custom analyst");
  await builder.locator("label", { hasText: "Strategy Type" }).locator("input").fill("Custom catalyst filter");
  await builder.locator("label", { hasText: "Asset Universe" }).locator("input").fill("AMD, COIN, SPY");
  await builder.locator("label", { hasText: "Exclusions" }).locator("input").fill("Illiquid names");
  await builder.locator("label", { hasText: "Data Sources Required" }).locator("input").fill("Market data, news");
  await builder.locator("label", { hasText: "Allocation Mode" }).locator("select").selectOption("Fixed");
  await builder.locator("label", { hasText: "Allocation Value" }).locator("input").fill("12000");
  await builder.locator("label", { hasText: "Risk" }).locator("select").selectOption("High");
  await builder.locator("label", { hasText: "Max Position Size" }).locator("input").fill("6");
  await builder.locator("label", { hasText: "Stop Loss" }).locator("input").fill("3");
  await builder.locator("label", { hasText: "Take Profit" }).locator("input").fill("11");
  await builder.locator("label", { hasText: "Entry Rules" }).locator("input").fill("Enter only on confirmed catalyst");
  await builder.locator("label", { hasText: "Exit Rules" }).locator("input").fill("Exit on target or thesis break");
  await builder.locator("label", { hasText: "Confidence Threshold" }).locator("input").fill("76");
  await builder.getByRole("button", { name: "Save Configuration", exact: true }).click();
  await expect(page.locator(".other-bot-grid")).toContainText("Custom Alpha");
  await page.getByRole("button", { name: "Create Your Own Bot", exact: true }).first().click();
  await page.locator(".custom-bot-builder").locator("label", { hasText: "Bot Name" }).locator("input").fill("Custom Alpha Live");
  await page.locator(".custom-bot-builder").locator("label", { hasText: "Strategy Type" }).locator("input").fill("Live custom strategy");
  await page.locator(".custom-bot-builder").getByRole("button", { name: "Deploy Strategy", exact: true }).click();
  await expect(page.locator(".other-bot-grid")).toContainText("Custom Alpha Live");

  await mainNav.getByRole("button", { name: "Signal Console", exact: true }).click();
  await page.locator(".signal-roster").getByRole("button", { name: /Surge/ }).click();
  await expect(page.locator(".signal-center")).toContainText("Surge Signal Console");
  await expect(page.locator(".signal-economics")).toContainText("Trade Economics");
  await expect(page.locator(".signal-economics")).toContainText("Small-account suitability");
  await page.locator(".signal-stack").getByRole("button").first().click();
  await expect(page.locator(".drawer")).toContainText("Decision Frame");
  await page.locator(".drawer").getByRole("button", { name: "Close", exact: true }).click();

  await mainNav.getByRole("button", { name: "Activity", exact: true }).click();
  for (const filter of ["Profitable", "Losing", "Long", "Short"]) {
    await page.locator(".activity-filters").getByRole("button", { name: filter, exact: true }).click();
    await expect(page.locator(".activity-filters").getByRole("button", { name: filter, exact: true })).toHaveClass(/active/);
  }
  await page.getByRole("button", { name: "Enable Trade Sounds", exact: true }).click();
  await expect(page.locator(".drawer")).toContainText("Closed profitable trade");
  await page.locator(".drawer").getByRole("button", { name: "Close", exact: true }).click();

  await mainNav.getByRole("button", { name: "Settings", exact: true }).click();
  const settingsCapital = page.locator(".settings-card").filter({ hasText: "Starting Capital" }).locator("input");
  await settingsCapital.fill("$125,000.00");
  await page.getByRole("button", { name: "Save Starting Capital", exact: true }).click();
  await expect(settingsCapital).toHaveValue("$125,000.00");
  await page.locator(".toggle input").check();
  await expect(page.locator(".toggle input")).toBeChecked();
  await page.locator(".settings-card").filter({ hasText: "Trading Mode" }).getByRole("button", { name: "Live", exact: true }).click();
  await expect(page.locator(".drawer")).toContainText("Brokerage setup required");
  await page.locator(".drawer").getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Prepare Reset", exact: true }).click();
  await page.getByRole("button", { name: "Cancel Reset", exact: true }).click();
  await expect(page.getByRole("button", { name: "Prepare Reset", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Prepare Reset", exact: true }).click();
  await page.getByRole("button", { name: "Confirm Reset Entire App", exact: true }).click();
  await expect(page.locator("#capital-input")).toBeVisible();
  await page.reload();
  await expect(page.locator("#capital-input")).toBeVisible();
});

test("Wolfie Bots page exhaustive field audit", async ({ page }) => {
  test.setTimeout(240000);
  await page.setViewportSize({ width: 1440, height: 940 });
  await onboard(page);
  const mainNav = page.getByLabel("Main views");
  await mainNav.getByRole("button", { name: "Bots", exact: true }).click();

  const primaryNames = ["Sentinel", "Surge", "Compass", "Contrarian", "Disclosure"];
  const otherNames = [
    "Momentum", "Mean reversion", "Conservative dividend", "High-risk growth", "Macro event",
    "Earnings surprise", "Options flow", "Insider accumulation", "Congressional disclosure",
    "Social sentiment", "WallStreetBets public forum sentiment", "Volatility breakout",
    "Sector rotation", "News arbitrage", "Defensive drawdown protection", "Large-cap quality",
    "Small-cap momentum", "AI technology trend", "Commodities macro hedge", "Custom watchlist bot"
  ];

  async function configureBot(name: string, group: "primary" | "other", index: number) {
    const grid = group === "primary" ? page.locator(".primary-bot-grid") : page.locator(".other-bot-grid");
    const id = group === "primary" ? name.toLowerCase() : `other-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    await grid.locator(`[data-bot-id="${id}"]`).click();
    const consolePanel = page.locator(".bot-deployment-console");
    await expect(consolePanel).toContainText(`${name} Deployment Console`);
    await consolePanel.locator("label", { hasText: "Allocation Mode" }).locator("select").selectOption("Percent");
    await expect(consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" })).toHaveCount(0);
    await consolePanel.locator("label", { hasText: "Percentage of Available Capital" }).locator("input").fill(String(1 + (index % 3)));
    await consolePanel.locator("label", { hasText: "Allocation Mode" }).locator("select").selectOption("Fixed");
    await expect(consolePanel.locator("label", { hasText: "Percentage of Available Capital" })).toHaveCount(0);
    await consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" }).locator("input").fill(String(1000 + index * 100));
    await consolePanel.locator("label", { hasText: "Risk Tolerance" }).locator("select").selectOption(index % 3 === 0 ? "Low" : index % 3 === 1 ? "Medium" : "High");
    await consolePanel.locator("label", { hasText: "Max Position Size" }).locator("input").fill("5");
    await consolePanel.locator("label", { hasText: "Stop-Loss" }).locator("input").fill("3");
    await consolePanel.locator("label", { hasText: "Take-Profit" }).locator("input").fill("9");
    await consolePanel.locator("label", { hasText: "Max Daily Loss" }).locator("input").fill("2");
    await consolePanel.locator("label", { hasText: "Max Trades Per Day" }).locator("input").fill("4");
    await consolePanel.locator("label", { hasText: "Asset Universe" }).locator("input").fill(`${name} audited universe`);
    await consolePanel.locator("label", { hasText: "Allowed Markets" }).locator("input").fill("US equities and ETFs");
    await consolePanel.locator("label", { hasText: "Exclusions" }).locator("input").fill("Illiquid names and unsourced tips");
    await consolePanel.locator("label", { hasText: "Signal Threshold" }).locator("input").fill("72");
    await consolePanel.locator("label", { hasText: "Entry Rules" }).locator("input").fill(`${name} entry rule confirmed`);
    await consolePanel.locator("label", { hasText: "Exit Rules" }).locator("input").fill(`${name} exit rule confirmed`);
    await consolePanel.locator("label", { hasText: "Exit Rules" }).locator("input").press("Tab");
    await expect(consolePanel).toContainText("Amount allocated");
    await consolePanel.getByRole("button", { name: /Market data/ }).click();
    const sourceModal = page.locator(".source-detail-modal");
    await expect(sourceModal).toBeVisible();
    const box = await sourceModal.boundingBox();
    expect(box?.x).toBeGreaterThan(120);
    await sourceModal.getByRole("button", { name: "Close", exact: true }).click();
    await consolePanel.getByRole("button", { name: "Save Configuration", exact: true }).click();
    await expect(consolePanel).toContainText("Armed");
    await consolePanel.getByRole("button", { name: "Deploy Bot", exact: true }).click();
    await expect(consolePanel).toContainText("Active");
    await consolePanel.getByRole("button", { name: "Pause Bot", exact: true }).click();
    await expect(consolePanel).toContainText("Paused");
    await consolePanel.getByRole("button", { name: "Turn Off Bot", exact: true }).click();
    await expect(consolePanel).toContainText("Inactive");
    await consolePanel.getByRole("button", { name: "Save Configuration", exact: true }).click();
    await consolePanel.getByRole("button", { name: "Deploy Bot", exact: true }).click();
    await expect(grid.locator(`[data-bot-id="${id}"]`)).toContainText("Active");
  }

  for (const [index, name] of primaryNames.entries()) {
    await configureBot(name, "primary", index);
  }
  for (const [index, name] of otherNames.entries()) {
    await configureBot(name, "other", index);
  }

  await page.reload();
  await expect(page.getByLabel("Main views").getByRole("button", { name: "Dashboard", exact: true })).toBeVisible();
  await page.getByLabel("Main views").getByRole("button", { name: "Bots", exact: true }).click();
  for (const name of primaryNames) {
    await expect(page.locator(`.primary-bot-grid [data-bot-id="${name.toLowerCase()}"]`)).toContainText("Active");
  }
  for (const name of otherNames) {
    const id = `other-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
    await expect(page.locator(`.other-bot-grid [data-bot-id="${id}"]`)).toContainText("Active");
  }

  for (const category of ["Politicians", "Public Figures", "Insiders"]) {
    await page.locator(".disclosure-main-card").filter({ hasText: category }).click();
    const workspace = page.locator(".disclosure-workspace");
    await expect(workspace).toBeVisible();
    await expect(workspace.locator(".disclosure-table-row")).toHaveCount(10);
    await workspace.getByRole("button", { name: "View Full List", exact: true }).click();
    await expect(workspace.locator(".disclosure-table-row").first()).toBeVisible();
    await workspace.getByRole("button", { name: "Close", exact: true }).click();
  }
});
