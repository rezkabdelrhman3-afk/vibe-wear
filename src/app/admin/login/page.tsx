import { AdminLogin } from "@/components/admin-ui";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
export default async function Login() {
  if (await currentUser()) redirect("/admin");
  return (
    <main id="main" className="login-page">
      <Link href="/" className="wordmark">
        MASHY
      </Link>
      <h1>BEHIND THE EVERYDAY.</h1>
      <p>The MASHY staff workspace. Sign in to continue.</p>
      <AdminLogin />
    </main>
  );
}
