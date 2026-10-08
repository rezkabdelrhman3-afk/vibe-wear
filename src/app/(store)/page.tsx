import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, MoveRight } from "lucide-react";
import { db } from "@/lib/db";
import { products, settings } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { MotionController } from "@/components/reveal";
import { Timeline } from "@/components/timeline";
import { appUrl } from "@/lib/utils";
export async function generateMetadata() {
  const s = await settings();
  return {
    title: { absolute: s.seoTitle },
    description: s.seoDescription,
    alternates: { canonical: "/" },
  };
}
export default async function Home() {
  const [catalog, content] = await Promise.all([
    products(),
    db.content.findMany(),
  ]);
  const c = Object.fromEntries(content.map((i) => [i.key, i]));
  return (
    <main id="main">
      <MotionController />
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-top eyebrow">
            <span>EVERYDAY ESSENTIALS</span>
            <span>YOUR PACE.</span>
          </div>
          <div>
            <p className="hero-kicker">
              <span className="little-dot" /> LESS NOISE. MORE LIFE.
            </p>
            <h1>{c.hero?.title || "EVERYDAY,\nIN MOTION."}</h1>
            <p className="hero-description">{c.hero?.body}</p>
            <Link href="/shop" className="button dark">
              Explore Chapter 01 <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="hero-bottom">
            <span>
              24 HOURS.
              <br />
              YOUR PACE. YOUR WAY.
            </span>
            <a
              href="#first-chapter"
              aria-label="Explore the first chapter"
              className="scroll-cue"
            >
              <ArrowDown size={20} />
            </a>
          </div>
        </div>
        <div className="hero-photo">
          <Image
            src={c.hero?.image || "/media/life-01.jpg"}
            alt="White Mashy crew socks worn with everyday sneakers and dark trousers"
            fill
            priority
            sizes="(max-width: 700px) 100vw, 51vw"
          />
          <div className="photo-caption">
            <span>
              NO SCRIPT.
              <br />
              JUST YOUR DAY.
            </span>
            <span className="signature">MASHY / 24</span>
          </div>
          <span className="photo-code">01 — THE EVERYDAY UNIFORM</span>
        </div>
      </section>
      <div className="chapter-strip">
        <span>MADE FOR THE EVERYDAY.</span>
        <span>NOTHING TO PROVE. PLACES TO GO.</span>
        <span>
          KEEP MASHY. <MoveRight size={20} />
        </span>
      </div>
      <section className="philosophy section-pad" data-reveal>
        <p className="eyebrow">01 / A SIMPLE BELIEF</p>
        <div>
          <h2>
            EVERYDAY THINGS
            <br />
            DESERVE TO BE
            <br />
            <span className="muted">MADE BETTER.</span>
          </h2>
          <div className="philosophy-bottom">
            <p>{c.philosophy?.body}</p>
            <Link href="/about" className="underlined">
              A little about us <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <span className="margin-code">M / 24</span>
      </section>
      <section className="chapter-feature" id="first-chapter">
        <div className="chapter-image">
          <Image
            src={c.chapter?.image || "/media/life-02.jpg"}
            alt="The first chapter: an understated white ribbed crew sock"
            fill
            sizes="(max-width:700px) 100vw, 50vw"
          />
          <span className="image-note eyebrow">A BETTER KIND OF BASIC.</span>
        </div>
        <div className="chapter-copy" data-reveal>
          <p className="eyebrow">CHAPTER 01 / SOCKS</p>
          <h2>{c.chapter?.title}</h2>
          <p>{c.chapter?.body}</p>
          <Link className="button outline" href="/collections/chapter-01">
            Discover the first chapter <ArrowUpRight size={18} />
          </Link>
          <div className="chapter-count">
            <span>01</span>
            <p>
              THE FIRST CHAPTER.
              <br />
              NOT THE WHOLE STORY.
            </p>
          </div>
        </div>
      </section>
      <section className="collection-section section-pad">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CONSIDERED FROM THE GROUND UP.</p>
            <h2>YOUR EVERYDAY ROTATION.</h2>
          </div>
          <Link href="/shop" className="underlined">
            Shop all essentials <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {catalog.slice(0, 3).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
      {content
        .filter((section) => section.key.startsWith("campaign-"))
        .map((section) => (
          <section className="campaign-block section-pad" key={section.id}>
            <div>
              <p className="eyebrow">MASHY / CAMPAIGN</p>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              <Link className="underlined" href="/shop">
                Explore the collection ↗︎
              </Link>
            </div>
            {section.image && (
              <div className="campaign-image">
                <Image
                  src={section.image}
                  alt={section.title}
                  fill
                  sizes="(max-width:700px) 100vw, 45vw"
                />
              </div>
            )}
          </section>
        ))}
      <Timeline />
      <section className="story-teaser section-pad" data-reveal>
        <div>
          <p className="eyebrow">A WORD. A WAY OF LIFE.</p>
          <h2>
            BORN FROM AN
            <br />
            EGYPTIAN WORD.
            <br />
            <span className="muted">
              BUILT FOR
              <br />
              EVERYWHERE.
            </span>
          </h2>
          <p>
            Moving. Going. Okay. Continuing.
            <br />A simple word for a life that rarely goes to plan.
          </p>
          <Link href="/about" className="underlined">
            The story behind MASHY <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="packaging-image">
          <Image
            src={c.philosophy?.image || "/media/packaging.jpg"}
            alt="Mashy concept packaging in considered neutral tones"
            fill
            sizes="(max-width:700px) 100vw, 42vw"
          />
          <span className="eyebrow">SIMPLE THINGS. DONE PROPERLY.</span>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "MASHY",
            url: appUrl(),
            logo: `${appUrl()}/icon.svg`,
            sameAs: ["https://www.instagram.com/mashy24/"],
          }).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
