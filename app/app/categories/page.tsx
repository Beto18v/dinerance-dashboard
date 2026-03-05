"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { api, ApiError, type Category } from "@/lib/api";
import { getCache, setCache } from "@/lib/cache";

const CACHE_KEY = "cache:categories";
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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  direction: z.enum(["income", "expense"]),
  parent_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(
    () => getCache<Category[]>(CACHE_KEY) ?? [],
  );
  const [listLoading, setListLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { direction: "expense" },
  });

  const directionValue = watch("direction");
  const parentIdValue = watch("parent_id");

  const loadCategories = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
      setCache(CACHE_KEY, data);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to load categories");
    } finally {
      if (!silent) setListLoading(false);
    }
  }, []);

  useEffect(() => {
    // silent refresh if cached data is already displayed
    loadCategories(!!getCache(CACHE_KEY));
  }, [loadCategories]);

  async function onSubmit(values: FormValues) {
    try {
      await api.createCategory({
        name: values.name,
        direction: values.direction,
        parent_id: values.parent_id || null,
      });
      toast.success("Category created");
      reset({ direction: "expense" });
      loadCategories();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to create category");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">Categories</h1>

      <Card>
        <CardHeader>
          <CardTitle>New category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Direction</Label>
              <Select
                value={directionValue}
                onValueChange={(v) =>
                  setValue("direction", v as "income" | "expense")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Parent category (optional)</Label>
              <Select
                value={parentIdValue ?? "__none__"}
                onValueChange={(v) =>
                  setValue("parent_id", v === "__none__" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Existing categories</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCategories()}
            disabled={listLoading}
          >
            Refresh
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Parent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground"
                >
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.direction}</TableCell>
                  <TableCell>
                    {c.parent_id
                      ? (categories.find((p) => p.id === c.parent_id)?.name ??
                        c.parent_id)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
