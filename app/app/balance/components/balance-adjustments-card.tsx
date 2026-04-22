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

type BalanceAdjustmentsCardProps = {
  adjustments: LedgerMovement[];
  deletingMovementId: string | null;
  loading: boolean;
  locale: string;
  onDeleteAdjustment: (movement: LedgerMovement) => void;
  site: SiteText;
  timeZone: string;
};

export function BalanceAdjustmentsCard({
  adjustments,
  deletingMovementId,
  loading,
  locale,
  onDeleteAdjustment,
  site,
  timeZone,
}: BalanceAdjustmentsCardProps) {
  const text = site.pages.balance;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{text.adjustmentsTitle}</CardTitle>
          <InfoHint
            title={text.adjustmentsHelpTitle}
            description={text.adjustmentsHelpDescription}
          />
        </div>
        <CardDescription>{text.adjustmentsDescription}</CardDescription>
      </CardHeader>

      <CardContent>
        {loading && adjustments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{site.common.loading}</p>
        ) : adjustments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{text.adjustmentsEmpty}</p>
        ) : (
          <div className="space-y-3">
            {adjustments.map((movement) => (
              <AdjustmentItem
                key={movement.id}
                deleting={deletingMovementId === movement.id}
                locale={locale}
                movement={movement}
                onDelete={() => onDeleteAdjustment(movement)}
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

function AdjustmentItem({
  deleting,
  locale,
  movement,
  onDelete,
  site,
  timeZone,
}: {
  deleting: boolean;
  locale: string;
  movement: LedgerMovement;
  onDelete: () => void;
  site: SiteText;
  timeZone: string;
}) {
  const balanceText = site.pages.balance;
  const occurredAtFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  });
  const isInflow = movement.balance_direction === "in";
  const signedAmount = `${isInflow ? "+" : "-"}${formatCurrencyAmount(
    movement.amount,
    movement.currency,
    locale,
  )}`;

  return (
    <div className="rounded-2xl border bg-muted/15 px-4 py-4 shadow-sm sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {resolveAdjustmentLabel(movement, balanceText)}
            </span>
            {movement.financial_account_name ? (
              <span className="text-sm text-muted-foreground">
                {movement.financial_account_name}
              </span>
            ) : null}
          </div>
          <p className="text-base font-semibold text-foreground">
            {movement.description?.trim() || balanceText.activityAdjustmentLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            {isInflow
              ? balanceText.activityIncomingLabel
              : balanceText.activityOutgoingLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            {occurredAtFormatter.format(new Date(movement.occurred_at))}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4 sm:min-w-34 sm:flex-col sm:items-end sm:justify-between">
          <div className="text-left sm:text-right">
            <p
              className={`font-semibold tabular-nums ${
                isInflow ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {signedAmount}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {movement.currency}
            </p>
          </div>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label={site.common.delete}
            title={site.common.delete}
            className="inline-flex h-9 w-9 items-center justify-center self-end rounded-full text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function resolveAdjustmentLabel(
  movement: LedgerMovement,
  text: SiteText["pages"]["balance"],
) {
  const description = movement.description?.trim().toLowerCase() ?? "";
  if (
    description.startsWith("saldo inicial:") ||
    description.startsWith("starting balance:")
  ) {
    return text.adjustmentTypeOpening;
  }
  if (
    description.startsWith("corregir diferencia:") ||
    description.startsWith("fix a difference:")
  ) {
    return text.adjustmentTypeCorrection;
  }
  return text.activityAdjustmentLabel;
}
