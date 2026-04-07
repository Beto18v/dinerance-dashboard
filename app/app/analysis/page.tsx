"use client";

import { formatCurrencyAmount } from "@/lib/finance";
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
