import { Timeline } from "@/components/timeline";
export const metadata = {
  title: "The /24 philosophy",
  alternates: { canonical: "/24" },
};
export default function Philosophy() {
  return (
    <main id="main">
      <section className="manifesto">
        <p className="eyebrow">MASHY / 24</p>
        <h1 style={{ fontSize: "clamp(48px,8vw,115px)" }}>
          24 HOURS.
          <br />
          YOUR PACE.
          <br />
          YOUR WAY.
        </h1>
        <p>
          A complete day. Different places. Different plans. The /24 is our
          reminder to make room for all of it. Move quickly. Move slowly. Take
          another route. Still Mashy.
        </p>
      </section>
      <Timeline />
    </main>
  );
}
