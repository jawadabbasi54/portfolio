import { expect, test } from "@playwright/test";

const caseStudies = [
  "/case-studies/aws-enterprise-iot-platform",
  "/case-studies/terraform-multi-environment-infrastructure",
  "/case-studies/secure-cicd-automation",
  "/case-studies/observability-incident-response",
];

test("homepage exposes core content, case studies, and résumé", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Jawad Abbasi \| Senior DevOps Engineer/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("End-to-end DevOps");
  await expect(page.locator(".study-card")).toHaveCount(4);
  await expect(page.getByRole("link", { name: /download résumé/i }).first()).toHaveAttribute("href", "/Jawad_Abbasi_Resume.pdf");
});

test("mobile navigation opens, closes with Escape, and exposes key destinations", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only interaction");
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("mobile defers Three.js until the globe approaches the viewport", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only loading behavior");
  await page.goto("/");
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => Boolean(window.THREE))).toBe(false);
  await page.locator("#globe-stage").scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => Boolean(window.THREE)), { timeout: 15_000 }).toBe(true);
});

for (const path of caseStudies) {
  test(`case study renders article metadata and content: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    const structuredData = await page.locator('script[type="application/ld+json"]').evaluate((element) => element.textContent || "");
    expect(structuredData).toContain("TechArticle");
  });
}

test("custom 404 is branded and excluded from indexing", async ({ page }) => {
  const response = await page.goto("/route-that-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("deployment path");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});

test("primary pages do not introduce horizontal overflow", async ({ page }) => {
  for (const path of ["/", ...caseStudies]) {
    await page.goto(path);
    const horizontalScroll = await page.evaluate(() => {
      window.scrollTo(10_000, window.scrollY);
      const result = window.scrollX;
      window.scrollTo(0, window.scrollY);
      return result;
    });
    expect(horizontalScroll, `${path} permits horizontal scrolling`).toBe(0);
  }
});
