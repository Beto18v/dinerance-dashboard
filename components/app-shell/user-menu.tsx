"use client";

import Link from "next/link";
import { LogOut, Monitor, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SiteText } from "@/lib/site";

import type { AppTheme, AppThemeOption } from "./types";

type UserMenuProps = {
  avatarUrl?: string;
  displayName: string;
  onSignOut: () => void;
  onThemeChange: (value: AppTheme) => void;
  selectedTheme: AppTheme;
  site: SiteText;
  themeOptions: AppThemeOption[];
  userEmail: string;
  userInitials: string;
};

export function UserMenu({
  avatarUrl,
  displayName,
  onSignOut,
  onThemeChange,
  selectedTheme,
  site,
  themeOptions,
  userEmail,
  userInitials,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={site.appLayout.userMenuLabel}
          className="rounded-full border border-border/60 bg-background p-0 shadow-sm hover:bg-muted"
        >
          <Avatar className="size-8">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="py-2">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName}
              </p>
              {userEmail ? (
                <p className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </p>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/profile">
            <UserRound className="size-4" />
            {site.appLayout.nav.profile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Monitor className="size-4" />
            {site.appLayout.themeMenuLabel}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuRadioGroup
              value={selectedTheme}
              onValueChange={(value) => onThemeChange(value as AppTheme)}
            >
              {themeOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    <Icon className="size-4" />
                    {option.label}
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void onSignOut()}>
          <LogOut className="size-4" />
          {site.appLayout.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
