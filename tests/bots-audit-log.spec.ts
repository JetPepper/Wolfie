import { expect, test } from "@playwright/test";

test("uploaded landing click-through audit covers visible navigation and controls", async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 1440, height: 940 });
  await page.goto("/");

  await page.locator("nav .nav-brand").click();
  await expect(page.locator("#top")).toBeInViewport();

  await page.locator("nav").getByRole("link", { name: "How it works" }).click();
  await expect(page.locator("#how-it-works")).toBeInViewport();

  await page.locator("nav").getByRole("link", { name: "Capabilities" }).click();
  await expect(page.locator("#features")).toBeInViewport();

  await page.locator("nav").getByRole("button", { name: "Join waitlist" }).click();
  await expect(page.locator("#waitlist")).toBeInViewport();

  await page.locator("#top").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Claim your place in the pack" }).click();
  await expect(page.locator("#waitlist")).toBeInViewport();

  await page.locator("#top").scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "See how it hunts" }).click();
  await expect(page.locator("#how-it-works")).toBeInViewport();

  await page.locator("#features").scrollIntoViewIfNeeded();
  const firstCard = page.locator(".card").first();
  await expect(firstCard).toBeVisible();
  await firstCard.hover();
  await page.waitForTimeout(900);
  await expect(firstCard).toHaveClass(/in/);

  await page.locator("#algoBody").scrollIntoViewIfNeeded();
  await expect(page.locator("#algoBody .algo-step").first()).toHaveClass(/in/);

  await page.locator("#waitlist").scrollIntoViewIfNeeded();
  await page.locator("#wl-name").fill("Click Audit");
  await expect(page.locator("#wl-name")).toHaveValue("Click Audit");
  await page.locator("#wl-email").fill("click-audit@example.com");
  await expect(page.locator("#wl-email")).toHaveValue("click-audit@example.com");
  await page.locator("#wl-exp").selectOption({ label: "Active / professional trader" });
  await expect(page.locator("#wl-exp")).toHaveValue("Active / professional trader");
  await page.locator("#wl-int").selectOption({ label: "Transparent AI reasoning" });
  await expect(page.locator("#wl-int")).toHaveValue("Transparent AI reasoning");

  await page.locator("footer").getByRole("link", { name: "Capabilities" }).click();
  await expect(page.locator("#features")).toBeInViewport();
  await page.locator("footer").getByRole("link", { name: "How it works" }).click();
  await expect(page.locator("#how-it-works")).toBeInViewport();
  await page.locator("footer").getByRole("link", { name: "Waitlist" }).click();
  await expect(page.locator("#waitlist")).toBeInViewport();

  await page.locator("footer").getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL(/privacy\.html/);
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await page.getByRole("link", { name: /Back to site/ }).click();
  await expect(page).toHaveURL(/index\.html/);

  await page.goto("/");
  await page.locator("footer").getByRole("link", { name: "Terms" }).click();
  await expect(page).toHaveURL(/terms\.html/);
  await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
});
