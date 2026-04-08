"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/auth-provider";
import { ProfileProvider } from "@/components/providers/profile-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

type AppNavLink = {
  href: string;
  label: string;
  badgeCount?: string | null;
  badgeTone?: "overdue" | "today" | "soon";
};

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
    overdueCount > 0 ? "overdue" : dueTodayCount > 0 ? "today" : "soon";
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
    { href: "/app/profile", label: site.appLayout.nav.profile },
  ];

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
        <header className="sticky top-0 z-20 border-b bg-background shadow-sm">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
            <Link
              href="/app/balance"
              className="flex shrink-0 items-center gap-1.5"
            >
              <span className="text-base font-bold tracking-tight text-green-600">
                Dine<span className="text-primary">rance</span>
              </span>
            </Link>

            <nav className="hidden flex-1 items-center gap-1 md:flex">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{link.label}</span>
                      {link.badgeCount ? (
                        <Badge
                          variant="outline"
                          className={resolveNavBadgeClassName(
                            link.badgeTone ?? "soon",
                            active,
                          )}
                        >
                          {link.badgeCount}
                        </Badge>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="hidden shrink-0 items-center gap-3 md:flex">
              <span className="max-w-45 truncate text-xs text-cyan-500">
                {session.user.email}
              </span>
            </div>

            <div className="ml-auto md:hidden">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                  >
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[85vw] sm:max-w-sm">
                  <SheetHeader className="space-y-2 border-b pb-4">
                    <SheetTitle>{site.appLayout.mobileMenuTitle}</SheetTitle>
                    <SheetDescription className="space-y-1">
                      <span className="block">
                        {site.appLayout.mobileMenuDescription}
                      </span>
                      <span className="block truncate text-cyan-500">
                        {session.user.email}
                      </span>
                    </SheetDescription>
                  </SheetHeader>

                  <nav className="flex flex-1 flex-col gap-2 px-4 py-6">
                    {navLinks.map((link) => {
                      const active = pathname === link.href;

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span>{link.label}</span>
                            {link.badgeCount ? (
                              <Badge
                                variant="outline"
                                className={resolveNavBadgeClassName(
                                  link.badgeTone ?? "soon",
                                  active,
                                )}
                              >
                                {link.badgeCount}
                              </Badge>
                            ) : null}
                          </span>
                        </Link>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

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

function formatAlertCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

function resolveNavBadgeClassName(
  tone: "overdue" | "today" | "soon",
  active: boolean,
) {
  if (active) {
    return "border-transparent bg-background/95 text-foreground";
  }

  if (tone === "overdue") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (tone === "today") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}
