"use client";

import Link from "next/link";
import { STYLES } from "@/lib/data";

export default function StyleGuidePage() {
  return (
    <div className="guide-page">
      <div className="page-head">
        <div>
          <p className="page-eyebrow">The knowledge base</p>
          <h2 className="page-title">The style dictionary.</h2>
          <p className="page-sub">
            Sixteen real dressing senses — each with its own palette, silhouette, layering formula and rules.
            This is the playbook the stylist uses. Every look it builds is scored against these principles,
            not thrown together at random.
          </p>
        </div>
        <div className="head-actions">
          <Link href="/outfits" className="btn-primary">Compose looks <span>→</span></Link>
        </div>
      </div>

      <section className="guide-principles">
        <div className="guide-principle">
          <span>01</span>
          <b>Layer with intent</b>
          <small>An outer layer is a frame, not a top. A jacket always gets a shirt, tee or knit beneath it.</small>
        </div>
        <div className="guide-principle">
          <span>02</span>
          <b>One voice at a time</b>
          <small>At most one loud colour or pattern. Everything else earns its place by staying quiet.</small>
        </div>
        <div className="guide-principle">
          <span>03</span>
          <b>Match the register</b>
          <small>Sneakers with suiting, or dress shoes with sweats, break the spell. Formality must agree.</small>
        </div>
        <div className="guide-principle">
          <span>04</span>
          <b>Shape before detail</b>
          <small>Roomy over roomy loses the frame. Contrast volume top to bottom, then add one finishing detail.</small>
        </div>
      </section>

      <div className="guide-grid">
        {STYLES.map((style, index) => (
          <details className="guide-card" key={style.id} open={index === 0}>
            <summary>
              <span className="guide-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="guide-heading">
                <b>{style.label}</b>
                <small>{style.note}</small>
              </span>
              <span className="guide-toggle">+</span>
            </summary>
            <div className="guide-body">
              <p className="guide-essence">{style.essence}</p>

              <div className="guide-row">
                <span className="guide-label">Palette</span>
                <span className="guide-palette">
                  {style.palette.map((tone) => <span className="palette-chip" key={tone}>{tone}</span>)}
                </span>
              </div>

              <div className="guide-row">
                <span className="guide-label">Key pieces</span>
                <span className="guide-value">{style.keyPieces.join(" · ")}</span>
              </div>

              <div className="guide-row">
                <span className="guide-label">The formula</span>
                <span className="guide-value">{style.formula}</span>
              </div>

              <div className="guide-row">
                <span className="guide-label">Occasion</span>
                <span className="guide-value">{style.occasion}</span>
              </div>

              <div className="guide-row">
                <span className="guide-label">Never with</span>
                <span className="guide-value guide-avoid">{style.avoid.join(" · ")}</span>
              </div>

              <div className="guide-row">
                <span className="guide-label">Formality</span>
                <span className="guide-meter" aria-label={`Formality ${style.formality} of 4`}>
                  {[1, 2, 3, 4].map((level) => (
                    <i key={level} className={level <= style.formality ? "on" : ""} />
                  ))}
                </span>
              </div>
            </div>
          </details>
        ))}
      </div>

      <p className="guide-footnote">
        Pick the worlds you dress in during <Link href="/onboarding">style profile</Link>, then tell the
        stylist the occasion. It will compose round-robins through your chosen niches and name every
        result the way you would — meeting fit, beach fit, local streetwear.
      </p>
    </div>
  );
}
