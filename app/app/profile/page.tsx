"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError, type UserProfile } from "@/lib/api";
import { getCache, setCache } from "@/lib/cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CACHE_KEY = "cache:profile";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    getCache<UserProfile>(CACHE_KEY),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // silent refresh if we already have cached data
    fetchProfile(!!getCache(CACHE_KEY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile(silent = false) {
    if (!silent) setLoading(true);
    try {
      const data = await api.getProfile();
      setProfile(data);
      setCache(CACHE_KEY, data);
      if (!silent) toast.success("Profile loaded");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to load profile");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <Button onClick={() => fetchProfile(false)} disabled={loading}>
        {loading ? "Loading…" : "Sync / Refresh profile"}
      </Button>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>{profile.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Email:</span> {profile.email}
            </p>
            <p>
              <span className="font-medium">ID:</span> {profile.id}
            </p>
            <p>
              <span className="font-medium">Member since:</span>{" "}
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
