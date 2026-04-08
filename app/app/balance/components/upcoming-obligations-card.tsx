"use client";

import Link from "next/link";

import { type UpcomingObligationsResponse } from "@/lib/api";
import { type SiteText } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type UpcomingObligationsCardProps = {
  upcoming: UpcomingObligationsResponse | null;
  loading: boolean;
  locale: string;
  loadingLabel: string;
  mainAccountLabel: string;
  timeZone: string;
  text: SiteText["pages"]["balance"];
  formatMoney: (value: string, currency: string, locale: string) => string;
};

const urgencyTone = {
  overdue: "border-rose-200 bg-rose-50 text-rose-800",
  today: "border-amber-200 bg-amber-50 text-amber-900",
  soon: "border-sky-200 bg-sky-50 text-sky-800",
  upcoming: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

export function UpcomingObligationsCard({
  upcoming,
  loading,
  locale,
  loadingLabel,
  mainAccountLabel,
  timeZone,
  text,
  formatMoney,
}: UpcomingObligationsCardProps) {
  const items = upcoming?.items ?? [];
  const summary = upcoming?.summary ?? null;
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{text.upcomingObligationsTitle}</CardTitle>
          <InfoHint
            title={text.upcomingObligationsHelpTitle}
            description={text.upcomingObligationsHelpDescription}
          />
        </div>
        <CardDescription>{text.upcomingObligationsDescription}</CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/obligations">{text.upcomingObligationsViewAll}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat
              label={text.upcomingObligationsSummaryTotal}
              value={formatMoney(
                summary.total_expected_amount,
                summary.currency,
                locale,
              )}
            />
            <SummaryStat
              label={text.upcomingObligationsSummaryUrgent}
              value={String(
                summary.overdue_count +
                  summary.due_today_count +
                  summary.due_soon_count,
              )}
            />
            <SummaryStat
              label={text.upcomingObligationsSummaryOverdue}
              value={String(summary.overdue_count)}
            />
            <SummaryStat
              label={text.upcomingObligationsSummaryRisk}
              value={String(summary.expected_account_risk_count)}
            />
          </div>
        ) : null}

        {loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {text.upcomingObligationsEmpty}
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-muted/20 px-4 py-3 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={urgencyTone[item.urgency]}
                      >
                        {resolveUrgencyLabel(item.urgency, text)}
                      </Badge>
                      <Badge variant="outline">{item.category_name}</Badge>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {text.upcomingObligationsDueDate(
                          dateFormatter.format(
                            new Date(`${item.next_due_date}T12:00:00Z`),
                          ),
                        )}
                      </p>
                    </div>
                    {item.expected_account_shortfall_amount ? (
                      <p className="text-sm text-amber-900">
                        {text.upcomingObligationsAccountRisk(
                          displayAccountName(
                            item.expected_financial_account_name,
                            mainAccountLabel,
                          ) ?? text.upcomingObligationsNoAccount,
                          formatMoney(
                            item.expected_account_shortfall_amount,
                            item.currency,
                            locale,
                          ),
                        )}
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-left md:text-right">
                    <p className="text-lg font-bold tabular-nums text-foreground">
                      {formatMoney(item.amount, item.currency, locale)}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {item.currency}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function displayAccountName(
  accountName: string | null | undefined,
  mainAccountLabel: string,
) {
  if (!accountName) {
    return null;
  }

  if (accountName === "Main account" || accountName === "Cuenta principal") {
    return mainAccountLabel;
  }

  return accountName;
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/10 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function resolveUrgencyLabel(
  urgency: "overdue" | "today" | "soon" | "upcoming",
  text: SiteText["pages"]["balance"],
) {
  if (urgency === "overdue") {
    return text.upcomingObligationsUrgencyOverdue;
  }
  if (urgency === "today") {
    return text.upcomingObligationsUrgencyToday;
  }
  if (urgency === "soon") {
    return text.upcomingObligationsUrgencySoon;
  }
  return text.upcomingObligationsUrgencyUpcoming;
}
