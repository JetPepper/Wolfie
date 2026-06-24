import { existsSync, readFileSync, rmSync } from "node:fs";
import { expect, test } from "@playwright/test";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const XLSX = require("../apps/web/node_modules/xlsx");

const xlsxPath = process.env.WOLFIE_WAITLIST_XLSX_PATH || "/tmp/wolfie-playwright-waitlist.xlsx";
const emailPath = process.env.WOLFIE_WAITLIST_EMAIL_PATH || "/tmp/wolfie-playwright-waitlist-email.json";

function resetWaitlistArtifacts() {
  rmSync(xlsxPath, { force: true });
  rmSync(emailPath, { force: true });
}

function readWorkbookRows() {
  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

test("uploaded landing route and legal routes load without runtime errors", async ({ page }) => {
  const consoleMessages: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) consoleMessages.push(message.text());
  });
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText}`));

  await page.setViewportSize({ width: 1440, height: 940 });
  await page.goto("/");
  await expect(page).toHaveTitle(/Autonomous AI Trading Agents/);
  await expect(page.getByRole("heading", { name: /The unfair advantage launches soon/i })).toBeVisible();
  await expect(page.locator(".eyebrow")).toContainText("Private beta");
  await expect(page.getByRole("heading", { name: "Join the pack." })).toBeVisible();
  await expect(page.locator("img[alt='Wolfie logo']").first()).toBeVisible();

  await page.goto("/privacy");
  await expect(page).toHaveURL(/\/privacy\/$/);
  await expect(page).toHaveTitle("Privacy Policy — Wolfie");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();

  await page.goto("/terms");
  await expect(page).toHaveURL(/\/terms\/$/);
  await expect(page).toHaveTitle("Terms of Service — Wolfie");
  await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();

  expect(consoleMessages).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test("waitlist validates, submits, writes XLSX, updates existing email, and triggers email file", async ({
  page,
  request
}) => {
  resetWaitlistArtifacts();

  await page.goto("/");
  await page.locator("#waitlist").scrollIntoViewIfNeeded();

  await page.locator("#wl-email").fill("not-an-email");
  const invalid = await page.locator("form").evaluate((form) => !(form as HTMLFormElement).checkValidity());
  expect(invalid).toBe(true);

  await page.locator("#wl-name").fill("Wolfie Test User");
  await page.locator("#wl-email").fill("wolfie-test@example.com");
  await page.locator("#wl-exp").selectOption({ label: "Retail / self-directed" });
  await page.locator("#wl-int").selectOption({ label: "Fully autonomous agents" });

  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/waitlist") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Claim my place" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  const payload = await response.json();
  expect(payload.ok).toBe(true);
  expect(payload.xlsx.filename).toBe("wolfie-playwright-waitlist.xlsx");
  expect(payload.xlsx.rowCount).toBe(1);
  expect(payload.xlsx.updatedExisting).toBe(false);
  expect(payload.email.sent).toBe(true);
  expect(payload.email.provider).toBe("file");
  await expect(page.locator("#wlSuccess")).toHaveClass(/show/);

  expect(existsSync(xlsxPath)).toBe(true);
  let rows = readWorkbookRows();
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    "Full Name": "Wolfie Test User",
    "Email Address": "wolfie-test@example.com",
    "Trading Experience": "Retail / self-directed",
    Interest: "Fully autonomous agents",
    "Submission Count": 1,
    Source: "uploaded-landing-page"
  });

  expect(existsSync(emailPath)).toBe(true);
  const email = JSON.parse(readFileSync(emailPath, "utf8"));
  expect(email.subject).toBe("New Wolfie Waitlist Submission");
  expect(email.text).toContain("Wolfie Test User");
  expect(email.text).toContain("Retail / self-directed");
  expect(email.attachments[0].filename).toBe("wolfie-playwright-waitlist.xlsx");

  const updateResponse = await request.post("/api/waitlist", {
    data: {
      name: "Wolfie Test User Updated",
      email: "wolfie-test@example.com",
      experience: "Fund or asset manager",
      interest: "Real-time news intelligence"
    }
  });
  expect(updateResponse.ok()).toBe(true);
  const updatePayload = await updateResponse.json();
  expect(updatePayload.xlsx.rowCount).toBe(1);
  expect(updatePayload.xlsx.updatedExisting).toBe(true);

  rows = readWorkbookRows();
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    "Full Name": "Wolfie Test User Updated",
    "Email Address": "wolfie-test@example.com",
    "Trading Experience": "Fund or asset manager",
    Interest: "Real-time news intelligence",
    "Submission Count": 2
  });
});

test("uploaded landing remains usable on mobile without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /The unfair advantage launches soon/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join waitlist" })).toBeVisible();

  await page.getByRole("button", { name: "Join waitlist" }).click();
  await expect(page.locator("#waitlist")).toBeInViewport();
  await expect(page.locator("#wl-name")).toBeVisible();
  await expect(page.locator("#wl-email")).toBeVisible();
  await expect(page.locator("#wl-exp")).toBeVisible();
  await expect(page.locator("#wl-int")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  expect(hasHorizontalOverflow).toBe(false);
});
