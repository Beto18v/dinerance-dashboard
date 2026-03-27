"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { useSession } from "@/components/providers/auth-provider";
import { useProfile } from "@/components/providers/profile-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SaveStatus = "idle" | "saving" | "saved";

export function AccountInfoCard() {
  const router = useRouter();
  const { signOut } = useSession();
  const { profile, setProfile } = useProfile();
  const { site } = useSitePreferences();
  const t = site.pages.profile;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [signingOut, setSigningOut] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const nextName = event.target.value;
    setSaveStatus("saving");

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveName(nextName), 800);
  }

  async function saveName(value: string) {
    const normalizedName = value.trim();
    if (!normalizedName || normalizedName === profile?.name) {
      setSaveStatus("idle");
      return;
    }

    try {
      const updated = await api.updateProfile({ name: normalizedName });
      setProfile(updated);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      setSaveStatus("idle");
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(t.failedSaveName);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.replace("/auth/login");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.infoCardTitle}</CardTitle>
        <CardDescription>{t.infoCardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="name" className="text-sm font-medium">
                {t.fullName}
              </label>
              {saveStatus === "saving" && (
                <span className="text-xs text-muted-foreground">{t.saving}</span>
              )}
              {saveStatus === "saved" && (
                <span className="text-xs font-medium text-green-600">
                  {t.saved}
                </span>
              )}
            </div>
            <Input
              id="name"
              key={profile?.name ?? ""}
              defaultValue={profile?.name ?? ""}
              onChange={handleNameChange}
              placeholder={t.fullNamePlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.email}</label>
            <Input
              value={profile?.email ?? ""}
              readOnly
              className="cursor-not-allowed bg-muted text-muted-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.memberSince}</label>
            <Input
              value={
                profile
                  ? new Date(profile.created_at).toLocaleDateString(
                      t.dateLocale,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )
                  : ""
              }
              readOnly
              className="cursor-not-allowed bg-muted text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex sm:justify-end">
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full border-destructive text-destructive dark:border-destructive dark:text-destructive sm:w-auto"
          >
            {site.appLayout.signOut}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
