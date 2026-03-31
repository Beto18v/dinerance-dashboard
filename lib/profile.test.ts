import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  bootstrapAuthenticatedProfileMock,
  cacheStore,
  getProfileMock,
} = vi.hoisted(() => ({
  bootstrapAuthenticatedProfileMock: vi.fn(),
  cacheStore: new Map<string, unknown>(),
  getProfileMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
  api: {
    getProfile: getProfileMock,
  },
}));

vi.mock("@/lib/auth", () => ({
  bootstrapAuthenticatedProfile: bootstrapAuthenticatedProfileMock,
}));

vi.mock("@/lib/cache", () => ({
  cacheKeys: {
    profile: "cache:profile",
  },
  cacheTtls: {
    profile: 300_000,
  },
  getCache: (key: string) => cacheStore.get(key) ?? null,
  setCache: (key: string, value: unknown) => {
    cacheStore.set(key, value);
  },
  removeCache: (key: string) => {
    cacheStore.delete(key);
  },
}));

import { ApiError } from "@/lib/api";
import {
  getCachedProfile,
  getPreferredSessionName,
  resolveAuthenticatedProfile,
} from "./profile";

describe("profile helpers", () => {
  beforeEach(() => {
    cacheStore.clear();
    getProfileMock.mockReset();
    bootstrapAuthenticatedProfileMock.mockReset();
  });

  it("returns the authenticated profile and caches it", async () => {
    const profile = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: "COP",
      timezone: "America/Bogota",
      created_at: "2026-03-26T12:00:00Z",
    };
    getProfileMock.mockResolvedValue(profile);

    await expect(resolveAuthenticatedProfile()).resolves.toEqual(profile);
    expect(getCachedProfile()).toEqual(profile);
    expect(bootstrapAuthenticatedProfileMock).not.toHaveBeenCalled();
  });

  it("bootstraps the local profile when the API returns 404", async () => {
    const profile = {
      id: "user-2",
      name: "Bootstrap User",
      email: "bootstrap@example.com",
      base_currency: null,
      timezone: null,
      created_at: "2026-03-26T12:00:00Z",
    };
    getProfileMock.mockRejectedValue(new ApiError(404, "Profile not found"));
    bootstrapAuthenticatedProfileMock.mockResolvedValue(profile);

    await expect(
      resolveAuthenticatedProfile({ preferredName: "Bootstrap User" }),
    ).resolves.toEqual(profile);

    expect(bootstrapAuthenticatedProfileMock).toHaveBeenCalledWith(
      "Bootstrap User",
    );
    expect(getCachedProfile()).toEqual(profile);
  });

  it("does not bootstrap when allowBootstrap is disabled", async () => {
    getProfileMock.mockRejectedValue(new ApiError(404, "Profile not found"));

    await expect(
      resolveAuthenticatedProfile({ allowBootstrap: false }),
    ).rejects.toMatchObject({
      status: 404,
      message: "Profile not found",
    });

    expect(bootstrapAuthenticatedProfileMock).not.toHaveBeenCalled();
  });

  it("derives the preferred session name using the expected fallback order", () => {
    expect(
      getPreferredSessionName({
        user: {
          email: "full@example.com",
          user_metadata: { full_name: "Full Name", name: "Name" },
        },
      } as never),
    ).toBe("Full Name");

    expect(
      getPreferredSessionName({
        user: {
          email: "name@example.com",
          user_metadata: { name: "Name Only" },
        },
      } as never),
    ).toBe("Name Only");

    expect(
      getPreferredSessionName({
        user: {
          email: "display@example.com",
          user_metadata: { display_name: "Display Name" },
        },
      } as never),
    ).toBe("Display Name");

    expect(
      getPreferredSessionName({
        user: {
          email: "fallback@example.com",
          user_metadata: {},
        },
      } as never),
    ).toBe("fallback");
  });

  it("deduplicates concurrent profile resolution for the same authenticated user", async () => {
    type TestProfile = {
      id: string;
      name: string;
      email: string;
      base_currency: string;
      timezone: string;
      created_at: string;
    };

    const profile: TestProfile = {
      id: "user-3",
      name: "Concurrent User",
      email: "concurrent@example.com",
      base_currency: "COP",
      timezone: "America/Bogota",
      created_at: "2026-03-26T12:00:00Z",
    };

    let resolveRequest: ((value: TestProfile) => void) | null = null;
    getProfileMock.mockImplementation(
      () =>
        new Promise<TestProfile>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const first = resolveAuthenticatedProfile({ sessionUserId: "user-3" });
    const second = resolveAuthenticatedProfile({ sessionUserId: "user-3" });

    expect(getProfileMock).toHaveBeenCalledTimes(1);

    expect(resolveRequest).not.toBeNull();
    if (!resolveRequest) {
      throw new Error("Missing resolver");
    }
    const resolveProfile = resolveRequest as (value: TestProfile) => void;
    resolveProfile(profile);

    await expect(Promise.all([first, second])).resolves.toEqual([
      profile,
      profile,
    ]);
  });

  it("reuses a recently resolved profile during immediate follow-up navigation", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:00:00Z"));

    const profile = {
      id: "user-4",
      name: "Warm Cache User",
      email: "warm@example.com",
      base_currency: "COP",
      timezone: "America/Bogota",
      created_at: "2026-03-26T12:00:00Z",
    };

    getProfileMock.mockResolvedValue(profile);

    await expect(
      resolveAuthenticatedProfile({ sessionUserId: "user-4" }),
    ).resolves.toEqual(profile);
    expect(getProfileMock).toHaveBeenCalledTimes(1);

    getProfileMock.mockClear();

    await expect(
      resolveAuthenticatedProfile({ sessionUserId: "user-4" }),
    ).resolves.toEqual(profile);
    expect(getProfileMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(10_001);
    getProfileMock.mockResolvedValue(profile);

    await expect(
      resolveAuthenticatedProfile({ sessionUserId: "user-4" }),
    ).resolves.toEqual(profile);
    expect(getProfileMock).toHaveBeenCalledTimes(1);
  });
});
