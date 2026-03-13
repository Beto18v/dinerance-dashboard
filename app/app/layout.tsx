"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import { useSession } from "@/components/providers/auth-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api, ApiError } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, signOut } = useSession();
  const { site } = useSitePreferences();
  const router = useRouter();
  const pathname = usePathname();
  const [profileReady, setProfileReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navLinks = [
    { href: "/app/balance", label: site.appLayout.nav.balance },
    { href: "/app/transactions", label: site.appLayout.nav.transactions },
    { href: "/app/categories", label: site.appLayout.nav.categories },
    { href: "/app/profile", label: site.appLayout.nav.profile },
  ];

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/auth/login");
      return;
    }

    if (!loading && session) {
      api
        .getProfile()
        .then(() => setProfileReady(true))
        .catch(async (err) => {
          if (err instanceof ApiError && err.status === 404) {
            await signOut();
            router.replace("/auth/register");
            return;
          }

          if (err instanceof ApiError && err.status === 401) {
            await signOut();
            router.replace("/auth/login");
            return;
          }

          setProfileReady(true);
        });
    }
  }, [session, loading, router, signOut]);

  if (loading || (session && !profileReady)) {
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

  async function handleSignOut() {
    setMobileNavOpen(false);
    await signOut();
    router.replace("/auth/login");
  }

  return (
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
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              {site.appLayout.signOut}
            </Button>
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

                <SheetFooter className="border-t pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    {site.appLayout.signOut}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
