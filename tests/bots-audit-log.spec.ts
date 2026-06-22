import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

type AuditRow = {
  element: string;
  action: string;
  expected: string;
  actual: string;
  result: "PASS" | "FAIL";
};

const primaryNames = ["Sentinel", "Surge", "Compass", "Contrarian", "Disclosure"];
const otherNames = [
  "Momentum", "Mean reversion", "Conservative dividend", "High-risk growth", "Macro event",
  "Earnings surprise", "Options flow", "Insider accumulation", "Congressional disclosure",
  "Social sentiment", "WallStreetBets public forum sentiment", "Volatility breakout",
  "Sector rotation", "News arbitrage", "Defensive drawdown protection", "Large-cap quality",
  "Small-cap momentum", "AI technology trend", "Commodities macro hedge", "Custom watchlist bot"
];

function botId(name: string, group: "primary" | "other") {
  if (group === "primary") return name.toLowerCase();
  return `other-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function row(rows: AuditRow[], element: string, action: string, expected: string, actual: string, pass: boolean) {
  rows.push({ element, action, expected, actual, result: pass ? "PASS" : "FAIL" });
}

async function onboard(page: any) {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.locator("#capital-input").fill("250000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Main views").getByRole("button", { name: "Dashboard", exact: true })).toBeVisible();
}

test("generate Bots click and field audit log", async ({ page }) => {
  test.setTimeout(360000);
  const rows: AuditRow[] = [];

  await page.setViewportSize({ width: 1440, height: 940 });
  await onboard(page);
  await page.getByLabel("Main views").getByRole("button", { name: "Bots", exact: true }).click();
  await expect(page.locator(".primary-bot-grid .bot-agent-card")).toHaveCount(5);
  await expect(page.locator(".other-bot-grid .bot-agent-card")).toHaveCount(20);
  await expect(page.locator(".disclosure-main-card")).toHaveCount(3);
  row(rows, "Bots nav", "Click Bots", "Bots command page loads", "5 primary cards, 20 Other Bot cards, 3 disclosure cards visible", true);

  async function auditBot(name: string, group: "primary" | "other", index: number) {
    const gridSelector = group === "primary" ? ".primary-bot-grid" : ".other-bot-grid";
    const id = botId(name, group);
    const card = page.locator(`${gridSelector} [data-bot-id="${id}"]`);
    await card.click();
    const consolePanel = page.locator(".bot-deployment-console");
    await expect(consolePanel).toContainText(`${name} Deployment Console`);
    row(rows, `${name} card`, "Click bot card", "Selected Bot Deployment Console opens", `${name} Deployment Console visible`, true);

    await consolePanel.locator("label", { hasText: "Allocation Mode" }).locator("select").selectOption("Percent");
    const fixedHidden = await consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" }).count();
    row(rows, `${name} Allocation Mode`, "Select Percent", "Only percent allocation field is visible", `Fixed field count: ${fixedHidden}`, fixedHidden === 0);

    await consolePanel.locator("label", { hasText: "Percentage of Available Capital" }).locator("input").fill("150");
    await consolePanel.locator("label", { hasText: "Percentage of Available Capital" }).locator("input").press("Tab");
    const percentAfterBad = await consolePanel.locator("label", { hasText: "Percentage of Available Capital" }).locator("input").inputValue();
    row(rows, `${name} Percentage of Available Capital`, "Input invalid percent 150", "Reject over-limit percent and preserve/revert valid value", `Value after blur: ${percentAfterBad}`, Number(percentAfterBad) <= 100);

    await consolePanel.locator("label", { hasText: "Percentage of Available Capital" }).locator("input").fill(String(1 + (index % 3)));
    await consolePanel.locator("label", { hasText: "Percentage of Available Capital" }).locator("input").press("Tab");
    const percentValue = await consolePanel.locator("label", { hasText: "Percentage of Available Capital" }).locator("input").inputValue();
    row(rows, `${name} Percentage of Available Capital`, `Input valid ${1 + (index % 3)}`, "Value accepted", `Value: ${percentValue}`, percentValue === String(1 + (index % 3)));

    await consolePanel.locator("label", { hasText: "Allocation Mode" }).locator("select").selectOption("Fixed");
    const percentHidden = await consolePanel.locator("label", { hasText: "Percentage of Available Capital" }).count();
    row(rows, `${name} Allocation Mode`, "Select Fixed", "Only fixed allocation field is visible", `Percent field count: ${percentHidden}`, percentHidden === 0);

    await consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" }).locator("input").fill("-100");
    await consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" }).locator("input").press("Tab");
    const fixedAfterBad = await consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" }).locator("input").inputValue();
    row(rows, `${name} Fixed Dollar Allocation`, "Input invalid -100", "Reject negative value and preserve/revert valid value", `Value after blur: ${fixedAfterBad}`, !fixedAfterBad.includes("-"));

    await consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" }).locator("input").fill("999999999");
    await consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" }).locator("input").press("Tab");
    await consolePanel.getByRole("button", { name: "Deploy Bot", exact: true }).click();
    const blocker = page.locator(".blocker-modal");
    await expect(blocker).toContainText("Allocation cannot exceed available capital");
    row(rows, `${name} Deploy validation`, "Deploy with allocation greater than capital", "Centered blocker modal explains allocation limit", "Blocker modal text: Allocation cannot exceed available capital", true);
    await page.keyboard.press("Escape");
    await expect(blocker).toHaveCount(0);
    row(rows, `${name} blocker modal`, "Press Escape", "Modal closes", "Blocker modal removed", true);

    await consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" }).locator("input").fill(String(1000 + index * 100));
    await consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" }).locator("input").press("Tab");
    const fixedValue = await consolePanel.locator("label", { hasText: "Fixed Dollar Allocation" }).locator("input").inputValue();
    row(rows, `${name} Fixed Dollar Allocation`, `Input valid ${1000 + index * 100}`, "Dollar value formats after blur", `Value: ${fixedValue}`, fixedValue.includes("$"));

    const riskValue = index % 3 === 0 ? "Low" : index % 3 === 1 ? "Medium" : "High";
    await consolePanel.locator("label", { hasText: "Risk Tolerance" }).locator("select").selectOption(riskValue);
    row(rows, `${name} Risk Tolerance`, `Select ${riskValue}`, "Risk selection accepted", `Selected: ${riskValue}`, true);

    const fieldValues: Array<[string, string, string]> = [
      ["Max Position Size", "5", "numeric percent field accepts valid value"],
      ["Stop-Loss", "3", "numeric percent field accepts valid value"],
      ["Take-Profit", "9", "numeric percent field accepts valid value"],
      ["Max Daily Loss", "2", "numeric percent field accepts valid value"],
      ["Max Trades Per Day", "4", "numeric count field accepts valid value"],
      ["Asset Universe", `${name} audited universe`, "text field accepts bot mandate"],
      ["Allowed Markets", "US equities and ETFs", "text field accepts allowed markets"],
      ["Exclusions", "Illiquid names and unsourced tips", "text field accepts exclusions"],
      ["Signal Threshold", "72", "threshold accepts 0-100 value"],
      ["Entry Rules", `${name} entry rule confirmed`, "entry rules accept text"],
      ["Exit Rules", `${name} exit rule confirmed`, "exit rules accept text"]
    ];

    for (const [label, value, expected] of fieldValues) {
      const input = consolePanel.locator("label", { hasText: label }).locator("input");
      await input.fill(value);
      await input.press("Tab");
      const actual = await input.inputValue();
      row(rows, `${name} ${label}`, `Input ${value}`, expected, `Value: ${actual}`, actual === value);
    }

    await consolePanel.getByRole("button", { name: /Market data/ }).click();
    const sourceModal = page.locator(".source-detail-modal");
    await expect(sourceModal).toBeVisible();
    const sourceBox = await sourceModal.boundingBox();
    row(rows, `${name} Market data source`, "Click source status", "Centered source detail modal opens", `Visible: true; x=${Math.round(sourceBox?.x || 0)}`, Boolean(sourceBox && sourceBox.x > 100));
    await sourceModal.getByRole("button", { name: "Close", exact: true }).click();
    await expect(sourceModal).toHaveCount(0);
    row(rows, `${name} source modal close`, "Click Close", "Modal closes", "Source modal removed", true);

    await consolePanel.getByRole("button", { name: "Save Configuration", exact: true }).click();
    await expect(consolePanel).toContainText("Armed");
    row(rows, `${name} Save Configuration`, "Click Save Configuration", "Bot status becomes Armed", "Console contains Armed", true);

    await consolePanel.getByRole("button", { name: "Deploy Bot", exact: true }).click();
    await expect(consolePanel).toContainText("Active");
    await expect(card).toContainText("Active");
    row(rows, `${name} Deploy Bot`, "Click Deploy Bot", "Bot status becomes Active and card updates", "Console/card contain Active", true);

    await consolePanel.getByRole("button", { name: "Pause Bot", exact: true }).click();
    await expect(consolePanel).toContainText("Paused");
    row(rows, `${name} Pause Bot`, "Click Pause Bot", "Bot status becomes Paused", "Console contains Paused", true);

    await consolePanel.getByRole("button", { name: "Turn Off Bot", exact: true }).click();
    await expect(consolePanel).toContainText("Inactive");
    row(rows, `${name} Turn Off Bot`, "Click Turn Off Bot", "Bot status becomes Inactive", "Console contains Inactive", true);

    await consolePanel.getByRole("button", { name: "Save Configuration", exact: true }).click();
    await consolePanel.getByRole("button", { name: "Deploy Bot", exact: true }).click();
    await expect(card).toContainText("Active");
    row(rows, `${name} redeploy for persistence`, "Save and deploy valid config", "Active state stored for reload check", "Card contains Active", true);
  }

  for (const [index, name] of primaryNames.entries()) {
    await auditBot(name, "primary", index);
  }
  for (const [index, name] of otherNames.entries()) {
    await auditBot(name, "other", index);
  }

  await page.reload();
  await page.getByLabel("Main views").getByRole("button", { name: "Bots", exact: true }).click();
  for (const name of primaryNames) {
    const id = botId(name, "primary");
    const actual = await page.locator(`.primary-bot-grid [data-bot-id="${id}"]`).textContent();
    row(rows, `${name} persistence`, "Reload page", "Saved Active state persists", String(actual?.includes("Active")), Boolean(actual?.includes("Active")));
  }
  for (const name of otherNames) {
    const id = botId(name, "other");
    const actual = await page.locator(`.other-bot-grid [data-bot-id="${id}"]`).textContent();
    row(rows, `${name} persistence`, "Reload page", "Saved Active state persists", String(actual?.includes("Active")), Boolean(actual?.includes("Active")));
  }

  async function auditDisclosure(category: "Politicians" | "Public Figures" | "Insiders", query: string, personName: string, expectedDetail: string) {
    await page.locator(".disclosure-main-card").filter({ hasText: category }).click();
    const workspace = page.locator(".disclosure-workspace");
    await expect(workspace).toBeVisible();
    await expect(workspace.locator(".disclosure-table-row")).toHaveCount(10);
    row(rows, `${category} card`, "Click disclosure card", "Centered top-10/search workspace opens", "Workspace visible with 10 rows", true);

    await page.getByLabel(`${category} search`).fill(query);
    await expect(workspace).toContainText(personName);
    row(rows, `${category} search`, `Input ${query}`, `${personName} appears in filtered results`, `${personName} visible`, true);

    await workspace.getByRole("button", { name: "View Full List", exact: true }).click();
    const fullRows = await workspace.locator(".disclosure-table-row").count();
    row(rows, `${category} View Full List`, "Click View Full List", "Full list remains usable", `Row count: ${fullRows}`, fullRows >= 1);

    await workspace.locator(".disclosure-table-row").filter({ hasText: personName }).click();
    const personModal = page.locator(".person-modal");
    await expect(personModal).toContainText(expectedDetail);
    row(rows, `${personName} detail`, "Click person row", "Centered person detail opens with methodology/source state", `Modal contains: ${expectedDetail}`, true);

    await personModal.getByRole("button", { name: "Track", exact: true }).click();
    await expect(personModal).toContainText("Tracking");
    row(rows, `${personName} follow/track`, "Click Track", "Follow state toggles to Tracking", "Modal contains Tracking", true);

    await personModal.getByRole("button", { name: "Close", exact: true }).click();
    await expect(personModal).toHaveCount(0);
    row(rows, `${personName} modal close`, "Click Close", "Person modal closes", "Person modal removed", true);

    await workspace.getByRole("button", { name: "Close", exact: true }).click();
    await expect(workspace).toHaveCount(0);
    row(rows, `${category} workspace close`, "Click Close", "Workspace closes", "Workspace removed", true);
  }

  await auditDisclosure("Politicians", "Nancy", "Nancy Pelosi", "Nancy Pelosi");
  await auditDisclosure("Politicians", "Josh", "Josh Gottheimer", "Josh Gottheimer");
  await auditDisclosure("Public Figures", "Warren", "Warren Buffett", "No public trading disclosure found");
  await auditDisclosure("Insiders", "Jensen", "Jensen Huang", "SEC/Form 4");

  await page.getByRole("button", { name: "Create Your Own Bot", exact: true }).first().click();
  const builder = page.locator(".custom-bot-builder");
  await expect(builder).toBeVisible();
  row(rows, "Create Your Own Bot", "Click Create Your Own Bot", "Centered custom bot builder opens", "Builder visible", true);

  await builder.getByRole("button", { name: "Deploy Strategy", exact: true }).click();
  await expect(builder).toContainText("Bot name is required");
  row(rows, "Custom Bot validation", "Deploy blank builder", "Specific blockers show", "Bot name is required visible", true);

  const customFields: Array<[string, string]> = [
    ["Bot Name", "Receipt Bot"],
    ["Bot Personality / Style", "Methodical audit robot"],
    ["Strategy Type", "Receipt strategy"],
    ["Asset Universe", "AMD, COIN, SPY"],
    ["Exclusions", "Illiquid names"],
    ["Data Sources Required", "Market data, news"],
    ["Allocation Value", "12000"],
    ["Max Position Size", "6"],
    ["Stop Loss", "3"],
    ["Take Profit", "11"],
    ["Entry Rules", "Enter on confirmed catalyst"],
    ["Exit Rules", "Exit on target or thesis break"],
    ["Confidence Threshold", "76"]
  ];
  await builder.locator("label", { hasText: "Allocation Mode" }).locator("select").selectOption("Fixed");
  row(rows, "Custom Bot Allocation Mode", "Select Fixed", "Allocation value is a fixed dollar field", "Fixed selected", true);
  await builder.locator("label", { hasText: "Risk" }).locator("select").selectOption("High");
  row(rows, "Custom Bot Risk", "Select High", "Risk accepted", "High selected", true);

  for (const [label, value] of customFields) {
    const input = builder.locator("label", { hasText: label }).locator("input");
    await input.fill(value);
    await input.press("Tab");
    const actual = await input.inputValue();
    row(rows, `Custom Bot ${label}`, `Input ${value}`, "Field accepts and retains value", `Value: ${actual}`, actual.includes(value) || actual === "$12,000.00");
  }

  await builder.getByRole("button", { name: "Save Configuration", exact: true }).click();
  await expect(page.locator(".other-bot-grid")).toContainText("Receipt Bot");
  row(rows, "Custom Bot Save Configuration", "Click Save Configuration", "Saved custom bot appears in Other Bots", "Receipt Bot visible", true);

  await page.locator('.other-bot-grid [data-bot-id="custom-receipt-bot"]').click();
  await expect(page.locator(".bot-deployment-console")).toContainText("Receipt Bot Deployment Console");
  row(rows, "Custom Bot behaves like other bots", "Click saved custom bot card", "Same deployment console opens", "Receipt Bot Deployment Console visible", true);

  const failed = rows.filter((entry) => entry.result === "FAIL");
  const lines = [
    "# Bots Click-and-Field Audit Log",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Total rows: ${rows.length}`,
    `Failures: ${failed.length}`,
    "",
    "| # | element tested | input/action used | expected result | actual result | pass/fail |",
    "|---:|---|---|---|---|---|",
    ...rows.map((entry, index) => `| ${index + 1} | ${entry.element.replaceAll("|", "\\|")} | ${entry.action.replaceAll("|", "\\|")} | ${entry.expected.replaceAll("|", "\\|")} | ${entry.actual.replaceAll("|", "\\|")} | ${entry.result} |`)
  ];
  const outPath = path.join(process.cwd(), "artifacts", "bots-click-field-audit-log.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n"));
  expect(failed).toHaveLength(0);
});
