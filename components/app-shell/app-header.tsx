"use client";

import Link from "next/link";
import { Monitor, Moon, Sun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { SiteText } from "@/lib/site";

import { resolveNavBadgeClassName } from "./helpers";
import type { AppNavLink, AppTheme, AppThemeOption } from "./types";
import { MobileNavSheet } from "./mobile-nav-sheet";
import { UserMenu } from "./user-menu";

type AppHeaderProps = {
  avatarUrl?: string;
  displayName: string;
  mobileNavOpen: boolean;
  navLinks: AppNavLink[];
  onMobileNavOpenChange: (open: boolean) => void;
  onSignOut: () => void;
  onThemeChange: (value: AppTheme) => void;
  pathname: string;
  selectedTheme: AppTheme;
  site: SiteText;
  userEmail: string;
  userInitials: string;
};

export function AppHeader({
  avatarUrl,
  displayName,
  mobileNavOpen,
  navLinks,
  onMobileNavOpenChange,
  onSignOut,
  onThemeChange,
  pathname,
  selectedTheme,
  site,
  userEmail,
  userInitials,
}: AppHeaderProps) {
  const themeOptions: AppThemeOption[] = [
    {
      value: "system",
      label: site.pages.profile.themeSystem,
      icon: Monitor,
    },
    {
      value: "light",
      label: site.pages.profile.themeLight,
      icon: Sun,
    },
    {
      value: "dark",
      label: site.pages.profile.themeDark,
      icon: Moon,
    },
  ];

  return (
    <header className="sticky top-0 z-20 border-b bg-background shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/app/balance" className="flex shrink-0 items-center gap-1.5">
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
                        link.badgeTone ?? "info",
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

        <div className="hidden shrink-0 items-center md:flex">
          <UserMenu
            avatarUrl={avatarUrl}
            displayName={displayName}
            onSignOut={onSignOut}
            onThemeChange={onThemeChange}
            selectedTheme={selectedTheme}
            site={site}
            themeOptions={themeOptions}
            userEmail={userEmail}
            userInitials={userInitials}
          />
        </div>

        <MobileNavSheet
          avatarUrl={avatarUrl}
          displayName={displayName}
          navLinks={navLinks}
          onOpenChange={onMobileNavOpenChange}
          onSignOut={onSignOut}
          onThemeChange={onThemeChange}
          open={mobileNavOpen}
          pathname={pathname}
          selectedTheme={selectedTheme}
          site={site}
          themeOptions={themeOptions}
          userEmail={userEmail}
          userInitials={userInitials}
        />
      </div>
    </header>
  );
}
