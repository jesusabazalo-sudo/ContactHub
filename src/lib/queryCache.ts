type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export const CACHE_TTL = {
  categories: 5 * 60_000,
  categoryContacts: 2 * 60_000,
  userData: 30_000,
  heroStats: 10 * 60_000,
} as const;

function set<T>(key: string, data: T, ttlMs: number) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function get<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

function invalidate(key: string) {
  store.delete(key);
}

function invalidatePattern(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Envuelve una query async: si hay cache vigente la devuelve, si no ejecuta y guarda. */
async function withCache<T>(key: string, ttlMs: number, queryFn: () => Promise<T>): Promise<T> {
  const cached = get<T>(key);
  if (cached !== null) return cached;
  const data = await queryFn();
  set(key, data, ttlMs);
  return data;
}

export const queryCache = { set, get, invalidate, invalidatePattern, withCache };
