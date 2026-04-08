import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getOptimisticAccessToken,
  getStoredSessionSnapshot,
  getSupabaseSessionStorageKey,
} from "./client";

describe("supabase client helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://project-ref.supabase.co",
    );
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllEnvs();
  });

  it("derives the auth storage key from the Supabase project ref", () => {
    expect(getSupabaseSessionStorageKey()).toBe("sb-project-ref-auth-token");
  });

  it("reads a stored session snapshot from localStorage", () => {
    window.localStorage.setItem(
      "sb-project-ref-auth-token",
      JSON.stringify({
        access_token: "token-123",
        refresh_token: "refresh-123",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: "user-1",
          email: "test@example.com",
        },
      }),
    );

    expect(getStoredSessionSnapshot()).toMatchObject({
      access_token: "token-123",
      refresh_token: "refresh-123",
      user: {
        id: "user-1",
      },
    });
  });

  it("returns an optimistic access token only when the stored session is still fresh", () => {
    window.localStorage.setItem(
      "sb-project-ref-auth-token",
      JSON.stringify({
        access_token: "token-123",
        refresh_token: "refresh-123",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: {
          id: "user-1",
          email: "test@example.com",
        },
      }),
    );
    expect(getOptimisticAccessToken()).toBe("token-123");

    window.localStorage.setItem(
      "sb-project-ref-auth-token",
      JSON.stringify({
        access_token: "token-456",
        refresh_token: "refresh-456",
        expires_at: Math.floor((Date.now() + 30_000) / 1000),
        user: {
          id: "user-1",
          email: "test@example.com",
        },
      }),
    );
    expect(getOptimisticAccessToken()).toBeNull();
  });
});
