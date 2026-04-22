import type { LucideIcon } from "lucide-react";

export type AppNavLink = {
  href: string;
  label: string;
  badgeCount?: string | null;
  badgeTone?: "danger" | "warning" | "info";
};

export type AppTheme = "system" | "light" | "dark";

export type AppThemeOption = {
  value: AppTheme;
  label: string;
  icon: LucideIcon;
};
