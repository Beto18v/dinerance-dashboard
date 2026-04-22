export function formatAlertCount(count: number) {
  return count > 99 ? "99+" : String(count);
}

export function resolveNavBadgeClassName(
  tone: "danger" | "warning" | "info",
  active: boolean,
) {
  if (active) {
    return "border-transparent bg-background/95 text-foreground";
  }

  if (tone === "danger") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}

export function getUserAvatarUrl(userMetadata: Record<string, unknown> | undefined) {
  const avatarUrl = userMetadata?.avatar_url;
  if (typeof avatarUrl === "string" && avatarUrl.trim()) {
    return avatarUrl.trim();
  }

  const picture = userMetadata?.picture;
  if (typeof picture === "string" && picture.trim()) {
    return picture.trim();
  }

  return undefined;
}

export function getUserInitials(value: string) {
  const normalized = value
    .replace(/[@._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (normalized.length === 0) {
    return "U";
  }

  return normalized
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}
