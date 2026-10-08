import { test, expect } from "@playwright/test";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const email = `editor-${randomUUID()}@example.test`;
const password = randomUUID() + randomUUID();
const key = `test-content-${randomUUID()}`;
let userId = "";
test.beforeAll(async () => {
  const u = await db.adminUser.create({
    data: {
      email,
      passwordHash: await hash(password, 12),
      name: "Test Editor",
      role: "EDITOR",
    },
  });
  userId = u.id;
});
test.afterAll(async () => {
  await db.content.deleteMany({ where: { key } });
  await db.auditLog.deleteMany({ where: { actorId: userId } });
  await db.adminUser.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});
test("editor login, content persistence, and role boundary", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Enter the workspace" }).click();
  await expect(page).toHaveURL("/admin");
  await page.getByRole("link", { name: "Content", exact: true }).click();
  await page.getByRole("button", { name: "Add section" }).click();
  await page.getByLabel("Section key").fill(key);
  await page.getByLabel("Title", { exact: true }).fill("A test story");
  await page
    .getByLabel("Body", { exact: true })
    .fill("A considered test of the content editor.");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toHaveText("Saved.");
  expect((await db.content.findUnique({ where: { key } }))?.title).toBe(
    "A test story",
  );
  const denied = await page.request.post("/api/admin/settings", {
    headers: { Origin: "http://localhost:3000" },
    data: {},
  });
  expect(denied.status()).toBe(403);
  const csrf = await page.request.post("/api/admin/content", {
    headers: { Origin: "http://localhost:3000" },
    data: { key: "never-saved", title: "No", body: "No", image: "" },
  });
  expect(csrf.status()).toBe(400);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/admin/login");
});
