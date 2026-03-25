"use client";

import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import { type Category, type Transaction } from "@/lib/api";
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

const TRANSACTIONS_PAGE_SIZE = 12;

type TransactionTableRow =
  | { type: "separator"; key: string; label: string }
  | {
      type: "transaction";
      key: string;
      transaction: Transaction;
      occurredAt: Date;
    };

interface TransactionsTableProps {
  categories: Category[];
  transactions: Transaction[];
  listLoading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  deletingId: string | null;
  formatAmount: (value: string, currency: string) => string;
}

export function TransactionsTable({
  categories,
  transactions,
  listLoading,
  currentPage,
  onPageChange,
  onEdit,
  onDelete,
  deletingId,
  formatAmount,
}: TransactionsTableProps) {
  const { site } = useSitePreferences();
  const t = site.pages.transactions;
  const displayLocale = site.metadata.htmlLang === "en" ? "en-US" : "es-CO";
  const [browserTimeZone, setBrowserTimeZone] = useState(() =>
    getBrowserTimeZone(),
  );
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    function syncBrowserClock() {
      setBrowserTimeZone(getBrowserTimeZone());
      setCurrentDate(new Date());
    }

    syncBrowserClock();
    const intervalId = window.setInterval(syncBrowserClock, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();

    for (const category of categories) {
      map.set(category.id, category);
    }

    return map;
  }, [categories]);

  const transactionDateFormatters = useMemo(
    () => ({
      day: new Intl.DateTimeFormat(displayLocale, {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: browserTimeZone,
      }),
      time: new Intl.DateTimeFormat(displayLocale, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: browserTimeZone,
      }),
      dayKey: new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: browserTimeZone,
      }),
    }),
    [browserTimeZone, displayLocale],
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
    Math.ceil(transactions.length / TRANSACTIONS_PAGE_SIZE),
  );
  const activePage = Math.min(currentPage, totalPages);
  const paginationSummary = getPaginationSummary({
    itemCount: transactions.length,
    pageSize: TRANSACTIONS_PAGE_SIZE,
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

  const paginatedTransactions = useMemo(() => {
    const start = (activePage - 1) * TRANSACTIONS_PAGE_SIZE;
    return transactions.slice(start, start + TRANSACTIONS_PAGE_SIZE);
  }, [activePage, transactions]);

  const paginatedRows = useMemo(() => {
    return paginatedTransactions.reduce<{
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
    paginatedTransactions,
    t.today,
    t.yesterday,
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
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        {listLoading && transactions.length === 0 ? (
          <div className="rounded-lg border bg-card px-4 py-8 text-center text-muted-foreground shadow-sm">
            {t.loading}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-lg border bg-card px-4 py-8 text-center text-muted-foreground shadow-sm">
            {t.empty}
          </div>
        ) : (
          paginatedRows.map((row) => {
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
                      {transactionDateFormatters.time.format(row.occurredAt)}
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
                  <div className="min-w-0">
                    {renderDirectionBadge(direction)}
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

      <div className="hidden overflow-hidden rounded-lg border bg-card shadow-sm md:block">
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
            {listLoading && transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={desktopColumnCount}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t.loading}
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
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
                const direction = getCategoryDirection(transaction.category_id);
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
                      {getCategoryName(transaction.category_id)}
                    </TableCell>
                    <TableCell className={rowPaddingClass}>
                      {renderDirectionBadge(direction)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        rowPaddingClass,
                        getAmountClassName(direction),
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

      {transactions.length > 0 ? (
        <PaginationFooter
          currentPage={activePage}
          totalPages={totalPages}
          pageSizeLabel={t.pageSizeLabel(TRANSACTIONS_PAGE_SIZE)}
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

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function getDayKey(value: Date, formatter: Intl.DateTimeFormat) {
  const parts = formatter.formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}
