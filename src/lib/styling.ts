import { STYLES, type StyleProfile } from "./data";
import type { Item } from "./types";

/* ------------------------------------------------------------------ *
 * THE STYLIST
 * A deterministic, knowledge-based engine. The chosen style is not a
 * caption — it constrains every decision: which categories are allowed,
 * which colours agree, how pieces layer, and what the result is called.
 * ------------------------------------------------------------------ */

export type Occasion = "any" | "everyday" | "meeting" | "work" | "evening" | "weekend" | "beach";

export const OCCASIONS: ReadonlyArray<{ id: Occasion; label: string; note: string }> = [
  { id: "any", label: "No occasion", note: "Let the style lead" },
  { id: "everyday", label: "Everyday", note: "Easy, repeatable" },
  { id: "meeting", label: "Meeting", note: "Sharp, credible" },
  { id: "work", label: "Office", note: "Tailored, all day" },
  { id: "evening", label: "Evening", note: "Dinner & drinks" },
  { id: "weekend", label: "Weekend", note: "Local & relaxed" },
  { id: "beach", label: "Beach", note: "Sun, air, ease" },
];

type Slot = "base" | "outer" | "bottom" | "shoes" | "accessory" | "dress";

type Garment = {
  slot: Slot;
  formality: number; // 0 relaxed → 4 ceremonial
  volume: number; // -1 sleek, 0 neutral, 1 roomy
};

const G: Record<string, Garment> = {
  // Base layers — worn next to or instead of an outer layer.
  "Polo": { slot: "base", formality: 2, volume: 0 },
  "Graphic Tee": { slot: "base", formality: 0, volume: 1 },
  "T-Shirt": { slot: "base", formality: 1, volume: 0 },
  "Tank Top": { slot: "base", formality: 0, volume: -1 },
  "Shirt": { slot: "base", formality: 2, volume: 0 },
  "Dress Shirt": { slot: "base", formality: 4, volume: 0 },
  "Oxford Shirt": { slot: "base", formality: 3, volume: 0 },
  "Linen Shirt": { slot: "base", formality: 2, volume: 1 },
  "Denim Shirt": { slot: "base", formality: 1, volume: 1 },
  "Flannel Shirt": { slot: "base", formality: 1, volume: 1 },
  "Blouse": { slot: "base", formality: 2, volume: 0 },
  "Turtleneck": { slot: "base", formality: 2, volume: -1 },
  "Sweater": { slot: "base", formality: 2, volume: 1 },
  "Hoodie": { slot: "base", formality: 0, volume: 1 },

  // Outer layers — always sit over a base layer when one exists.
  "Cardigan": { slot: "outer", formality: 2, volume: 1 },
  "Jacket": { slot: "outer", formality: 1, volume: 1 },
  "Blazer": { slot: "outer", formality: 3, volume: 0 },
  "Suit Jacket": { slot: "outer", formality: 4, volume: 0 },
  "Coat": { slot: "outer", formality: 3, volume: 1 },
  "Trench Coat": { slot: "outer", formality: 3, volume: 1 },
  "Denim Jacket": { slot: "outer", formality: 1, volume: 1 },
  "Leather Jacket": { slot: "outer", formality: 3, volume: 0 },
  "Bomber Jacket": { slot: "outer", formality: 1, volume: 1 },
  "Vest": { slot: "outer", formality: 3, volume: 0 },

  // Bottoms & one-piece looks.
  "Dress": { slot: "dress", formality: 2, volume: 0 },
  "Jeans": { slot: "bottom", formality: 1, volume: 0 },
  "Trousers": { slot: "bottom", formality: 2, volume: 0 },
  "Suit Trousers": { slot: "bottom", formality: 4, volume: 0 },
  "Chinos": { slot: "bottom", formality: 2, volume: 0 },
  "Cargo Pants": { slot: "bottom", formality: 0, volume: 1 },
  "Wide-Leg Trousers": { slot: "bottom", formality: 3, volume: 1 },
  "Shorts": { slot: "bottom", formality: 0, volume: 0 },
  "Skirt": { slot: "bottom", formality: 2, volume: 0 },
  "Leggings": { slot: "bottom", formality: 0, volume: -1 },

  // Footwear.
  "Sneakers": { slot: "shoes", formality: 0, volume: 0 },
  "Shoes": { slot: "shoes", formality: 2, volume: 0 },
  "Dress Shoes": { slot: "shoes", formality: 4, volume: -1 },
  "Loafers": { slot: "shoes", formality: 3, volume: 0 },
  "Boots": { slot: "shoes", formality: 2, volume: 1 },
  "Sandals": { slot: "shoes", formality: 0, volume: 0 },

  // Finishing details.
  "Watch": { slot: "accessory", formality: 3, volume: 0 },
  "Bag": { slot: "accessory", formality: 2, volume: 0 },
  "Belt": { slot: "accessory", formality: 3, volume: 0 },
  "Sunglasses": { slot: "accessory", formality: 1, volume: 0 },
  "Jewellery": { slot: "accessory", formality: 3, volume: 0 },
  "Hat": { slot: "accessory", formality: 0, volume: 0 },
  "Cap": { slot: "accessory", formality: 0, volume: 0 },
  "Scarf": { slot: "accessory", formality: 2, volume: 0 },
  "Tie": { slot: "accessory", formality: 4, volume: 0 },
  "Other": { slot: "accessory", formality: 1, volume: 0 },
};

const fallbackGarment: Garment = { slot: "accessory", formality: 1, volume: 0 };
const garmentOf = (item: Item): Garment => G[item.category] ?? fallbackGarment;

/* ---------------------------- colour sense ---------------------------- */

type ColourRead = {
  families: string[];
  tone: "light" | "mid" | "dark";
  neutral: boolean;
  vivid: boolean;
  patterned: boolean;
  earth: boolean;
};

const COLOR_WORDS: Record<string, string[]> = {
  black: ["black", "charcoal", "midnight", "onyx", "ink"],
  white: ["white", "ivory", "cream", "ecru", "off-white", "chalk", "pearl"],
  grey: ["grey", "gray", "slate", "heather", "silver"],
  navy: ["navy", "indigo", "dark blue", "midnight blue"],
  blue: ["blue", "denim", "sky", "cobalt", "aqua", "teal"],
  beige: ["beige", "tan", "camel", "sand", "taupe", "khaki", "stone"],
  brown: ["brown", "chocolate", "cocoa", "chestnut", "brown"],
  olive: ["olive", "army", "military green", "forest", "sage", "moss"],
  green: ["green", "emerald", "jade", "mint"],
  red: ["red", "burgundy", "maroon", "wine", "ruby", "crimson"],
  orange: ["orange", "rust", "terracotta", "burnt", "coral", "tangerine"],
  yellow: ["yellow", "mustard", "gold", "ochre", "amber"],
  pink: ["pink", "fuchsia", "magenta", "blush", "rose"],
  purple: ["purple", "violet", "lavender", "plum", "lilac"],
};

const NEUTRAL = ["black", "white", "grey", "navy", "beige", "brown", "olive"];
const EARTH = ["beige", "brown", "olive", "orange", "yellow"];
const VIVID = ["red", "orange", "yellow", "pink", "purple", "green", "neon", "bright", "electric", "floral", "leopard", "zebra"];
const PATTERN = ["striped", "stripe", "plaid", "check", "floral", "print", "leopard", "zebra", "camo", "camouflage", "graphic", "pattern"];
const DARK = ["black", "navy", "charcoal", "brown", "olive", "plum", "burgundy", "forest", "ink"];
const LIGHT = ["white", "cream", "ivory", "beige", "sand", "tan", "sky", "pastel", "blush", "stone", "pearl"];

function readColour(item: Item): ColourRead {
  const text = `${item.color || ""} ${item.name || ""} ${item.notes || ""}`.toLowerCase();
  const families: string[] = [];
  for (const [family, words] of Object.entries(COLOR_WORDS)) {
    if (words.some((word) => text.includes(word))) families.push(family);
  }
  if (text.includes("neon") || text.includes("electric") || text.includes("fluorescent")) families.push("neon");
  if (families.length === 0) families.push("grey"); // unknown colours behave as quiet neutrals

  const tone: ColourRead["tone"] = DARK.some((w) => text.includes(w))
    ? "dark"
    : LIGHT.some((w) => text.includes(w))
      ? "light"
      : "mid";

  return {
    families,
    tone,
    neutral: families.some((f) => NEUTRAL.includes(f)),
    vivid: VIVID.some((w) => text.includes(w)),
    patterned: PATTERN.some((w) => text.includes(w)),
    earth: families.some((f) => EARTH.includes(f)),
  };
}

/* ------------------------- style enforcement ------------------------- */

/** Hard filters: an outfit in this niche can never contain these pieces. */
function forbidden(item: Item, profile: StyleProfile, occasion: Occasion): boolean {
  const category = item.category.toLowerCase();
  const text = `${item.name} ${item.color} ${item.notes}`.toLowerCase();
  const avoid = profile.avoid.map((entry) => entry.toLowerCase()).join(" | ");

  // Category-level exclusions.
  if (profile.avoid.some((entry) => entry.toLowerCase() === category)) return true;
  if (avoid.includes("sneaker") && category === "sneakers") return true;
  if (avoid.includes("hoodie") && category === "hoodie") return true;
  if (avoid.includes("graphic") && category === "graphic tee") return true;
  if (avoid.includes("cargo") && category === "cargo pants") return true;
  if (avoid.includes("silk") && text.includes("silk")) return true;
  if (avoid.includes("leather") && text.includes("leather")) return true;
  if (avoid.includes("pastel") && /pastel|blush|mint|lilac/.test(text)) return true;
  if (avoid.includes("neon") && (text.includes("neon") || text.includes("electric") || text.includes("fluorescent"))) return true;
  if (avoid.includes("logo") && text.includes("logo")) return true;
  if (avoid.includes("ripped") && /ripped|distressed/.test(text)) return true;
  if (avoid.includes("white sneaker") && category === "sneakers" && /white/.test(text)) return true;
  if (avoid.includes("pattern") && readColour(item).patterned) return true;
  if (avoid.includes("bright colour") && readColour(item).vivid) return true;
  if (profile.accentLimit === 0 && readColour(item).vivid && !category.includes("jewellery")) return true;

  // Occasion-level exclusions (a beach fit is never a suit, a meeting is never a hoodie).
  if (occasion === "meeting" || occasion === "work") {
    if (["hoodie", "graphic tee", "tank top", "cap", "sandals", "cargo pants"].includes(category)) return true;
  }
  if (occasion === "beach") {
    if (["blazer", "suit jacket", "suit trousers", "dress shoes", "boots", "tie", "coat", "trench coat", "jeans", "leggings"].includes(category)) return true;
  }
  if (occasion === "evening") {
    if (["cap", "tank top", "cargo pants"].includes(category)) return true;
  }
  return false;
}

/** How strongly an item belongs to a profile. High numbers dominate selection. */
function affinity(item: Item, profile: StyleProfile): number {
  let score = 0;
  const category = item.category;
  if (profile.keyPieces.includes(category)) score += 8;
  const colour = readColour(item);
  for (const tone of profile.palette) {
    const root = tone.split(" ")[0];
    if (colour.families.some((family) => family === root || tone.includes(family))) score += 3;
  }
  score += 3 - Math.abs(garmentOf(item).formality - profile.formality);
  if (colour.vivid && profile.accentLimit === 0) score -= 6;
  if (colour.patterned && profile.id === "minimal") score -= 8;
  if (colour.earth && ["old-money", "vintage", "workwear", "boho"].includes(profile.id)) score += 2;
  return score;
}

/** Extra pull toward the pieces that define the chosen occasion. */
function occasionWeight(item: Item, occasion: Occasion): number {
  const boosts: Partial<Record<Occasion, string[]>> = {
    beach: ["Linen Shirt", "Chinos", "Shorts", "Dress", "Sandals", "Loafers", "Sunglasses", "Polo"],
    meeting: ["Dress Shirt", "Oxford Shirt", "Blazer", "Suit Jacket", "Suit Trousers", "Chinos", "Dress Shoes", "Loafers", "Tie", "Watch", "Belt"],
    work: ["Dress Shirt", "Oxford Shirt", "Blazer", "Suit Jacket", "Suit Trousers", "Chinos", "Dress Shoes", "Loafers", "Watch", "Belt"],
    evening: ["Blouse", "Leather Jacket", "Wide-Leg Trousers", "Boots", "Jewellery", "Bag", "Loafers"],
    weekend: ["T-Shirt", "Hoodie", "Denim Jacket", "Jeans", "Sneakers", "Cap", "Sunglasses"],
    everyday: ["T-Shirt", "Polo", "Jeans", "Chinos", "Sneakers", "Watch"],
  };
  return boosts[occasion]?.includes(item.category) ? 9 : 0;
}

function weightedPick<T>(pool: T[], weight: (entry: T) => number, random: () => number): T | null {
  if (!pool.length) return null;
  const weights = pool.map((entry) => Math.pow(1.35, Math.max(0, weight(entry))));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let roll = random() * total;
  for (let index = 0; index < pool.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return pool[index];
  }
  return pool[pool.length - 1];
}

type Pools = Record<Slot, Item[]>;

function buildPools(items: Item[], profile: StyleProfile, occasion: Occasion): Pools {
  const pools: Pools = { base: [], outer: [], bottom: [], shoes: [], accessory: [], dress: [] };
  for (const item of items) {
    if (forbidden(item, profile, occasion)) continue;
    pools[garmentOf(item).slot].push(item);
  }
  return pools;
}

/* ------------------------------ scoring ------------------------------ */

type Assessment = { score: number; notes: string[] };

function assess(items: Item[], profile: StyleProfile, occasion: Occasion): Assessment {
  let score = 0;
  const notes: string[] = [];
  const add = (value: number, note?: string) => {
    score += value;
    if (note && !notes.includes(note)) notes.push(note);
  };

  const of = (slot: Slot) => items.filter((item) => garmentOf(item).slot === slot);
  const base = of("base");
  const outer = of("outer");
  const dress = of("dress");
  const bottom = of("bottom");
  const shoes = of("shoes");
  const colours = items.map(readColour);

  // 1. Layering — a jacket is an outer layer, never a substitute for a top.
  if (outer.length && (base.length || dress.length)) {
    add(18, `${outer[0].name} sits over ${base[0]?.name ?? dress[0].name} — that inner layer is what makes the look read as styled.`);
  } else if (outer.length && !base.length && !dress.length) {
    add(-12, "The outer layer has nothing beneath it. Add a tee or shirt to turn this into a real layer.");
  }

  // 2. Colour discipline.
  const neutrals = colours.filter((c) => c.neutral).length;
  const vivid = colours.filter((c) => c.vivid);
  if (neutrals >= 2) add(9, "Two quiet anchors give the eye somewhere to rest.");
  else if (neutrals === 0 && profile.accentLimit < 2) add(-9, "Nothing here is neutral — one calm piece would steady the palette.");

  if (vivid.length > profile.accentLimit) {
    add(-8 * (vivid.length - profile.accentLimit), "Too many loud pieces are competing; keep one statement and quiet the rest.");
  } else if (vivid.length === 1) {
    add(6, `${items[colours.indexOf(vivid[0])].color || "The accent"} carries the colour; the rest stays composed.`);
  }

  const paletteHits = colours.reduce((sum, colour) => {
    return sum + (profile.palette.some((p) => colour.families.some((f) => p.toLowerCase().includes(f) || f === p.toLowerCase().split(" ")[0])) ? 1 : 0);
  }, 0);
  add(paletteHits * 3, profile.id === "minimal" ? "One tight neutral palette — the whole point of minimal dressing." : `Every piece speaks the ${profile.label.toLowerCase()} colour language.`);

  const light = colours.some((c) => c.tone === "light");
  const dark = colours.some((c) => c.tone === "dark");
  if (light && dark) add(6, "Light against dark gives the outfit depth and contrast.");
  else if (colours.every((c) => c.tone === colours[0]?.tone) && profile.id !== "minimal") add(-3, "Everything is the same tone — a shift in value would create shape.");

  // 3. Formality must agree with itself and with the niche.
  const formalities = items.map((item) => garmentOf(item).formality);
  const spread = Math.max(...formalities) - Math.min(...formalities);
  const average = formalities.reduce((a, b) => a + b, 0) / Math.max(1, formalities.length);
  if (spread <= 1) add(10, "Every piece sits at the same formality level — nothing is under- or over-dressed.");
  else if (spread >= 3) add(-14, "The formality is split — one piece is fighting the rest of the outfit.");
  add(8 - Math.abs(average - profile.formality) * 5);

  // 4. Shape: volume above and below together swamps the frame.
  const volumes = items.map((item) => garmentOf(item).volume);
  const topVolume = Math.max(...base.concat(outer).map((i) => garmentOf(i).volume), 0);
  const bottomVolume = Math.max(...bottom.map((i) => garmentOf(i).volume), 0);
  if (topVolume > 0 && bottomVolume > 0 && !dress.length) {
    add(-7, "Roomy above and roomy below loses your shape — let one half stay slim.");
  } else if (topVolume !== bottomVolume && !dress.length) {
    add(5, "One relaxed half against one closer half keeps the silhouette intentional.");
  }
  if (volumes.every((v) => v === 0)) add(2);

  // 5. Shoe logic.
  const shoe = shoes[0];
  if (shoe) {
    const shoeFormality = garmentOf(shoe).formality;
    if (Math.abs(shoeFormality - average) <= 1) add(7, `${shoe.name} lands exactly where the rest of the outfit does.`);
    else add(-8, `${shoe.name} is the wrong register for this combination.`);
  }

  // 6. Accessory restraint.
  const accessories = of("accessory");
  if (accessories.length > 2) add(-6, "One accessory too many — remove one and the look gets sharper.");
  else if (accessories.length === 1) add(4, `A single ${accessories[0].category.toLowerCase()} is enough of a finishing detail.`);
  if (profile.formality >= 3 && accessories.some((a) => ["Watch", "Belt", "Tie"].includes(a.category))) {
    add(5, "The watch/belt detail is what separates tailored dressing from simply wearing nice clothes.");
  }

  // 7. Occasion check.
  if (occasion === "meeting" || occasion === "work") {
    if (average < 2.5) add(-9, "For a meeting the look needs more structure — a shirt and tailored layer.");
    else add(6, "Structured, quiet and credible — appropriate for the room.");
  }
  if (occasion === "beach" && colours.some((c) => c.families.includes("blue") || c.families.includes("beige"))) {
    add(6, "Sun-washed tones keep this firmly in coastal territory.");
  }
  if (occasion === "evening" && average >= 2) add(4, "Dressed with enough edge for after dark.");

  if (new Set(items.map((i) => i.category)).size !== items.length) add(-10, "Two pieces do the same job — only one belongs.");

  return { score, notes };
}

/* ------------------------------ naming ------------------------------- */

/** Real-world fit names, not abstract editorials. */
const FIT_NAMES: Record<string, string[]> = {
  "streetwear": ["Local Streetwear", "City Street Fit", "Everyday Streetwear"],
  "old-money": ["Heritage Fit", "Country Club Fit", "Old Money Fit"],
  "casual": ["Everyday Fit", "Coffee Run Fit", "Casual Fit"],
  "business": ["Meeting Fit", "Boardroom Fit", "Business Fit"],
  "rich": ["Night Out Fit", "Luxury Fit", "Elevated Fit"],
  "formal": ["Wedding Fit", "Black Tie Fit", "Ceremony Fit"],
  "minimal": ["Clean Fit", "Monochrome Fit", "Minimal Fit"],
  "smart-casual": ["Business Casual", "Smart Casual", "Dinner Fit"],
  "preppy": ["Campus Fit", "Ivy League Fit", "Country Club Casual"],
  "athleisure": ["Gym Fit", "Travel Fit", "Athleisure Fit"],
  "vintage": ["Thrifted Fit", "Retro Fit", "Vintage Fit"],
  "boho": ["Festival Fit", "Boho Fit", "Sunday Market Fit"],
  "grunge": ["Concert Fit", "Grunge Fit", "Weekend Rebel Fit"],
  "gothic": ["All-Black Fit", "Gothic Fit", "Night Fit"],
  "nautical": ["Beach Fit", "Coastal Fit", "Boat Club Fit"],
  "workwear": ["Utility Fit", "Workwear Fit", "Weekend Project Fit"],
};

const OCCASION_NAMES: Partial<Record<Occasion, string[]>> = {
  meeting: ["Meeting Fit", "Office Meeting Fit", "Presentation Fit"],
  work: ["Office Fit", "Work Fit", "Boardroom Fit"],
  beach: ["Beach Fit", "Coastal Fit", "Sun-Day Fit"],
  evening: ["Dinner Fit", "Night Out Fit", "Evening Fit"],
  weekend: ["Weekend Fit", "Local Fit", "Off-Duty Fit"],
  everyday: ["Everyday Fit", "Daily Fit", "Easy Fit"],
};

const numeral = (n: number) => ["", " II", " III", " IV", " V"][Math.min(n, 4)];

export function fitName(styleId: string, occasion: Occasion, index: number): string {
  const names = OCCASION_NAMES[occasion] ?? FIT_NAMES[styleId] ?? ["Everyday Fit"];
  const round = Math.floor(index / names.length);
  return `${names[index % names.length]}${numeral(round)}`;
}

/* --------------------------- composition ----------------------------- */

export type ComposedLook = {
  items: Item[];
  styleId: string;
  styleLabel: string;
  name: string;
  notes: string[];
  recipe: string[];
  occasion: Occasion;
  score: number;
};

type ComposeOptions = {
  items: Item[];
  styleIds: string[];
  index: number;
  occasion?: Occasion;
  usedSignatures?: Set<string>;
  usedCombos?: Set<string>;
  random?: () => number;
};

function candidate(
  pools: Pools,
  profile: StyleProfile,
  occasion: Occasion,
  usedSignatures: Set<string>,
  random: () => number,
): Item[] {
  const used = new Set<string>();
  const weightFor = (item: Item) =>
    affinity(item, profile) + occasionWeight(item, occasion) - (usedSignatures.has(item.id) ? 6 : 0);
  const take = (pool: Item[], bonus = 0): Item | null => {
    const available = pool.filter((item) => !used.has(item.id));
    const chosen = weightedPick(available, (item) => weightFor(item) + bonus, random);
    if (chosen) used.add(chosen.id);
    return chosen;
  };

  // Start with a hero from the pools that define this style, favouring the
  // pieces named in its profile and the outer layer when the style layers.
  const heroPool = [...pools.outer, ...pools.dress, ...pools.base, ...pools.bottom];
  const hero = weightedPick(heroPool, (item) => {
    let weight = weightFor(item);
    if (profile.keyPieces.includes(item.category)) weight += 10;
    if (item.category === "Dress") weight += 4;
    return weight;
  }, random);
  if (hero) used.add(hero.id);

  const heroSlot = hero ? garmentOf(hero).slot : "base";
  const base: Item[] = [];
  const outer: Item[] = [];
  const bottom: Item[] = [];
  const shoes: Item[] = [];
  const accessories: Item[] = [];
  const dress: Item[] = [];

  if (heroSlot === "dress") {
    dress.push(hero!);
    if (pools.shoes.length) {
      const shoe = take(pools.shoes);
      if (shoe) shoes.push(shoe);
    }
    if (pools.accessory.length) {
      const detail = take(pools.accessory);
      if (detail) accessories.push(detail);
    }
  } else {
    if (heroSlot === "base") base.push(hero!);
    if (heroSlot === "outer") outer.push(hero!);
    if (heroSlot === "bottom") bottom.push(hero!);

    // The rule the old generator broke: an outer layer always gets an inner layer.
    if (!base.length && pools.base.length) {
      const inner = take(pools.base, profile.layers ? 4 : 0);
      if (inner) base.push(inner);
    }
    if (!outer.length && profile.layers && pools.outer.length && (base.length || pools.base.length)) {
      const layer = take(pools.outer, 3);
      if (layer) outer.push(layer);
    }
    if (!bottom.length && pools.bottom.length) {
      const lower = take(pools.bottom);
      if (lower) bottom.push(lower);
    }
    if (pools.shoes.length) {
      const shoe = take(pools.shoes, profile.formality >= 3 ? 3 : 0);
      if (shoe) shoes.push(shoe);
    }
    const accessoryTarget = profile.formality >= 3 ? 2 : profile.id === "streetwear" || profile.id === "boho" ? 2 : 1;
    if (pools.accessory.length) {
      const first = take(pools.accessory);
      if (first) accessories.push(first);
      if (accessoryTarget > 1 && pools.accessory.length) {
        const second = take(pools.accessory);
        if (second) accessories.push(second);
      }
    }
  }

  // Layer order matters for the cover collage: inner → outer → lower → feet → details.
  return [...dress, ...base, ...outer, ...bottom, ...shoes, ...accessories];
}

export function composeLook({
  items,
  styleIds,
  index,
  occasion = "any",
  usedSignatures = new Set(),
  usedCombos,
  random = Math.random,
}: ComposeOptions): ComposedLook | null {
  const validIds = styleIds.filter((id) => STYLES.some((style) => style.id === id));
  if (!validIds.length || !items.length) return null;

  // The occasion promotes the niches that naturally belong to it, while the
  // round-robin still cycles through everything else the user selected.
  const preferredByOccasion: Partial<Record<Occasion, string[]>> = {
    beach: ["nautical", "casual"],
    meeting: ["business", "smart-casual"],
    work: ["business", "smart-casual"],
    evening: ["rich", "formal"],
    weekend: ["casual", "streetwear"],
    everyday: ["casual", "minimal"],
  };
  const preferred = (preferredByOccasion[occasion] ?? []).filter((id) => validIds.includes(id));
  const ordered = [...preferred, ...validIds.filter((id) => !preferred.includes(id))];

  // Round-robin guarantees every niche the user picked actually gets looks.
  const styleId = ordered[index % ordered.length];
  const profile = STYLES.find((style) => style.id === styleId)!;
  const pools = buildPools(items, profile, occasion);
  if (!Object.values(pools).some((pool) => pool.length)) return null;

  let best: Item[] | null = null;
  let bestScore = -Infinity;
  const attempts = 70;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const combination = candidate(pools, profile, occasion, usedSignatures, random);
    if (!combination.length) continue;
    const { score } = assess(combination, profile, occasion);
    // Discourage reusing the same pieces — and forbid an identical combination.
    const comboKey = combination.map((item) => item.id).sort().join("|");
    const repeatPenalty =
      (usedCombos?.has(comboKey) ? 60 : 0) +
      combination.filter((item) => usedSignatures.has(item.id)).length * 8;
    const adjusted = score - repeatPenalty;
    if (adjusted > bestScore) {
      bestScore = adjusted;
      best = combination;
    }
  }
  if (!best) return null;
  if (usedCombos) usedCombos.add(best.map((item) => item.id).sort().join("|"));

  const assessment = assess(best, profile, occasion);
  const notes = assessment.notes.slice(0, 3);
  if (!notes.length) {
    notes.push(`Built around ${best[0].name}, following the ${profile.label.toLowerCase()} rules of colour, layer and proportion.`);
  }

  return {
    items: best,
    styleId,
    styleLabel: profile.label,
    name: fitName(styleId, occasion, index),
    notes,
    recipe: best.map((item) => `${item.category}: ${item.name}`),
    occasion,
    score: Math.round(assessment.score),
  };
}

export const styleLabel = (id: string) => STYLES.find((style) => style.id === id)?.label ?? id;
