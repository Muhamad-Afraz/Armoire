"use client";

import { useEffect, useState } from "react";
import OpeningScreen from "./OpeningScreen";

/**
 * Rendered at the root so the splash is present in the very first HTML paint
 * (before React hydrates), preventing the login page from flashing first.
 * Because it lives in the root layout it runs once per full page load,
 * on every route.
 */
export default function GlobalIntro() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setShow(false), 1900);
    return () => window.clearTimeout(id);
  }, []);

  return <OpeningScreen show={show} />;
}
