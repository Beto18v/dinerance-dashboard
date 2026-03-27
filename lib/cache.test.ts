import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  cacheKeys,
  cacheTtls,
  getCache,
  invalidateCacheKey,
  setCache,
  subscribeToCacheKeys,
} from "./cache";

describe("cache helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("expires cached values after the configured TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:00:00Z"));

    setCache(cacheKeys.transactions, [{ id: "txn-1" }]);

    expect(
      getCache<{ id: string }[]>(cacheKeys.transactions, {
        maxAgeMs: cacheTtls.transactions,
      }),
    ).toEqual([{ id: "txn-1" }]);

    vi.advanceTimersByTime(cacheTtls.transactions + 1);

    expect(
      getCache<{ id: string }[]>(cacheKeys.transactions, {
        maxAgeMs: cacheTtls.transactions,
      }),
    ).toBeNull();
    expect(localStorage.getItem(cacheKeys.transactions)).toBeNull();
  });

  it("notifies listeners when a cache key is invalidated", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToCacheKeys(
      [cacheKeys.transactions],
      listener,
    );

    setCache(cacheKeys.transactions, [{ id: "txn-1" }]);
    invalidateCacheKey(cacheKeys.transactions);

    expect(listener).toHaveBeenCalledWith([cacheKeys.transactions]);
    expect(localStorage.getItem(cacheKeys.transactions)).toBeNull();

    unsubscribe();
  });
});
