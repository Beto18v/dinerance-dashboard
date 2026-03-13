"use client";

import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const AUTH_CALLBACK_PATH = "/auth/callback";

function getSiteUrl(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  throw new Error("Missing NEXT_PUBLIC_SITE_URL");
}

export async function signInWithGoogle() {
  const redirectTo = new URL(AUTH_CALLBACK_PATH, getSiteUrl()).toString();
  return createClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}

export async function bootstrapAuthenticatedProfile(name?: string) {
  const trimmedName = name?.trim();
  return api.bootstrapProfile(trimmedName ? { name: trimmedName } : undefined);
}
