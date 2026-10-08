import { test, expect } from "@playwright/test";
test("homepage, navigation, filter state and responsive layout", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "EVERYDAY, IN MOTION." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "Explore Chapter 01", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "THE EVERYDAY COLLECTION." }),
  ).toBeVisible();
  await page.getByLabel("Color", { exact: true }).selectOption("Ink");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page).toHaveURL(/color=Ink/);
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "The After Hours" }),
  ).toBeVisible();
});
test("variant, cart, guest checkout and order tracking", async ({ page }) => {
  await page.goto("/products/everyday-crew");
  await page
    .locator(".purchase-row")
    .getByRole("button", { name: "Add to bag" })
    .click();
  await expect(page.locator(".form-error")).toContainText("Choose your size");
  await page.getByRole("button", { name: "EU 36–40", exact: true }).click();
  await page
    .locator(".purchase-row")
    .getByRole("button", { name: "Add to bag" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "The Everyday Crew" }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Increase The Everyday Crew" })
    .click();
  await expect(dialog.locator(".quantity span")).toHaveText("2");
  await dialog.getByRole("link", { name: "Continue to checkout" }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Browser Test");
  await page.getByLabel("Mobile number").fill("01012345678");
  await page
    .getByLabel("Email address")
    .fill(`browser-${Date.now()}@example.test`);
  await page.getByLabel("City / Area").fill("Cairo");
  await page.getByLabel("Street address").fill("Test street");
  await page.getByLabel("Building", { exact: true }).fill("12");
  await page.getByLabel("I agree to the").check();
  await page.getByRole("button", { name: "Place test order" }).click();
  await expect(page).toHaveURL(/\/orders\//);
  await expect(
    page.getByRole("heading", { name: "YOUR NEXT CHAPTER." }),
  ).toBeVisible();
  await expect(page.getByText("COD / PENDING")).toBeVisible();
  await expect(
    page.getByText("TEST ORDER / No goods will be shipped."),
  ).toBeVisible();
});
test("sandbox card payment and admin access protection", async ({
  page,
  request,
}) => {
  await page.goto("/products/quiet-stripe");
  await page.getByRole("button", { name: "EU 41–45", exact: true }).click();
  await page
    .locator(".purchase-row")
    .getByRole("button", { name: "Add to bag" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Continue to checkout" })
    .click();
  await page.getByLabel("Full name", { exact: true }).fill("Card Test");
  await page.getByLabel("Mobile number").fill("01112345678");
  await page
    .getByLabel("Email address")
    .fill(`card-${Date.now()}@example.test`);
  await page.getByLabel("City / Area").fill("Giza");
  await page.getByLabel("Street address").fill("Test avenue");
  await page.getByLabel("Building", { exact: true }).fill("10");
  await page.getByRole("radio", { name: /Card \/ sandbox/ }).check();
  await page.getByLabel("I agree to the").check();
  await page.getByRole("button", { name: "Place test order" }).click();
  await expect(page).toHaveURL(/\/payment\//);
  await page
    .getByRole("button", { name: "Simulate successful payment" })
    .click();
  await expect(page.getByText("CARD / PAID")).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL("/admin/login");
  const r = await request.post("/api/admin/settings", {
    headers: { Origin: "http://localhost:3000" },
    data: { freeShippingThreshold: 0 },
  });
  expect(r.status()).toBe(401);
});
test("keyboard dialog dismissal, reduced motion and informational pages", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: /Bag \(/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  for (const url of [
    "/about",
    "/24",
    "/contact",
    "/faq",
    "/shipping-returns",
    "/privacy",
    "/terms",
    "/size-guide",
  ]) {
    await page.goto(url);
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
