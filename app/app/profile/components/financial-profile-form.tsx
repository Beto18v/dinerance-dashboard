"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type UserProfile } from "@/lib/api";
import { cacheKeys, invalidateCacheKey } from "@/lib/cache";
import {
  currencyOptions,
  isValidCurrencyCode,
  normalizeCurrencyCode,
} from "@/lib/finance";
import { shouldLockBaseCurrency } from "@/lib/profile";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import {
  getBrowserTimeZone,
  getSupportedTimeZones,
  isValidTimeZone,
} from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SaveStatus = "idle" | "saving" | "saved";

export function FinancialProfileForm({
  profile,
  hasTransactions,
  onProfileUpdated,
  compact = false,
}: {
  profile: UserProfile | null;
  hasTransactions: boolean;
  onProfileUpdated: (profile: UserProfile) => void;
  compact?: boolean;
}) {
  const { site } = useSitePreferences();
  const t = site.pages.profile;
  const browserTimeZone = getBrowserTimeZone();
  const availableTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [baseCurrency, setBaseCurrency] = useState(
    profile?.base_currency ?? "",
  );
  const [timeZone, setTimeZone] = useState(
    profile?.timezone ?? browserTimeZone,
  );
  const [status, setStatus] = useState<SaveStatus>("idle");

  const baseCurrencyLocked = shouldLockBaseCurrency(profile, hasTransactions);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  function resetSavedStatus() {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }

    statusTimerRef.current = setTimeout(() => {
      setStatus("idle");
    }, 2500);
  }

  async function handleFinanceSave() {
    const normalizedBaseCurrency = normalizeCurrencyCode(baseCurrency);
    const normalizedTimeZone = timeZone.trim();

    if (!isValidCurrencyCode(normalizedBaseCurrency)) {
      toast.error(t.baseCurrencyInvalid);
      return;
    }

    if (!isValidTimeZone(normalizedTimeZone)) {
      toast.error(t.timezoneInvalid);
      return;
    }

    const payload: {
      base_currency?: string;
      timezone?: string;
    } = {};

    if (!baseCurrencyLocked && profile?.base_currency !== normalizedBaseCurrency) {
      payload.base_currency = normalizedBaseCurrency;
    }

    if (profile?.timezone !== normalizedTimeZone) {
      payload.timezone = normalizedTimeZone;
    }

    if (!payload.base_currency && !payload.timezone) {
      setStatus("saved");
      resetSavedStatus();
      return;
    }

    setStatus("saving");

    try {
      const updated = await api.updateProfile(payload);
      invalidateCacheKey(cacheKeys.financialAccounts);
      onProfileUpdated(updated);
      setBaseCurrency(updated.base_currency ?? normalizedBaseCurrency);
      setTimeZone(updated.timezone ?? normalizedTimeZone);
      setStatus("saved");
      resetSavedStatus();
    } catch (error) {
      setStatus("idle");
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedSaveFinance);
      }
    }
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-4 rounded-xl border bg-muted/25 p-4"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          {!compact ? (
            <p className="font-medium text-foreground">{t.financeTitle}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {t.financeDescription}
          </p>
        </div>
        {status === "saving" ? (
          <span className="text-xs text-muted-foreground">
            {t.financeSaving}
          </span>
        ) : null}
        {status === "saved" ? (
          <span className="text-xs font-medium text-green-600">
            {t.financeSaved}
          </span>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label htmlFor={compact ? "onboarding_base_currency" : "base_currency"}>
            {t.baseCurrencyLabel}
          </Label>
          <InfoHint
            title={t.baseCurrencyHelpTitle}
            description={t.baseCurrencyHelpDescription}
          />
        </div>
        <Input
          id={compact ? "onboarding_base_currency" : "base_currency"}
          list="profile-base-currency-options"
          value={baseCurrency}
          onChange={(event) =>
            setBaseCurrency(normalizeCurrencyCode(event.target.value))
          }
          placeholder={t.baseCurrencyPlaceholder}
          disabled={baseCurrencyLocked}
        />
        <datalist id="profile-base-currency-options">
          {currencyOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">
          {baseCurrencyLocked
            ? t.baseCurrencyLockedHint
            : t.baseCurrencyHint}
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor={compact ? "onboarding_timezone" : "timezone"}>
              {t.timezoneLabel}
            </Label>
            <InfoHint
              title={t.timezoneHelpTitle}
              description={t.timezoneHelpDescription}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setTimeZone(browserTimeZone)}
            className="h-auto px-2 py-1 text-xs"
          >
            {t.timezoneBrowserAction}
          </Button>
        </div>
        <Input
          id={compact ? "onboarding_timezone" : "timezone"}
          list="profile-timezone-options"
          value={timeZone}
          onChange={(event) => setTimeZone(event.target.value)}
          placeholder={t.timezonePlaceholder}
        />
        <datalist id="profile-timezone-options">
          {availableTimeZones.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">
          {t.timezoneHint(browserTimeZone)}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{t.timezoneExamples}</p>
        <Button type="button" onClick={handleFinanceSave}>
          {status === "saving" ? t.financeSaving : t.financeSave}
        </Button>
      </div>
    </div>
  );
}
