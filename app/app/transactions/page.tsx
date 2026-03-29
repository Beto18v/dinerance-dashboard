"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useProfile } from "@/components/providers/profile-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  api,
  ApiError,
  type Category,
  type Transaction,
  type TransactionsPageResponse,
} from "@/lib/api";
import {
  cacheKeys,
  cacheTtls,
  getCache,
  invalidateCacheKey,
  setCache,
  subscribeToCacheKeys,
} from "@/lib/cache";
import { formatCurrencyAmount, normalizeCurrencyCode } from "@/lib/finance";
import { getSiteText } from "@/lib/site";
import {
  dateInputBoundaryToUtcIso,
  dateTimeLocalToUtcIso,
  formatDateTimeLocalInTimeZone,
  getQuickRangeDates,
  resolveTimeZone,
} from "@/lib/timezone";
import { FinancialProfileForm } from "../profile/components/financial-profile-form";
import {
  CreateTransactionModal,
  TransactionsFilters,
  TransactionsView,
} from "./components";

const schemaText = getSiteText().pages.transactions;
const AMOUNT_PATTERN = /^\d+([.,]\d{0,2})?$/;

const schema = z.object({
  category_id: z.string().min(1, schemaText.validations.categoryRequired),
  amount: z
    .string()
    .trim()
    .min(1, schemaText.validations.amountRequired)
    .regex(AMOUNT_PATTERN, schemaText.validations.amountInvalid),
  occurred_at: z.string().min(1, schemaText.validations.dateRequired),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type QuickRange = "today" | "last7" | "thisMonth";
type TransactionsDisplayMode = "desktop" | "mobile";
type TransactionFilters = {
  category_id?: string;
  parent_category_id?: string;
  start_date?: string;
  end_date?: string;
};

const TRANSACTIONS_PAGE_SIZE = 12;
const EMPTY_TRANSACTIONS_SUMMARY: TransactionsPageResponse["summary"] = {
  active_categories_count: 0,
  skipped_transactions: 0,
  income_totals: [],
  expense_totals: [],
  balance_totals: [],
};

export default function TransactionsPage() {
  const { site } = useSitePreferences();
  const { profile, setProfile } = useProfile();
  const t = site.pages.transactions;
  const profileTexts = site.pages.profile;
  const displayLocale = site.metadata.htmlLang === "en" ? "en-US" : "es-CO";
  const timeZone = resolveTimeZone(profile?.timezone);
  const baseCurrency = profile?.base_currency
    ? normalizeCurrencyCode(profile.base_currency)
    : null;
  const hasFinanceProfile = Boolean(profile?.base_currency && profile?.timezone);
  const cachedTransactionsPage = getFreshTransactionCache();
  const [categories, setCategories] = useState<Category[]>(
    () => getFreshCategoryCache() ?? [],
  );
  const [transactionsPage, setTransactionsPage] =
    useState<TransactionsPageResponse | null>(() => cachedTransactionsPage);
  const [hasAnyTransactions, setHasAnyTransactions] = useState(
    () => (cachedTransactionsPage?.total_count ?? 0) > 0,
  );
  const [listLoading, setListLoading] = useState(() => !cachedTransactionsPage);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [confirmDeleteTxn, setConfirmDeleteTxn] = useState<Transaction | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [filterParentCategoryId, setFilterParentCategoryId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [activeQuickRange, setActiveQuickRange] = useState<QuickRange | null>(
    null,
  );
  const [displayMode, setDisplayMode] =
    useState<TransactionsDisplayMode>("desktop");
  const [currentPage, setCurrentPage] = useState(1);

  const filterParams = useMemo(
    () => ({
      category_id: filterCategoryId || undefined,
      parent_category_id: filterParentCategoryId || undefined,
      start_date: filterStartDate
        ? dateInputBoundaryToUtcIso(filterStartDate, "start", timeZone)
        : undefined,
      end_date: filterEndDate
        ? dateInputBoundaryToUtcIso(filterEndDate, "end", timeZone)
        : undefined,
    }),
    [filterCategoryId, filterEndDate, filterParentCategoryId, filterStartDate, timeZone],
  );

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    control: editControl,
    setValue: setEditValue,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: editIsSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const editCategoryIdValue = useWatch({
    control: editControl,
    name: "category_id",
  });
  const editAmountField = registerEdit("amount", {
    onChange: (event) => {
      event.target.value = sanitizeAmountInput(event.target.value);
    },
  });

  const parentCategories = useMemo(
    () =>
      categories.filter((category) => !category.parent_id).sort((a, b) =>
        a.name.localeCompare(b.name, displayLocale),
      ),
    [categories, displayLocale],
  );

  const loadCategories = useCallback(
    async (silent = false) => {
      try {
        const data = await api.getCategories();
        setCategories(data);
        setCache(cacheKeys.categories, data);
      } catch (error) {
        if (!silent) {
          if (error instanceof ApiError) {
            toast.error(error.message);
          } else {
            toast.error(t.failedLoad);
          }
        }
      }
    },
    [t.failedLoad],
  );

  const loadTransactionsPresence = useCallback(async () => {
    const freshTransactions = getFreshTransactionCache();
    if (freshTransactions) {
      setHasAnyTransactions(freshTransactions.total_count > 0);
      return;
    }

    try {
      const data = await api.getTransactions({ limit: 1 });
      setHasAnyTransactions(data.total_count > 0);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedLoad);
      }
    }
  }, [t.failedLoad]);

  const loadTransactions = useCallback(
    async (
      params: TransactionFilters,
      page: number,
      silent = false,
    ) => {
      if (!silent) setListLoading(true);

      try {
        let resolvedPage = page;
        let data = await fetchTransactionsPage(params, page);
        const totalPages = Math.max(
          1,
          Math.ceil(data.total_count / TRANSACTIONS_PAGE_SIZE),
        );

        if (data.total_count > 0 && page > totalPages) {
          resolvedPage = totalPages;
          setCurrentPage(totalPages);
          data = await fetchTransactionsPage(params, totalPages);
        } else if (data.total_count === 0 && page !== 1) {
          resolvedPage = 1;
          setCurrentPage(1);
        }

        setTransactionsPage(data);

        const isDefaultQuery =
          !isTransactionsFilterActive(params) && resolvedPage === 1;
        if (isDefaultQuery) {
          setCache(cacheKeys.transactions, data);
          setHasAnyTransactions(data.total_count > 0);
        } else if (data.total_count > 0) {
          setHasAnyTransactions(true);
        }
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(t.failedLoad);
        }
      } finally {
        if (!silent) setListLoading(false);
      }
    },
    [t.failedLoad],
  );

  const handleProfileUpdated = useCallback(
    (updatedProfile: typeof profile) => {
      if (!updatedProfile) return;
      setProfile(updatedProfile);
      invalidateCacheKey(cacheKeys.transactions);
    },
    [setProfile],
  );

  useEffect(() => {
    void loadCategories(Boolean(getFreshCategoryCache()));
  }, [loadCategories]);

  useEffect(() => {
    const hasFreshTransactionCache = Boolean(getFreshTransactionCache());
    const isDefaultQuery =
      currentPage === 1 && !isTransactionsFilterActive(filterParams);

    void loadTransactions(
      filterParams,
      currentPage,
      hasFreshTransactionCache && isDefaultQuery,
    );
  }, [currentPage, filterParams, loadTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategoryId, filterEndDate, filterParentCategoryId, filterStartDate]);

  useEffect(() => {
    return subscribeToCacheKeys(
      [cacheKeys.categories, cacheKeys.transactions],
      (changedKeys) => {
        if (changedKeys.includes(cacheKeys.categories)) {
          void loadCategories(true);
        }
        if (changedKeys.includes(cacheKeys.transactions)) {
          void loadTransactions(filterParams, currentPage, true);
          void loadTransactionsPresence();
        }
      },
    );
  }, [currentPage, filterParams, loadCategories, loadTransactions, loadTransactionsPresence]);

  const transactions = transactionsPage?.items ?? [];
  const totalCount = transactionsPage?.total_count ?? 0;
  const transactionsSummary = transactionsPage?.summary ?? EMPTY_TRANSACTIONS_SUMMARY;

  const summary = useMemo(() => {
    return {
      income: formatTotals(
        transactionsSummary.income_totals,
        displayLocale,
        site.common.dash,
      ),
      expense: formatTotals(
        transactionsSummary.expense_totals,
        displayLocale,
        site.common.dash,
      ),
      balance: formatTotals(
        transactionsSummary.balance_totals,
        displayLocale,
        site.common.dash,
      ),
    };
  }, [displayLocale, site.common.dash, transactionsSummary]);

  function openEditDialog(transaction: Transaction) {
    setEditingTxn(transaction);

    resetEdit({
      category_id: transaction.category_id,
      amount: String(transaction.amount),
      occurred_at: formatDateTimeLocalInTimeZone(transaction.occurred_at, timeZone),
      description: transaction.description ?? "",
    });
  }

  async function onEditSubmit(values: FormValues) {
    if (!editingTxn) return;

    try {
      await api.updateTransaction(editingTxn.id, {
        category_id: values.category_id,
        amount: normalizeAmountForApi(values.amount),
        occurred_at: dateTimeLocalToUtcIso(values.occurred_at, timeZone),
        description: values.description || null,
      });
      toast.success(t.updated);
      setEditingTxn(null);
      invalidateCacheKey(cacheKeys.transactions);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedUpdate);
      }
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDeleteTxn) return;

    const transactionId = confirmDeleteTxn.id;
    setDeletingId(transactionId);
    setConfirmDeleteTxn(null);

    try {
      await api.deleteTransaction(transactionId);
      toast.success(t.deleted);
      invalidateCacheKey(cacheKeys.transactions);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedDelete);
      }
    } finally {
      setDeletingId(null);
    }
  }

  const summaryItems = [
    { label: t.summaryTransactions, value: String(totalCount) },
    {
      label: t.summaryCategories,
      value: String(transactionsSummary.active_categories_count),
    },
    { label: t.summaryIncome, value: summary.income },
    { label: t.summaryExpense, value: summary.expense },
    { label: t.summaryBalance, value: summary.balance },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      {!hasFinanceProfile ? (
        <Card className="border-primary/15 bg-primary/5">
          <CardHeader>
            <CardTitle>{profileTexts.financeTitle}</CardTitle>
            <CardDescription>{profileTexts.financeCardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialProfileForm
              compact
              profile={profile}
              hasTransactions={hasAnyTransactions}
              onProfileUpdated={handleProfileUpdated}
            />
          </CardContent>
        </Card>
      ) : null}

      <TransactionsFilters
        categories={categories}
        parentCategories={parentCategories}
        filterCategoryId={filterCategoryId}
        filterParentCategoryId={filterParentCategoryId}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        activeQuickRange={activeQuickRange}
        displayMode={displayMode}
        onFilterCategoryChange={setFilterCategoryId}
        onFilterParentCategoryChange={setFilterParentCategoryId}
        onFilterStartDateChange={(value) => {
          setActiveQuickRange(null);
          setFilterStartDate(value);
        }}
        onFilterEndDateChange={(value) => {
          setActiveQuickRange(null);
          setFilterEndDate(value);
        }}
        onQuickRangeChange={(range) => {
          const quickRange = getQuickRangeDates(range, timeZone);
          setActiveQuickRange(range);
          setFilterStartDate(quickRange.startDate);
          setFilterEndDate(quickRange.endDate);
        }}
        onDisplayModeChange={setDisplayMode}
        onClearFilters={() => {
          setActiveQuickRange(null);
          setFilterParentCategoryId("");
          setFilterCategoryId("");
          setFilterStartDate("");
          setFilterEndDate("");
        }}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {summaryItems.map((item) => (
          <Card key={item.label} className="gap-0 py-0">
            <CardContent className="space-y-1 px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {item.label}
              </p>
              <p className="text-lg font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {baseCurrency && transactionsSummary.skipped_transactions > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t.summarySkippedNotice(
            transactionsSummary.skipped_transactions,
            baseCurrency,
          )}
        </p>
      ) : null}

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            {t.listTitle}
            {listLoading ? (
              <span className="ml-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent align-middle" />
            ) : null}
          </h2>
          {hasFinanceProfile && categories.length > 0 ? (
            <CreateTransactionModal
              categories={categories}
              defaultCurrency={baseCurrency ?? "COP"}
              timeZone={timeZone}
              onCreated={() => {
                setCurrentPage(1);
                invalidateCacheKey(cacheKeys.transactions);
              }}
            />
          ) : null}
        </div>

        <TransactionsView
          categories={categories}
          transactions={transactions}
          totalCount={totalCount}
          pageSize={TRANSACTIONS_PAGE_SIZE}
          listLoading={listLoading}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onEdit={openEditDialog}
          onDelete={setConfirmDeleteTxn}
          deletingId={deletingId}
          displayMode={displayMode}
          timeZone={timeZone}
          formatAmount={(value, currency) =>
            formatCurrencyAmount(value, currency, displayLocale)
          }
        />
      </div>

      <Dialog
        open={!!confirmDeleteTxn}
        onOpenChange={(open) => !open && setConfirmDeleteTxn(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteTitle}</DialogTitle>
            <DialogDescription>
              {t.deleteDescription(
                formatCurrencyAmount(
                  confirmDeleteTxn?.amount ?? "",
                  confirmDeleteTxn?.currency ?? "COP",
                  displayLocale,
                ),
                confirmDeleteTxn?.description ?? undefined,
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteTxn(null)}>
              {site.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed}>
              {site.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingTxn}
        onOpenChange={(open) => !open && setEditingTxn(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t.category}</Label>
              <Select
                value={editCategoryIdValue ?? ""}
                onValueChange={(value) => setEditValue("category_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.categoryPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors.category_id ? (
                <p className="text-sm text-destructive">
                  {editErrors.category_id.message}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit_amount">{t.amount}</Label>
                <Input
                  id="edit_amount"
                  {...editAmountField}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder={t.amountPlaceholder}
                />
                {editErrors.amount ? (
                  <p className="text-sm text-destructive">
                    {editErrors.amount.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_currency">{t.currency}</Label>
                <Input
                  id="edit_currency"
                  value={editingTxn?.currency ?? baseCurrency ?? "COP"}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_occurred_at">{t.dateTime}</Label>
              <Input
                id="edit_occurred_at"
                type="datetime-local"
                {...registerEdit("occurred_at")}
              />
              {editErrors.occurred_at ? (
                <p className="text-sm text-destructive">
                  {editErrors.occurred_at.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_description">{t.descriptionOptional}</Label>
              <Input id="edit_description" {...registerEdit("description")} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingTxn(null)}
              >
                {site.common.cancel}
              </Button>
              <Button type="submit" disabled={editIsSubmitting}>
                {editIsSubmitting ? t.saving : t.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatTotals(
  totals: TransactionsPageResponse["summary"]["income_totals"],
  locale: string,
  emptyValue: string,
) {
  if (totals.length === 0) return emptyValue;

  return [...totals]
    .sort((a, b) => a.currency.localeCompare(b.currency))
    .map((item) => formatCurrencyAmount(item.amount, item.currency, locale))
    .join(" | ");
}

function sanitizeAmountInput(value: string) {
  const sanitizedValue = value.replace(/[^\d.,]/g, "");
  const separatorIndex = sanitizedValue.search(/[.,]/);

  if (separatorIndex === -1) return sanitizedValue;

  const separator = sanitizedValue[separatorIndex];
  const integerPart = sanitizedValue
    .slice(0, separatorIndex)
    .replace(/[^\d]/g, "");
  const decimalPart = sanitizedValue
    .slice(separatorIndex + 1)
    .replace(/[^\d]/g, "");

  return `${integerPart || "0"}${separator}${decimalPart}`;
}

function normalizeAmountForApi(value: string) {
  return value.replace(",", ".");
}

function getFreshCategoryCache() {
  return getCache<Category[]>(cacheKeys.categories, {
    maxAgeMs: cacheTtls.categories,
  });
}

function getFreshTransactionCache() {
  return getCache<TransactionsPageResponse>(cacheKeys.transactions, {
    maxAgeMs: cacheTtls.transactions,
  });
}

async function fetchTransactionsPage(
  params: TransactionFilters,
  page: number,
) {
  return api.getTransactions({
    category_id: params.category_id,
    parent_category_id: params.parent_category_id,
    start_date: params.start_date,
    end_date: params.end_date,
    limit: TRANSACTIONS_PAGE_SIZE,
    offset: (page - 1) * TRANSACTIONS_PAGE_SIZE,
  });
}

function isTransactionsFilterActive(params: TransactionFilters) {
  return Boolean(
    params.category_id ||
      params.parent_category_id ||
      params.start_date ||
      params.end_date,
  );
}
