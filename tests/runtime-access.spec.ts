import { expect, test } from "@playwright/test";

const removedVisibleStrings = [
  "How much do you want Wolfie to trade with?",
  "Main views",
  "Signal Console",
  "Trading Activity",
  "Starting Capital",
  "Deploy Bot",
  "Create Your Own Bot",
  "Wolfie Command Dashboard",
  "Field Navigator",
  "Bot Thought Preview"
];

test("uploaded landing replaces removed dashboard/runtime UI", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Autonomous AI Trading Agents/);
  await expect(page.getByRole("heading", { name: /The unfair advantage launches soon/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Join the pack." })).toBeVisible();

  const body = await page.locator("body").innerText();
  for (const text of removedVisibleStrings) {
    expect(body).not.toContain(text);
  }
});

test("waitlist submission does not call trading or broker endpoints", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.goto("/");
  await page.locator("#wl-name").fill("Runtime Access Check");
  await page.locator("#wl-email").fill("runtime-access@example.com");
  await page.locator("#wl-exp").selectOption({ label: "Retail / self-directed" });
  await page.locator("#wl-int").selectOption({ label: "Fully autonomous agents" });
  await page.getByRole("button", { name: "Claim my place" }).click();
  await expect(page.locator("#wlSuccess")).toHaveClass(/show/);

  expect(requests.some((url) => /\/api\/(paper|market|mcp|orders?|positions?|broker|trades?)/i.test(url))).toBe(false);
  expect(requests.some((url) => /\/api\/waitlist/i.test(url))).toBe(true);
});
