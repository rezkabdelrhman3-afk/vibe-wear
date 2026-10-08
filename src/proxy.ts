import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

// Preview access is independent of staff authentication and covers every route,
// including APIs and media. Vercel deployments fail closed until configured.
export function proxy(request: NextRequest) {
  const password = process.env.PREVIEW_PASSWORD;
  if (!password && process.env.VERCEL !== "1") return NextResponse.next();
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  };
  if (!password || password.length < 16)
    return new NextResponse("Private preview is not configured yet.", {
      status: 503,
      headers,
    });
  const expected =
    "Basic " + Buffer.from("mashy:" + password).toString("base64");
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (
    !timingSafeEqual(
      digest(request.headers.get("authorization") || ""),
      digest(expected),
    )
  ) {
    return new NextResponse("MASHY private preview. Sign in to continue.", {
      status: 401,
      headers: {
        ...headers,
        "WWW-Authenticate":
          'Basic realm="MASHY private preview", charset="UTF-8"',
      },
    });
  }
  const response = NextResponse.next();
  for (const [name, value] of Object.entries(headers))
    response.headers.set(name, value);
  return response;
}
