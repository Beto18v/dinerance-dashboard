"use client";

import Link from "next/link";
import { LogOut, Menu, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import type { SiteText } from "@/lib/site";

import { resolveNavBadgeClassName } from "./helpers";
import type { AppNavLink, AppTheme, AppThemeOption } from "./types";

type MobileNavSheetProps = {
  avatarUrl?: string;
  displayName: string;
  navLinks: AppNavLink[];
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
  onThemeChange: (value: AppTheme) => void;
  open: boolean;
  pathname: string;
  selectedTheme: AppTheme;
  site: SiteText;
  themeOptions: AppThemeOption[];
  userEmail: string;
  userInitials: string;
};

export function MobileNavSheet({
  avatarUrl,
  displayName,
  navLinks,
  onOpenChange,
  onSignOut,
  onThemeChange,
  open,
  pathname,
  selectedTheme,
  site,
  themeOptions,
  userEmail,
  userInitials,
}: MobileNavSheetProps) {
  return (
    <div className="ml-auto md:hidden">
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-[85vw] sm:max-w-sm">
          <SheetHeader className="space-y-2 border-b pb-4">
            <SheetTitle>{site.appLayout.mobileMenuTitle}</SheetTitle>
            <SheetDescription className="space-y-3">
              <span className="block">{site.appLayout.mobileMenuDescription}</span>
              <span className="flex items-center gap-3">
                <Avatar className="size-9">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {displayName}
                  </span>
                  {userEmail ? (
                    <span className="block truncate text-cyan-500">{userEmail}</span>
                  ) : null}
                </span>
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
                  onClick={() => onOpenChange(false)}
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

          <SheetFooter className="border-t px-4 py-4">
            <div className="w-full space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {site.appLayout.quickActionsTitle}
                </p>
                <Link
                  href="/app/profile"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <UserRound className="size-4 text-muted-foreground" />
                  <span>{site.appLayout.nav.profile}</span>
                </Link>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {site.appLayout.themeMenuLabel}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={
                          selectedTheme === option.value ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => onThemeChange(option.value)}
                        className="h-9 px-2 text-xs"
                      >
                        <Icon className="size-3.5" />
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => void onSignOut()}
                className="w-full justify-start border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive"
              >
                <LogOut className="size-4" />
                {site.appLayout.signOut}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
