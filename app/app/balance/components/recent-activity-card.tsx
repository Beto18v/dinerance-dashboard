"use client";

import { FiTrash2 } from "react-icons/fi";

import { type LedgerMovement } from "@/lib/api";
import { formatCurrencyAmount } from "@/lib/finance";
import { type SiteText } from "@/lib/site";
import { InfoHint } from "@/components/ui/info-hint";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RecentActivityCardProps = {
  activity: LedgerMovement[];
  activityScopeLabel: string;
  balanceCurrency: string;
  deletingMovementId: string | null;
  loading: boolean;
  locale: string;
  onDeleteMovement: (movement: LedgerMovement) => void;
  site: SiteText;
  timeZone: string;
};

export function RecentActivityCard({
  activity,
  activityScopeLabel,
  balanceCurrency,
  deletingMovementId,
  loading,
  locale,
  onDeleteMovement,
  site,
  timeZone,
}: RecentActivityCardProps) {
  const text = site.pages.balance;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{text.recentActivityTitle}</CardTitle>
          <InfoHint
            title={text.recentActivityHelpTitle}
            description={text.recentActivityHelpDescription}
          />
        </div>
        <CardDescription>
          {text.recentActivityDescription} {activityScopeLabel}.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading && activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">{site.common.loading}</p>
        ) : activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {text.recentActivityEmpty}
          </p>
        ) : (
          <div className="space-y-3">
            {activity.map((movement) => (
              <ActivityItem
                key={movement.id}
                balanceCurrency={balanceCurrency}
                deleting={deletingMovementId === movement.id}
                locale={locale}
                movement={movement}
                onDelete={
                  movement.transaction_type === "transfer" ||
                  movement.transaction_type === "adjustment"
                    ? () => onDeleteMovement(movement)
                    : undefined
                }
                site={site}
                timeZone={timeZone}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  balanceCurrency,
  deleting,
  locale,
  movement,
  onDelete,
  site,
  timeZone,
}: {
  balanceCurrency: string;
  deleting: boolean;
  locale: string;
  movement: LedgerMovement;
  onDelete?: () => void;
  site: SiteText;
  timeZone: string;
}) {
  const occurredAtFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
  const isInflow = movement.balance_direction === "in";
  const amountColorClass = isInflow ? "text-emerald-700" : "text-rose-700";
  const signedAmount = `${isInflow ? "+" : "-"}${formatMoney(
    movement.amount,
    movement.currency || balanceCurrency,
    locale,
  )}`;

  return (
    <div className="rounded-2xl border bg-muted/15 px-4 py-4 shadow-sm sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {resolveMovementLabel(movement, site)}
            </span>
            {movement.financial_account_name ? (
              <span className="text-sm text-muted-foreground">
                {movement.financial_account_name}
              </span>
            ) : null}
          </div>
          <p className="text-base font-semibold text-foreground">
            {movement.description?.trim() ||
              movement.category_name ||
              resolveMovementLabel(movement, site)}
          </p>
          <p className="text-sm text-muted-foreground">
            {buildMovementMeta(movement, site)}
          </p>
          <p className="text-sm text-muted-foreground">
            {occurredAtFormatter.format(new Date(movement.occurred_at))}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4 sm:min-w-34 sm:flex-col sm:items-end sm:justify-between">
          <div className="text-left sm:text-right">
            <p className={`font-semibold tabular-nums ${amountColorClass}`}>
              {signedAmount}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {movement.currency || balanceCurrency}
            </p>
          </div>

          {onDelete ? (
            <DeleteMovementButton
              deleting={deleting}
              label={site.common.delete}
              onDelete={onDelete}
            />
          ) : (
            <div className="hidden h-9 w-9 sm:block" />
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteMovementButton({
  deleting,
  label,
  onDelete,
}: {
  deleting: boolean;
  label: string;
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={deleting}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center self-end rounded-full text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <FiTrash2 size={16} />
    </button>
  );
}

function resolveMovementLabel(movement: LedgerMovement, site: SiteText) {
  if (movement.transaction_type === "transfer") {
    return site.pages.balance.activityTransferLabel;
  }
  if (movement.transaction_type === "adjustment") {
    return site.pages.balance.activityAdjustmentLabel;
  }
  if (movement.transaction_type === "income") {
    return site.common.income;
  }
  return site.common.expense;
}

function buildMovementMeta(movement: LedgerMovement, site: SiteText) {
  if (
    movement.transaction_type === "transfer" &&
    movement.counterparty_financial_account_name
  ) {
    return movement.balance_direction === "in"
      ? `${site.pages.balance.activityIncomingLabel} ${movement.counterparty_financial_account_name}`
      : `${site.pages.balance.activityOutgoingLabel} ${movement.counterparty_financial_account_name}`;
  }

  if (movement.transaction_type === "adjustment") {
    return movement.balance_direction === "in"
      ? site.pages.balance.activityIncomingLabel
      : site.pages.balance.activityOutgoingLabel;
  }

  return movement.category_name || resolveMovementLabel(movement, site);
}

function formatMoney(value: string, currency: string, locale: string) {
  return formatCurrencyAmount(value, currency, locale);
}
