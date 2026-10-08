"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, LockKeyhole, ArrowLeft } from "lucide-react";
import { useBag } from "./cart-provider";
import { money } from "@/lib/utils";
import { track } from "@/lib/analytics";
export function CheckoutForm({
  rates,
  demo,
  threshold,
}: {
  rates: { governorate: string; price: number }[];
  demo: boolean;
  threshold: number;
}) {
  const bag = useBag();
  const [governorate, setGovernorate] = useState("Cairo");
  const [method, setMethod] = useState("COD");
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<{
    subtotal: number;
    discount: number;
    shipping: number;
    total: number;
    code: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [codeMessage, setCodeMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const key = useRef("");
  const previousPayload = useRef("");
  useEffect(() => {
    key.current = crypto.randomUUID();
    track("begin_checkout");
  }, []);
  const shipping =
    bag.subtotal >= threshold
      ? 0
      : rates.find((r) => r.governorate === governorate)?.price || 0;
  useEffect(() => {
    setQuote(null);
    setCodeMessage("");
  }, [governorate, bag.items]);
  async function applyCode() {
    setCodeMessage("");
    try {
      const r = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: bag.items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          governorate,
          code,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setQuote(data);
      setCodeMessage(
        data.code ? `${data.code} applied. A good first move.` : "Bag updated.",
      );
    } catch (e) {
      setQuote(null);
      setCodeMessage((e as Error).message);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    const payload = JSON.stringify({
      fields,
      method,
      code: quote?.code || "",
      items: bag.items,
    });
    if (previousPayload.current && previousPayload.current !== payload)
      key.current = crypto.randomUUID();
    previousPayload.current = payload;
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          paymentMethod: method,
          discountCode: quote?.code || "",
          idempotencyKey: key.current,
          items: bag.items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        key.current = crypto.randomUUID();
        throw new Error(data.error);
      }
      window.location.assign(data.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <main id="main" className="checkout-page">
      <Link href="/cart" className="back-link">
        <ArrowLeft size={15} /> Back to your bag
      </Link>
      <div className="page-intro">
        <div>
          <p className="eyebrow">ONE LAST STEP. THEN, YOUR EVERYDAY.</p>
          <h1>MAKE IT YOURS.</h1>
        </div>
        <span className="secure-label">
          <LockKeyhole size={14} /> GUEST CHECKOUT
        </span>
      </div>
      {demo && (
        <p className="demo-notice">
          CONCEPT STORE / Test orders only. No money will be charged and no
          goods will ship.
        </p>
      )}
      {!bag.items.length ? (
        <div className="empty-state">
          <h2>Your bag is taking a breather.</h2>
          <Link href="/shop" className="button dark">
            Find your everyday ↗︎
          </Link>
        </div>
      ) : (
        <div className="checkout-grid">
          <form onSubmit={submit} className="checkout-form">
            <h2>
              <span>01</span> A little about you
            </h2>
            <div className="form-grid">
              <label>
                Full name
                <input
                  required
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                />
              </label>
              <label>
                Mobile number
                <input
                  required
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  placeholder="01xxxxxxxxx"
                  pattern="(\+20|0)1[0125][0-9]{8}"
                />
              </label>
              <label className="span-two">
                Email address
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                />
              </label>
            </div>
            <h2>
              <span>02</span> Where are we going?
            </h2>
            <div className="form-grid">
              <label>
                Governorate
                <select
                  name="governorate"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                >
                  {rates.map((r) => (
                    <option key={r.governorate}>{r.governorate}</option>
                  ))}
                </select>
              </label>
              <label>
                City / Area
                <input required name="city" autoComplete="address-level2" />
              </label>
              <label className="span-two">
                Street address
                <input required name="street" autoComplete="address-line1" />
              </label>
              <label>
                Building
                <input required name="building" />
              </label>
              <label>
                Floor
                <input name="floor" />
              </label>
              <label>
                Apartment
                <input name="apartment" autoComplete="address-line2" />
              </label>
              <label>
                Landmark <small>(optional)</small>
                <input name="landmark" />
              </label>
              <label className="span-two">
                Anything we should know? <small>(optional)</small>
                <textarea name="notes" maxLength={500} rows={3} />
              </label>
            </div>
            <h2>
              <span>03</span> Your way to pay
            </h2>
            <fieldset className="payment-methods">
              <legend className="sr-only">Payment method</legend>
              {[
                ["COD", "Cash on delivery", "Pay when your essentials arrive."],
                [
                  "CARD",
                  demo ? "Card / sandbox" : "Card payment",
                  demo
                    ? "Simulate a payment. No card details needed."
                    : "Continue to secure provider checkout.",
                ],
                [
                  "WALLET",
                  demo ? "Mobile wallet / sandbox" : "Mobile wallet",
                  "Available through the configured payment provider.",
                ],
              ].map(([value, label, note]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={value}
                    checked={method === value}
                    onChange={() => setMethod(value)}
                  />
                  <span>
                    {label}
                    <small>{note}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="check-label terms-check">
              <input required type="checkbox" />{" "}
              <span>
                I agree to the <Link href="/terms">terms</Link> and have read
                the <Link href="/privacy">privacy notice</Link>.
              </span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button disabled={busy} className="button dark full">
              {busy
                ? "Making the arrangements…"
                : demo
                  ? "Place test order"
                  : "Place order"}{" "}
              <ArrowUpRight size={18} />
            </button>
            <p className="checkout-footnote">
              Final price, availability, and discounts are verified on the
              server.
            </p>
          </form>
          <aside className="order-summary">
            <p className="eyebrow">YOUR EVERYDAY, CONSIDERED.</p>
            <h2>
              In your bag{" "}
              <span>({bag.items.reduce((s, i) => s + i.quantity, 0)})</span>
            </h2>
            {bag.items.map((i) => (
              <div className="summary-product" key={i.variantId}>
                <Image src={i.image} alt={i.name} width={64} height={80} />
                <div>
                  <h3>{i.name}</h3>
                  <p>
                    {i.color} / EU {i.size}
                  </p>
                  <p>Quantity {i.quantity}</p>
                </div>
                <span>{money(i.price * i.quantity)}</span>
              </div>
            ))}
            <div className="discount-input">
              <input
                aria-label="Discount code"
                placeholder="A code for your next move"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setQuote(null);
                }}
              />
              <button onClick={applyCode} type="button">
                Apply
              </button>
            </div>
            {codeMessage && (
              <p aria-live="polite" className="code-message">
                {codeMessage}
              </p>
            )}
            <div className="summary-totals">
              <p>
                <span>Subtotal</span>
                <span>{money(quote?.subtotal ?? bag.subtotal)}</span>
              </p>
              <p>
                <span>Shipping</span>
                <span>
                  {(quote?.shipping ?? shipping) === 0
                    ? "On us"
                    : money(quote?.shipping ?? shipping)}
                </span>
              </p>
              {!!quote?.discount && (
                <p>
                  <span>Discount</span>
                  <span>−{money(quote.discount)}</span>
                </p>
              )}
              <p className="total">
                <span>
                  Total <small>EGP</small>
                </span>
                <strong>
                  {money(quote?.total ?? bag.subtotal + shipping)}
                </strong>
              </p>
            </div>
            <p className="summary-signature">24 HOURS. YOUR PACE. YOUR WAY.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
