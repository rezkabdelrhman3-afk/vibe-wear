import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOrigin, rateLimit, clientKey, createSession } from "@/lib/auth";
import { readJson, errorResponse } from "@/lib/http";
export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    await rateLimit(`login:${clientKey(req)}`, 10, 900);
    const input = z
      .object({
        email: z.email().transform((v) => v.toLowerCase()),
        password: z.string().min(1).max(72),
      })
      .parse(await readJson(req));
    await rateLimit(`account:${input.email}`, 10, 900);
    const user = await db.adminUser.findUnique({
      where: { email: input.email },
    });
    const valid = await compare(
      input.password,
      user?.passwordHash ||
        "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxAYRyRtndScGYcPqYaSdEbWBj2",
    );
    if (!valid || !user?.active)
      return Response.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    await createSession(user);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
