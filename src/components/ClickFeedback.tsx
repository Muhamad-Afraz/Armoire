"use client";

import { useEffect } from "react";

const RIPPLE_TARGETS = "button, .btn-primary, .btn-secondary, .google-btn, .social-btn, .chip.button, .count-picker button";

export default function ClickFeedback() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest(RIPPLE_TARGETS) : null;
      if (!target) return;

      const element = target as HTMLElement;
      if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") return;

      const rect = element.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "click-ripple";
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;

      const parts = getComputedStyle(element).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
      const [r = 255, g = 255, b = 255, alpha = 1] = parts;
      const isDark = alpha > 0 && r * 0.299 + g * 0.587 + b * 0.114 < 150;
      ripple.style.background = isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(70, 130, 180, 0.22)";

      element.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 560);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
