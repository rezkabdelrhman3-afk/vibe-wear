"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
const moments = [
  ["07:12", "A slower start.", "A moment before the day becomes a day."],
  [
    "10:46",
    "Finding your rhythm.",
    "Somewhere between the first coffee and the next idea.",
  ],
  [
    "14:18",
    "A different route.",
    "One stop becomes five. Make room for the unexpected.",
  ],
  [
    "18:32",
    "Plans changed.",
    "The best part of a plan is what happens around it.",
  ],
  ["22:47", "Still out.", "Good company. Nowhere else to be."],
  ["00:03", "Still Mashy.", "A new day. The same you."],
];
export function Timeline() {
  const [active, setActive] = useState(0);
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let scheduled = false;
    const scroll = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        const r = section.current?.getBoundingClientRect();
        if (r) {
          const progress = Math.max(
            0,
            Math.min(
              0.999,
              (window.innerHeight - r.top) / (window.innerHeight + r.height),
            ),
          );
          setActive(Math.floor(progress * 6));
        }
        scheduled = false;
      });
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  return (
    <section ref={section} className={`timeline tone-${active}`}>
      <div className="timeline-top">
        <span className="eyebrow">THE /24 PHILOSOPHY</span>
        <span className="eyebrow">DIFFERENT PLACES. DIFFERENT PLANS.</span>
      </div>
      <div className="timeline-main">
        <div>
          <p className="eyebrow">LIFE DOESN’T MOVE IN STRAIGHT LINES.</p>
          <h2>
            YOUR DAY.
            <br />
            YOUR WAY.
          </h2>
          <Link href="/24" className="underlined">
            Explore the /24 philosophy <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="clock-story" aria-live="off">
          <span className="clock">{moments[active][0]}</span>
          <h3>{moments[active][1]}</h3>
          <p>{moments[active][2]}</p>
        </div>
      </div>
      <div className="time-track" aria-label="Moments in a day">
        {moments.map(([time, label], i) => (
          <button
            aria-label={`${time}, ${label}`}
            aria-pressed={active === i}
            className={active === i ? "selected" : ""}
            key={time}
            onClick={() => setActive(i)}
          >
            <span className="time-dot" />
            {time}
            <span className="time-label">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
