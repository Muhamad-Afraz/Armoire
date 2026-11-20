"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { planById, STYLES } from "@/lib/data";
import { buildOutfitCover } from "@/lib/image";
import { loadStore, uid, updateStore } from "@/lib/store";
import { composeLook, OCCASIONS, type Occasion } from "@/lib/styling";
import type { Outfit, Store } from "@/lib/types";

export default function OutfitsPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [styles, setStyles] = useState<string[]>([]);
  const [occasion, setOccasion] = useState<Occasion>("any");
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    void loadStore().then((current) => {
      setStore(current);
      setStyles(current.styles);
    });
  }, []);

  const plan = planById(store?.plan ?? "essential");
  const used = store?.usedQuota ?? 0;
  const remaining = plan.limit === Infinity ? Infinity : Math.max(0, plan.limit - used);
  const outfits = store?.outfits ?? [];
  const items = store?.items ?? [];

  const visible = useMemo(
    () => filter === "all" ? outfits : outfits.filter((outfit) => outfit.styles.includes(filter)),
    [outfits, filter],
  );

  const toggleStyle = (id: string) => {
    setStyles((current) => current.includes(id) ? current.filter((style) => style !== id) : [...current, id]);
  };

  const generate = async () => {
    setMessage("");
    const current = await loadStore();
    if (current.items.length < 2) {
      setMessage("Add at least 2 pieces to your closet first.");
      return;
    }
    if (!styles.length) {
      setMessage("Pick at least one style for these looks.");
      return;
    }
    const batchCap = Math.min(count, plan.perBatch);
    const limit = plan.limit === Infinity ? batchCap : Math.min(batchCap, Math.max(0, plan.limit - current.usedQuota));
    if (limit <= 0) {
      setMessage("You've used your outfit allowance. Upgrade your plan to keep creating.");
      return;
    }

    setGenerating(true);
    const created: Outfit[] = [];
    const usedPieces = new Set<string>();
    const usedCombos = new Set<string>();

    for (let index = 0; index < limit; index += 1) {
      // Every selected niche gets its own looks, composed by its own rules.
      const look = composeLook({
        items: current.items,
        styleIds: styles,
        index,
        occasion,
        usedSignatures: usedPieces,
        usedCombos,
      });
      if (!look) continue;
      look.items.forEach((item) => usedPieces.add(item.id));

      const cover = await buildOutfitCover(
        look.items,
        current.usedQuota + index + 1,
        look.styleLabel,
        look.notes[0],
      );
      created.push({
        id: uid(),
        number: current.usedQuota + index + 1,
        name: look.name,
        styles: [look.styleId],
        itemIds: look.items.map((item) => item.id),
        cover,
        createdAt: Date.now(),
        notes: look.notes,
        recipe: look.recipe,
        occasion: look.occasion,
      });
    }

    const next = await updateStore((state) => ({
      outfits: [...state.outfits, ...created],
      usedQuota: state.usedQuota + created.length,
    }));
    setStore(next);
    setGenerating(false);
    setOpen(false);
    setMessage(`${created.length} premium outfit${created.length > 1 ? "s" : ""} created.`);
  };

  const changeCover = async (outfit: Outfit) => {
    const outfitItems = items.filter((item) => outfit.itemIds.includes(item.id));
    if (!outfitItems.length) return;
    const cover = await buildOutfitCover(outfitItems, outfit.number, outfit.styles[0] ?? "Curated");
    const next = await updateStore((state) => ({
      outfits: state.outfits.map((entry) => entry.id === outfit.id ? { ...entry, cover } : entry),
    }));
    setStore(next);
  };

  const changeCategory = async (outfit: Outfit, styleId: string) => {
    const next = await updateStore((state) => ({
      outfits: state.outfits.map((entry) => entry.id === outfit.id ? { ...entry, styles: [styleId] } : entry),
    }));
    setStore(next);
  };

  const deleteOutfit = async (outfit: Outfit) => {
    if (!window.confirm(`Delete look #${String(outfit.number).padStart(2, "0")}? Your lifetime allowance is not refunded.`)) return;
    const next = await updateStore((state) => ({ outfits: state.outfits.filter((entry) => entry.id !== outfit.id) }));
    setStore(next);
  };

  const batchSize = Math.min(count, plan.perBatch, remaining === Infinity ? count : remaining);

  return (
    <div className="outfits-page">
      <div className="page-head">
        <div>
          <p className="page-eyebrow">The edit</p>
          <h2 className="page-title">Your outfits.</h2>
          <p className="page-sub">Real styling, not random pairing. Every look obeys the niche you chose — its palette, formality, layering and finishing details — and is named for how you&apos;d actually wear it.</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn-primary" onClick={() => { setMessage(""); setOpen(true); }}>+ Create outfits</button>
        </div>
      </div>

      <div className="quota-panel">
        <div>
          <span className="stat-label">Lifetime outfit allowance</span>
          <strong>{used} <small>/ {plan.limit === Infinity ? "∞" : plan.limit} used</small></strong>
        </div>
        <div className="quota-bar wide">
          <span style={{ width: plan.limit === Infinity ? "100%" : `${Math.min(100, (used / plan.limit) * 100)}%` }} />
        </div>
        <span className="quota-note">{remaining === Infinity ? "Unlimited looks" : `${remaining} left`}</span>
        {plan.id !== "atelier" && <Link href="/plans" className="mini-link">Upgrade →</Link>}
      </div>

      {message && <div className="inline-message">{message}</div>}

      {outfits.length > 0 && (
        <div className="filter-row">
          <button type="button" className={`filter-chip${filter === "all" ? " active" : ""}`} onClick={() => setFilter("all")}>
            All looks <span>{outfits.length}</span>
          </button>
          {STYLES.filter((style) => outfits.some((outfit) => outfit.styles.includes(style.id))).map((style) => (
            <button type="button" key={style.id} className={`filter-chip${filter === style.id ? " active" : ""}`} onClick={() => setFilter(style.id)}>
              {style.label} <span>{outfits.filter((outfit) => outfit.styles.includes(style.id)).length}</span>
            </button>
          ))}
        </div>
      )}

      {visible.length ? (
        <div className="look-grid large">
          {[...visible].reverse().map((outfit) => (
            <article className="look-card" key={outfit.id}>
              <div className="look-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={outfit.cover} alt={outfit.name} />
                <span className="look-number">#{String(outfit.number).padStart(2, "0")}</span>
              </div>
              <div className="look-detail">
                <strong>{outfit.name}</strong>
                <div className="chip-row tight">
                  {outfit.styles.map((style) => (
                    <span className="chip" key={style}>{STYLES.find((entry) => entry.id === style)?.label ?? style}</span>
                  ))}
                </div>
                <span className="muted">{outfit.itemIds.length} pieces in this look</span>
                {outfit.notes?.length ? (
                  <div className="stylist-notes">
                    <span className="stylist-notes-title">Why it works</span>
                    <ul>
                      {outfit.notes.slice(0, 2).map((note, noteIndex) => (
                        <li key={noteIndex}>{note}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="look-actions">
                  <button type="button" onClick={() => changeCover(outfit)}>Change front picture</button>
                  <select value={outfit.styles[0] ?? ""} onChange={(event) => changeCategory(outfit, event.target.value)} aria-label="Change category">
                    {STYLES.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
                  </select>
                  <button type="button" className="danger" onClick={() => deleteOutfit(outfit)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty tall">
          <div className="empty-icon">✧</div>
          <p className="empty-title">{outfits.length ? "No looks in this style." : "A blank canvas."}</p>
          <p>Add your clothes, choose your styles, then let the AI compose your first looks.</p>
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>Create outfits</button>
        </div>
      )}

      {open && (
        <div className="modal-backdrop" onClick={() => { if (!generating) setOpen(false); }}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="page-eyebrow">AI stylist</p>
                <h3>Compose your looks</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} disabled={generating}>×</button>
            </div>

            <label className="field-label">How many outfits?</label>
            <div className="count-picker">
              <button type="button" onClick={() => setCount((value) => Math.max(1, value - 1))} disabled={generating}>−</button>
              <input type="number" min={1} max={15} value={count} onChange={(event) => setCount(Math.min(15, Math.max(1, Number(event.target.value) || 1)))} disabled={generating} aria-label="Number of outfits" />
              <button type="button" onClick={() => setCount((value) => Math.min(15, value + 1))} disabled={generating}>+</button>
            </div>
            <p className="modal-note">Up to 15 at once · {plan.perBatch} on your {plan.name} plan · {remaining === Infinity ? "unlimited" : remaining} lifetime looks remaining.</p>

            <label className="field-label">Occasion</label>
            <div className="occasion-pick">
              {OCCASIONS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`occasion-option${occasion === option.id ? " on" : ""}`}
                  onClick={() => setOccasion(option.id)}
                  disabled={generating}
                >
                  {option.label}
                  <small>{option.note}</small>
                </button>
              ))}
            </div>

            <label className="field-label">Styles for this batch</label>
            <div className="style-pick-grid">
              {STYLES.map((style) => (
                <button type="button" key={style.id} className={`style-pick${styles.includes(style.id) ? " on" : ""}`} onClick={() => toggleStyle(style.id)} disabled={generating}>
                  {style.label}
                  <small>{style.note}</small>
                </button>
              ))}
            </div>

            {message && <div className="inline-message">{message}</div>}

            <button type="button" className="btn-primary full" onClick={generate} disabled={generating || !styles.length}>
              {generating ? (
                <><span className="loader" /> Composing your looks…</>
              ) : (
                <>Generate {batchSize} outfit{batchSize === 1 ? "" : "s"} <span>→</span></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
