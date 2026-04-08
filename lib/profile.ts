import type { Session } from "@supabase/supabase-js";

import { api, ApiError, type UserProfile } from "@/lib/api";
import { bootstrapAuthenticatedProfile } from "@/lib/auth";
import { cacheKeys, cacheTtls, getCache, removeCache, setCache } from "@/lib/cache";

export const PROFILE_CACHE_KEY = cacheKeys.profile;
const RECENT_PROFILE_REUSE_WINDOW_MS = 10_000;
const inFlightProfileResolutions = new Map<string, Promise<UserProfile>>();
const recentProfileResolutionTimes = new Map<string, number>();

export function getCachedProfile(options?: { allowStale?: boolean }) {
  return getCache<UserProfile>(
    PROFILE_CACHE_KEY,
    options?.allowStale
      ? undefined
      : {
          maxAgeMs: cacheTtls.profile,
        },
  );
}

export function cacheProfile(profile: UserProfile) {
  setCache(PROFILE_CACHE_KEY, profile);
}

export function clearCachedProfile() {
  removeCache(PROFILE_CACHE_KEY);
}

export function isFinanceProfileComplete(
  profile: UserProfile | null | undefined,
) {
  return Boolean(profile?.base_currency && profile?.timezone);
}

export function getPostAuthAppPath(
  profile: UserProfile | null | undefined,
) {
  void profile;
  return "/app/balance";
}

export function shouldLockBaseCurrency(
  profile: UserProfile | null | undefined,
  hasTransactions: boolean,
) {
  return Boolean(profile?.base_currency && hasTransactions);
}

export function getPreferredSessionName(session: Session | null | undefined) {
  const fullName = session?.user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  const name = session?.user.user_metadata?.name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  const displayName = session?.user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName.trim()) {
    return displayName.trim();
  }

  const email = session?.user.email;
  if (typeof email === "string" && email.trim()) {
    return email.trim().split("@")[0];
  }

  return undefined;
}

function getProfileResolutionKey(options?: {
  allowBootstrap?: boolean;
  sessionUserId?: string | null;
}) {
  return `${options?.sessionUserId?.trim() || "current-user"}:${
    options?.allowBootstrap ?? true ? "bootstrap" : "no-bootstrap"
  }`;
}

function canReuseRecentlyResolvedProfile(
  cachedProfile: UserProfile | null,
  sessionUserId?: string | null,
) {
  if (!cachedProfile) {
    return false;
  }

  if (sessionUserId && cachedProfile.id !== sessionUserId) {
    return false;
  }

  const resolvedAt = recentProfileResolutionTimes.get(cachedProfile.id);
  if (resolvedAt == null) {
    return false;
  }

  if (Date.now() - resolvedAt > RECENT_PROFILE_REUSE_WINDOW_MS) {
    recentProfileResolutionTimes.delete(cachedProfile.id);
    return false;
  }

  return true;
}

function markProfileAsRecentlyResolved(profile: UserProfile) {
  recentProfileResolutionTimes.set(profile.id, Date.now());
}

export async function resolveAuthenticatedProfile(options?: {
  preferredName?: string;
  allowBootstrap?: boolean;
  sessionUserId?: string | null;
}) {
  const allowBootstrap = options?.allowBootstrap ?? true;
  const cachedProfile = getCachedProfile();
  if (canReuseRecentlyResolvedProfile(cachedProfile, options?.sessionUserId)) {
    return cachedProfile as UserProfile;
  }

  const resolutionKey = getProfileResolutionKey({
    allowBootstrap,
    sessionUserId: options?.sessionUserId,
  });
  const inFlightResolution = inFlightProfileResolutions.get(resolutionKey);
  if (inFlightResolution) {
    return inFlightResolution;
  }

  const resolutionPromise = (async () => {
    try {
      const profile = await api.getProfile();
      cacheProfile(profile);
      markProfileAsRecentlyResolved(profile);
      return profile;
    } catch (error) {
      if (
        allowBootstrap &&
        error instanceof ApiError &&
        error.status === 404
      ) {
        const profile = await bootstrapAuthenticatedProfile(options?.preferredName);
        cacheProfile(profile);
        markProfileAsRecentlyResolved(profile);
        return profile;
      }

      throw error;
    } finally {
      inFlightProfileResolutions.delete(resolutionKey);
    }
  })();

  inFlightProfileResolutions.set(resolutionKey, resolutionPromise);
  return resolutionPromise;
}
