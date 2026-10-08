import { db } from "@/lib/db";
import Link from "next/link";
export const metadata = {
  title: "Frequently asked questions",
  alternates: { canonical: "/faq" },
};
export default async function FAQ() {
  const entries = await db.content.findMany({
    where: { key: { startsWith: "faq-" } },
    orderBy: { key: "asc" },
  });
  return (
    <main id="main" className="narrow-page">
      <p className="eyebrow">A LITTLE CLARITY.</p>
      <h1>GOOD QUESTIONS.</h1>
      <div className="faq-list">
        {entries.map((e) => (
          <details key={e.id}>
            <summary>{e.title}</summary>
            <p>{e.body}</p>
          </details>
        ))}
      </div>
      <Link className="underlined" href="/contact">
        Something else on your mind? ↗︎
      </Link>
    </main>
  );
}
