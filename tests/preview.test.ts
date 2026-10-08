import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
afterEach(() => vi.unstubAllEnvs());
describe("private Vercel preview", () => {
  it("fails closed before a password is configured", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("PREVIEW_PASSWORD", "");
    expect(proxy(new NextRequest("https://example.test/")).status).toBe(503);
  });
  it("protects pages, APIs, source assets and media", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("PREVIEW_PASSWORD", "only-a-test-password");
    for (const path of [
      "/",
      "/api/health",
      "/media/cream.jpg",
      "/_next/static/example.js",
    ]) {
      const response = proxy(new NextRequest("https://example.test" + path));
      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toContain("Basic");
    }
  });
  it("allows the correct password and prevents caching", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("PREVIEW_PASSWORD", "only-a-test-password");
    const response = proxy(
      new NextRequest("https://example.test/", {
        headers: {
          authorization:
            "Basic " +
            Buffer.from("mashy:only-a-test-password").toString("base64"),
        },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("does not gate local development without an explicit password", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("PREVIEW_PASSWORD", "");
    expect(proxy(new NextRequest("http://localhost:3000/")).status).toBe(200);
  });
});
