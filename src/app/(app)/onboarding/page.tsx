"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { STYLES } from "@/lib/data";
import { loadStore, updateStore } from "@/lib/store";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    void loadStore().then((store) => setSelected(store.styles));
  }, []);

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const finish = async () => {
    if (!selected.length) return;
    await updateStore({ styles: selected, onboarded: true });
    router.push("/dashboard");
  };

  return (
    <>
      <div className="onboarding">
        <div className="step-track">
          <span className="step active"><b>01</b> Style profile</span>
          <span className="step-line" />
          <span className="step"><b>02</b> Your closet</span>
        </div>

        <div className="page-head">
          <div>
            <p className="page-eyebrow">The direction</p>
            <h2 className="page-title">Define your taste.</h2>
            <p className="page-sub">Choose every world you feel at home in. We&apos;ll compose looks only within these styles — and you can refine them whenever you like.</p>
          </div>
        </div>

        <div className="style-grid">
          {STYLES.map((style, index) => {
            const active = selected.includes(style.id);
            return (
              <button type="button" key={style.id} onClick={() => toggle(style.id)} className={`style-card${active ? " selected" : ""}`} aria-pressed={active}>
                <span className="style-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={style.image} alt="" />
                </span>
                <span className="style-shade" />
                <span className="style-no">{String(index + 1).padStart(2, "0")}</span>
                <span className="style-check">{active ? "✓" : "+"}</span>
                <span className="style-label">{style.label}</span>
                <span className="style-note">{style.note}</span>
              </button>
            );
          })}
        </div>

        <p className="guide-link-line">
          New to dressing senses? <Link href="/style-guide">Open the style dictionary →</Link>
          <span> Palette, key pieces, layering formula and the rules for all sixteen worlds.</span>
        </p>

        <div className="onboarding-bar">
          <span className="selection-count">
            {selected.length ? `${selected.length} style${selected.length > 1 ? "s" : ""} selected` : "Choose at least one style"}
          </span>
          <button type="button" className="btn-primary" onClick={finish} disabled={!selected.length}>
            Continue to closet <span>→</span>
          </button>
        </div>
      </div>
    </>
  );
}
