"use client";

import { useMemo } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import {
  type Category,
  type FinancialAccount,
  type Transaction,
} from "@/lib/api";
import { resolveFinancialAccountName } from "@/lib/financial-accounts";
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
  financialAccounts: FinancialAccount[];
  categories: Category[];
  rows: TransactionsMobileRow[];
  totalCount: number;
  listLoading: boolean;
  deletingId: string | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  formatAmount: (value: string, currency: string) => string;
  formatTime: (value: Date) => string;
  className?: string;
}

export function TransactionsMobileList({
  financialAccounts,
  categories,
  rows,
  totalCount,
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
  const showFinancialAccountNames = financialAccounts.length > 1;

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

  function getCategoryDirection(id: string | null) {
    return id ? (categoryMap.get(id)?.direction ?? null) : null;
  }

  function getFinancialAccountName(transaction: Transaction) {
    return resolveFinancialAccountName(
      financialAccounts,
      transaction.financial_account_id,
      site.common.mainFinancialAccount,
    );
  }

  function getTransactionType(transaction: Transaction) {
    return transaction.transaction_type ?? getCategoryDirection(transaction.category_id);
  }

  function getTransactionTypeLabel(transactionType: string | null | undefined) {
    if (transactionType === "income") return site.common.income;
    if (transactionType === "expense") return site.common.expense;
    if (!transactionType) return site.common.dash;
    return transactionType.charAt(0).toUpperCase() + transactionType.slice(1);
  }

  function getTransactionCategoryName(transaction: Transaction) {
    if (transaction.category_id) {
      return getCategoryName(transaction.category_id);
    }
    return getTransactionTypeLabel(transaction.transaction_type);
  }

  function getTransactionDescription(transaction: Transaction) {
    const description = transaction.description?.trim();
    return description?.length ? description : null;
  }

  function renderDirectionBadge(transactionType: string | null | undefined) {
    if (transactionType === "income") {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
          {site.common.income}
        </Badge>
      );
    }

    if (transactionType === "expense") {
      return (
        <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
          {site.common.expense}
        </Badge>
      );
    }

    if (!transactionType) {
      return (
        <span className="text-sm text-muted-foreground">{site.common.dash}</span>
      );
    }

    return <Badge variant="secondary">{getTransactionTypeLabel(transactionType)}</Badge>;
  }

  function getAmountClassName(transactionType: string | null | undefined) {
    return cn(
      "font-medium tabular-nums whitespace-nowrap",
      transactionType === "income" && "text-emerald-700 dark:text-emerald-300",
      transactionType === "expense" && "text-rose-700 dark:text-rose-300",
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {listLoading && totalCount === 0 ? (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-muted-foreground shadow-sm">
          {t.loading}
        </div>
      ) : totalCount === 0 ? (
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
          const transactionType = getTransactionType(transaction);
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
                    {getTransactionCategoryName(transaction)}
                  </p>
                  {showFinancialAccountNames ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getFinancialAccountName(transaction) ?? site.common.dash}
                    </p>
                  ) : null}
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "text-base font-semibold",
                      getAmountClassName(transactionType),
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
                <div className="min-w-0">
                  {renderDirectionBadge(transactionType)}
                </div>
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
