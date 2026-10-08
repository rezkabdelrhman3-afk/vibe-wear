import { db } from "@/lib/db";
export async function PolicyPage({
  slug,
  title,
  sections,
}: {
  slug: string;
  title: string;
  sections: [string, string][];
}) {
  const custom = await db.content.findUnique({
    where: { key: `policy-${slug}` },
  });
  return (
    <main id="main" className="narrow-page legal-copy">
      <p className="eyebrow">MASHY / THE SMALL PRINT</p>
      <h1>{custom?.title || title}</h1>
      {custom ? (
        <p style={{ whiteSpace: "pre-line" }}>{custom.body}</p>
      ) : (
        <>
          <p className="demo-notice">
            Pre-launch draft. These policies require merchant and legal approval
            before live commerce.
          </p>
          {sections.map(([heading, body]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              <p>{body}</p>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
