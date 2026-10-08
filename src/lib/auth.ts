import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "./db";
function secret() {
  const key = process.env.AUTH_SECRET;
  if (!key || key.length < 32)
    throw new Error("AUTH_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(key);
}
export async function createSession(user: {
  id: string;
  sessionVersion: number;
}) {
  const csrf = randomBytes(24).toString("hex");
  const token = await new SignJWT({ ver: user.sessionVersion, csrf })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
  (await cookies()).set("mashy_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 28800,
  });
  return csrf;
}
export async function currentUser() {
  try {
    const token = (await cookies()).get("mashy_session")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
    });
    const user = await db.adminUser.findUnique({ where: { id: payload.sub } });
    if (!user?.active || user.sessionVersion !== payload.ver) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      csrf: String(payload.csrf),
    };
  } catch {
    return null;
  }
}
export async function requireUser(adminOnly = false) {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (adminOnly && user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
export function verifyOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const allowed = [
    process.env.APP_URL,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ].filter((value): value is string => Boolean(value));
  if (!allowed.length) allowed.push("http://localhost:3000");
  if (!origin || !allowed.some((value) => new URL(value).origin === origin))
    throw new Error("Invalid request origin");
}
export async function verifyAdminRequest(req: Request, adminOnly = false) {
  verifyOrigin(req);
  const user = await requireUser(adminOnly);
  const csrf = req.headers.get("x-csrf-token") || "";
  if (
    csrf.length !== user.csrf.length ||
    !timingSafeEqual(Buffer.from(csrf), Buffer.from(user.csrf))
  )
    throw new Error("Invalid security token");
  return user;
}
export async function rateLimit(key: string, limit = 10, seconds = 60) {
  const rows = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "RateLimit" ("key","count","expiresAt") VALUES (${key},1,NOW()+${seconds}*INTERVAL '1 second') ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "RateLimit"."expiresAt"<NOW() THEN 1 ELSE "RateLimit"."count"+1 END, "expiresAt"=CASE WHEN "RateLimit"."expiresAt"<NOW() THEN NOW()+${seconds}*INTERVAL '1 second' ELSE "RateLimit"."expiresAt" END RETURNING "count"`;
  if (rows[0].count > limit)
    throw new Error("Too many requests. Please try again shortly.");
}
export function clientKey(req: Request) {
  return process.env.TRUST_PROXY === "true"
    ? req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
    : "shared";
}
