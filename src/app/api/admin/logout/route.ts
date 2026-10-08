import { cookies } from "next/headers";
import { verifyOrigin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    (await cookies()).delete("mashy_session");
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
