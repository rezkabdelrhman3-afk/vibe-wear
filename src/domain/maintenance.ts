import { db } from "@/lib/db";
import { releaseOrder } from "./checkout";
import { flushEmails } from "@/integrations/email";
export async function runMaintenance() {
  const expired = await db.order.findMany({
    where: {
      expiresAt: { lt: new Date() },
      paymentStatus: "PENDING",
      inventoryReleased: false,
    },
    take: 100,
  });
  let released = 0;
  for (const order of expired) if (await releaseOrder(order.id)) released++;
  await db.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 86400000) } },
  });
  return { released, email: await flushEmails() };
}
