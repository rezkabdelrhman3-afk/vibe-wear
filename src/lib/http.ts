import { ZodError } from "zod";
export function errorResponse(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      { error: error.issues.map((i) => i.message).join(". ") },
      { status: 400 },
    );
  const message = error instanceof Error ? error.message : "Request failed";
  const safe =
    message === "UNAUTHORIZED" ||
    message === "FORBIDDEN" ||
    /stock|code|available|Duplicate|Checkout has changed|origin|security token|Too many|Payment|payment|Discount|required|invalid|Invalid|cannot|transition|limit|not found|Choose|Quantity/i.test(
      message,
    );
  return Response.json(
    {
      error: safe
        ? message
        : "Unable to complete the request. Please try again.",
    },
    {
      status:
        message === "UNAUTHORIZED"
          ? 401
          : message === "FORBIDDEN"
            ? 403
            : /Too many/.test(message)
              ? 429
              : 400,
    },
  );
}
export async function readJson(req: Request) {
  const raw = await req.text();
  if (raw.length > 100000) throw new Error("Request size limit exceeded");
  return JSON.parse(raw);
}
