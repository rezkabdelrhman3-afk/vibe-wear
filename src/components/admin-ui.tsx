"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fields, type EditableResource } from "@/domain/admin";
export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <label>
        Email
        <input type="email" required name="email" autoComplete="username" />
      </label>
      <label>
        Password
        <input
          type="password"
          required
          name="password"
          autoComplete="current-password"
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button dark full" disabled={busy}>
        {busy ? "Signing in…" : "Enter the workspace ↗︎"}
      </button>
    </form>
  );
}
export function Logout() {
  const router = useRouter();
  return (
    <button
      className="text-button"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
export function ResourceEditor({
  resource,
  records,
  csrf,
  columns,
}: {
  resource: EditableResource;
  records: Record<string, unknown>[];
  csrf: string;
  columns: string[];
}) {
  const [editing, setEditing] = useState<Record<string, unknown> | null>(
    resource === "settings" ? records[0] : null,
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const data: Record<string, unknown> = { id: editing?.id };
    for (const field of fields[resource]) {
      const value = String(form.get(field.name) || "");
      data[field.name] =
        field.type === "checkbox"
          ? form.has(field.name)
          : field.type === "array"
            ? value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : field.type === "number"
              ? Number(value)
              : field.type === "nullable-number"
                ? value
                  ? Number(value)
                  : null
                : field.type === "datetime-local"
                  ? value
                    ? new Date(value).toISOString()
                    : null
                  : value;
    }
    try {
      const r = await fetch(`/api/admin/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage("Saved.");
      if (resource !== "settings") setEditing(null);
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {resource !== "settings" && (
        <button
          className="button dark"
          onClick={() => {
            setEditing({});
            setMessage("");
          }}
        >
          Add {resource === "content" ? "section" : resource.replace(/s$/, "")}{" "}
          +
        </button>
      )}
      {message && (
        <p className="admin-note" role="status">
          {message}
        </p>
      )}
      {editing && (
        <form
          key={String(editing.id || "new")}
          onSubmit={submit}
          className="admin-editor"
        >
          <h2>
            {editing.id ? "Edit" : "Create"} {resource}
          </h2>
          <div className="form-grid">
            {fields[resource].map((field) => {
              const raw = editing[field.name];
              const value = Array.isArray(raw)
                ? raw.join("\n")
                : raw == null
                  ? ""
                  : String(raw);
              return (
                <label
                  key={field.name}
                  className={
                    ["textarea", "array"].includes(field.type || "")
                      ? "span-two"
                      : ""
                  }
                >
                  {field.label}
                  {field.type === "checkbox" ? (
                    <input
                      name={field.name}
                      type="checkbox"
                      defaultChecked={Boolean(raw)}
                    />
                  ) : field.type === "select" ? (
                    <select
                      name={field.name}
                      defaultValue={value || field.options?.[0]}
                    >
                      {field.options?.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  ) : ["textarea", "array"].includes(field.type || "") ? (
                    <textarea name={field.name} defaultValue={value} rows={4} />
                  ) : (
                    <input
                      name={field.name}
                      type={
                        field.type === "nullable-number"
                          ? "number"
                          : field.type || "text"
                      }
                      defaultValue={
                        field.type === "datetime-local"
                          ? value
                            ? value.slice(0, 16)
                            : ""
                          : value
                      }
                      step={field.type?.includes("number") ? 1 : undefined}
                    />
                  )}
                </label>
              );
            })}
          </div>
          <div className="admin-actions">
            <button className="button dark" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            {resource !== "settings" && (
              <button
                type="button"
                className="text-button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      {resource !== "settings" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={String(record.id)}>
                  {columns.map((c) => (
                    <td key={c}>
                      {typeof record[c] === "boolean"
                        ? record[c]
                          ? "Yes"
                          : "No"
                        : String(record[c] ?? "—").slice(0, 100)}
                    </td>
                  ))}
                  <td>
                    <button
                      onClick={() => {
                        setEditing(record);
                        setMessage("");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
export function OrderActions({
  id,
  csrf,
  status,
  paymentMethod,
  paymentStatus,
}: {
  id: string;
  csrf: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const body = {
      id,
      status: f.get("status"),
      note: f.get("note"),
      internal: f.has("internal"),
      ...(f.get("paymentStatus")
        ? { paymentStatus: f.get("paymentStatus") }
        : {}),
    };
    const r = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    setMessage(r.ok ? "Order updated." : d.error);
    setBusy(false);
    if (r.ok) router.refresh();
  }
  return (
    <form onSubmit={submit} className="admin-editor">
      <h2>Move the order forward</h2>
      <div className="form-grid">
        <label>
          Order status
          <select name="status" defaultValue={status}>
            {[
              "PENDING",
              "CONFIRMED",
              "PREPARING",
              "SHIPPED",
              "DELIVERED",
              "CANCELLED",
              "RETURNED",
              "REFUNDED",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Payment reconciliation
          <select name="paymentStatus">
            <option value="">Keep {paymentStatus}</option>
            {paymentMethod === "COD" && (
              <option value="PAID">COD collected</option>
            )}
            <option value="REFUNDED">External refund confirmed</option>
          </select>
        </label>
        <label className="span-two">
          Note
          <textarea name="note" rows={3} maxLength={2000} />
        </label>
        <label className="check-label">
          <input type="checkbox" name="internal" defaultChecked />
          Keep note internal
        </label>
      </div>
      <p className="admin-note">
        Refund status records a refund completed with the payment provider; it
        does not transfer money. Returned stock requires inspection and an
        explicit inventory adjustment.
      </p>
      <button className="button dark" disabled={busy}>
        Update order
      </button>
      {message && (
        <p role="status" className="admin-note">
          {message}
        </p>
      )}
    </form>
  );
}
export function MediaUploader({ csrf }: { csrf: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="admin-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fetch("/api/media", {
            method: "POST",
            headers: { "x-csrf-token": csrf },
            body: new FormData(e.currentTarget),
          });
          const d = await r.json();
          setMessage(r.ok ? `Uploaded. Use this URL: ${d.url}` : d.error);
          router.refresh();
        } catch {
          setMessage("Upload failed. Please retry.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">
        <label>
          Image (JPEG, PNG, WebP, AVIF, max 10 MB)
          <input
            required
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
          />
        </label>
        <label>
          Describe the image
          <input required name="alt" maxLength={300} />
        </label>
      </div>
      <button className="button dark" disabled={busy}>
        Upload image
      </button>
      {message && (
        <p role="status" className="admin-note">
          {message}
        </p>
      )}
      <p className="admin-note">
        Paste the resulting URL into a product or content section. Video URLs
        can be added directly in product editing.
      </p>
    </form>
  );
}
export function AdminHomeLink() {
  return (
    <Link href="/" className="underlined">
      View storefront ↗︎
    </Link>
  );
}
