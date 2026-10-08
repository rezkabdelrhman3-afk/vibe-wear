import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="error-page">
      <span className="eyebrow">404 / A DIFFERENT ROUTE.</span>
      <h1>PLANS CHANGE.</h1>
      <p>This page isn’t here. There’s still plenty to discover.</p>
      <Link className="button dark" href="/shop">
        Find your way back ↗︎
      </Link>
    </main>
  );
}
