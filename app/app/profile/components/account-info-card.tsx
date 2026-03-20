"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api, ApiError, type UserProfile } from "@/lib/api";
import { getCache, setCache } from "@/lib/cache";
import { useSession } from "@/components/providers/auth-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CACHE_KEY = "cache:profile";

type SaveStatus = "idle" | "saving" | "saved";

export function AccountInfoCard() {
  const router = useRouter();
  const { signOut } = useSession();
  const { site } = useSitePreferences();
  const t = site.pages.profile;

  const [profile, setProfile] = useState<UserProfile | null>(() =>
    getCache<UserProfile>(CACHE_KEY),
  );
  const [name, setName] = useState(
    () => getCache<UserProfile>(CACHE_KEY)?.name ?? "",
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [signingOut, setSigningOut] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getProfile()
      .then((data) => {
        if (!mounted) return;
        setProfile(data);
        setName(data.name);
        setCache(CACHE_KEY, data);
      })
      .catch((err) => {
        if (err instanceof ApiError) toast.error(err.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveName(val), 800);
  }

  async function saveName(val: string) {
    if (!val.trim()) return;

    try {
      const updated = await api.updateProfile({ name: val.trim() });
      setProfile(updated);
      setCache(CACHE_KEY, updated);
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
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="name">{t.fullName}</Label>
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
            value={name}
            onChange={handleNameChange}
            placeholder={t.fullNamePlaceholder}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t.email}</Label>
          <Input
            value={profile?.email ?? ""}
            readOnly
            className="cursor-not-allowed bg-muted text-muted-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t.memberSince}</Label>
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
