"use client";

import { useEffect, useMemo, useState } from "react";
import { PLANS } from "@/lib/data";
import { loadStore } from "@/lib/store";
import type { PlanId } from "@/lib/types";

export default function PlansPage() {
  const [current, setCurrent] = useState<PlanId>("essential");

  useEffect(() => { void loadStore().then((store) => setCurrent(store.plan)); }, []);

  const upgradeHref = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
    // Optional: point this to your pricing/checkout/contact page when available.
    return base ? `${base}/#upgrade` : "mailto:?subject=Armoire%20Plan%20Upgrade";
  }, []);

  return (
    <div className="plans-page">
      <div className="page-head center">
        <div>
          <p className="page-eyebrow">Membership</p>
          <h2 className="page-title">A plan for every wardrobe.</h2>
          <p className="page-sub">Begin with a hundred lifetime looks and grow from there. Every tier composes complete, considered outfits from the clothes you already own.</p>
        </div>
      </div>

      <div className="plan-grid">
        {PLANS.map((plan) => {
          const active = current === plan.id;
          return (
            <article className={`plan-card${plan.featured ? " featured" : ""}${active ? " current" : ""}`} key={plan.id}>
              {plan.featured && <span className="plan-badge">Most loved</span>}
              {active && <span className="plan-current">Current plan</span>}
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-tagline">{plan.tagline}</p>
              <div className="plan-price"><strong>{plan.price}</strong><span>{plan.period}</span></div>
              <div className="plan-limit">
                {plan.limit === Infinity ? "Unlimited outfits" : `${plan.limit} outfits total`}
                <small>Up to {plan.perBatch} looks at once</small>
              </div>
              <ul className="plan-features">
                {plan.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              {active ? (
                <button type="button" className="btn-primary full ghost" disabled>
                  Your current plan
                </button>
              ) : (
                <a className="btn-primary full" href={upgradeHref}>
                  {`Choose ${plan.name}`}
                </a>
              )}
            </article>
          );
        })}
      </div>

      <p className="plan-foot">
        Deleting a look never frees its slot — your allowance counts every outfit ever created. Paid upgrades/billing are not connected in this build; selected accounts can be granted Atelier via <code>ATELIER_EMAILS</code>.
      </p>
    </div>
  );
}
