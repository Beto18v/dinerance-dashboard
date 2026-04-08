"use client";

import { type CashflowForecast, type ForecastWindow } from "@/lib/api";
import { type SiteText } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { InfoHint } from "@/components/ui/info-hint";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FutureCashCardProps = {
  forecast: CashflowForecast | null;
  loading: boolean;
  locale: string;
  loadingLabel: string;
  showHeader?: boolean;
  timeZone: string;
  text: SiteText["pages"]["balance"];
  formatMoney: (value: string, currency: string, locale: string) => string;
};

const statusTone = {
  covered: "border-emerald-200 bg-emerald-50 text-emerald-800",
  tight: "border-amber-200 bg-amber-50 text-amber-900",
  shortfall: "border-rose-200 bg-rose-50 text-rose-800",
} as const;

export function FutureCashCard({
  forecast,
  loading,
  locale,
  loadingLabel,
  showHeader = true,
  timeZone,
  text,
  formatMoney,
}: FutureCashCardProps) {
  const safeToSpend = forecast?.safe_to_spend ?? null;
  const horizons = forecast?.horizons ?? [];
  const forecastCurrency = forecast?.currency ?? safeToSpend?.currency ?? "COP";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  });

  return (
    <Card>
      {showHeader ? (
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <CardTitle>{text.futureCashTitle}</CardTitle>
            <InfoHint
              title={text.futureCashHelpTitle}
              description={text.futureCashHelpDescription}
            />
          </div>
          <CardDescription>{text.futureCashDescription}</CardDescription>
        </CardHeader>
      ) : null}
      <CardContent className="space-y-4">
        {loading && !forecast ? (
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        ) : safeToSpend ? (
          <>
            <div className="rounded-2xl border bg-muted/15 p-5 shadow-sm">
              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={statusTone[safeToSpend.status]}
                    >
                      {resolveStatusLabel(safeToSpend.status, text)}
                    </Badge>
                    <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {text.futureCashHorizonLabel(safeToSpend.horizon_days)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {text.futureCashSafeToSpendTitle}
                    </p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
                      {formatMoney(
                        safeToSpend.safe_to_spend,
                        safeToSpend.currency,
                        locale,
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {text.futureCashSafeToSpendDescription(
                      formatMoney(
                        safeToSpend.current_balance,
                        safeToSpend.currency,
                        locale,
                      ),
                      formatMoney(
                        safeToSpend.confirmed_obligations_total,
                        safeToSpend.currency,
                        locale,
                      ),
                      dateFormatter.format(
                        new Date(`${safeToSpend.window_end_date}T12:00:00Z`),
                      ),
                    )}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <SummaryMetric
                    label={text.futureCashCurrentBalanceLabel}
                    helpTitle={text.futureCashCurrentBalanceHelpTitle}
                    helpDescription={text.futureCashCurrentBalanceHelpDescription}
                    value={formatMoney(
                      safeToSpend.current_balance,
                      safeToSpend.currency,
                      locale,
                    )}
                  />
                  <SummaryMetric
                    label={text.futureCashCommittedLabel}
                    helpTitle={text.futureCashCommittedHelpTitle}
                    helpDescription={text.futureCashCommittedHelpDescription}
                    value={formatMoney(
                      safeToSpend.confirmed_obligations_total,
                      safeToSpend.currency,
                      locale,
                    )}
                  />
                  <SummaryMetric
                    label={text.futureCashPerDayLabel}
                    helpTitle={text.futureCashPerDayHelpTitle}
                    helpDescription={text.futureCashPerDayHelpDescription}
                    value={formatMoney(
                      safeToSpend.safe_to_spend_per_day,
                      safeToSpend.currency,
                      locale,
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-3">
              {horizons.map((window) => (
                <ForecastWindowCard
                  currency={forecastCurrency}
                  key={window.horizon_days}
                  formatMoney={formatMoney}
                  locale={locale}
                  text={text}
                  timeZone={timeZone}
                  window={window}
                />
              ))}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ForecastWindowCard({
  currency,
  formatMoney,
  locale,
  text,
  timeZone,
  window,
}: {
  currency: string;
  formatMoney: (value: string, currency: string, locale: string) => string;
  locale: string;
  text: SiteText["pages"]["balance"];
  timeZone: string;
  window: ForecastWindow;
}) {
  const projectedTone =
    window.status === "shortfall" ? "text-rose-700" : "text-foreground";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  });

  return (
    <div className="rounded-2xl border bg-muted/10 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{text.futureCashHorizonLabel(window.horizon_days)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {text.futureCashWindowEndLabel(
              dateFormatter.format(new Date(`${window.window_end_date}T12:00:00Z`)),
            )}
          </p>
        </div>
        <Badge variant="outline" className={statusTone[window.status]}>
          {resolveStatusLabel(window.status, text)}
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {text.futureCashProjectedBalanceLabel}
            </p>
            <InfoHint
              title={text.futureCashProjectedBalanceHelpTitle}
              description={text.futureCashProjectedBalanceHelpDescription}
              buttonClassName="h-5 w-5 text-muted-foreground/80 transition-colors hover:text-foreground"
              panelClassName="top-full border bg-popover text-popover-foreground"
              align="right"
            />
          </div>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${projectedTone}`}>
            {formatMoney(window.projected_balance, currency, locale)}
          </p>
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p>
            {text.futureCashCommittedLine(
              formatMoney(window.confirmed_obligations_total, currency, locale),
            )}
          </p>
          <p>
            {text.futureCashSafeLine(
              formatMoney(window.safe_to_spend, currency, locale),
            )}
          </p>
          <p>{text.futureCashScheduledPaymentsLabel(window.scheduled_payments_count)}</p>
          {window.shortfall_amount !== "0.00" ? (
            <p className="text-rose-700">
              {text.futureCashShortfallLine(
                formatMoney(window.shortfall_amount, currency, locale),
              )}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  helpTitle,
  helpDescription,
}: {
  label: string;
  value: string;
  helpTitle: string;
  helpDescription: string;
}) {
  return (
    <div className="rounded-xl border bg-background/70 px-4 py-3">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        <InfoHint
          title={helpTitle}
          description={helpDescription}
          buttonClassName="h-5 w-5 text-muted-foreground/80 transition-colors hover:text-foreground"
          panelClassName="top-full border bg-popover text-popover-foreground"
          align="right"
        />
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function resolveStatusLabel(
  status: ForecastWindow["status"],
  text: SiteText["pages"]["balance"],
) {
  if (status === "covered") {
    return text.futureCashStatusCovered;
  }
  if (status === "tight") {
    return text.futureCashStatusTight;
  }
  return text.futureCashStatusShortfall;
}
