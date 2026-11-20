const DB_NAME = "armoire_blobs_v1";
const STORE_NAME = "blobs";
const DB_VERSION = 1;

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | void> {
  return openDb().then((db) => new Promise<T | void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let request: IDBRequest<T> | void;
    try {
      request = run(store);
    } catch (error) {
      db.close();
      reject(error);
      return;
    }
    tx.oncomplete = () => {
      db.close();
      resolve(request ? (request as IDBRequest<T>).result : undefined);
    };
    tx.onerror = () => {
      const err = tx.error || (request as IDBRequest<T> | undefined)?.error || new Error("IndexedDB transaction failed");
      db.close();
      reject(err);
    };
    tx.onabort = () => {
      const err = tx.error || new Error("IndexedDB transaction aborted");
      db.close();
      reject(err);
    };
  }));
}

export async function idbGet(key: string): Promise<string | undefined> {
  if (!isBrowser()) return undefined;
  const result = await withStore<string | undefined>("readonly", (store) => store.get(key));
  return typeof result === "string" ? result : undefined;
}

export async function idbSet(key: string, value: string): Promise<void> {
  if (!isBrowser()) return;
  await withStore("readwrite", (store) => store.put(value, key));
}

export async function idbDelete(key: string): Promise<void> {
  if (!isBrowser()) return;
  await withStore("readwrite", (store) => store.delete(key));
}

export async function idbGetMany(keys: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!isBrowser() || keys.length === 0) return map;
  await openDb().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    for (const key of keys) {
      const req = store.get(key);
      req.onsuccess = () => {
        if (typeof req.result === "string") map.set(key, req.result);
      };
    }
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { const err = tx.error || new Error("IndexedDB read failed"); db.close(); reject(err); };
    tx.onabort = () => { const err = tx.error || new Error("IndexedDB read aborted"); db.close(); reject(err); };
  }));
  return map;
}

export async function idbSetMany(entries: Array<[string, string]>): Promise<void> {
  if (!isBrowser() || entries.length === 0) return;
  await openDb().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const [key, value] of entries) store.put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { const err = tx.error || new Error("IndexedDB write failed"); db.close(); reject(err); };
    tx.onabort = () => { const err = tx.error || new Error("IndexedDB write aborted"); db.close(); reject(err); };
  }));
}

export async function idbDeleteMany(keys: string[]): Promise<void> {
  if (!isBrowser() || keys.length === 0) return;
  await openDb().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const key of keys) store.delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { const err = tx.error || new Error("IndexedDB delete failed"); db.close(); reject(err); };
    tx.onabort = () => { const err = tx.error || new Error("IndexedDB delete aborted"); db.close(); reject(err); };
  }));
}
