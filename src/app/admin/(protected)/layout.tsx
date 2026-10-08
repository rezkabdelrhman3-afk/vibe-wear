import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logout } from "@/components/admin-ui";
import { resources, editorResources } from "@/domain/admin";
export const dynamic = "force-dynamic";
export default async function Protected({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="wordmark">
          MASHY
        </Link>
        <p className="staff-label">
          THE WORKSPACE / 24
          <br />
          {user.name} · {user.role}
        </p>
        <nav>
          <Link href="/admin">Overview</Link>
          {resources
            .filter((r) => user.role === "ADMIN" || editorResources.includes(r))
            .map((r) => (
              <Link key={r} href={`/admin/${r}`}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Link>
            ))}
        </nav>
        <Link href="/">View storefront ↗︎</Link>
        <Logout />
      </aside>
      <main id="main" className="admin-main">
        {children}
      </main>
    </div>
  );
}
