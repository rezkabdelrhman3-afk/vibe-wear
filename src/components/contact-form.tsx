"use client";
import { useState } from "react";
export function ContactForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const form = e.currentTarget;
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setMessage("Message received. Thanks for reaching out.");
      form.reset();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="contact-form" onSubmit={submit}>
      <label>
        Your name
        <input
          name="name"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
        />
      </label>
      <label>
        Email address
        <input name="email" required type="email" autoComplete="email" />
      </label>
      <label>
        Your message
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={5}
        />
      </label>
      <label className="sr-only" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <button className="button dark full" disabled={busy}>
        {busy ? "Sending…" : "Send a little hello ↗︎"}
      </button>
      {message && (
        <p role="status" className="admin-note">
          {message}
        </p>
      )}
    </form>
  );
}
