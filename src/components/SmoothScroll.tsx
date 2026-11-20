"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const isStaticPage = pathname === "/" || pathname === "/login";

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("no-scroll", isStaticPage);

    if (isStaticPage) {
      lenisRef.current?.stop();
      window.scrollTo(0, 0);
    } else {
      lenisRef.current?.start();
      lenisRef.current?.scrollTo(0, { immediate: true });
    }

    return () => document.documentElement.classList.remove("no-scroll");
  }, [isStaticPage, pathname]);

  return null;
}
