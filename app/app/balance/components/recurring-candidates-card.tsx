"use client";

import Link from "next/link";
import { type AnalyticsRecurringCandidates } from "@/lib/api";
import { type SiteText } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RecurringCandidatesCardProps = {
  candidates: AnalyticsRecurringCandidates | null;
  loading: boolean;
  locale: string;
  loadingLabel: string;
  text: SiteText["pages"]["balance"];
  formatMoney: (value: string, currency: string, locale: string) => string;
  timeZone: string;
  compact?: boolean;
  maxItems?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
};

const cadenceBadgeTone = {
  monthly: "border-sky-200 bg-sky-50 text-sky-800",
  biweekly: "border-amber-200 bg-amber-50 text-amber-800",
  weekly: "border-emerald-200 bg-emerald-50 text-emerald-800",
} as const;

const directionBadgeTone = {
  income: "border-emerald-200 bg-emerald-50 text-emerald-800",
  expense: "border-rose-200 bg-rose-50 text-rose-800",
} as const;

export function RecurringCandidatesCard({
  candidates,
  loading,
  locale,
  loadingLabel,
  text,
  formatMoney,
  timeZone,
  compact = false,
  maxItems,
  viewAllHref,
  viewAllLabel,
}: RecurringCandidatesCardProps) {
  const items = (candidates?.candidates ?? []).slice(0, maxItems);
  const totalItems = candidates?.candidates.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{text.recurringCandidatesTitle}</CardTitle>
        <CardDescription>{text.recurringCandidatesDescription}</CardDescription>
        {viewAllHref && viewAllLabel && totalItems > 0 ? (
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href={viewAllHref}>{viewAllLabel}</Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {loading && items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {text.recurringCandidatesEmpty}
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((candidate) => {
              const lastSeenFormatter = new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeZone,
              });
              const formattedTypicalAmount = formatMoney(
                candidate.typical_amount,
                candidate.currency,
                locale,
              );
              const formattedMinAmount = formatMoney(
                candidate.amount_min,
                candidate.currency,
                locale,
              );
              const formattedMaxAmount = formatMoney(
                candidate.amount_max,
                candidate.currency,
                locale,
              );

              return (
                <div
                  key={`${candidate.category_id}-${candidate.label}-${candidate.last_occurred_at}`}
                  className={`rounded-xl border bg-muted/20 shadow-sm ${
                    compact ? "px-4 py-3" : "px-4 py-4"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cadenceBadgeTone[candidate.cadence]}
                        >
                          {resolveCadenceLabel(candidate.cadence, text)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={directionBadgeTone[candidate.direction]}
                        >
                          {candidate.direction === "income"
                            ? text.recurringCandidatesIncome
                            : text.recurringCandidatesExpense}
                        </Badge>
                        <Badge variant="outline">
                          {text.recurringCandidatesOccurrences(
                            candidate.occurrence_count,
                          )}
                        </Badge>
                      </div>

                      <div>
                        <p className="font-semibold text-foreground">
                          {candidate.label}
                        </p>
                        {compact ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {resolveCadenceLabel(candidate.cadence, text)} |{" "}
                            {candidate.category_name} |{" "}
                            {text.recurringCandidatesOccurrences(
                              candidate.occurrence_count,
                            )}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {candidate.description &&
                            candidate.description !== candidate.category_name
                              ? text.recurringCandidatesCategoryHint(
                                  candidate.category_name,
                                )
                              : candidate.category_name}
                          </p>
                        )}
                      </div>

                      {compact ? (
                        <p className="text-sm text-muted-foreground">
                          {text.recurringCandidatesCompactLine(
                            lastSeenFormatter.format(
                              new Date(candidate.last_occurred_at),
                            ),
                          )}
                        </p>
                      ) : (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            {candidate.match_basis === "description"
                              ? text.recurringCandidatesMatchDescription(
                                  candidate.occurrence_count,
                                )
                              : text.recurringCandidatesMatchCategoryAmount(
                                  candidate.occurrence_count,
                                )}
                          </p>
                          <p>
                            {text.recurringCandidatesIntervals(
                              candidate.interval_days,
                            )}
                          </p>
                          <p>
                            {candidate.amount_pattern === "exact"
                              ? text.recurringCandidatesAmountExact(
                                  formattedTypicalAmount,
                                )
                              : text.recurringCandidatesAmountStable(
                                  formattedMinAmount,
                                  formattedMaxAmount,
                                )}
                          </p>
                          <p>
                            {text.recurringCandidatesLastSeen(
                              lastSeenFormatter.format(
                                new Date(candidate.last_occurred_at),
                              ),
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-left md:text-right">
                      <p className="text-lg font-bold tabular-nums text-foreground">
                        {formattedTypicalAmount}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        {candidate.currency}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function resolveCadenceLabel(
  cadence: "weekly" | "biweekly" | "monthly",
  text: SiteText["pages"]["balance"],
) {
  if (cadence === "monthly") {
    return text.recurringCandidatesMonthly;
  }
  if (cadence === "biweekly") {
    return text.recurringCandidatesBiweekly;
  }
  return text.recurringCandidatesWeekly;
}
