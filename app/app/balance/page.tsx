"use client";

import { type AnalyticsSummaryTransaction } from "@/lib/api";
import { invalidateCacheKey, cacheKeys } from "@/lib/cache";
import { formatCurrencyAmount } from "@/lib/finance";
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
import { AnalyticsFiltersBar } from "../components/analytics-filters-bar";
import { useBalancePageState } from "./use-balance-page-state";
import { BalanceOnboardingCard } from "./components/balance-onboarding-card";

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
  const {
    balanceCurrency,
    categories,
    current,
    financialAccounts,
    handleSelectedFinancialAccountChange,
    handleSelectedMonthChange,
    hasBaseCurrency,
    hasMultipleFinancialAccounts,
    hasTimeZone,
    hasTransactions,
    history,
    loading,
    monthHeadingDate,
    profile,
    recentTransactions,
    refreshProfileFromOnboarding,
    resolveRecentTransactionAccountName,
    selectedFinancialAccountId,
    selectedFinancialAccountName,
    selectedMonth,
    showOnboarding,
    site,
    timeZone,
    totalSkippedTransactions,
  } = useBalancePageState({
    includeCategoryBreakdown: false,
    includeRecurringCandidates: false,
  });
  const t = site.pages.balance;

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

        <AnalyticsFiltersBar
          accountLabel={t.accountLabel}
          allAccountsLabel={t.allAccountsLabel}
          monthLabel={t.monthLabel}
          hasBaseCurrency={hasBaseCurrency}
          hasMultipleFinancialAccounts={hasMultipleFinancialAccounts}
          financialAccounts={financialAccounts}
          selectedFinancialAccountId={selectedFinancialAccountId}
          selectedMonth={selectedMonth}
          mainFinancialAccountLabel={site.common.mainFinancialAccount}
          onSelectedFinancialAccountChange={handleSelectedFinancialAccountChange}
          onSelectedMonthChange={handleSelectedMonthChange}
        />
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
          onTransactionCreated={() => invalidateCacheKey(cacheKeys.transactions)}
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
              ? t.currentCardDescription(
                  balanceCurrency,
                  selectedFinancialAccountName,
                )
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
                  accountName={resolveRecentTransactionAccountName(transaction)}
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
  accountName,
  locale,
  timeZone,
}: {
  transaction: AnalyticsSummaryTransaction;
  accountName?: string | null;
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
        {accountName ? (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {accountName}
          </p>
        ) : null}
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
