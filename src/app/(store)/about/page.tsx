import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { MotionController } from "@/components/reveal";
export const metadata = {
  title: "Our story",
  alternates: { canonical: "/about" },
};
export default async function About() {
  const story = await db.content.findUniqueOrThrow({ where: { key: "story" } });
  return (
    <main id="main" className="story-page">
      <MotionController />
      <section className="story-intro">
        <div>
          <p className="eyebrow">MASHY / THE STORY SO FAR</p>
          <h1>{story.title}</h1>
          <p>{story.body}</p>
        </div>
        <div className="story-image">
          <Image
            src={story.image}
            alt="Mashy essentials, worn in the everyday"
            fill
            priority
            sizes="(max-width:700px) 100vw, 40vw"
          />
        </div>
      </section>
      <section className="manifesto" data-reveal>
        <p className="eyebrow">MOVING. GOING. OKAY. CONTINUING.</p>
        <h2>
          LIFE CHANGES.
          <br />
          PLANS CHANGE.
          <br />
          YOU KEEP GOING.
        </h2>
        <p>
          Mornings turn into long days. One stop becomes five. Work turns into
          plans. Plans change. You change. But somehow, you keep going.
        </p>
        <p>
          We started with socks because some of the things you wear the most get
          the least attention. We believe everyday things deserve to be made
          better.
        </p>
        <Link href="/shop" className="button dark">
          Meet Chapter 01 ↗︎
        </Link>
      </section>
    </main>
  );
}
