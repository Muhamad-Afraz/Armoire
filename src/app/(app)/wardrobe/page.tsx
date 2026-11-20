"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACCESSORY_CATEGORIES,
  BOTTOM_CATEGORIES,
  CATEGORY_GROUPS,
  SHOE_CATEGORIES,
  TOP_CATEGORIES,
} from "@/lib/data";
import { cleanBackground, resizeDataUrl } from "@/lib/image";
import { loadStore, uid, updateStore } from "@/lib/store";
import type { Item } from "@/lib/types";

type Pending = {
  id: string;
  name: string;
  originalImage: string;
  image: string;
  processedImage?: string;
  category: string;
  color: string;
  clean: boolean;
  analyzing: boolean;
  aiError?: string;
  notes?: string;
};

const FILTERS = [
  { id: "all", label: "All pieces", categories: [] as string[] },
  { id: "tops", label: "Tops", categories: TOP_CATEGORIES },
  { id: "bottoms", label: "Bottoms", categories: BOTTOM_CATEGORIES },
  { id: "shoes", label: "Shoes", categories: SHOE_CATEGORIES },
  { id: "accessories", label: "Accessories", categories: ACCESSORY_CATEGORIES },
] as const;

function guessCategory(name: string) {
  const lower = name.toLowerCase();
  // Specific silhouettes first, so a denim jacket is never just "Jacket".
  const words: Array<[string, string]> = [
    ["denim jacket", "Denim Jacket"], ["leather jacket", "Leather Jacket"],
    ["bomber", "Bomber Jacket"], ["trench", "Trench Coat"],
    ["suit jacket", "Suit Jacket"], ["blazer", "Blazer"], ["coat", "Coat"],
    ["cardigan", "Cardigan"], ["turtleneck", "Turtleneck"], ["sweater", "Sweater"],
    ["hoodie", "Hoodie"], ["flannel", "Flannel Shirt"], ["oxford", "Oxford Shirt"],
    ["linen shirt", "Linen Shirt"], ["denim shirt", "Denim Shirt"],
    ["dress shirt", "Dress Shirt"], ["graphic tee", "Graphic Tee"],
    ["t-shirt", "T-Shirt"], ["tee", "T-Shirt"], ["tank", "Tank Top"],
    ["polo", "Polo"], ["shirt", "Shirt"], ["blouse", "Blouse"],
    ["dress shoe", "Dress Shoes"], ["dress", "Dress"],
    ["wide-leg", "Wide-Leg Trousers"], ["cargo", "Cargo Pants"],
    ["suit trouser", "Suit Trousers"], ["chino", "Chinos"], ["trouser", "Trousers"],
    ["jean", "Jeans"], ["short", "Shorts"], ["skirt", "Skirt"], ["legging", "Leggings"],
    ["sneaker", "Sneakers"], ["loafer", "Loafers"], ["boot", "Boots"],
    ["sandal", "Sandals"], ["shoe", "Shoes"], ["watch", "Watch"], ["bag", "Bag"],
    ["belt", "Belt"], ["glass", "Sunglasses"], ["jewel", "Jewellery"],
    ["scarf", "Scarf"], ["tie", "Tie"], ["cap", "Cap"], ["hat", "Hat"],
    ["jacket", "Jacket"], ["vest", "Vest"],
  ];
  for (const [needle, category] of words) if (lower.includes(needle)) return category;
  return "Other";
}

export default function WardrobePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [processing, setProcessing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => { void loadStore().then((store) => setItems(store.items)); }, []);

  const counts = useMemo(() => {
    const categories = new Set(items.map((item) => item.category));
    return {
      total: items.length,
      categories: categories.size,
      clean: items.filter((item) => item.clean).length,
    };
  }, [items]);

  const visible = useMemo(() => {
    const active = FILTERS.find((entry) => entry.id === filter);
    if (!active || active.categories.length === 0) return items;
    return items.filter((item) => (active.categories as readonly string[]).includes(item.category));
  }, [items, filter]);

  const updatePending = (id: string, patch: Partial<Pending>) => {
    setPending((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch } : entry));
  };

  const analyzeItem = async (id: string, dataUrl: string, fallbackName: string) => {
    try {
      const response = await fetch("/api/ai/analyze-clothing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.analysis) {
        throw new Error(result?.error || "Analysis failed");
      }
      const analysis = result.analysis as { category?: string; color?: string; suggestedName?: string; notes?: string };
      setPending((current) => current.map((entry) => {
        if (entry.id !== id) return entry;
        return {
          ...entry,
          analyzing: false,
          aiError: undefined,
          category: analysis.category || entry.category || guessCategory(fallbackName),
          color: analysis.color || entry.color,
          name: analysis.suggestedName || entry.name,
          notes: analysis.notes || entry.notes,
        };
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI analysis failed";
      setPending((current) => current.map((entry) => entry.id === id ? { ...entry, analyzing: false, aiError: message } : entry));
    }
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = String(reader.result);
        const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim() || "New item";
        const entry: Pending = {
          id: uid(),
          name: baseName,
          originalImage: dataUrl,
          image: dataUrl,
          category: guessCategory(baseName),
          color: "",
          clean: true,
          analyzing: true,
        };
        setPending((current) => [...current, entry]);

        // Downscale for faster local cleanup and AI analysis (large phone photos can be slow to upload/process).
        const workImage = await resizeDataUrl(dataUrl, 1280, 0.85);

        // Prepare a locally cleaned (background-reduced) version and run AI analysis in parallel.
        cleanBackground(workImage).then((processed) => {
          setPending((current) => current.map((row) => {
            if (row.id !== entry.id) return row;
            const nextImage = row.clean ? processed : row.originalImage;
            return { ...row, processedImage: processed, image: nextImage };
          }));
        });
        void analyzeItem(entry.id, workImage, baseName);
      };
      reader.readAsDataURL(file);
    });
    if (inputRef.current) inputRef.current.value = "";
  };

  const toggleClean = async (id: string, clean: boolean) => {
    const entry = pending.find((row) => row.id === id);
    if (!entry) return;
    if (clean) {
      if (entry.processedImage) {
        updatePending(id, { clean: true, image: entry.processedImage });
        return;
      }
      updatePending(id, { clean: true });
      const processed = await cleanBackground(entry.originalImage);
      setPending((current) => current.map((row) => row.id === id ? { ...row, clean: true, processedImage: processed, image: processed } : row));
      return;
    }
    updatePending(id, { clean: false, image: entry.originalImage });
  };

  const retryAnalysis = async (id: string) => {
    const entry = pending.find((row) => row.id === id);
    if (!entry) return;
    updatePending(id, { analyzing: true, aiError: undefined });
    const workImage = await resizeDataUrl(entry.originalImage, 1280, 0.85);
    await analyzeItem(id, workImage, entry.name);
  };

  const savePending = async () => {
    if (!pending.length) return;
    setSaveError("");
    setProcessing(true);
    try {
      const toSave: Item[] = [];
      for (const entry of pending) {
        let image = entry.image;
        if (entry.clean) {
          const processed = entry.processedImage || await cleanBackground(await resizeDataUrl(entry.originalImage, 1280, 0.85));
          // Keep transparency for cleaned items but cap size for storage.
          image = await resizeDataUrl(processed, 1400, 0.9, "image/png");
        } else {
          // Store original photo as compressed JPEG to avoid localStorage quota issues.
          image = await resizeDataUrl(entry.originalImage, 1600, 0.82, "image/jpeg");
        }
        toSave.push({
          id: entry.id,
          name: entry.name.trim() || "Untitled item",
          category: entry.category || "Other",
          color: entry.color.trim() || undefined,
          image,
          clean: entry.clean,
          createdAt: Date.now(),
          notes: entry.notes?.trim() || undefined,
        });
      }
      const next = await updateStore((store) => ({ items: [...store.items, ...toSave] }));
      setItems(next.items);
      setPending([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save items.";
      if (message.toLowerCase().includes("quota") || message.includes("QuotaExceeded")) {
        setSaveError("Storage is full (browser limit). Remove some items or save fewer/smaller photos, then try again.");
      } else {
        setSaveError(message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const removeItem = async (id: string) => {
    const next = await updateStore((store) => ({ items: store.items.filter((item) => item.id !== id) }));
    setItems(next.items);
  };

  const updateSavedItem = async (id: string, patch: Partial<Item>) => {
    const next = await updateStore((store) => ({
      items: store.items.map((item) => item.id === id ? { ...item, ...patch } : item),
    }));
    setItems(next.items);
  };

  return (
    <div className="wardrobe-page">
      <div className="page-head">
        <div>
          <p className="page-eyebrow">The collection</p>
          <h2 className="page-title">Build your closet.</h2>
          <p className="page-sub">
            Add each piece on its own. Armoire uses AI to detect category and color, and applies a clean studio background.
            You can edit every detail before saving.
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}>+ Upload pieces</button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(event) => addFiles(event.target.files)} />
      </div>

      <div
        className={`dropzone${dragging ? " dragging" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <div className="drop-icon">+</div>
        <strong className="drop-title">Drop your clothing photos here</strong>
        <span className="drop-sub">or click to browse · JPG, PNG, WEBP · AI will categorize, detect color, and clean up</span>
      </div>

      {pending.length > 0 && (
        <section className="panel pending-panel">
          <div className="panel-head">
            <h3>Review before adding <span className="count-pill">{pending.length}</span></h3>
            <button type="button" className="btn-primary small" onClick={savePending} disabled={processing || pending.some((p) => p.analyzing)}>
              {processing ? "Saving to closet…" : pending.some((p) => p.analyzing) ? "Analyzing…" : "Add to closet"}
            </button>
          </div>
          <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
            AI suggestions are editable. Confirm the name, category, color, and image before saving.
          </p>
          {saveError ? <p className="muted" style={{ color: "#a33c33", marginTop: -8, marginBottom: 16 }}>{saveError}</p> : null}
          <div className="item-grid">
            {pending.map((entry) => (
              <div className="item-card" key={entry.id}>
                <div className="item-photo"><img src={entry.image} alt={entry.name || "Clothing item"} /></div>
                <div className="item-body">
                  {entry.analyzing && <span className="item-cat">Analyzing with AI…</span>}
                  {entry.aiError && (
                    <div className="muted" style={{ color: "#a33c33" }}>
                      AI error: {entry.aiError}{" "}
                      <button type="button" className="text-link" onClick={() => retryAnalysis(entry.id)}>Retry</button>
                    </div>
                  )}
                  <label className="field" style={{ marginBottom: 8 }}>
                    <span className="field-label">Name</span>
                    <div className="input-wrap" style={{ height: 38 }}>
                      <input
                        value={entry.name}
                        onChange={(e) => updatePending(entry.id, { name: e.target.value })}
                        placeholder="Item name"
                        aria-label="Item name"
                      />
                    </div>
                  </label>
                  <label className="field" style={{ marginBottom: 8 }}>
                    <span className="field-label">Category</span>
                    <select value={entry.category} onChange={(e) => updatePending(entry.id, { category: e.target.value })} aria-label={`Category for ${entry.name || "item"}`}>
                      {CATEGORY_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.categories.map((category) => <option key={category} value={category}>{category}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <label className="field" style={{ marginBottom: 8 }}>
                    <span className="field-label">Color</span>
                    <div className="input-wrap" style={{ height: 38 }}>
                      <input
                        value={entry.color}
                        onChange={(e) => updatePending(entry.id, { color: e.target.value })}
                        placeholder={entry.analyzing ? "Detecting color…" : "e.g. Navy blue"}
                        aria-label="Item color"
                      />
                    </div>
                  </label>
                  <label className="clean-toggle">
                    <input type="checkbox" checked={entry.clean} onChange={(e) => { void toggleClean(entry.id, e.target.checked); }} />
                    Clean background / studio look
                  </label>
                  {entry.notes ? <small className="muted">{entry.notes}</small> : null}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="button" className="remove-link" onClick={() => setPending((current) => current.filter((row) => row.id !== entry.id))}>Discard</button>
                    <button type="button" className="mini-link" style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer" }} onClick={() => retryAnalysis(entry.id)} disabled={entry.analyzing}>
                      Re-analyze
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <>
          <div className="closet-summary">
            <div className="summary-item"><strong>{counts.total}</strong><span>Total pieces</span></div>
            <div className="summary-item"><strong>{counts.categories}</strong><span>Categories covered</span></div>
            <div className="summary-item"><strong>{counts.clean}</strong><span>Studio-cleaned</span></div>
          </div>

          <div className="filter-row">
            {FILTERS.map((entry) => (
              <button type="button" key={entry.id} className={`filter-chip${filter === entry.id ? " active" : ""}`} onClick={() => setFilter(entry.id)}>
                {entry.label}
                <span>{entry.id === "all" ? items.length : items.filter((item) => (entry.categories as readonly string[]).includes(item.category)).length}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <section className="panel">
        <div className="panel-head">
          <h3>Your pieces <span className="count-pill">{visible.length}</span></h3>
          <span className="muted">Edit details anytime — AI can make mistakes</span>
        </div>
        {visible.length ? (
          <div className="item-grid">
            {visible.map((item) => (
              <div className="item-card" key={item.id}>
                <div className="item-photo"><img src={item.image} alt={item.name} /></div>
                <div className="item-body">
                  <label className="field" style={{ marginBottom: 8 }}>
                    <span className="field-label">Name</span>
                    <div className="input-wrap" style={{ height: 38 }}>
                      <input
                        value={item.name}
                        onChange={(e) => updateSavedItem(item.id, { name: e.target.value })}
                        aria-label="Item name"
                      />
                    </div>
                  </label>
                  <label className="field" style={{ marginBottom: 8 }}>
                    <span className="field-label">Category</span>
                    <select value={item.category} onChange={(e) => updateSavedItem(item.id, { category: e.target.value })} aria-label={`Category for ${item.name}`}>
                      {CATEGORY_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.categories.map((category) => <option key={category} value={category}>{category}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <label className="field" style={{ marginBottom: 8 }}>
                    <span className="field-label">Color</span>
                    <div className="input-wrap" style={{ height: 38 }}>
                      <input
                        value={item.color || ""}
                        onChange={(e) => updateSavedItem(item.id, { color: e.target.value })}
                        placeholder="Add color"
                        aria-label="Item color"
                      />
                    </div>
                  </label>
                  <button type="button" className="remove-link" onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">◈</div>
            <p className="empty-title">{items.length ? "Nothing in this category." : "Your closet is empty."}</p>
            <p>{items.length ? "Try another filter above." : "Upload a few pieces to begin building your wardrobe."}</p>
            {!items.length && <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>Upload pieces</button>}
          </div>
        )}
      </section>
    </div>
  );
}
