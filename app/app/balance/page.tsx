"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  api,
  ApiError,
  type AnalyticsCategoryBreakdown,
  type AnalyticsSummary,
  type AnalyticsSummaryTransaction,
  type Category,
  type TransactionsPageResponse,
  type UserProfile,
} from "@/lib/api";
import { useProfile } from "@/components/providers/profile-provider";
import { formatCurrencyAmount } from "@/lib/finance";
import {
  cacheKeys,
  cacheTtls,
  getCache,
  invalidateCacheKey,
  setCache,
  subscribeToCacheKeys,
} from "@/lib/cache";
import { getCurrentMonthValue } from "@/lib/timezone";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BalanceOnboardingCard } from "./components/balance-onboarding-card";
import { CategoryBreakdownCard } from "./components/category-breakdown-card";

const monthFormatters = {
  es: new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }),
  en: new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }),
};
export default function BalancePage() {
  const { site } = useSitePreferences();
  const { profile, setProfile } = useProfile();
  const t = site.pages.balance;
  const cachedCategories = getFreshCategoriesCache();
  const cachedTransactions = getFreshTransactionsCache();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] =
    useState<AnalyticsCategoryBreakdown | null>(null);
  const [categoryBreakdownLoading, setCategoryBreakdownLoading] =
    useState(false);
  const [categoryBreakdownDirection, setCategoryBreakdownDirection] = useState<
    "expense" | "income"
  >("income");
  const [categories, setCategories] = useState<Category[]>(
    () => cachedCategories ?? [],
  );
  const [categoriesReady, setCategoriesReady] = useState(
    () => !!cachedCategories,
  );
  const [transactionsReady, setTransactionsReady] = useState(
    () => cachedTransactions !== null,
  );
  const [hasTransactions, setHasTransactions] = useState(
    () => (cachedTransactions?.total_count ?? 0) > 0,
  );
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const profileRef = useRef<UserProfile | null>(profile);
  const categoryBreakdownDirectionRef = useRef<"expense" | "income">(
    categoryBreakdownDirection,
  );
  const categoryBreakdownResolvedKeyRef = useRef<string | null>(null);
  const categoryBreakdownInFlightKeyRef = useRef<string | null>(null);
  const categoryBreakdownRequestIdRef = useRef(0);

  const hasBaseCurrency = Boolean(profile?.base_currency);
  const hasTimeZone = Boolean(profile?.timezone);
  const hasCategories = categories.length > 0;
  const needsProfileSetup = !hasBaseCurrency || !hasTimeZone;
  // Missing finance setup should render onboarding immediately instead of flashing
  // a temporary fallback card while categories/transactions are still loading.
  const showOnboarding =
    needsProfileSetup ||
    (categoriesReady &&
      transactionsReady &&
      !(hasBaseCurrency && hasTimeZone && hasCategories && hasTransactions));
  const profileAnalyticsKey = getProfileAnalyticsKey(profile);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    categoryBreakdownDirectionRef.current = categoryBreakdownDirection;
  }, [categoryBreakdownDirection]);

  const loadCategoryBreakdown = useCallback(
    async (
      params?: {
        year?: number;
        month?: number;
        direction?: "expense" | "income";
      },
      activeProfile?: UserProfile | null,
    ) => {
      const resolvedProfile = activeProfile ?? profileRef.current;
      if (
        !resolvedProfile?.base_currency ||
        params?.year == null ||
        params?.month == null
      ) {
        categoryBreakdownResolvedKeyRef.current = null;
        categoryBreakdownInFlightKeyRef.current = null;
        setCategoryBreakdown(null);
        setCategoryBreakdownLoading(false);
        return;
      }

      const requestKey = getCategoryBreakdownRequestKey({
        baseCurrency: resolvedProfile.base_currency,
        year: params.year,
        month: params.month,
        direction: params.direction,
      });
      if (
        requestKey === categoryBreakdownResolvedKeyRef.current ||
        requestKey === categoryBreakdownInFlightKeyRef.current
      ) {
        return;
      }

      const requestId = categoryBreakdownRequestIdRef.current + 1;
      categoryBreakdownRequestIdRef.current = requestId;
      categoryBreakdownInFlightKeyRef.current = requestKey;
      setCategoryBreakdown(null);
      setCategoryBreakdownLoading(true);
      try {
        const data = await api.getAnalyticsCategoryBreakdown({
          year: params.year,
          month: params.month,
          direction: params.direction,
        });
        if (requestId !== categoryBreakdownRequestIdRef.current) {
          return;
        }
        categoryBreakdownResolvedKeyRef.current = requestKey;
        setCategoryBreakdown(data);
      } catch (err) {
        if (requestId !== categoryBreakdownRequestIdRef.current) {
          return;
        }
        if (err instanceof ApiError && err.status === 409) {
          categoryBreakdownResolvedKeyRef.current = null;
          setCategoryBreakdown(null);
        } else if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error(site.common.unexpectedError);
        }
      } finally {
        if (requestId === categoryBreakdownRequestIdRef.current) {
          categoryBreakdownInFlightKeyRef.current = null;
          setCategoryBreakdownLoading(false);
        }
      }
    },
    [site.common.unexpectedError],
  );

  const loadBalance = useCallback(
    async (
      params?: { year?: number; month?: number },
      activeProfile?: UserProfile | null,
    ) => {
      const resolvedProfile = activeProfile ?? profileRef.current;
      const fallbackMonth = getCurrentMonthValue(
        resolvedProfile?.timezone ?? "UTC",
      );

      if (!resolvedProfile?.base_currency) {
        setSummary(null);
        categoryBreakdownResolvedKeyRef.current = null;
        categoryBreakdownInFlightKeyRef.current = null;
        setCategoryBreakdown(null);
        setCategoryBreakdownLoading(false);
        setSelectedMonth((currentValue) => currentValue || fallbackMonth);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await api.getAnalyticsSummary(params);
        setSummary(data);
        const resolvedMonthValue = data.current.month_start.slice(0, 7);
        setSelectedMonth(resolvedMonthValue);
        const resolvedMonth = parseMonthValue(resolvedMonthValue);
        if (resolvedMonth) {
          void loadCategoryBreakdown(
            {
              ...resolvedMonth,
              direction: categoryBreakdownDirectionRef.current,
            },
            resolvedProfile,
          );
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setSummary(null);
          categoryBreakdownResolvedKeyRef.current = null;
          categoryBreakdownInFlightKeyRef.current = null;
          setCategoryBreakdown(null);
          setCategoryBreakdownLoading(false);
          setSelectedMonth((currentValue) => currentValue || fallbackMonth);
        } else if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error(site.common.unexpectedError);
        }
      } finally {
        setLoading(false);
      }
    },
    [loadCategoryBreakdown, site.common.unexpectedError],
  );

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
      setCache(cacheKeys.categories, data);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(site.common.unexpectedError);
    } finally {
      setCategoriesReady(true);
    }
  }, [site.common.unexpectedError]);

  const refreshProfileFromOnboarding = useCallback(
    async (updatedProfile: UserProfile) => {
      setProfile(updatedProfile);
      await loadBalance(undefined, updatedProfile);
    },
    [loadBalance, setProfile],
  );

  const loadTransactionsPresence = useCallback(async () => {
    const freshTransactions = getFreshTransactionsCache();
    if (freshTransactions) {
      setHasTransactions((freshTransactions.total_count ?? 0) > 0);
      setTransactionsReady(true);
      return;
    }

    try {
      const data = await api.getTransactions({ limit: 1 });
      setHasTransactions((data.total_count ?? 0) > 0);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(site.common.unexpectedError);
    } finally {
      setTransactionsReady(true);
    }
  }, [site.common.unexpectedError]);

  const refreshSelectedMonth = useCallback(() => {
    if (!selectedMonth) {
      loadBalance();
      return;
    }

    const [year, month] = selectedMonth.split("-").map(Number);
    loadBalance(year && month ? { year, month } : undefined);
  }, [loadBalance, selectedMonth]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance, profileAnalyticsKey]);

  useEffect(() => {
    Promise.all([loadCategories(), loadTransactionsPresence()]);
  }, [loadCategories, loadTransactionsPresence]);

  useEffect(() => {
    return subscribeToCacheKeys(
      [cacheKeys.categories, cacheKeys.transactions],
      (changedKeys) => {
        if (changedKeys.includes(cacheKeys.categories)) {
          void loadCategories();
        }
        if (changedKeys.includes(cacheKeys.transactions)) {
          void loadTransactionsPresence();
          refreshSelectedMonth();
        }
      },
    );
  }, [loadCategories, loadTransactionsPresence, refreshSelectedMonth]);

  const current = summary?.current;
  const history = summary?.series ?? [];
  const recentTransactions = summary?.recent_transactions ?? [];
  const monthHeadingDate =
    current?.month_start ??
    `${selectedMonth || getCurrentMonthValue(profile?.timezone ?? "UTC")}-01`;
  const balanceCurrency = current?.currency ?? profile?.base_currency ?? "COP";
  const timeZone = profile?.timezone ?? "UTC";
  const totalSkippedTransactions = history.reduce(
    (total, item) => total + (item.skipped_transactions ?? 0),
    0,
  );
  const selectedMonthParts = parseMonthValue(selectedMonth);

  const handleCategoryBreakdownDirectionChange = useCallback(
    (direction: "expense" | "income") => {
      categoryBreakdownDirectionRef.current = direction;
      setCategoryBreakdownDirection(direction);
      if (!selectedMonthParts) {
        return;
      }
      void loadCategoryBreakdown({
        ...selectedMonthParts,
        direction,
      });
    },
    [loadCategoryBreakdown, selectedMonthParts],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
          <p className="mt-3 text-lg font-semibold text-foreground">
            {t.heading(
              formatMonthLabel(monthHeadingDate, site.metadata.htmlLang),
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.latestMonthHint}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <label className="px-2 text-sm font-medium" htmlFor="balance-month">
              {t.monthLabel}
            </label>
            <Input
              id="balance-month"
              type="month"
              value={selectedMonth}
              disabled={!hasBaseCurrency}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedMonth(value);
                const [year, month] = value.split("-").map(Number);
                if (year && month) {
                  loadBalance({ year, month });
                }
              }}
              className="w-44"
            />
          </div>
        </div>
      </div>

      {showOnboarding ? (
        <BalanceOnboardingCard
          profile={profile}
          categories={categories}
          hasBaseCurrency={hasBaseCurrency}
          hasTimeZone={hasTimeZone}
          hasTransactions={hasTransactions}
          baseCurrency={profile?.base_currency ?? null}
          timeZone={profile?.timezone ?? null}
          onProfileUpdated={refreshProfileFromOnboarding}
          onCategoryCreated={() => invalidateCacheKey(cacheKeys.categories)}
          onTransactionCreated={() =>
            invalidateCacheKey(cacheKeys.transactions)
          }
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            {t.heading(
              formatMonthLabel(monthHeadingDate, site.metadata.htmlLang),
            )}
          </CardTitle>
          <CardDescription>
            {hasBaseCurrency
              ? t.currentCardDescription(balanceCurrency)
              : t.currentCardPendingDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <BalanceStatCard
              label={site.common.income}
              value={formatMoney(
                current?.income ?? "0",
                balanceCurrency,
                displayLocale(site.metadata.htmlLang),
              )}
              tone="emerald"
            />
            <BalanceStatCard
              label={site.common.expense}
              value={formatMoney(
                current?.expense ?? "0",
                balanceCurrency,
                displayLocale(site.metadata.htmlLang),
              )}
              tone="rose"
            />
            <BalanceStatCard
              label={t.title}
              value={formatMoney(
                current?.balance ?? "0",
                balanceCurrency,
                displayLocale(site.metadata.htmlLang),
              )}
              tone="sky"
            />
          </div>
          {current &&
            current.income === "0.00" &&
            current.expense === "0.00" &&
            current.balance === "0.00" && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t.selectedMonthEmpty}
              </p>
            )}
          {(current?.skipped_transactions ?? 0) > 0 ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {t.selectedMonthSkippedNotice(
                current?.skipped_transactions ?? 0,
                balanceCurrency,
              )}
            </p>
          ) : null}

          <div className="mt-8 border-t pt-6">
            <CategoryBreakdownCard
              breakdown={categoryBreakdown}
              loading={categoryBreakdownLoading}
              direction={categoryBreakdownDirection}
              currency={categoryBreakdown?.currency ?? balanceCurrency}
              locale={displayLocale(site.metadata.htmlLang)}
              loadingLabel={site.common.loading}
              text={t}
              onDirectionChange={handleCategoryBreakdownDirectionChange}
              formatMoney={formatMoney}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.recentTransactionsTitle}</CardTitle>
          <CardDescription>{t.recentTransactionsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {site.common.loading}
            </p>
          ) : recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.recentTransactionsEmpty}
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <RecentTransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  locale={displayLocale(site.metadata.htmlLang)}
                  timeZone={timeZone}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.historyTitle}</CardTitle>
          <CardDescription>{t.historyDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
            <Table showMobileScrollHint>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>{t.monthLabel}</TableHead>
                  <TableHead>{site.common.income}</TableHead>
                  <TableHead>{site.common.expense}</TableHead>
                  <TableHead>{t.title}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {site.common.loading}
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {hasBaseCurrency ? t.noHistory : t.historyPending}
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow
                      key={item.month_start}
                      className="hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">
                        {formatMonthLabel(
                          item.month_start,
                          site.metadata.htmlLang,
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-emerald-700">
                        {formatMoney(
                          item.income,
                          item.currency ?? balanceCurrency,
                          displayLocale(site.metadata.htmlLang),
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-rose-700">
                        {formatMoney(
                          item.expense,
                          item.currency ?? balanceCurrency,
                          displayLocale(site.metadata.htmlLang),
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sky-700">
                        {formatMoney(
                          item.balance,
                          item.currency ?? balanceCurrency,
                          displayLocale(site.metadata.htmlLang),
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalSkippedTransactions > 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {t.historySkippedNotice(
                totalSkippedTransactions,
                balanceCurrency,
              )}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose" | "sky";
}) {
  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    sky: "border-sky-200 bg-sky-50 text-sky-900",
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function RecentTransactionItem({
  transaction,
  locale,
  timeZone,
}: {
  transaction: AnalyticsSummaryTransaction;
  locale: string;
  timeZone: string;
}) {
  const occurredAtFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
  const amountColorClass =
    transaction.direction === "income"
      ? "text-emerald-700"
      : transaction.direction === "expense"
        ? "text-rose-700"
        : "text-foreground";

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border bg-muted/20 px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <p className="font-medium text-foreground">
          {transaction.category_name}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {occurredAtFormatter.format(new Date(transaction.occurred_at))}
        </p>
        {transaction.description?.trim() ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {transaction.description}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        <p className={`font-semibold tabular-nums ${amountColorClass}`}>
          {formatMoney(transaction.amount, transaction.currency, locale)}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {transaction.currency}
        </p>
      </div>
    </div>
  );
}

function formatMoney(value: string, currency: string, locale: string) {
  return formatCurrencyAmount(value, currency, locale);
}

function formatMonthLabel(value: string, locale: string) {
  return (locale === "es" ? monthFormatters.es : monthFormatters.en).format(
    new Date(`${value}T00:00:00`),
  );
}

function displayLocale(language: string) {
  return language === "en" ? "en-US" : "es-CO";
}

function parseMonthValue(value: string) {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) {
    return null;
  }
  return { year, month };
}

function getProfileAnalyticsKey(profile: UserProfile | null) {
  if (!profile) {
    return "anonymous";
  }

  return [profile.id, profile.base_currency ?? "", profile.timezone ?? ""].join(
    ":",
  );
}

function getCategoryBreakdownRequestKey({
  baseCurrency,
  year,
  month,
  direction,
}: {
  baseCurrency: string;
  year: number;
  month: number;
  direction?: "expense" | "income";
}) {
  return [baseCurrency, year, month, direction ?? ""].join(":");
}

function getFreshCategoriesCache() {
  return getCache<Category[]>(cacheKeys.categories, {
    maxAgeMs: cacheTtls.categories,
  });
}

function getFreshTransactionsCache() {
  return getCache<TransactionsPageResponse>(cacheKeys.transactions, {
    maxAgeMs: cacheTtls.transactions,
  });
}
