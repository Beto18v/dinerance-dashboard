"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { AppHeader } from "@/components/app-shell/app-header";
import {
  formatAlertCount,
  getUserAvatarUrl,
  getUserInitials,
} from "@/components/app-shell/helpers";
import type { AppNavLink, AppTheme } from "@/components/app-shell/types";
import { useSession } from "@/components/providers/auth-provider";
import { ProfileProvider } from "@/components/providers/profile-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { api, ApiError, type UpcomingObligationsResponse } from "@/lib/api";
import {
  cacheKeys,
  cacheTtls,
  getCache,
  setCache,
  subscribeToCacheKeys,
} from "@/lib/cache";
import {
  cacheProfile,
  clearCachedProfile,
  getCachedProfile,
  getPreferredSessionName,
  resolveAuthenticatedProfile,
} from "@/lib/profile";

const OBLIGATION_ALERT_WINDOW_DAYS = 7;
const OBLIGATION_ALERT_LIMIT = 1;

async function getInitialProfileState(sessionUserId: string) {
  const cachedProfile = getCachedProfile({ allowStale: true });
  if (cachedProfile?.id === sessionUserId) {
    return {
      profile: cachedProfile,
      ready: true,
    };
  }

  return {
    profile: null,
    ready: false,
  };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, signOut } = useSession();
  const { site } = useSitePreferences();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfileState] = useState(() =>
    getCachedProfile({ allowStale: true }),
  );
  const [profileReady, setProfileReady] = useState(
    () => !!getCachedProfile({ allowStale: true }),
  );
  const [preparedSessionUserId, setPreparedSessionUserId] = useState(
    () => getCachedProfile({ allowStale: true })?.id ?? null,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cachedObligationAlerts] = useState(() =>
    getFreshObligationAlertsCache(),
  );
  const [obligationAlerts, setObligationAlerts] =
    useState<UpcomingObligationsResponse | null>(() => cachedObligationAlerts);
  const handledUserIdRef = useRef<string | null>(null);
  const hasFinancialProfile = Boolean(
    profile?.base_currency && profile?.timezone,
  );
  const selectedTheme = (theme ?? "system") as AppTheme;
  const obligationAlertSummary =
    session && hasFinancialProfile ? obligationAlerts?.summary ?? null : null;
  const overdueCount = obligationAlertSummary?.overdue_count ?? 0;
  const dueTodayCount = obligationAlertSummary?.due_today_count ?? 0;
  const dueSoonCount = obligationAlertSummary?.due_soon_count ?? 0;
  const urgentObligationCount = overdueCount + dueTodayCount + dueSoonCount;
  const showObligationBanner = overdueCount > 0 || dueTodayCount > 0;
  const obligationBannerMessage =
    overdueCount > 0 && dueTodayCount > 0
      ? site.appLayout.obligationsAlertMixedBanner(overdueCount, dueTodayCount)
      : overdueCount > 0
        ? site.appLayout.obligationsAlertOverdueBanner(overdueCount)
        : dueTodayCount > 0
          ? site.appLayout.obligationsAlertTodayBanner(dueTodayCount)
          : null;
  const obligationBadgeTone =
    overdueCount > 0 ? "danger" : dueTodayCount > 0 ? "warning" : "info";
  const navLinks: AppNavLink[] = [
    { href: "/app/balance", label: site.appLayout.nav.balance },
    { href: "/app/cashflow", label: site.appLayout.nav.cashflow },
    { href: "/app/analysis", label: site.appLayout.nav.analysis },
    {
      href: "/app/obligations",
      label: site.appLayout.nav.obligations,
      badgeCount:
        urgentObligationCount > 0
          ? formatAlertCount(urgentObligationCount)
          : null,
      badgeTone: obligationBadgeTone,
    },
    { href: "/app/transactions", label: site.appLayout.nav.transactions },
    { href: "/app/categories", label: site.appLayout.nav.categories },
  ];
  const displayName =
    profile?.name?.trim() || getPreferredSessionName(session) || "User";
  const userEmail = profile?.email?.trim() || session?.user.email?.trim() || "";
  const avatarUrl = getUserAvatarUrl(session?.user.user_metadata);
  const userInitials = getUserInitials(displayName || userEmail);

  const loadObligationAlerts = useCallback(async () => {
    if (!session || !profile?.base_currency || !profile?.timezone) {
      return;
    }

    try {
      const data = await api.getUpcomingObligations({
        days_ahead: OBLIGATION_ALERT_WINDOW_DAYS,
        limit: OBLIGATION_ALERT_LIMIT,
      });
      setObligationAlerts(data);
      setCache(cacheKeys.obligationAlerts, data);
    } catch {
      // Keep navigation usable even if the alert fetch fails.
    }
  }, [profile?.base_currency, profile?.timezone, session]);

  const setProfile = useCallback((profileData: typeof profile) => {
    setProfileState(profileData);
    if (profileData) {
      cacheProfile(profileData);
      return;
    }

    clearCachedProfile();
  }, []);

  const handleSignOut = useCallback(async () => {
    setMobileNavOpen(false);
    await signOut();
    router.replace("/auth/login");
  }, [router, signOut]);

  useEffect(() => {
    if (!loading && !session) {
      handledUserIdRef.current = null;
      clearCachedProfile();
      router.replace("/auth/login");
      return;
    }

    if (!loading && session) {
      if (handledUserIdRef.current === session.user.id) {
        return;
      }

      handledUserIdRef.current = session.user.id;
      let cancelled = false;
      void (async () => {
        const initialProfileState = await getInitialProfileState(
          session.user.id,
        );
        if (cancelled) return;

        setPreparedSessionUserId(session.user.id);
        setProfile(initialProfileState.profile);
        setProfileReady(initialProfileState.ready);

        try {
          const resolvedProfile = await resolveAuthenticatedProfile({
            preferredName: getPreferredSessionName(session),
            sessionUserId: session.user.id,
          });
          if (cancelled) return;
          setProfile(resolvedProfile);
          setProfileReady(true);
        } catch (err) {
          if (cancelled) return;

          if (
            err instanceof ApiError &&
            (err.status === 401 || err.status === 409)
          ) {
            handledUserIdRef.current = null;
            setPreparedSessionUserId(null);
            setProfile(null);
            setProfileReady(false);
            await signOut();
            toast.error(err.message);
            router.replace("/auth/login");
            return;
          }

          if (err instanceof ApiError) {
            toast.error(err.message);
          } else {
            toast.error(site.common.unexpectedError);
          }

          setProfileReady(true);
        }
      })();

      return () => {
        cancelled = true;
      };
    }
  }, [
    loading,
    router,
    session,
    setProfile,
    signOut,
    site.common.unexpectedError,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadObligationAlerts();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadObligationAlerts]);

  useEffect(() => {
    return subscribeToCacheKeys(
      [cacheKeys.obligationAlerts, cacheKeys.obligations],
      () => {
        void loadObligationAlerts();
      },
    );
  }, [loadObligationAlerts]);

  if (
    loading ||
    (session && (!profileReady || preparedSessionUserId !== session.user.id))
  ) {
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

  if (!session) return null;

  return (
    <ProfileProvider value={{ profile, setProfile }}>
      <div className="flex min-h-screen flex-col bg-muted/40">
        <AppHeader
          avatarUrl={avatarUrl}
          displayName={displayName}
          mobileNavOpen={mobileNavOpen}
          navLinks={navLinks}
          onMobileNavOpenChange={setMobileNavOpen}
          onSignOut={handleSignOut}
          onThemeChange={setTheme}
          pathname={pathname}
          selectedTheme={selectedTheme}
          site={site}
          userEmail={userEmail}
          userInitials={userInitials}
        />

        <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="space-y-6">
            {showObligationBanner && obligationBannerMessage ? (
              <div
                className={`flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
                  overdueCount > 0
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <p className="font-medium">{obligationBannerMessage}</p>
                <Link
                  href="/app/obligations"
                  className="text-sm font-semibold underline-offset-4 hover:underline"
                >
                  {site.appLayout.obligationsAlertOpen}
                </Link>
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </ProfileProvider>
  );
}

function getFreshObligationAlertsCache() {
  const cached = getCache<UpcomingObligationsResponse>(
    cacheKeys.obligationAlerts,
    {
      maxAgeMs: cacheTtls.obligationAlerts,
    },
  );

  if (!cached) {
    return null;
  }

  const referenceDate = new Date(`${cached.reference_date}T00:00:00Z`);
  const windowEndDate = new Date(`${cached.window_end_date}T00:00:00Z`);
  const windowDays = Math.round(
    (windowEndDate.getTime() - referenceDate.getTime()) / 86_400_000,
  );

  if (windowDays !== OBLIGATION_ALERT_WINDOW_DAYS) {
    return null;
  }

  return cached;
}
