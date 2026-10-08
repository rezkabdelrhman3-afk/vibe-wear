"use client";
import { useEffect } from "react";
export function MotionController() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const elements = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.1 },
    );
    elements.forEach((e) => {
      e.classList.add("will-reveal");
      observer.observe(e);
    });
    return () => observer.disconnect();
  }, []);
  return null;
}
