import { db } from "@/lib/db";
import { verifyAdminRequest } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { storeImage } from "@/integrations/media";
export async function POST(req: Request) {
  try {
    const user = await verifyAdminRequest(req);
    if (Number(req.headers.get("content-length") || 0) > 11 * 1024 * 1024)
      throw new Error("Upload size limit exceeded");
    const form = await req.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") || "").trim();
    if (!(file instanceof File) || !alt || alt.length > 300)
      throw new Error("Image and descriptive alt text are required");
    const url = await storeImage(file);
    const media = await db.media.create({ data: { url, alt } });
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: "UPLOAD",
        resource: "media",
        resourceId: media.id,
      },
    });
    return Response.json(media);
  } catch (e) {
    return errorResponse(e);
  }
}
