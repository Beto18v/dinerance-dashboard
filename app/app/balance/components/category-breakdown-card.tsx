"use client";

import { type AnalyticsCategoryBreakdown } from "@/lib/api";
import { type SiteText } from "@/lib/site";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BreakdownDirection = "expense" | "income";

type CategoryBreakdownCardProps = {
  breakdown: AnalyticsCategoryBreakdown | null;
  loading: boolean;
  direction: BreakdownDirection;
  currency: string;
  locale: string;
  loadingLabel: string;
  text: SiteText["pages"]["balance"];
  onDirectionChange: (direction: BreakdownDirection) => void;
  formatMoney: (value: string, currency: string, locale: string) => string;
};

export function CategoryBreakdownCard({
  breakdown,
  loading,
  direction,
  currency,
  locale,
  loadingLabel,
  text,
  onDirectionChange,
  formatMoney,
}: CategoryBreakdownCardProps) {
  const tone =
    direction === "expense"
      ? {
          surface: "border-rose-200 bg-rose-50 text-rose-900",
          label: "text-rose-800",
          meta: "text-rose-800/70",
          text: "text-rose-700",
          bar: "bg-rose-500",
        }
      : {
          surface: "border-emerald-200 bg-emerald-50 text-emerald-900",
          label: "text-emerald-800",
          meta: "text-emerald-800/70",
          text: "text-emerald-700",
          bar: "bg-emerald-500",
        };
  const totalLabel =
    direction === "expense"
      ? text.categoryBreakdownExpenseTotal
      : text.categoryBreakdownIncomeTotal;
  const emptyLabel =
    direction === "expense"
      ? text.categoryBreakdownEmptyExpense
      : text.categoryBreakdownEmptyIncome;
  const categoriesCount = breakdown?.breakdown.length ?? 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {text.categoryBreakdownTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {text.categoryBreakdownDescription}
          </p>
        </div>

        <Tabs
          value={direction}
          onValueChange={(value) => {
            if (value === "expense" || value === "income") {
              onDirectionChange(value);
            }
          }}
          className="w-fit"
          >
            <TabsList>
              <TabsTrigger value="income">
                {text.categoryBreakdownIncomeTab}
              </TabsTrigger>
              <TabsTrigger value="expense">
                {text.categoryBreakdownExpenseTab}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

      <div className="space-y-4">
        <div className={`rounded-xl border px-5 py-4 shadow-sm ${tone.surface}`}>
          <p className={`text-sm font-medium ${tone.label}`}>{totalLabel}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums md:text-4xl">
            {formatMoney(breakdown?.total ?? "0", currency, locale)}
          </p>
          <p className={`mt-2 text-sm ${tone.meta}`}>
            {categoriesCount > 0
              ? text.categoryBreakdownCategoriesCount(categoriesCount)
              : emptyLabel}
          </p>
        </div>

        {(breakdown?.skipped_transactions ?? 0) > 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {text.categoryBreakdownSkippedNotice(
              breakdown?.skipped_transactions ?? 0,
              currency,
            )}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        ) : !breakdown || breakdown.breakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="space-y-3">
            {breakdown.breakdown.map((item) => {
              const rawPercentage = Number(item.percentage) || 0;
              const barWidth =
                rawPercentage > 0 ? Math.max(rawPercentage, 6) : 0;

              return (
                <div
                  key={item.category_id}
                  className="rounded-xl border bg-muted/20 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {item.category_name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPercentage(item.percentage, locale)} |{" "}
                        {text.categoryBreakdownTransactionsCount(
                          item.transaction_count,
                        )}
                      </p>
                    </div>

                    <p
                      className={`shrink-0 text-base font-bold tabular-nums md:text-lg ${tone.text}`}
                    >
                      {formatMoney(item.amount, currency, locale)}
                    </p>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-[width] ${tone.bar}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function formatPercentage(value: string, locale: string) {
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatter.format(Number(value) || 0)}%`;
}
