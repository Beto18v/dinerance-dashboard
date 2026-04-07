"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/auth-provider";
import { ProfileProvider } from "@/components/providers/profile-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ApiError } from "@/lib/api";
import {
  cacheProfile,
  clearCachedProfile,
  getCachedProfile,
  getPreferredSessionName,
  resolveAuthenticatedProfile,
} from "@/lib/profile";

async function getInitialProfileState(sessionUserId: string) {
  const cachedProfile = getCachedProfile();
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
  const [profile, setProfileState] = useState(() => getCachedProfile());
  const [profileReady, setProfileReady] = useState(() => !!getCachedProfile());
  const [preparedSessionUserId, setPreparedSessionUserId] = useState(
    () => getCachedProfile()?.id ?? null,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const handledUserIdRef = useRef<string | null>(null);
  const navLinks = [
    { href: "/app/balance", label: site.appLayout.nav.balance },
    { href: "/app/analysis", label: site.appLayout.nav.analysis },
    { href: "/app/transactions", label: site.appLayout.nav.transactions },
    { href: "/app/categories", label: site.appLayout.nav.categories },
    { href: "/app/profile", label: site.appLayout.nav.profile },
  ];

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
                    {link.label}
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
                          {link.label}
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
          {children}
        </main>
      </div>
    </ProfileProvider>
  );
}
