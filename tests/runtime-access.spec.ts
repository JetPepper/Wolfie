import { expect, test } from "@playwright/test";

const forbiddenVisible = [
  "mock",
  "sandbox",
  "debug",
  "localhost",
  "MCP TOOL CALL",
  "BotConfig",
  "PaperExchange",
  "Warren",
  "Twinkies",
  "premium",
  "pro tier",
  "upgrade tier",
];

test("pins onboarding capital prompt remains unchanged", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "How much do you want Wolfie to trade with?" })).toBeVisible();
});

test("pins app opens without login in local explore mode", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Dashboard/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Paper/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue/ })).toBeVisible();
});

test("pins bot deployment console remains available", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Main views").getByRole("button", { name: "Bots" }).click();
  await expect(page.getByText("Deploy", { exact: false }).first()).toBeVisible();
});

test("pins custom bot builder remains available", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Main views").getByRole("button", { name: "Bots" }).click();
  await expect(page.getByRole("button", { name: /Create Your Own Bot/i }).first()).toBeVisible();
});

test("pins live mode prompts for full wolfie unlock", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Live/ }).first().click();
  await expect(page.getByText("Live trading locked")).toBeVisible();
  await expect(page.getByText("Live trading is not enabled in this beta. Wolfie currently tests real intelligence with paper-only execution.")).toBeVisible();
});

test("pins local explore does not require entitlement", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Starting Capital")).toBeVisible();
  await expect(page.getByText("entitlement", { exact: false })).toHaveCount(0);
});

test("pins full wolfie unlock does not upload trading data", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Live/ }).first().click();
  expect(requests.some((url) => /trade|order|position|portfolio|broker|watchlist/i.test(url))).toBe(false);
});

test("pins master dev indicator is not visible in production", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("MASTER_DEV_OWNER")).toHaveCount(0);
  await expect(page.getByText("Wolfie Master Dev Operator")).toHaveCount(0);
});

test("pins forbidden visible strings are absent", async ({ page }) => {
  await page.goto("/");
  const body = (await page.locator("body").innerText()).toLowerCase();
  for (const text of forbiddenVisible) {
    expect(body).not.toContain(text.toLowerCase());
  }
});
