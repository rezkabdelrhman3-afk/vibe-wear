"use client";
import { BagItems, useBag } from "@/components/cart-provider";
import { money } from "@/lib/utils";
import Link from "next/link";
export default function Cart() {
  const bag = useBag();
  return (
    <main id="main" className="narrow-page">
      <p className="eyebrow">A FEW GOOD ESSENTIALS.</p>
      <h1>YOUR BAG.</h1>
      {bag.items.length ? (
        <>
          <BagItems />
          <p className="row">
            <span>Subtotal</span>
            <strong>{money(bag.subtotal)}</strong>
          </p>
          <Link className="button dark full" href="/checkout">
            Continue to checkout ↗︎
          </Link>
        </>
      ) : (
        <div className="empty-state">
          <p>A little room for the everyday.</p>
          <Link href="/shop" className="button dark">
            Explore Chapter 01 ↗︎
          </Link>
        </div>
      )}
    </main>
  );
}
