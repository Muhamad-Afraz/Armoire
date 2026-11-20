"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MARQUEE, planById, STYLES } from "@/lib/data";
import { loadStore } from "@/lib/store";
import type { Store } from "@/lib/types";

export default function DashboardPage() {
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => { void loadStore().then(setStore); }, []);

  const plan = planById(store?.plan ?? "essential");
  const used = store?.usedQuota ?? 0;
  const items = store?.items ?? [];
  const outfits = store?.outfits ?? [];
  const styleLabels = (store?.styles ?? [])
    .map((id) => STYLES.find((style) => style.id === id)?.label)
    .filter(Boolean) as string[];
  const heroImage = outfits.length ? outfits[outfits.length - 1].cover : MARQUEE[0].src;

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-eyebrow">Overview</p>
          <h2 className="page-title">Your styling studio.</h2>
          <p className="page-sub">Everything you own, considered as one wardrobe. Choose a direction and let the AI compose something exceptional.</p>
        </div>
        <div className="head-actions">
          <Link href="/wardrobe" className="btn-secondary">Add pieces</Link>
          <Link href="/outfits" className="btn-primary">Create outfits <span>→</span></Link>
        </div>
      </div>

      <section className="studio-hero">
        <div className="hero-content">
          <span className="hero-kicker">Curated for you · {plan.name}</span>
          <h3 className="hero-title">The right look,<br /><em>effortlessly.</em></h3>
          <p className="hero-text">Beautiful outfits are not about having more — they are about seeing what you already own differently. Your AI stylist is ready.</p>
          <div className="hero-actions">
            <Link href="/outfits" className="hero-btn">Compose a look <span>→</span></Link>
            <Link href="/onboarding" className="hero-btn ghost">Edit style profile</Link>
          </div>
        </div>
        <div className="hero-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="Curated style" />
          <span className="hero-art-badge">{outfits.length ? "Your latest look" : "The wardrobe edit"}</span>
        </div>
      </section>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">◈</div>
          <span className="stat-label">Closet pieces</span>
          <div className="stat-value">{items.length}</div>
          <span className="stat-foot">Uploaded & background-cleaned</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✧</div>
          <span className="stat-label">Looks created</span>
          <div className="stat-value">{outfits.length}</div>
          <span className="stat-foot">{used} lifetime slots used</span>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon">✦</div>
          <span className="stat-label">Remaining allowance</span>
          <div className="stat-value">{plan.limit === Infinity ? "∞" : Math.max(0, plan.limit - used)}</div>
          <span className="stat-foot">{plan.name} membership</span>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-head">
            <h3>Your style profile</h3>
            <Link href="/onboarding" className="mini-link">Refine</Link>
          </div>
          {styleLabels.length ? (
            <div className="chip-row">
              {styleLabels.map((label) => <span className="chip" key={label}>{label}</span>)}
            </div>
          ) : (
            <p className="muted">No styles picked yet.</p>
          )}
          <p className="panel-note">We only compose looks within the styles you choose here.</p>
        </section>

        <section className="panel">
          <div className="panel-head"><h3>The process</h3></div>
          <ol className="process-list">
            <li className="process-item">
              <span className="process-no">01</span>
              <div className="process-body"><b>Add your pieces</b><small>Photograph each item — we clean the backdrop to white.</small></div>
            </li>
            <li className="process-item">
              <span className="process-no">02</span>
              <div className="process-body"><b>Define your taste</b><small>Old money, streetwear, business, rich — pick as many as you like.</small></div>
            </li>
            <li className="process-item">
              <span className="process-no">03</span>
              <div className="process-body"><b>Compose the looks</b><small>Pick an occasion — every look is styled to its niche and named for how you&apos;ll wear it.</small></div>
            </li>
          </ol>
        </section>
      </div>

      <section>
        <div className="section-head">
          <h3 className="section-title">Recent looks</h3>
          <Link href="/outfits" className="mini-link">View all →</Link>
        </div>
        {outfits.length ? (
          <div className="look-grid">
            {outfits.slice(-3).reverse().map((outfit) => (
              <Link href="/outfits" className="look-card" key={outfit.id}>
                <div className="look-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={outfit.cover} alt={`Look ${outfit.number}`} />
                  <span className="look-number">#{String(outfit.number).padStart(2, "0")}</span>
                </div>
                <div className="look-meta">
                  <b>{outfit.name}</b>
                  <span>{outfit.styles.map((id) => STYLES.find((style) => style.id === id)?.label ?? id).join(" · ")}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty tall">
            <div className="empty-icon">✧</div>
            <p className="empty-title">No looks just yet.</p>
            <p>Upload a few pieces, then compose your first curated outfit.</p>
            <Link href="/wardrobe" className="btn-secondary">Go to closet</Link>
          </div>
        )}
      </section>
    </>
  );
}
