import { z } from "zod";
import { db } from "@/lib/db";
import { verifyOrigin, rateLimit, clientKey } from "@/lib/auth";
import { readJson, errorResponse } from "@/lib/http";
export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    await rateLimit(`contact:${clientKey(req)}`, 5, 600);
    const input = z
      .object({
        name: z.string().trim().min(2).max(100),
        email: z.email().max(254),
        message: z.string().trim().min(10).max(3000),
        website: z.string().max(0).optional(),
      })
      .parse(await readJson(req));
    await db.inquiry.create({
      data: { name: input.name, email: input.email, message: input.message },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
