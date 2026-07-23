"use client";

import { useEffect, useState } from "react";

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const next = window.scrollY > Math.min(600, window.innerHeight);
      setVisible((current) => current === next ? current : next);
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  const scrollToTop = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      aria-label="回到页面顶部"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={scrollToTop}
      className={`fixed z-40 grid size-12 place-items-center rounded-full border border-[#d8d2c7] bg-[#173f35] text-xl font-bold text-[#f8f5ee] shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-[#0e4d3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8a54b] focus-visible:ring-offset-2 ${visible ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}
      style={{
        right: "max(1rem, calc(env(safe-area-inset-right) + 0.875rem))",
        bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.875rem))",
      }}
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
