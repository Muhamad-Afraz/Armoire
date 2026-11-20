import type { PlanId } from "./types";

/**
 * A dressing sense is more than a label. Each profile carries the palette,
 * silhouette, layering formula and the rules that actually make an outfit read
 * as that style. The stylist engine in `styling.ts` scores against this data.
 */
export type StyleProfile = {
  id: string;
  label: string;
  note: string;
  image: string;
  essence: string;
  palette: readonly string[];
  keyPieces: readonly string[];
  formula: string;
  avoid: readonly string[];
  occasion: string;
  formality: number; // 0 = lounging, 4 = black tie
  layers: boolean;
  accentLimit: number; // how many loud/patterned pieces can share a look
};

const img = (id: string, w = 640) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

export const STYLES = [
  {
    id: "streetwear",
    label: "Streetwear",
    note: "Bold, relaxed, urban",
    image: img("photo-1525507119028-ed4c629a60a3"),
    essence: "Born from hip-hop, skate and sneaker culture. Volume is the point: oversized tees and hoodies, graphic statements, wide bottoms and a sneaker that leads the look.",
    palette: ["black", "white", "grey", "denim blue", "olive", "one neon accent"],
    keyPieces: ["Graphic Tee", "Hoodie", "Bomber Jacket", "Cargo Pants", "Sneakers", "Cap"],
    formula: "Oversized tee or hoodie → bomber/denim jacket → wide trousers → statement sneakers → cap or chain.",
    avoid: ["Dress Shoes", "Suit Trousers", "Silk blouse", "Tie"],
    occasion: "Everyday, gigs, city weekends",
    formality: 1,
    layers: true,
    accentLimit: 2,
  },
  {
    id: "old-money",
    label: "Old Money",
    note: "Quiet, timeless, heritage",
    image: img("photo-1483985988355-763728e1935b"),
    essence: "Understatement as confidence. Natural fibres, heritage checks, camel and navy, nothing logo-led. The clothes look inherited, not bought this season.",
    palette: ["navy", "cream", "camel", "forest green", "burgundy", "chocolate brown"],
    keyPieces: ["Blazer", "Trench Coat", "Oxford Shirt", "Chinos", "Loafers", "Watch"],
    formula: "Crisp shirt → fine knit or blazer → tailored trousers → loafers → leather watch.",
    avoid: ["Neon", "Chunky sneakers", "Ripped denim", "Graphic logos"],
    occasion: "Country club, dinner, Sunday best",
    formality: 3,
    layers: true,
    accentLimit: 1,
  },
  {
    id: "casual",
    label: "Casual",
    note: "Easy, everyday, effortless",
    image: img("photo-1515886657613-9f3515b0c78f"),
    essence: "Getting dressed without looking like you tried. Soft neutrals, denim, a good tee and shoes you can actually walk in.",
    palette: ["white", "navy", "light blue", "grey", "beige", "denim blue"],
    keyPieces: ["T-Shirt", "Jeans", "Denim Jacket", "Hoodie", "Sneakers"],
    formula: "Tee or polo → light outer layer → straight jeans → clean sneakers → one small accessory.",
    avoid: ["Tie", "Dress Shoes", "Full suit"],
    occasion: "Coffee, errands, low-key plans",
    formality: 1,
    layers: true,
    accentLimit: 1,
  },
  {
    id: "business",
    label: "Business",
    note: "Sharp, tailored, work-ready",
    image: img("photo-1539109136881-3be0616acf4b"),
    essence: "Tailoring with intent. Pressed shirting, a structured jacket, a clean break at the ankle and polished shoes. Every line is deliberate.",
    palette: ["navy", "charcoal", "white", "light blue", "slate grey"],
    keyPieces: ["Dress Shirt", "Oxford Shirt", "Blazer", "Suit Jacket", "Suit Trousers", "Chinos", "Dress Shoes", "Loafers", "Belt", "Tie", "Watch"],
    formula: "Dress shirt → blazer or suit jacket → matching or tonal trousers → leather shoes → belt and watch.",
    avoid: ["Hoodie", "Cargo Pants", "Sneakers", "Graphic Tee"],
    occasion: "Office, meetings, interviews",
    formality: 4,
    layers: true,
    accentLimit: 1,
  },
  {
    id: "rich",
    label: "Rich / Luxury",
    note: "Statement, elevated, premium",
    image: img("photo-1490481651871-ab68de25d43d"),
    essence: "One unmistakable statement piece, everything else quietly expensive. Jewel tones, leather, silk and jewellery used with restraint.",
    palette: ["black", "ivory", "emerald", "burgundy", "camel", "gold"],
    keyPieces: ["Leather Jacket", "Blouse", "Wide-Leg Trousers", "Boots", "Jewellery", "Bag"],
    formula: "Silky base → leather or structured outer → fluid wide trouser → boots → one fine piece of jewellery.",
    avoid: ["Cargo Pants", "Graphic Tee", "Chunky logos"],
    occasion: "Dinner, launches, nights out",
    formality: 3,
    layers: true,
    accentLimit: 1,
  },
  {
    id: "formal",
    label: "Formal",
    note: "Black tie, events, ceremonies",
    image: img("photo-1594633312681-425c7b97ccd1"),
    essence: "The strict end of the spectrum. Midnight tones, crisp white, clean tailoring and nothing that fights for attention.",
    palette: ["black", "midnight blue", "white", "ivory", "charcoal"],
    keyPieces: ["Suit Jacket", "Dress Shirt", "Suit Trousers", "Dress Shoes", "Tie", "Watch"],
    formula: "White dress shirt → tailored jacket → matching trousers → patent or polished shoes → tie or watch.",
    avoid: ["Sneakers", "Jeans", "Hoodie", "Bright colour", "Cap"],
    occasion: "Weddings, ceremonies, black tie",
    formality: 4,
    layers: true,
    accentLimit: 0,
  },
  {
    id: "minimal",
    label: "Minimal",
    note: "Clean lines, neutral tones",
    image: img("photo-1487222477894-8943e31ef7b2"),
    essence: "Edit until only shape and texture remain. A tight neutral palette, generous cuts and absolutely no noise.",
    palette: ["black", "white", "grey", "beige", "cream", "taupe"],
    keyPieces: ["T-Shirt", "Turtleneck", "Wide-Leg Trousers", "Blazer", "Sneakers", "Loafers"],
    formula: "Fine base layer → unstructured blazer or knit → wide neutral trouser → clean flat shoe → one watch.",
    avoid: ["Graphic Tee", "Neon", "Loud patterns", "Heavy jewellery"],
    occasion: "Gallery, studio, quiet dinners",
    formality: 2,
    layers: true,
    accentLimit: 0,
  },
  {
    id: "smart-casual",
    label: "Smart Casual",
    note: "Polished, relaxed, considered",
    image: img("photo-1539109136881-3be0616acf4b", 680),
    essence: "The most useful dressing sense there is: soft tailoring worn with relaxed pieces. A blazer over a knit, chinos instead of a suit, loafers instead of dress shoes.",
    palette: ["navy", "white", "grey", "camel", "olive", "light blue"],
    keyPieces: ["Oxford Shirt", "Sweater", "Blazer", "Chinos", "Loafers", "Watch"],
    formula: "Oxford shirt or fine knit → unstructured blazer → chinos → loafers or clean sneakers → leather watch.",
    avoid: ["Full suit", "Graphic Tee", "Cargo Pants", "Flip-flops"],
    occasion: "Dinner reservations, dates, Friday office",
    formality: 3,
    layers: true,
    accentLimit: 1,
  },
  {
    id: "preppy",
    label: "Preppy / Ivy",
    note: "Campus classics, crisp colour",
    image: img("photo-1483985988355-763728e1935b", 680),
    essence: "Ivy League codes: Oxford cloth, polo knits, khaki and a wash of pastel. Neat, youthful and unapologetically wholesome.",
    palette: ["navy", "white", "khaki", "pastel pink", "mint", "burgundy"],
    keyPieces: ["Oxford Shirt", "Polo", "Blazer", "Chinos", "Loafers", "Belt"],
    formula: "Oxford or polo → cricket knit or blazer → khaki chinos → loafers → woven belt.",
    avoid: ["Grunge layers", "Leather", "Neon", "Ripped denim"],
    occasion: "Campus, brunch, summer parties",
    formality: 3,
    layers: true,
    accentLimit: 1,
  },
  {
    id: "athleisure",
    label: "Athleisure",
    note: "Sporty comfort, city-ready",
    image: img("photo-1517836357463-d25dfeac3438"),
    essence: "Performance pieces borrowed for everyday life. Technical fabrics, hoodies, leggings and clean trainers — comfort with a pulse.",
    palette: ["black", "grey", "white", "slate", "electric blue"],
    keyPieces: ["Hoodie", "Tank Top", "Leggings", "Sneakers", "Cap"],
    formula: "Tank or tee → hoodie → leggings or relaxed trousers → running sneakers → cap.",
    avoid: ["Dress Shoes", "Blazer", "Silk", "Tie"],
    occasion: "Gym, travel, quick errands",
    formality: 0,
    layers: true,
    accentLimit: 1,
  },
  {
    id: "vintage",
    label: "Vintage",
    note: "Thrifted, worn-in, storied",
    image: img("photo-1515886657613-9f3515b0c78f", 680),
    essence: "Clothes with a past. Faded denim, mustard knitwear, flannel and denim jackets that look better the tenth time you wear them.",
    palette: ["faded denim", "mustard", "rust", "cream", "olive", "brown"],
    keyPieces: ["Denim Jacket", "Flannel Shirt", "Graphic Tee", "Jeans", "Boots", "Sunglasses"],
    formula: "Worn tee or flannel → denim jacket → straight jeans → leather boots → tinted glasses.",
    avoid: ["Sharp tailoring", "Neon", "Dress Shoes"],
    occasion: "Markets, gigs, weekend wandering",
    formality: 1,
    layers: true,
    accentLimit: 1,
  },
  {
    id: "boho",
    label: "Boho",
    note: "Free-spirited, textured, warm",
    image: img("photo-1503342217505-b0a15ec3261c"),
    essence: "Soft layers, earthy prints and a little romance. Flowing blouses, cardigans, long skirts and jewellery that feels collected rather than matched.",
    palette: ["terracotta", "cream", "sand", "olive", "rust", "floral"],
    keyPieces: ["Blouse", "Cardigan", "Skirt", "Dress", "Boots", "Jewellery", "Scarf"],
    formula: "Flowing blouse → slouchy cardigan → long skirt or dress → ankle boots → layered jewellery.",
    avoid: ["Suit Trousers", "Dress Shoes", "Sharp tailoring"],
    occasion: "Festivals, holidays, long lunches",
    formality: 1,
    layers: true,
    accentLimit: 2,
  },
  {
    id: "grunge",
    label: "Grunge",
    note: "Undone, layered, rebellious",
    image: img("photo-1525507119028-ed4c629a60a3", 680),
    essence: "Nineties anti-polish. Flannel over a band tee, worn denim, scuffed boots and the deliberate impression you got dressed in the dark.",
    palette: ["black", "charcoal", "faded denim", "olive", "burgundy"],
    keyPieces: ["Flannel Shirt", "Graphic Tee", "Denim Jacket", "Jeans", "Boots"],
    formula: "Band tee → open flannel → worn denim jacket → straight jeans → chunky boots.",
    avoid: ["Tie", "Dress Shoes", "Crisp tailoring", "Pastels"],
    occasion: "Gigs, late nights, no plans",
    formality: 1,
    layers: true,
    accentLimit: 1,
  },
  {
    id: "gothic",
    label: "Gothic",
    note: "Dark, romantic, dramatic",
    image: img("photo-1509631179647-0177331693ae"),
    essence: "Monochrome dressed with intent. Black on black, tactile contrast — leather, lace, knit — and silver jewellery as the only glint.",
    palette: ["black", "charcoal", "deep red", "plum", "silver"],
    keyPieces: ["Leather Jacket", "Turtleneck", "Jeans", "Boots", "Jewellery"],
    formula: "Fine turtleneck → leather or long coat → slim dark trousers → boots → silver detail.",
    avoid: ["Pastels", "White sneakers", "Bright prints"],
    occasion: "Evening, concerts, anytime",
    formality: 2,
    layers: true,
    accentLimit: 0,
  },
  {
    id: "nautical",
    label: "Nautical",
    note: "Coastal, crisp, sun-washed",
    image: img("photo-1469334031218-e382a71b716b"),
    essence: "Dockside ease. Wide stripes, breathable linen, navy and white with a single red detail. Nothing too precious.",
    palette: ["navy", "white", "sky blue", "red", "cream"],
    keyPieces: ["Linen Shirt", "Polo", "Chinos", "Shorts", "Loafers", "Sunglasses"],
    formula: "Breton or linen shirt → light overshirt → chinos or tailored shorts → boat shoes → sunglasses.",
    avoid: ["Heavy leather", "Dark tailoring", "Winter knits"],
    occasion: "Coast, holidays, summer weekends",
    formality: 2,
    layers: false,
    accentLimit: 1,
  },
  {
    id: "workwear",
    label: "Workwear",
    note: "Utility, durable, honest",
    image: img("photo-1542272604-787c3835535d"),
    essence: "Clothes built for a job, worn for life. Canvas, denim, olive and brown with functional details — a look that earns its place.",
    palette: ["olive", "khaki", "denim blue", "brown", "black", "rust"],
    keyPieces: ["Denim Jacket", "Flannel Shirt", "Cargo Pants", "Jacket", "Boots", "Belt"],
    formula: "Sturdy shirt → chore or denim jacket → canvas trousers → leather boots → simple belt.",
    avoid: ["Silk", "Dress Shoes", "Fine jewellery", "Tailored suiting"],
    occasion: "Weekend projects, casual days, outdoors",
    formality: 1,
    layers: true,
    accentLimit: 1,
  },
] satisfies readonly StyleProfile[];

/**
 * Ordered from specific to generic so AI suggestions and filters resolve to the
 * most useful label (a "Denim Jacket" must never collapse into "Jacket").
 */
export const CATEGORIES = [
  "Polo", "Graphic Tee", "T-Shirt", "Tank Top", "Shirt", "Dress Shirt",
  "Oxford Shirt", "Linen Shirt", "Denim Shirt", "Flannel Shirt", "Blouse",
  "Turtleneck", "Sweater", "Hoodie", "Cardigan", "Jacket", "Blazer",
  "Suit Jacket", "Coat", "Trench Coat", "Denim Jacket", "Leather Jacket",
  "Bomber Jacket", "Vest", "Dress", "Jeans", "Trousers", "Suit Trousers",
  "Chinos", "Cargo Pants", "Wide-Leg Trousers", "Shorts", "Skirt", "Leggings",
  "Sneakers", "Shoes", "Dress Shoes", "Loafers", "Boots", "Sandals", "Watch",
  "Bag", "Belt", "Sunglasses", "Jewellery", "Hat", "Cap", "Scarf", "Tie", "Other",
] as const;

export const CATEGORY_GROUPS: ReadonlyArray<{ label: string; categories: readonly string[] }> = [
  { label: "Tops & base layers", categories: ["Polo", "Graphic Tee", "T-Shirt", "Tank Top", "Shirt", "Dress Shirt", "Oxford Shirt", "Linen Shirt", "Denim Shirt", "Flannel Shirt", "Blouse", "Turtleneck", "Sweater", "Hoodie"] },
  { label: "Outer layers", categories: ["Cardigan", "Jacket", "Blazer", "Suit Jacket", "Coat", "Trench Coat", "Denim Jacket", "Leather Jacket", "Bomber Jacket", "Vest"] },
  { label: "Bottoms & dresses", categories: ["Dress", "Jeans", "Trousers", "Suit Trousers", "Chinos", "Cargo Pants", "Wide-Leg Trousers", "Shorts", "Skirt", "Leggings"] },
  { label: "Footwear", categories: ["Sneakers", "Shoes", "Dress Shoes", "Loafers", "Boots", "Sandals"] },
  { label: "Accessories", categories: ["Watch", "Bag", "Belt", "Sunglasses", "Jewellery", "Hat", "Cap", "Scarf", "Tie", "Other"] },
];

export const TOP_CATEGORIES = [
  "Polo", "Graphic Tee", "T-Shirt", "Tank Top", "Shirt", "Dress Shirt",
  "Oxford Shirt", "Linen Shirt", "Denim Shirt", "Flannel Shirt", "Blouse",
  "Turtleneck", "Sweater", "Hoodie", "Cardigan", "Jacket", "Blazer",
  "Suit Jacket", "Coat", "Trench Coat", "Denim Jacket", "Leather Jacket",
  "Bomber Jacket", "Vest", "Dress",
];
export const BOTTOM_CATEGORIES = [
  "Jeans", "Trousers", "Suit Trousers", "Chinos", "Cargo Pants",
  "Wide-Leg Trousers", "Shorts", "Skirt", "Leggings", "Dress",
];
export const SHOE_CATEGORIES = ["Sneakers", "Shoes", "Dress Shoes", "Loafers", "Boots", "Sandals"];
export const ACCESSORY_CATEGORIES = ["Watch", "Bag", "Belt", "Sunglasses", "Jewellery", "Hat", "Cap", "Scarf", "Tie", "Other"];

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  price: string;
  period: string;
  limit: number;
  perBatch: number;
  features: string[];
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "essential",
    name: "Essential",
    tagline: "Start building a better wardrobe.",
    price: "$0",
    period: "forever",
    limit: 100,
    perBatch: 10,
    features: [
      "100 outfits, lifetime",
      "Up to 10 outfits at once",
      "Background cleanup on uploads",
      "All core style categories",
      "Outfit cover editing",
    ],
  },
  {
    id: "signature",
    name: "Signature",
    tagline: "For a wardrobe that keeps growing.",
    price: "$19",
    period: "per month",
    limit: 250,
    perBatch: 15,
    features: [
      "250 outfits, lifetime",
      "Up to 15 outfits at once",
      "Everything in Essential",
      "Priority AI generation",
      "Unlimited closet uploads",
      "Style profile expansion",
    ],
    featured: true,
  },
  {
    id: "atelier",
    name: "Atelier",
    tagline: "No limits. Full access to everything.",
    price: "$39",
    period: "per month",
    limit: Infinity,
    perBatch: 15,
    features: [
      "Unlimited outfits",
      "Everything in Signature",
      "All styles, including new drops",
      "Advanced outfit controls",
      "Early access to features",
      "Priority support",
    ],
  },
];

export const planById = (id: PlanId) => PLANS.find((plan) => plan.id === id) ?? PLANS[0];

export const MARQUEE = [
  { src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&q=80", label: "Old Money", no: "01" },
  { src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&q=80", label: "Rich", no: "02" },
  { src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&q=80", label: "Business", no: "03" },
  { src: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=700&q=80", label: "Streetwear", no: "04" },
  { src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&q=80", label: "Casual", no: "05" },
];
