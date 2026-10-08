import { db } from "@/lib/db";
import { escapeHtml, money } from "@/lib/utils";
const titles: Record<string, string> = {
  received: "Your next chapter starts here.",
  paid: "All set. Keep Mashy.",
  shipped: "Your essentials are on the move.",
  delivered: "Made it to your everyday.",
  cancelled: "Your order has been cancelled.",
};
export async function queueOrderEmail(
  to: string,
  number: string,
  total: number,
  event: string,
) {
  const title = titles[event] || titles.received;
  return db.emailOutbox.create({
    data: {
      to,
      subject: `MASHY / ${number} — ${event}`,
      html: `<div style="font-family:Arial,sans-serif;background:#f4f1e9;padding:48px;color:#20201d"><h1 style="font-size:42px;letter-spacing:-3px">MASHY</h1><p>CHAPTER 01 / YOUR ORDER</p><h2>${title}</h2><p>Order ${escapeHtml(number)} · ${money(total)}</p><p>24 hours. Your pace. Your way.</p><hr><p>KEEP MASHY.</p></div>`,
    },
  });
}
export async function flushEmails() {
  if (process.env.EMAIL_PROVIDER !== "resend")
    return { mode: "outbox", sent: 0 };
  if (!process.env.RESEND_API_KEY)
    throw new Error("RESEND_API_KEY is required");
  const pending = await db.emailOutbox.findMany({
    where: { status: "PENDING", attempts: { lt: 5 } },
    take: 25,
  });
  let sent = 0;
  for (const message of pending) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.id,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
      }),
    });
    await db.emailOutbox.update({
      where: { id: message.id },
      data: { attempts: { increment: 1 }, status: r.ok ? "SENT" : "PENDING" },
    });
    if (r.ok) sent++;
  }
  return { sent };
}
