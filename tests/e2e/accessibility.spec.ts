import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const route of ["/", "/shop", "/products/everyday-crew", "/contact"]) {
  test(`accessibility baseline ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
test("homepage fits small mobile through large desktop", async ({ page }) => {
  await page.goto("/");
  for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
