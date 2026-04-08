import {
  createClient as createSupabaseClient,
  type Session,
} from "@supabase/supabase-js";

let client: ReturnType<typeof createSupabaseClient> | null = null;
const SESSION_EXPIRY_MARGIN_MS = 90_000;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  client = createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
  );
  return client;
}

export function getSupabaseSessionStorageKey() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return null;
  }

  try {
    const baseUrl = new URL(supabaseUrl);
    return `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
  } catch {
    return null;
  }
}

export function getStoredSessionSnapshot(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = getSupabaseSessionStorageKey();
  if (!storageKey) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    return normalizeStoredSession(parsedValue);
  } catch {
    return null;
  }
}

export function getOptimisticAccessToken() {
  const session = getStoredSessionSnapshot();
  if (!session?.access_token) {
    return null;
  }

  if (
    typeof session.expires_at === "number" &&
    session.expires_at * 1000 - Date.now() <= SESSION_EXPIRY_MARGIN_MS
  ) {
    return null;
  }

  return session.access_token;
}

function normalizeStoredSession(value: unknown): Session | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const candidate of value) {
      const session = normalizeStoredSession(candidate);
      if (session) {
        return session;
      }
    }
    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    access_token?: unknown;
    refresh_token?: unknown;
    user?: { id?: unknown } | null;
    session?: unknown;
    currentSession?: unknown;
    data?: { session?: unknown } | null;
  };

  if (
    typeof candidate.access_token === "string" &&
    typeof candidate.refresh_token === "string" &&
    candidate.user &&
    typeof candidate.user.id === "string"
  ) {
    return candidate as Session;
  }

  if (candidate.session) {
    return normalizeStoredSession(candidate.session);
  }

  if (candidate.currentSession) {
    return normalizeStoredSession(candidate.currentSession);
  }

  if (candidate.data?.session) {
    return normalizeStoredSession(candidate.data.session);
  }

  return null;
}
