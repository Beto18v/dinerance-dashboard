const STORED_UID_KEY = "cache:__uid";
const CACHE_INVALIDATION_EVENT = "dinerance:cache-invalidated";
const CACHE_INVALIDATION_STORAGE_KEY = "cache:__invalidation__";

export const cacheKeys = {
  profile: "cache:profile",
  categories: "cache:categories",
  financialAccounts: "cache:financial-accounts",
  transactions: "cache:transactions",
  obligations: "cache:obligations",
  upcomingObligations: "cache:upcoming-obligations",
  ledgerBalances: "cache:ledger-balances",
  ledgerActivity: "cache:ledger-activity",
} as const;

export const cacheTtls = {
  profile: 5 * 60_000,
  categories: 60_000,
  financialAccounts: 60_000,
  transactions: 30_000,
  obligations: 30_000,
  upcomingObligations: 30_000,
  ledgerBalances: 30_000,
  ledgerActivity: 30_000,
} as const;

type CacheKey = (typeof cacheKeys)[keyof typeof cacheKeys];

interface CacheEnvelope<T> {
  savedAt: number;
  value: T;
}

interface CacheReadOptions {
  maxAgeMs?: number;
}

interface CacheInvalidationDetail {
  keys: string[];
}

function isCacheEnvelope(value: unknown): value is CacheEnvelope<unknown> {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<CacheEnvelope<unknown>>;
  return typeof candidate.savedAt === "number" && "value" in candidate;
}

function dispatchCacheInvalidation(keys: string[]) {
  if (typeof window === "undefined") return;

  const detail: CacheInvalidationDetail = { keys };
  window.dispatchEvent(
    new CustomEvent<CacheInvalidationDetail>(CACHE_INVALIDATION_EVENT, {
      detail,
    }),
  );
}

function isExpired(savedAt: number, maxAgeMs?: number) {
  if (maxAgeMs == null) return false;
  return Date.now() - savedAt > maxAgeMs;
}

export function getCache<T>(
  key: string,
  options: CacheReadOptions = {},
): T | null {
  if (typeof window === "undefined") return null;

  try {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) return null;

    const parsedValue = JSON.parse(storedValue) as unknown;

    if (isCacheEnvelope(parsedValue)) {
      if (isExpired(parsedValue.savedAt, options.maxAgeMs)) {
        localStorage.removeItem(key);
        return null;
      }

      return parsedValue.value as T;
    }

    return parsedValue as T | null;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    const payload: CacheEnvelope<T> = {
      savedAt: Date.now(),
      value,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export function removeCache(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export function invalidateCacheKeys(keys: string[]): void {
  if (typeof window === "undefined") return;

  const uniqueKeys = [...new Set(keys)];
  for (const key of uniqueKeys) {
    localStorage.removeItem(key);
  }

  try {
    localStorage.setItem(
      CACHE_INVALIDATION_STORAGE_KEY,
      JSON.stringify({
        keys: uniqueKeys,
        ts: Date.now(),
      }),
    );
  } catch {
    // ignore quota errors
  }

  dispatchCacheInvalidation(uniqueKeys);
}

export function invalidateCacheKey(key: CacheKey): void {
  invalidateCacheKeys([key]);
}

export function subscribeToCacheKeys(
  keys: string[],
  listener: (changedKeys: string[]) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const keySet = new Set(keys);

  function handleCustomEvent(event: Event) {
    const detail = (event as CustomEvent<CacheInvalidationDetail>).detail;
    const changedKeys = detail?.keys?.filter((key) => keySet.has(key)) ?? [];
    if (changedKeys.length === 0) return;
    listener(changedKeys);
  }

  function handleStorageEvent(event: StorageEvent) {
    if (event.key && keySet.has(event.key)) {
      listener([event.key]);
      return;
    }

    if (event.key !== CACHE_INVALIDATION_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      const detail = JSON.parse(event.newValue) as CacheInvalidationDetail;
      const changedKeys = detail.keys?.filter((key) => keySet.has(key)) ?? [];
      if (changedKeys.length > 0) {
        listener(changedKeys);
      }
    } catch {
      // ignore malformed cross-tab events
    }
  }

  window.addEventListener(CACHE_INVALIDATION_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(CACHE_INVALIDATION_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}

/** Removes all cache: prefixed keys from localStorage. */
export function clearUserCache(): void {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key?.startsWith("cache:")) keysToRemove.push(key);
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORED_UID_KEY);
}

export function storeUserId(uid: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORED_UID_KEY, uid);
}
