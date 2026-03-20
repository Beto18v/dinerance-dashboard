"use client";

import { useSitePreferences } from "@/components/providers/site-preferences-provider";

export function ProfileHeader() {
  const { site } = useSitePreferences();
  const t = site.pages.profile;

  return (
    <div>
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
    </div>
  );
}
