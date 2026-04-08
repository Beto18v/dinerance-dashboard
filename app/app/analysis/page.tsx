"use client";

import Link from "next/link";

import { type AnalyticsRecurringCandidate } from "@/lib/api";
import { formatCurrencyAmount } from "@/lib/finance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import { AnalyticsFiltersBar } from "../components/analytics-filters-bar";
import { useBalancePageState } from "../balance/use-balance-page-state";
import { CategoryBreakdownCard } from "../balance/components/category-breakdown-card";
import { RecurringCandidatesCard } from "../balance/components/recurring-candidates-card";

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

export default function AnalysisPage() {
  const {
    balanceCurrency,
    categoryBreakdown,
    categoryBreakdownDirection,
    categoryBreakdownLoading,
    financialAccounts,
    handleCategoryBreakdownDirectionChange,
    handleSelectedFinancialAccountChange,
    handleSelectedMonthChange,
    hasBaseCurrency,
    hasMultipleFinancialAccounts,
    monthHeadingDate,
    recurringCandidates,
    recurringCandidatesLoading,
    selectedFinancialAccountId,
    selectedMonth,
    site,
    timeZone,
  } = useBalancePageState({
    includeCategoryBreakdown: true,
    includeRecurringCandidates: true,
  });

  const analysisText = site.pages.analysis;
  const balanceText = site.pages.balance;
  const locale = displayLocale(site.metadata.htmlLang);
  const hasRecurringCandidates =
    (recurringCandidates?.candidates.length ?? 0) > 0;

  function renderRecurringCandidateAction(candidate: AnalyticsRecurringCandidate) {
    if (candidate.direction !== "expense") {
      return null;
    }

    if (candidate.confirmed_obligation_id) {
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
        >
          {balanceText.recurringCandidatesConfirmed}
        </Badge>
      );
    }

    return (
      <Button asChild variant="outline" size="sm">
        <Link
          href={buildCandidateObligationHref({
            categoryId: candidate.category_id,
            name: candidate.label,
            amount: candidate.typical_amount,
            cadence: candidate.cadence,
            lastOccurredAt: candidate.last_occurred_at,
            recurringCandidateKey: candidate.recurring_candidate_key,
            expectedFinancialAccountId: selectedFinancialAccountId || null,
            timeZone,
          })}
        >
          {site.pages.obligations.createFromCandidate}
        </Link>
      </Button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{analysisText.title}</h1>
            <InfoHint
              title={analysisText.analysisHelpTitle}
              description={analysisText.analysisHelpDescription}
            />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {analysisText.subtitle}
          </p>
          <p className="mt-3 text-lg font-semibold text-foreground">
            {analysisText.heading(
              formatMonthLabel(monthHeadingDate, site.metadata.htmlLang),
            )}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {analysisText.latestMonthHint}
          </p>
        </div>

        <AnalyticsFiltersBar
          accountLabel={analysisText.accountLabel}
          allAccountsLabel={analysisText.allAccountsLabel}
          monthLabel={analysisText.monthLabel}
          hasBaseCurrency={hasBaseCurrency}
          hasMultipleFinancialAccounts={hasMultipleFinancialAccounts}
          financialAccounts={financialAccounts}
          selectedFinancialAccountId={selectedFinancialAccountId}
          selectedMonth={selectedMonth}
          mainFinancialAccountLabel={site.common.mainFinancialAccount}
          onSelectedFinancialAccountChange={
            handleSelectedFinancialAccountChange
          }
          onSelectedMonthChange={handleSelectedMonthChange}
        />
      </div>

      <CategoryBreakdownCard
        breakdown={categoryBreakdown}
        loading={categoryBreakdownLoading}
        direction={categoryBreakdownDirection}
        currency={categoryBreakdown?.currency ?? balanceCurrency}
        locale={locale}
        loadingLabel={site.common.loading}
        text={balanceText}
        onDirectionChange={handleCategoryBreakdownDirectionChange}
        formatMoney={formatMoney}
      />

      {hasRecurringCandidates ? (
        <RecurringCandidatesCard
          candidates={recurringCandidates}
          loading={recurringCandidatesLoading}
          locale={locale}
          loadingLabel={site.common.loading}
          text={balanceText}
          formatMoney={formatMoney}
          timeZone={timeZone}
          renderAction={renderRecurringCandidateAction}
        />
      ) : null}
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

function buildCandidateObligationHref({
  categoryId,
  name,
  amount,
  cadence,
  lastOccurredAt,
  recurringCandidateKey,
  expectedFinancialAccountId,
  timeZone,
}: {
  categoryId: string;
  name: string;
  amount: string;
  cadence: "weekly" | "biweekly" | "monthly";
  lastOccurredAt: string;
  recurringCandidateKey: string;
  expectedFinancialAccountId: string | null;
  timeZone: string;
}) {
  const params = new URLSearchParams({
    prefill_name: name,
    prefill_amount: amount,
    prefill_cadence: cadence,
    prefill_next_due_date: resolveNextDueDate(lastOccurredAt, cadence, timeZone),
    prefill_category_id: categoryId,
    prefill_recurring_candidate_key: recurringCandidateKey,
  });

  if (expectedFinancialAccountId) {
    params.set(
      "prefill_expected_financial_account_id",
      expectedFinancialAccountId,
    );
  }

  return `/app/obligations?${params.toString()}`;
}

function resolveNextDueDate(
  lastOccurredAt: string,
  cadence: "weekly" | "biweekly" | "monthly",
  timeZone: string,
) {
  const lastDate = extractLocalDate(lastOccurredAt, timeZone);

  if (cadence === "weekly") {
    return addDays(lastDate, 7).toISOString().slice(0, 10);
  }
  if (cadence === "biweekly") {
    return addDays(lastDate, 14).toISOString().slice(0, 10);
  }

  const nextMonth = new Date(
    Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth() + 1, 1),
  );
  const lastDayOfNextMonth = new Date(
    Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const anchorDay = Math.min(lastDate.getUTCDate(), lastDayOfNextMonth);
  return new Date(
    Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), anchorDay),
  )
    .toISOString()
    .slice(0, 10);
}

function extractLocalDate(value: string, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(value));
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "1970");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "1");
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(value: Date, amount: number) {
  const nextDate = new Date(value.getTime());
  nextDate.setUTCDate(nextDate.getUTCDate() + amount);
  return nextDate;
}
