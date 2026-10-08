import { timingSafeEqual } from "node:crypto";
import { runMaintenance } from "@/domain/maintenance";
export async function POST(req: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  const actual = req.headers.get("authorization") || "";
  if (
    !process.env.CRON_SECRET ||
    expected.length !== actual.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
  )
    return new Response(null, { status: 401 });
  return Response.json(await runMaintenance());
}
