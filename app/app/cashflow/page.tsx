"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { useProfile } from "@/components/providers/profile-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoHint } from "@/components/ui/info-hint";
import { api, ApiError, type CashflowForecast } from "@/lib/api";
import {
  cacheKeys,
  cacheTtls,
  getCache,
  setCache,
  subscribeToCacheKeys,
} from "@/lib/cache";
import { FutureCashCard } from "../balance/components/future-cash-card";

export default function CashflowPage() {
  const { profile } = useProfile();
  const { site } = useSitePreferences();
  const t = site.pages.cashflow;
  const balanceText = site.pages.balance;
  const locale = site.metadata.htmlLang === "en" ? "en-US" : "es-CO";
  const timeZone = profile?.timezone ?? "UTC";
  const [cachedForecast] = useState(() => getFreshCashflowForecastCache());
  const [forecast, setForecast] = useState<CashflowForecast | null>(
    () => cachedForecast,
  );
  const [loading, setLoading] = useState(() => !cachedForecast);

  const loadForecast = useCallback(
    async (silent = false) => {
      if (!profile?.base_currency || !profile?.timezone) {
        setForecast(null);
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const data = await api.getCashflowForecast();
        setForecast(data);
        setCache(cacheKeys.cashflowForecast, data);
      } catch (error) {
        if (!silent) {
          if (error instanceof ApiError) {
            toast.error(error.message);
          } else {
            toast.error(balanceText.failedLoadCashflowForecast);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [
      balanceText.failedLoadCashflowForecast,
      profile?.base_currency,
      profile?.timezone,
    ],
  );

  useEffect(() => {
    void loadForecast(Boolean(cachedForecast));
  }, [cachedForecast, loadForecast]);

  useEffect(() => {
    return subscribeToCacheKeys(
      [
        cacheKeys.cashflowForecast,
        cacheKeys.obligations,
        cacheKeys.ledgerBalances,
        cacheKeys.transactions,
      ],
      () => {
        void loadForecast(true);
      },
    );
  }, [loadForecast]);

  if (!profile?.base_currency || !profile?.timezone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t.missingProfile}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <InfoHint title={t.helpTitle} description={t.helpDescription} />
          </div>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/app/obligations">{t.openObligations}</Link>
        </Button>
      </div>

      <FutureCashCard
        forecast={forecast}
        loading={loading}
        locale={locale}
        loadingLabel={site.common.loading}
        showHeader={false}
        timeZone={timeZone}
        text={balanceText}
        formatMoney={formatMoney}
      />
    </div>
  );
}

function getFreshCashflowForecastCache() {
  return getCache<CashflowForecast>(cacheKeys.cashflowForecast, {
    maxAgeMs: cacheTtls.cashflowForecast,
  });
}

function formatMoney(value: string, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...(currency === "COP"
      ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
      : {}),
  })
    .format(Number(value || 0))
    .replace(/\s+/g, "");
}
