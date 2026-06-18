import { expect, test } from "@playwright/test";

async function onboard(page: any) {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: "How much do you want Wolfie to trade with?" })).toBeVisible();
  await page.locator("#capital-input").fill("250000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: "Wolfie overview" })).toBeVisible();
}

test("Wolfie metallic cockpit renders and core controls work", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await onboard(page);

  await expect(page.getByRole("button", { name: "Wolfie overview" })).toBeVisible();
  const mainNav = page.getByLabel("Main views");
  await expect(mainNav.getByRole("button", { name: "Overview", exact: true })).toBeVisible();
  await expect(mainNav.getByRole("button", { name: "Trading Bots", exact: true })).toBeVisible();
  await expect(mainNav.getByRole("button", { name: "Signal Intelligence", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wolfie Command Dashboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Trading Balance/ })).toBeVisible();

  const cardGrid = page.locator(".dashboard-card-grid");
  for (const cardName of ["Trading Balance", "Buying Power", "Allocated to Bots", "Net P/L", "Active Thoughts", "Top Confidence"]) {
    await cardGrid.getByRole("button", { name: new RegExp(cardName) }).click();
    await expect(page.locator(".detail-drawer").getByRole("heading", { name: cardName })).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
  }

  await page.getByRole("button", { name: "Expand 3D" }).click();
  await expect(page.getByRole("heading", { name: "Signal field ranked by conviction" })).toBeVisible();
  await expect(page.getByLabel("Bot Thought intelligence field")).toBeVisible();
  const canvas = page.locator(".three-stage canvas").first();
  await expect(canvas).toBeVisible();
  const canvasHasPixels = await canvas.evaluate((element: HTMLCanvasElement) => {
    const context = element.getContext("webgl2") || element.getContext("webgl");
    return Boolean(context && element.width > 100 && element.height > 100);
  });
  expect(canvasHasPixels).toBeTruthy();
  await page.screenshot({ path: "artifacts/dashboard-desktop.png", fullPage: true });

  await page.getByRole("button", { name: /NVDA/ }).first().click({ force: true });
  await expect(page.locator(".detail-drawer").getByRole("heading", { name: "NVDA Position" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await mainNav.getByRole("button", { name: "Trading Bots", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Trading Bots" })).toBeVisible();
  await expect(page.getByText("Public Disclosure Micro Bots")).toBeVisible();
  await expect(page.getByText("Returns UNKNOWN")).toBeVisible();
  await expect(page.getByRole("button", { name: /Form Scout/ })).toBeVisible();
  await page.screenshot({ path: "artifacts/bots-refined.png", fullPage: true });
  await page.getByRole("button", { name: /Wolfie Compass/ }).first().click();
  await expect(page.locator(".detail-drawer").getByRole("heading", { name: "Wolfie Compass" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await mainNav.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thought timeline and audit trail" })).toBeVisible();
  await expect(page.getByText("Thought upgraded")).toBeVisible();

  await mainNav.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Risk and operating controls" })).toBeVisible();
  await page.locator(".settings-panel input").first().fill("$125,000");
  await page.getByRole("button", { name: "Save capital" }).click();
  await expect(page.locator(".settings-panel input").first()).toHaveValue("$125,000");
  await page.getByRole("button", { name: "LIVE" }).first().click();
  await expect(page.getByRole("heading", { name: "Live trading is not enabled." })).toBeVisible();
  await page.screenshot({ path: "artifacts/dashboard-live-lock.png", fullPage: true });
});

test("Wolfie cockpit scales on mobile without clipped navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  const mainNav = page.getByLabel("Main views");
  await expect(mainNav.getByRole("button", { name: "Overview", exact: true })).toBeVisible();
  await expect(mainNav.getByRole("button", { name: "Trading Bots", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Wolfie Command Dashboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Trading Balance/ })).toBeVisible();
  await mainNav.getByRole("button", { name: "Signal Intelligence", exact: true }).click();
  await expect(page.getByLabel("Bot Thought intelligence field")).toBeVisible();
  await page.screenshot({ path: "artifacts/dashboard-mobile.png", fullPage: true });
});
