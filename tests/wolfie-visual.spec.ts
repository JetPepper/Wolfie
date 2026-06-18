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

  await expect(page.getByRole("button", { name: "BOT THOUGHT" })).toBeVisible();
  await expect(page.getByLabel("Bot Thought intelligence field")).toBeVisible();
  await expect(page.locator(".three-stage canvas")).toBeVisible();
  const canvasHasPixels = await page.locator(".three-stage canvas").evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    return Boolean(context && canvas.width > 100 && canvas.height > 100);
  });
  expect(canvasHasPixels).toBeTruthy();
  await expect(page.getByRole("button", { name: /NVDA/ }).first()).toBeVisible();
  await page.screenshot({ path: "artifacts/metallic-bot-thought-desktop.png", fullPage: true });

  await page.getByRole("button", { name: /NVDA/ }).first().click({ force: true });
  await expect(page.locator(".detail-drawer").getByRole("heading", { name: "NVDA Position" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "SIGNALS", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Signal field ranked by conviction" })).toBeVisible();
  await expect(page.locator(".wide-panel .three-stage canvas").first()).toBeVisible();

  await page.getByRole("button", { name: "PORTFOLIO", exact: true }).click();
  await expect(page.getByText("Portfolio Allocation")).toBeVisible();

  await page.getByRole("button", { name: "RISK", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Risk and operating controls" })).toBeVisible();
  await page.getByRole("button", { name: "LIVE" }).first().click();
  await expect(page.getByRole("heading", { name: "Live trading is not enabled." })).toBeVisible();
  await page.screenshot({ path: "artifacts/metallic-live-lock.png", fullPage: true });
});

test("Wolfie cockpit scales on mobile without clipped navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await expect(page.getByRole("button", { name: "BOT THOUGHT" })).toBeVisible();
  await expect(page.getByLabel("Bot Thought intelligence field")).toBeVisible();
  await page.screenshot({ path: "artifacts/metallic-mobile.png", fullPage: true });
});
