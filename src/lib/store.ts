import { idbDeleteMany, idbGetMany, idbSetMany } from "./blob-store";
import { deleteRemoteUrls, isDataUrl, isRemoteUrl, uploadDataUrl } from "./storage-client";
import type { Item, Outfit, Store } from "./types";

const META_KEY = "armoire_meta_v3";
const PREV_META_KEY = "armoire_meta_v2";
const OLD_KEY = "armoire_store_v1";
const OLDER_KEY = "ai_wardrobe_store_v1";

const initial: Store = {
  items: [],
  outfits: [],
  usedQuota: 0,
  plan: "essential",
  styles: [],
  onboarded: false,
};

type MetaItem = Omit<Item, "image"> & { image?: string; imageRef?: string };
type MetaOutfit = Omit<Outfit, "cover"> & { cover?: string; coverRef?: string };
type MetaStore = {
  items: MetaItem[];
  outfits: MetaOutfit[];
  usedQuota: number;
  plan: Store["plan"];
  styles: string[];
  onboarded: boolean;
};

function itemImageKey(id: string) {
  return `item:${id}:image`;
}

function outfitCoverKey(id: string) {
  return `outfit:${id}:cover`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readLegacyStore(): Store | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(OLD_KEY) || window.localStorage.getItem(OLDER_KEY);
  const parsed = parseJson<Partial<Store>>(raw);
  if (!parsed) return null;
  return {
    ...initial,
    ...parsed,
    items: Array.isArray(parsed.items) ? (parsed.items as Item[]) : [],
    outfits: Array.isArray(parsed.outfits) ? (parsed.outfits as Outfit[]) : [],
    styles: Array.isArray(parsed.styles) ? (parsed.styles as string[]) : [],
  };
}

function readMetaSync(): MetaStore | null {
  if (!isBrowser()) return null;
  return (
    parseJson<MetaStore>(window.localStorage.getItem(META_KEY)) ||
    parseJson<MetaStore>(window.localStorage.getItem(PREV_META_KEY))
  );
}

function saveMetaSync(meta: MetaStore) {
  if (!isBrowser()) return;
  window.localStorage.setItem(META_KEY, JSON.stringify(meta));
  try { window.localStorage.removeItem(PREV_META_KEY); } catch {}
}

async function assembleStore(meta: MetaStore): Promise<Store> {
  const idbKeys: string[] = [];
  for (const item of meta.items || []) {
    if (!item.image && item.imageRef) idbKeys.push(item.imageRef);
  }
  for (const outfit of meta.outfits || []) {
    if (!outfit.cover && outfit.coverRef) idbKeys.push(outfit.coverRef);
  }
  let blobs = new Map<string, string>();
  try {
    blobs = await idbGetMany(idbKeys);
  } catch {
    blobs = new Map();
  }

  return {
    items: (meta.items || []).map((item) => {
      const key = item.imageRef || itemImageKey(item.id);
      const image = item.image || blobs.get(key) || "";
      const { imageRef, ...rest } = item;
      return { ...(rest as Omit<Item, "image">), image } as Item;
    }),
    outfits: (meta.outfits || []).map((outfit) => {
      const key = outfit.coverRef || outfitCoverKey(outfit.id);
      const cover = outfit.cover || blobs.get(key) || "";
      const { coverRef, ...rest } = outfit;
      return { ...(rest as Omit<Outfit, "cover">), cover } as Outfit;
    }),
    usedQuota: meta.usedQuota || 0,
    plan: meta.plan || "essential",
    styles: meta.styles || [],
    onboarded: Boolean(meta.onboarded),
  };
}

async function ensureBackendUrl(value: string, pathname: string): Promise<string> {
  if (!value) return "";
  if (isRemoteUrl(value)) return value;
  if (isDataUrl(value)) {
    const uploaded = await uploadDataUrl(value, pathname);
    if (uploaded) return uploaded;
  }
  return value;
}

async function persistStore(store: Store): Promise<Store> {
  if (!isBrowser()) return store;

  // Try to upload data URLs to backend storage (Vercel Blob) when configured.
  const items: Item[] = [];
  for (const item of store.items) {
    const image = await ensureBackendUrl(item.image, `items/${item.id}`);
    items.push({ ...item, image });
  }
  const outfits: Outfit[] = [];
  for (const outfit of store.outfits) {
    const cover = await ensureBackendUrl(outfit.cover, `outfits/${outfit.id}`);
    outfits.push({ ...outfit, cover });
  }
  const normalized: Store = { ...store, items, outfits };

  const meta: MetaStore = {
    items: normalized.items.map((item) => {
      const { image, ...rest } = item;
      if (isRemoteUrl(image)) return { ...rest, image };
      return { ...rest, imageRef: itemImageKey(item.id) };
    }),
    outfits: normalized.outfits.map((outfit) => {
      const { cover, ...rest } = outfit;
      if (isRemoteUrl(cover)) return { ...rest, cover };
      return { ...rest, coverRef: outfitCoverKey(outfit.id) };
    }),
    usedQuota: normalized.usedQuota,
    plan: normalized.plan,
    styles: normalized.styles || [],
    onboarded: Boolean(normalized.onboarded),
  };

  const idbEntries: Array<[string, string]> = [];
  const idbKeysToDelete: string[] = [];
  for (const item of normalized.items) {
    const key = itemImageKey(item.id);
    if (isRemoteUrl(item.image)) idbKeysToDelete.push(key);
    else if (item.image) idbEntries.push([key, item.image]);
  }
  for (const outfit of normalized.outfits) {
    const key = outfitCoverKey(outfit.id);
    if (isRemoteUrl(outfit.cover)) idbKeysToDelete.push(key);
    else if (outfit.cover) idbEntries.push([key, outfit.cover]);
  }

  if (idbEntries.length) await idbSetMany(idbEntries);
  if (idbKeysToDelete.length) {
    try { await idbDeleteMany(idbKeysToDelete); } catch {}
  }

  saveMetaSync(meta);

  // Remove legacy large keys to free localStorage quota.
  try {
    window.localStorage.removeItem(OLD_KEY);
    window.localStorage.removeItem(OLDER_KEY);
  } catch {}

  return normalized;
}

let cachedStore: Store | null = null;
let loadPromise: Promise<Store> | null = null;

async function migrateLegacyIfNeeded(): Promise<MetaStore | null> {
  if (!isBrowser()) return null;
  const existing = readMetaSync();
  if (existing) return existing;

  const legacy = readLegacyStore();
  if (!legacy) return null;

  const persisted = await persistStore(legacy);
  cachedStore = persisted;
  return readMetaSync();
}

function hasLocalDataUrls(store: Store) {
  return store.items.some((i) => isDataUrl(i.image)) || store.outfits.some((o) => isDataUrl(o.cover));
}

async function loadStoreInternal(): Promise<Store> {
  if (!isBrowser()) return { ...initial };
  const meta = (await migrateLegacyIfNeeded()) || readMetaSync();
  if (!meta) return { ...initial };
  try {
    return await assembleStore(meta);
  } catch {
    return { ...initial, plan: meta.plan || "essential", styles: meta.styles || [], onboarded: Boolean(meta.onboarded), usedQuota: meta.usedQuota || 0 };
  }
}

export async function loadStore(): Promise<Store> {
  if (cachedStore) return cachedStore;
  if (!loadPromise) {
    loadPromise = loadStoreInternal()
      .then(async (store) => {
        cachedStore = store;
        // Best-effort: if backend blob storage is configured, upload any local data URLs in background.
        if (hasLocalDataUrls(store)) {
          try {
            const normalized = await persistStore(store);
            cachedStore = normalized;
            return normalized;
          } catch {
            // keep locally loaded store
          }
        }
        return store;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export async function saveStore(store: Store): Promise<void> {
  cachedStore = store;
  const normalized = await persistStore(store);
  cachedStore = normalized;
}

export async function updateStore(patch: Partial<Store> | ((current: Store) => Partial<Store>)): Promise<Store> {
  const current = cachedStore || await loadStore();
  const next = typeof patch === "function" ? patch(current) : patch;
  const updated = { ...current, ...next } as Store;
  const normalized = await persistStore(updated);
  cachedStore = normalized;

  // Reclaim storage for removed items/outfits.
  const removedItems = current.items.filter((i) => !normalized.items.some((u) => u.id === i.id));
  const removedOutfits = current.outfits.filter((o) => !normalized.outfits.some((u) => u.id === o.id));
  const removedIdbKeys = [
    ...removedItems.map((i) => itemImageKey(i.id)),
    ...removedOutfits.map((o) => outfitCoverKey(o.id)),
  ];
  const removedRemoteUrls = [
    ...removedItems.map((i) => i.image).filter(isRemoteUrl),
    ...removedOutfits.map((o) => o.cover).filter(isRemoteUrl),
  ];
  if (removedIdbKeys.length) {
    try { await idbDeleteMany(removedIdbKeys); } catch {}
  }
  if (removedRemoteUrls.length) {
    await deleteRemoteUrls(removedRemoteUrls);
  }
  return normalized;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
