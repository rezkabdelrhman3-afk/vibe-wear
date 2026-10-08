import { PolicyPage } from "@/components/policy-page";
export const metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <PolicyPage
      slug="privacy"
      title="YOUR LIFE.\nYOUR PRIVACY."
      sections={[
        [
          "Information you share",
          "Checkout stores your name, contact information, delivery address, and order details to process and support your order. Contact messages are stored so staff can respond. Please use fictional information when testing.",
        ],
        [
          "Storage & cookies",
          "Your bag is stored in your browser. Staff authentication uses a secure, HTTP-only session cookie in production. Optional marketing analytics are disabled unless you explicitly opt in; no marketing provider is configured by default.",
        ],
        [
          "Payments & service providers",
          "Card details are collected only by the configured payment provider, never by MASHY. In demo mode, no card details are collected. Hosting, payment, email, and storage providers may process data necessary to deliver the service.",
        ],
        [
          "Your choices",
          "Contact hello@mashy24.com for access, correction, or deletion requests. Before launch, the merchant must publish its legal identity, retention periods, processor details, and the rights and procedures applicable to its markets.",
        ],
      ]}
    />
  );
}
