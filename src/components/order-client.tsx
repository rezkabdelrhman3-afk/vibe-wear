"use client";
import { useEffect, useState, useRef } from "react";
import { useBag } from "./cart-provider";
import { track } from "@/lib/analytics";
export function OrderReceipt({
  id,
  total,
  clear,
}: {
  id: string;
  total: number;
  clear: boolean;
}) {
  const { clear: clearBag, ready } = useBag();
  const completed = useRef(false);
  useEffect(() => {
    if (clear && ready && !completed.current) {
      completed.current = true;
      clearBag();
      if (!sessionStorage.getItem(`purchase:${id}`)) {
        track("purchase", { id, value: total / 100, currency: "EGP" });
        sessionStorage.setItem(`purchase:${id}`, "1");
      }
    }
  }, [id, total, clear, ready, clearBag]);
  return null;
}
export function MockPayment({ token }: { token: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function pay(success: boolean) {
    setBusy(true);
    try {
      const r = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, success }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      window.location.assign(d.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="mock-actions">
      <button
        className="button dark full"
        disabled={busy}
        onClick={() => pay(true)}
      >
        Simulate successful payment ↗︎
      </button>
      <button
        className="button outline full"
        disabled={busy}
        onClick={() => pay(false)}
      >
        Simulate declined payment
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
