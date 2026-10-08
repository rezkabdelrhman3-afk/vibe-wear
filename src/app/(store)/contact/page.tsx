import { ContactForm } from "@/components/contact-form";
import { settings } from "@/lib/catalog";
export const metadata = {
  title: "Contact",
  alternates: { canonical: "/contact" },
};
export default async function Contact() {
  const s = await settings();
  return (
    <main id="main" className="narrow-page">
      <p className="eyebrow">NO QUESTION TOO SMALL.</p>
      <h1>LET’S TALK.</h1>
      <p>About an order. About an idea. Or just to say hello.</p>
      <ContactForm />
      <div className="contact-aside">
        <p>
          Prefer email? <a href={`mailto:${s.email}`}>{s.email}</a>
        </p>
        {s.whatsapp && (
          <p>
            <a
              href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              A conversation on WhatsApp ↗︎
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
