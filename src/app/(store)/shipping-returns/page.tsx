import { PolicyPage } from "@/components/policy-page";
export const metadata = { title: "Shipping & returns" };
export default function Shipping() {
  return (
    <PolicyPage
      slug="shipping-returns"
      title="THERE. AND BACK."
      sections={[
        [
          "Delivery in Egypt",
          "Shipping rates are calculated from your governorate and shown before you place an order. Current rates and the free-shipping threshold are illustrative demo settings. Delivery windows will be published before launch.",
        ],
        [
          "Order tracking",
          "Your private order link shows the latest order and payment status. Keep that link safe; it provides access to your order summary.",
        ],
        [
          "Returns & cancellations",
          "Contact the support team with your order number. The final return window, return costs, refund timeline, and any hygiene conditions for opened socks must be confirmed before live sales.",
        ],
        [
          "Demo orders",
          "No goods are dispatched from this concept store. Sandbox orders and payments are for testing only.",
        ],
      ]}
    />
  );
}
