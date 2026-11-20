"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { planById } from "@/lib/data";
import { loadStore, updateStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" },
  { href: "/wardrobe", label: "My Closet", icon: "M4 7h16l-1.4 13H5.4L4 7Zm4 0V5a4 4 0 0 1 8 0v2" },
  { href: "/outfits", label: "Outfits", icon: "M5 4h14v16H5V4Zm4 4h6m-6 4h6m-6 4h4" },
  { href: "/style-guide", label: "Style Guide", icon: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Zm0 15A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5Z" },
  { href: "/plans", label: "Plans", icon: "M4 18h16M6 18V9l6-4 6 4v9M10 18v-5h4v5" },
];

const initials = (value: string) =>
  value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState<PlanId>("essential");
  const [used, setUsed] = useState(0);
  const [items, setItems] = useState(0);
  const [looks, setLooks] = useState(0);
  const [styles, setStyles] = useState(0);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    let active = true;
    async function check() {
      let authenticated = false;
      let grantedPlan: "atelier" | null = null;
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        authenticated = Boolean(data.authenticated);
        if (data.user?.email) setEmail(data.user.email);
        if (data.user?.name) setName(data.user.name);
        if (data.effectivePlan === "atelier") grantedPlan = "atelier";
      } catch {
        // fall back to local demo session
      }
      try {
        if (!authenticated && sessionStorage.getItem("aw_auth") === "true") {
          authenticated = true;
          setEmail(sessionStorage.getItem("aw_email") || "");
          setName(sessionStorage.getItem("aw_name") || "");
        }
      } catch {
        // Storage can be unavailable (private mode / sandboxed iframe).
      }
      if (!active) return;
      if (!authenticated) {
        router.replace("/");
        return;
      }

      let store = await loadStore();
      if (grantedPlan === "atelier" && store.plan !== "atelier") {
        store = await updateStore({ plan: "atelier" });
      }
      setPlan(store.plan);
      setUsed(store.usedQuota);
      setItems(store.items.length);
      setLooks(store.outfits.length);
      setStyles(store.styles.length);
      if (!store.onboarded && pathname !== "/onboarding") {
        router.replace("/onboarding");
        return;
      }
      setReady(true);
    }
    // Never let an unexpected rejection surface as an uncaught console error.
    void check().catch(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, [pathname, router]);

  const navigateTo = (href: string) => {
    if (href === pathname) return;
    router.push(href);
  };

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigateTo(href);
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {
      // Sign out locally even if the server request fails (offline / dev restart).
    }
    try {
      ["aw_auth", "aw_email", "aw_remember", "aw_phone", "aw_name"].forEach((key) => sessionStorage.removeItem(key));
    } catch {
      // Storage may be unavailable.
    }
    router.replace("/");
  };

  const currentPlan = planById(plan);
  const remaining = currentPlan.limit === Infinity ? "Unlimited" : String(Math.max(0, currentPlan.limit - used));
  const activeLabel = NAV.find((item) => item.href === pathname)?.label ?? "Studio";
  const avatarText = initials(name || email || "Armoire");
  const completed = [styles > 0, items > 0, looks > 0].filter(Boolean).length;
  const progress = Math.round((completed / 3) * 100);

  // The single global intro already covers the initial load; render nothing
  // while the session is checked so we never stack two splash screens.
  if (!ready) return null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="side-brand" onClick={(event) => handleNavClick(event, "/dashboard")}>
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span><b>Armoire</b></span>
        </Link>

        <nav className="side-nav">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${active ? " active" : ""}`}
                aria-label={item.label}
                title={item.label}
                aria-current={active ? "page" : undefined}
                onClick={(event) => handleNavClick(event, item.href)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {completed < 3 ? (
          <div className="studio-progress">
            <div className="studio-progress-head">
              <span>Account setup</span>
              <b>{progress}%</b>
            </div>
            <strong>Complete your setup</strong>
            <div className="quota-bar"><span style={{ width: `${progress}%` }} /></div>
            <div className="progress-marks">
              <span className={styles > 0 ? "on" : ""}>Style</span>
              <span className={items > 0 ? "on" : ""}>Closet</span>
              <span className={looks > 0 ? "on" : ""}>Looks</span>
            </div>
          </div>
        ) : null}

        <div className="side-bottom">
          <button type="button" className="side-signout" onClick={signOut}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 17l5-5-5-5M15 12H4" /><path d="M9 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <div className="route-wash" key={`wash-${pathname}`} aria-hidden="true" />
        <header className="app-topbar">
          <div className="topbar-left">
            <span className="topbar-crumb">Studio / <b>{activeLabel}</b></span>
            <span className="topbar-divider" />
            <span className="topbar-title">Your styling space</span>
          </div>
          <div className="topbar-actions">
            <Link href="/plans" className="top-plan" title="Manage your plan">
              <span className="top-plan-dot" />
              <span className="top-plan-name">{currentPlan.name}</span>
              <span className="top-plan-count">{remaining} looks</span>
            </Link>
            <Link href="/outfits" className="top-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              <span>Create looks</span>
            </Link>
            <span className="top-avatar">{avatarText}</span>
          </div>
        </header>
        <div className="app-content page-enter" key={pathname}>{children}</div>
      </div>
    </div>
  );
}
