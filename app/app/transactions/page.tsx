"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { Separator } from "@/components/ui/separator";

const schema = z.object({
  category_id: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().min(1, "Currency is required"),
  occurred_at: z.string().min(1, "Date is required"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>(
    () => getCache<Category[]>(CACHE_KEY_CATS) ?? [],
  );
  const [transactions, setTransactions] = useState<Transaction[]>(
    () => getCache<Transaction[]>(CACHE_KEY_TXN) ?? [],
  );
  const [listLoading, setListLoading] = useState(false);

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
        // only cache the unfiltered result
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

  useEffect(() => {
    async function init() {
      const silentCats = !!getCache(CACHE_KEY_CATS);
      const silentTxn = !!getCache(CACHE_KEY_TXN);
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        setCache(CACHE_KEY_CATS, cats);
      } catch (err) {
        if (err instanceof ApiError) toast.error(err.message);
      }
      loadTransactions(undefined, silentTxn && silentCats);
    }
    init();
  }, [loadTransactions]);

  function applyFilters() {
    loadTransactions({
      category_id: filterCategoryId || undefined,
      start_date: filterStartDate || undefined,
      end_date: filterEndDate || undefined,
    });
  }

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
      loadTransactions();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to create transaction");
    }
  }

  function getCategoryName(id: string) {
    return categories.find((c) => c.id === id)?.name ?? id;
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
              {isSubmitting ? "Creating…" : "Create"}
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

          <Button onClick={applyFilters} disabled={listLoading}>
            Apply
          </Button>
        </div>
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Transactions</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTransactions()}
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
              <TableHead>Amount</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.occurred_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{getCategoryName(t.category_id)}</TableCell>
                  <TableCell>{t.amount}</TableCell>
                  <TableCell>{t.currency}</TableCell>
                  <TableCell>{t.description ?? "—"}</TableCell>
                  <TableCell>{t.status ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
