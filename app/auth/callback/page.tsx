"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useSession } from "@/components/providers/auth-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { bootstrapAuthenticatedProfile } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const hasHandledRef = useRef(false);
  const { session, loading, signOut } = useSession();
  const { site } = useSitePreferences();

  useEffect(() => {
    if (loading || hasHandledRef.current) {
      return;
    }

    if (!session) {
      hasHandledRef.current = true;
      router.replace("/auth/login");
      return;
    }

    hasHandledRef.current = true;

    bootstrapAuthenticatedProfile()
      .then(() => {
        router.replace("/app/balance");
      })
      .catch(async (error) => {
        await signOut();
        toast.error(
          error instanceof ApiError
            ? error.message
            : site.common.unexpectedError,
        );
        router.replace("/auth/login");
      });
  }, [loading, router, session, signOut, site.common.unexpectedError]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        <p className="text-sm font-medium text-muted-foreground">
          {site.common.loading}
        </p>
      </div>
    </div>
  );
}
