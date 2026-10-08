import { PolicyPage } from "@/components/policy-page";
export const metadata = { title: "Terms" };
export default function Terms() {
  return (
    <PolicyPage
      slug="terms"
      title="A FEW GROUND RULES."
      sections={[
        [
          "Concept store",
          "This site currently demonstrates the MASHY brand and shopping experience. Seed product names, pricing, stock, sizing, and images are concepts. No test order forms a contract for delivery.",
        ],
        [
          "Before live sales",
          "The merchant must confirm product specifications, legal identity, contact details, tax treatment, delivery commitments, consumer rights, and approved terms before enabling live commerce.",
        ],
        [
          "Pricing & orders",
          "Prices are displayed in EGP. Shipping and discounts are calculated at checkout and verified by the server. Availability is checked again when you place an order.",
        ],
        [
          "Using the site",
          "Use the site lawfully. Do not attempt to interfere with the service, access other customers’ private order links, or misuse the checkout. Please report technical issues through the contact page.",
        ],
      ]}
    />
  );
}
