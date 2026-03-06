"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import { api, ApiError, type Category, type Transaction } from "@/lib/api";
import { getCache, setCache } from "@/lib/cache";

const CACHE_KEY_CATS = "cache:categories";
const CACHE_KEY_TXN = "cache:transactions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  category_id: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().min(1, "Currency is required"),
  occurred_at: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});

const editSchema = z.object({
  category_id: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().min(1, "Currency is required"),
  occurred_at: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type EditFormValues = z.infer<typeof editSchema>;

export default function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>(
    () => getCache<Category[]>(CACHE_KEY_CATS) ?? [],
  );
  const [transactions, setTransactions] = useState<Transaction[]>(
    () => getCache<Transaction[]>(CACHE_KEY_TXN) ?? [],
  );
  const [listLoading, setListLoading] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters state
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "COP" },
  });

  const categoryIdValue = watch("category_id");

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
    reset: resetEdit,
    watch: watchEdit,
    formState: { errors: editErrors, isSubmitting: editIsSubmitting },
  } = useForm<EditFormValues>({ resolver: zodResolver(editSchema) });

  const editCategoryIdValue = watchEdit("category_id");

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
        else toast.error("Failed to load transactions");
      } finally {
        if (!silent) setListLoading(false);
      }
    },
    [],
  );

  // Load categories on mount
  useEffect(() => {
    async function loadCats() {
      const silent = !!getCache(CACHE_KEY_CATS);
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        setCache(CACHE_KEY_CATS, cats);
      } catch (err) {
        if (!silent && err instanceof ApiError) toast.error(err.message);
      }
    }
    loadCats();
  }, []);

  // Real-time filter effect - fires on mount and whenever a filter changes
  useEffect(() => {
    const silent =
      !filterCategoryId && !filterStartDate && !filterEndDate
        ? !!getCache(CACHE_KEY_TXN)
        : false;
    loadTransactions(
      {
        category_id: filterCategoryId || undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
      },
      silent,
    );
  }, [filterCategoryId, filterStartDate, filterEndDate, loadTransactions]);

  async function onSubmit(values: FormValues) {
    try {
      await api.createTransaction({
        category_id: values.category_id,
        amount: values.amount,
        currency: values.currency,
        occurred_at: new Date(values.occurred_at).toISOString(),
        description: values.description || null,
      });
      toast.success("Transaction created");
      reset({ currency: "COP" });
      loadTransactions({
        category_id: filterCategoryId || undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
      });
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to create transaction");
    }
  }

  function openEditDialog(txn: Transaction) {
    setEditingTxn(txn);
    const dt = new Date(txn.occurred_at);
    const localDt = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    resetEdit({
      category_id: txn.category_id,
      amount: String(txn.amount),
      currency: txn.currency,
      occurred_at: localDt,
      description: txn.description ?? "",
    });
  }

  async function onEditSubmit(values: EditFormValues) {
    if (!editingTxn) return;
    try {
      await api.updateTransaction(editingTxn.id, {
        category_id: values.category_id,
        amount: values.amount,
        currency: values.currency,
        occurred_at: new Date(values.occurred_at).toISOString(),
        description: values.description || null,
      });
      toast.success("Transaction updated");
      setEditingTxn(null);
      loadTransactions({
        category_id: filterCategoryId || undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
      });
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to update transaction");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api.deleteTransaction(id);
      toast.success("Transaction deleted");
      loadTransactions({
        category_id: filterCategoryId || undefined,
        start_date: filterStartDate || undefined,
        end_date: filterEndDate || undefined,
      });
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to delete transaction");
    } finally {
      setDeletingId(null);
    }
  }

  function getCategoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? id;
  }

  function getCategoryDirection(id: string) {
    return categories.find((c) => c.id === id)?.direction ?? null;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>New transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select
                  value={categoryIdValue ?? ""}
                  onValueChange={(v) => setValue("category_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-sm text-destructive">
                    {errors.category_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  {...register("amount")}
                  placeholder="e.g. 50000"
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  {...register("currency")}
                  placeholder="COP"
                />
                {errors.currency && (
                  <p className="text-sm text-destructive">
                    {errors.currency.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="occurred_at">Date &amp; time</Label>
                <Input
                  id="occurred_at"
                  type="datetime-local"
                  {...register("occurred_at")}
                />
                {errors.occurred_at && (
                  <p className="text-sm text-destructive">
                    {errors.occurred_at.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Description (optional)</Label>
                <Input id="description" {...register("description")} />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Filters */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Filters</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label>Category</Label>
            <Select
              value={filterCategoryId || "__all__"}
              onValueChange={(v) =>
                setFilterCategoryId(v === "__all__" ? "" : v)
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="start_date">Start date</Label>
            <Input
              id="start_date"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="end_date">End date</Label>
            <Input
              id="end_date"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Transactions</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              loadTransactions({
                category_id: filterCategoryId || undefined,
                start_date: filterStartDate || undefined,
                end_date: filterEndDate || undefined,
              })
            }
            disabled={listLoading}
          >
            Refresh
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => {
                const direction = getCategoryDirection(t.category_id);
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      {new Date(t.occurred_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{getCategoryName(t.category_id)}</TableCell>
                    <TableCell>
                      {direction === "income" && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Income
                        </Badge>
                      )}
                      {direction === "expense" && (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          Expense
                        </Badge>
                      )}
                      {direction === null && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{t.amount}</TableCell>
                    <TableCell>{t.currency}</TableCell>
                    <TableCell>{t.description ?? "-"}</TableCell>
                    <TableCell>{t.status ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDialog(t)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
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

      {/* Edit Dialog */}
      <Dialog
        open={!!editingTxn}
        onOpenChange={(open) => !open && setEditingTxn(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleEditSubmit(onEditSubmit)}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={editCategoryIdValue ?? ""}
                onValueChange={(v) => setEditValue("category_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editErrors.category_id && (
                <p className="text-sm text-destructive">
                  {editErrors.category_id.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="edit_amount">Amount</Label>
                <Input
                  id="edit_amount"
                  {...registerEdit("amount")}
                  placeholder="e.g. 50000"
                />
                {editErrors.amount && (
                  <p className="text-sm text-destructive">
                    {editErrors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit_currency">Currency</Label>
                <Input
                  id="edit_currency"
                  {...registerEdit("currency")}
                  placeholder="COP"
                />
                {editErrors.currency && (
                  <p className="text-sm text-destructive">
                    {editErrors.currency.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit_occurred_at">Date &amp; time</Label>
              <Input
                id="edit_occurred_at"
                type="datetime-local"
                {...registerEdit("occurred_at")}
              />
              {editErrors.occurred_at && (
                <p className="text-sm text-destructive">
                  {editErrors.occurred_at.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit_description">Description (optional)</Label>
              <Input id="edit_description" {...registerEdit("description")} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingTxn(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editIsSubmitting}>
                {editIsSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
