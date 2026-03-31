"use client";

import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import {
  type Category,
  type FinancialAccount,
  type Transaction,
} from "@/lib/api";
import { resolveFinancialAccountName } from "@/lib/financial-accounts";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { cn } from "@/lib/utils";
import { getPaginationSummary } from "@/lib/pagination";
import { Badge } from "@/components/ui/badge";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionsMobileList } from "./transactions-mobile-list";

type TransactionTableRow =
  | { type: "separator"; key: string; label: string }
  | {
      type: "transaction";
      key: string;
      transaction: Transaction;
      occurredAt: Date;
    };

interface TransactionsViewProps {
  financialAccounts: FinancialAccount[];
  categories: Category[];
  transactions: Transaction[];
  totalCount: number;
  pageSize: number;
  listLoading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  deletingId: string | null;
  displayMode: "desktop" | "mobile";
  timeZone: string;
  formatAmount: (value: string, currency: string) => string;
}

export function TransactionsView({
  financialAccounts,
  categories,
  transactions,
  totalCount,
  pageSize,
  listLoading,
  currentPage,
  onPageChange,
  onEdit,
  onDelete,
  deletingId,
  displayMode,
  timeZone,
  formatAmount,
}: TransactionsViewProps) {
  const { site } = useSitePreferences();
  const t = site.pages.transactions;
  const displayLocale = site.metadata.htmlLang === "en" ? "en-US" : "es-CO";
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentDate(new Date()), 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();

    for (const category of categories) {
      map.set(category.id, category);
    }

    return map;
  }, [categories]);
  const showFinancialAccountNames = financialAccounts.length > 1;

  const transactionDateFormatters = useMemo(
    () => ({
      day: new Intl.DateTimeFormat(displayLocale, {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone,
      }),
      time: new Intl.DateTimeFormat(displayLocale, {
        hour: "numeric",
        minute: "2-digit",
        timeZone,
      }),
      dayKey: new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone,
      }),
    }),
    [displayLocale, timeZone],
  );

  const currentDayKey = useMemo(
    () => getDayKey(currentDate, transactionDateFormatters.dayKey),
    [currentDate, transactionDateFormatters.dayKey],
  );

  const yesterdayDayKey = useMemo(() => {
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);

    return getDayKey(yesterday, transactionDateFormatters.dayKey);
  }, [currentDate, transactionDateFormatters.dayKey]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize),
  );
  const activePage = Math.min(currentPage, totalPages);
  const paginationSummary = getPaginationSummary({
    itemCount: totalCount,
    pageSize,
    currentPage: activePage,
    totalPages,
    pageOf: t.pageOf,
    showingOfTotal: t.showingOfTotal,
  });

  useEffect(() => {
    if (currentPage !== activePage) {
      onPageChange(activePage);
    }
  }, [activePage, currentPage, onPageChange]);

  const paginatedRows = useMemo(() => {
    return transactions.reduce<{
      lastDayKey: string;
      rows: TransactionTableRow[];
    }>(
      (accumulator, transaction) => {
        const occurredAt = new Date(transaction.occurred_at);
        const dayKey = getDayKey(occurredAt, transactionDateFormatters.dayKey);
        const nextRows = [...accumulator.rows];

        if (dayKey !== accumulator.lastDayKey) {
          nextRows.push({
            type: "separator",
            key: `day-${dayKey}`,
            label: formatTransactionDayLabel(
              occurredAt,
              transactionDateFormatters.dayKey,
              transactionDateFormatters.day,
              currentDayKey,
              yesterdayDayKey,
              t.today,
              t.yesterday,
            ),
          });
        }

        nextRows.push({
          type: "transaction",
          key: transaction.id,
          transaction,
          occurredAt,
        });

        return {
          lastDayKey: dayKey,
          rows: nextRows,
        };
      },
      { lastDayKey: "", rows: [] },
    ).rows;
  }, [
    currentDayKey,
    t.today,
    t.yesterday,
    transactions,
    transactionDateFormatters.day,
    transactionDateFormatters.dayKey,
    yesterdayDayKey,
  ]);

  const rowPaddingClass = "py-2";
  const separatorPaddingClass = "py-1.5";
  const timeWidthClass = "min-w-[5rem]";
  const descriptionWidthClass = "max-w-32";
  const hasVisibleDescriptions = transactions.some((transaction) =>
    getTransactionDescription(transaction),
  );
  const desktopColumnCount = hasVisibleDescriptions ? 7 : 6;

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
    return capitalizeFirstLetter(transactionType);
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
    <div className="space-y-3">
      <TransactionsMobileList
        financialAccounts={financialAccounts}
        categories={categories}
        rows={paginatedRows}
        totalCount={totalCount}
        listLoading={listLoading}
        deletingId={deletingId}
        onEdit={onEdit}
        onDelete={onDelete}
        formatAmount={formatAmount}
        formatTime={(value) => transactionDateFormatters.time.format(value)}
        className={displayMode === "mobile" ? "md:block" : "md:hidden"}
      />

      <div
        className={cn(
          "hidden overflow-hidden rounded-lg border bg-card shadow-sm",
          displayMode === "desktop" && "md:block",
        )}
      >
        <Table showMobileScrollHint>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t.time}</TableHead>
              <TableHead>{t.category}</TableHead>
              <TableHead>{t.type}</TableHead>
              <TableHead>{t.amount}</TableHead>
              <TableHead>{t.currency}</TableHead>
              {hasVisibleDescriptions ? (
                <TableHead>{site.common.description}</TableHead>
              ) : null}
              <TableHead className="text-right">
                {site.common.actions}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading && totalCount === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={desktopColumnCount}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t.loading}
                </TableCell>
              </TableRow>
            ) : totalCount === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={desktopColumnCount}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t.empty}
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                if (row.type === "separator") {
                  return (
                    <TableRow
                      key={row.key}
                      className="bg-muted/15 hover:bg-muted/15"
                    >
                      <TableCell
                        colSpan={desktopColumnCount}
                        className={cn(
                          "border-y text-xs font-semibold text-muted-foreground",
                          separatorPaddingClass,
                        )}
                      >
                        {row.label}
                      </TableCell>
                    </TableRow>
                  );
                }

                const transaction = row.transaction;
                const transactionType = getTransactionType(transaction);
                const description = getTransactionDescription(transaction);

                return (
                  <TableRow key={row.key} className="hover:bg-muted/30">
                    <TableCell
                      className={cn(rowPaddingClass, "text-sm tabular-nums")}
                    >
                      <time
                        dateTime={transaction.occurred_at}
                        className={cn(
                          "block whitespace-nowrap font-medium",
                          timeWidthClass,
                        )}
                      >
                        {transactionDateFormatters.time.format(row.occurredAt)}
                      </time>
                    </TableCell>
                    <TableCell className={cn(rowPaddingClass, "font-medium")}>
                      <div className="space-y-0.5">
                        <p>{getTransactionCategoryName(transaction)}</p>
                        {showFinancialAccountNames ? (
                          <p className="text-xs font-normal text-muted-foreground">
                            {getFinancialAccountName(transaction) ?? site.common.dash}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className={rowPaddingClass}>
                      {renderDirectionBadge(transactionType)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        rowPaddingClass,
                        getAmountClassName(transactionType),
                      )}
                    >
                      {formatAmount(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        rowPaddingClass,
                        "text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground",
                      )}
                    >
                      {transaction.currency}
                    </TableCell>
                    {hasVisibleDescriptions ? (
                      <TableCell
                        className={cn(
                          rowPaddingClass,
                          descriptionWidthClass,
                          "truncate text-muted-foreground",
                        )}
                      >
                        {description ?? ""}
                      </TableCell>
                    ) : null}
                    <TableCell className={cn(rowPaddingClass, "text-right")}>
                      <div className="flex justify-end gap-1">
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
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalCount > 0 ? (
        <PaginationFooter
          currentPage={activePage}
          totalPages={totalPages}
          pageSizeLabel={t.pageSizeLabel(pageSize)}
          summaryLabel={paginationSummary}
          previousLabel={t.previousPage}
          nextLabel={t.nextPage}
          onPageChange={onPageChange}
        />
      ) : null}
    </div>
  );
}

function formatTransactionDayLabel(
  value: Date,
  dayKeyFormatter: Intl.DateTimeFormat,
  formatter: Intl.DateTimeFormat,
  currentDayKey: string,
  yesterdayDayKey: string,
  todayLabel: string,
  yesterdayLabel: string,
) {
  const dayKey = getDayKey(value, dayKeyFormatter);

  if (dayKey === currentDayKey) return todayLabel;
  if (dayKey === yesterdayDayKey) return yesterdayLabel;

  return capitalizeFirstLetter(formatter.format(value));
}

function capitalizeFirstLetter(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function getDayKey(value: Date, formatter: Intl.DateTimeFormat) {
  const parts = formatter.formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}
