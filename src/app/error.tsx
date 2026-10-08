"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="error-page">
      <span className="eyebrow">A MOMENT TO RESET.</span>
      <h1>A SMALL PAUSE.</h1>
      <p>Something interrupted this page. Try again in a moment.</p>
      <button className="button dark" onClick={reset}>
        Try again ↗︎
      </button>
    </main>
  );
}
