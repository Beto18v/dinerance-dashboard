"use client";

import { useMemo } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import { type Category, type Transaction } from "@/lib/api";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TransactionsMobileRow =
  | { type: "separator"; key: string; label: string }
  | {
      type: "transaction";
      key: string;
      transaction: Transaction;
      occurredAt: Date;
    };

interface TransactionsMobileListProps {
  categories: Category[];
  rows: TransactionsMobileRow[];
  transactionsCount: number;
  listLoading: boolean;
  deletingId: string | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  formatAmount: (value: string, currency: string) => string;
  formatTime: (value: Date) => string;
  className?: string;
}

export function TransactionsMobileList({
  categories,
  rows,
  transactionsCount,
  listLoading,
  deletingId,
  onEdit,
  onDelete,
  formatAmount,
  formatTime,
  className,
}: TransactionsMobileListProps) {
  const { site } = useSitePreferences();
  const t = site.pages.transactions;

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();

    for (const category of categories) {
      map.set(category.id, category);
    }

    return map;
  }, [categories]);

  function getCategoryName(id: string) {
    return categoryMap.get(id)?.name ?? id;
  }

  function getCategoryDirection(id: string) {
    return categoryMap.get(id)?.direction ?? null;
  }

  function getTransactionDescription(transaction: Transaction) {
    const description = transaction.description?.trim();
    return description?.length ? description : null;
  }

  function renderDirectionBadge(direction: Category["direction"] | null) {
    if (direction === "income") {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
          {site.common.income}
        </Badge>
      );
    }

    if (direction === "expense") {
      return (
        <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
          {site.common.expense}
        </Badge>
      );
    }

    return (
      <span className="text-sm text-muted-foreground">{site.common.dash}</span>
    );
  }

  function getAmountClassName(direction: Category["direction"] | null) {
    return cn(
      "font-medium tabular-nums whitespace-nowrap",
      direction === "income" && "text-emerald-700 dark:text-emerald-300",
      direction === "expense" && "text-rose-700 dark:text-rose-300",
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {listLoading && transactionsCount === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-muted-foreground shadow-sm">
          {t.loading}
        </div>
      ) : transactionsCount === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-muted-foreground shadow-sm">
          {t.empty}
        </div>
      ) : (
        rows.map((row) => {
          if (row.type === "separator") {
            return (
              <div
                key={row.key}
                className="rounded-lg border bg-muted/15 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm"
              >
                {row.label}
              </div>
            );
          }

          const transaction = row.transaction;
          const direction = getCategoryDirection(transaction.category_id);
          const description = getTransactionDescription(transaction);

          return (
            <div
              key={row.key}
              className="rounded-lg border bg-card px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <time
                    dateTime={transaction.occurred_at}
                    className="block text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    {formatTime(row.occurredAt)}
                  </time>
                  <p className="mt-1 wrap-break-word font-semibold">
                    {getCategoryName(transaction.category_id)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "text-base font-semibold",
                      getAmountClassName(direction),
                    )}
                  >
                    {formatAmount(transaction.amount, transaction.currency)}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {transaction.currency}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">{renderDirectionBadge(direction)}</div>
                <div className="flex shrink-0 justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(transaction)}
                    className="rounded p-1.5 text-cyan-600 transition-colors hover:bg-cyan-500/10 hover:text-cyan-500 dark:text-cyan-300 dark:hover:bg-cyan-400/10 dark:hover:text-cyan-200"
                    title={site.common.edit}
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(transaction)}
                    disabled={deletingId === transaction.id}
                    className="rounded p-1.5 text-rose-600 transition-colors hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-40 dark:text-rose-300 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                    title={site.common.delete}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>

              {description ? (
                <div className="mt-3 border-t pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {site.common.description}
                  </p>
                  <p className="mt-1 wrap-break-word text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}
