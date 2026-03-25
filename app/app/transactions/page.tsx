"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { api, ApiError, type Category, type Transaction } from "@/lib/api";
import { getCache, setCache } from "@/lib/cache";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { getSiteText } from "@/lib/site";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateTransactionModal } from "./components/create-transaction-modal";
import { TransactionsFilters } from "./components/transactions-filters";
import { TransactionsTable } from "./components/transactions-table";

const CACHE_KEY_CATS = "cache:categories";
const CACHE_KEY_TXN = "cache:transactions";
const schemaText = getSiteText().pages.transactions;

const schema = z.object({
  category_id: z.string().min(1, schemaText.validations.categoryRequired),
  amount: z.string().min(1, schemaText.validations.amountRequired),
  currency: z.string().min(1, schemaText.validations.currencyRequired),
  occurred_at: z.string().min(1, schemaText.validations.dateRequired),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TransactionsPage() {
  const { site } = useSitePreferences();
  const t = site.pages.transactions;
  const displayLocale = getDisplayLocale(site.metadata.htmlLang);
  const [categories, setCategories] = useState<Category[]>(
    () => getCache<Category[]>(CACHE_KEY_CATS) ?? [],
  );
  const [transactions, setTransactions] = useState<Transaction[]>(
    () => getCache<Transaction[]>(CACHE_KEY_TXN) ?? [],
  );
  const [listLoading, setListLoading] = useState(
    () => !getCache<Transaction[]>(CACHE_KEY_TXN),
  );
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [confirmDeleteTxn, setConfirmDeleteTxn] = useState<Transaction | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filterParams = useMemo(
    () => ({
      category_id: filterCategoryId || undefined,
      start_date: filterStartDate
        ? toDayBoundaryIso(filterStartDate, "start")
        : undefined,
      end_date: filterEndDate
        ? toDayBoundaryIso(filterEndDate, "end")
        : undefined,
    }),
    [filterCategoryId, filterEndDate, filterStartDate],
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

  const loadTransactions = useCallback(
    async (
      params?: { category_id?: string; start_date?: string; end_date?: string },
      silent = false,
    ) => {
      if (!silent) setListLoading(true);

      try {
        const data = await api.getTransactions({
          category_id: params?.category_id || undefined,
          start_date: params?.start_date || undefined,
          end_date: params?.end_date || undefined,
        });
        setTransactions(data);

        if (!params?.category_id && !params?.start_date && !params?.end_date) {
          setCache(CACHE_KEY_TXN, data);
        }
      } catch (err) {
        if (err instanceof ApiError) toast.error(err.message);
        else toast.error(t.failedLoad);
      } finally {
        if (!silent) setListLoading(false);
      }
    },
    [t.failedLoad],
  );

  useEffect(() => {
    async function loadCategories() {
      const silent = !!getCache(CACHE_KEY_CATS);

      try {
        const data = await api.getCategories();
        setCategories(data);
        setCache(CACHE_KEY_CATS, data);
      } catch (err) {
        if (!silent && err instanceof ApiError) toast.error(err.message);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    const hasTxnCache = !!getCache(CACHE_KEY_TXN);
    const isFiltered = !!(
      filterParams.category_id ||
      filterParams.start_date ||
      filterParams.end_date
    );

    loadTransactions(filterParams, hasTxnCache && !isFiltered);
  }, [filterParams, loadTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterParams]);

  function openEditDialog(transaction: Transaction) {
    setEditingTxn(transaction);

    const date = new Date(transaction.occurred_at);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    resetEdit({
      category_id: transaction.category_id,
      amount: String(transaction.amount),
      currency: transaction.currency,
      occurred_at: localDate,
      description: transaction.description ?? "",
    });
  }

  async function onEditSubmit(values: FormValues) {
    if (!editingTxn) return;

    try {
      await api.updateTransaction(editingTxn.id, {
        category_id: values.category_id,
        amount: values.amount,
        currency: values.currency,
        occurred_at: new Date(values.occurred_at).toISOString(),
        description: values.description || null,
      });
      toast.success(t.updated);
      setEditingTxn(null);
      loadTransactions(filterParams, true);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(t.failedUpdate);
    }
  }

  async function handleDeleteConfirmed() {
    if (!confirmDeleteTxn) return;

    const id = confirmDeleteTxn.id;
    setDeletingId(id);
    setConfirmDeleteTxn(null);

    try {
      await api.deleteTransaction(id);
      toast.success(t.deleted);
      loadTransactions(filterParams, true);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(t.failedDelete);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <TransactionsFilters
        categories={categories}
        filterCategoryId={filterCategoryId}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        onFilterCategoryChange={setFilterCategoryId}
        onFilterStartDateChange={setFilterStartDate}
        onFilterEndDateChange={setFilterEndDate}
        onClearFilters={() => {
          setFilterCategoryId("");
          setFilterStartDate("");
          setFilterEndDate("");
        }}
      />

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            {t.listTitle}
            {listLoading ? (
              <span className="ml-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent align-middle" />
            ) : null}
          </h2>
          <div className="flex items-center gap-2">
            <CreateTransactionModal
              categories={categories}
              onCreated={() => {
                setCurrentPage(1);
                loadTransactions(filterParams, true);
              }}
            />
          </div>
        </div>

        <TransactionsTable
          categories={categories}
          transactions={transactions}
          listLoading={listLoading}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onEdit={openEditDialog}
          onDelete={setConfirmDeleteTxn}
          deletingId={deletingId}
          formatAmount={(value, currency) =>
            formatTransactionAmount(value, currency, displayLocale)
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
                formatTransactionAmount(
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
                  {...registerEdit("amount")}
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
                  {...registerEdit("currency")}
                  placeholder={t.currencyPlaceholder}
                />
                {editErrors.currency ? (
                  <p className="text-sm text-destructive">
                    {editErrors.currency.message}
                  </p>
                ) : null}
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

function toDayBoundaryIso(date: string, boundary: "start" | "end") {
  const time = boundary === "start" ? "00:00:00.000" : "23:59:59.999";
  return new Date(`${date}T${time}`).toISOString();
}

function getDisplayLocale(language: string) {
  return language === "en" ? "en-US" : "es-CO";
}

function formatTransactionAmount(
  value: string,
  currency: string,
  locale: string,
) {
  const normalizedCurrency = (currency || "COP").toUpperCase();
  const amount = Number(value || 0);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalizedCurrency,
    ...(normalizedCurrency === "COP"
      ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
      : {}),
  })
    .format(amount)
    .replace(/\s+/g, "");
}
