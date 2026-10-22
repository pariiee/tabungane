"use client";

import { useEffect } from "react";

export default function ArtcraftScrollChoreo() {
  useEffect(() => {
    // 1. Initial styles setup
    const rules = document.querySelectorAll<HTMLElement>("[data-draw-rule]");
    rules.forEach((el) => {
      el.style.transform = "scaleX(0)";
      el.style.transformOrigin = "left";
      el.style.transition = "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)";
    });

    const ticks = document.querySelectorAll<HTMLElement>("[data-draw-tick]");
    ticks.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "scale(0)";
      el.style.transition = "opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
    });

    const reveals = document.querySelectorAll<HTMLElement>("[data-reveal]");
    reveals.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(28px)";
      el.style.transition = "opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)";
      el.style.willChange = "opacity, transform";
    });

    // 2. IntersectionObserver trigger on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;

            // Trigger rule animation
            const rule = target.querySelector<HTMLElement>("[data-draw-rule]");
            if (rule) {
              setTimeout(() => {
                rule.style.transform = "scaleX(1)";
              }, 50);
            }

            // Trigger ticks
            const targetTicks = target.querySelectorAll<HTMLElement>("[data-draw-tick]");
            targetTicks.forEach((t, i) => {
              setTimeout(() => {
                t.style.opacity = "1";
                t.style.transform = "scale(1)";
              }, 150 + i * 50);
            });

            // Trigger single reveal
            if (target.hasAttribute("data-reveal")) {
              target.style.opacity = "1";
              target.style.transform = "translateY(0)";
            }

            // Trigger staggered group reveals
            const groupReveals = target.querySelectorAll<HTMLElement>("[data-reveal]");
            groupReveals.forEach((rev, idx) => {
              setTimeout(() => {
                rev.style.opacity = "1";
                rev.style.transform = "translateY(0)";
              }, idx * 75);
            });

            observer.unobserve(target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    document.querySelectorAll("[data-choreo], [data-reveal-group], section, article[data-reveal]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
