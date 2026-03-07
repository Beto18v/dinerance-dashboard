"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import { api, ApiError, type Category } from "@/lib/api";
import { getCache, setCache } from "@/lib/cache";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const CACHE_KEY = "cache:categories";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  direction: z.enum(["income", "expense"]),
  parent_id: z.string().optional(),
});

const editSchema = z.object({
  name: z.string().min(1, "Name is required"),
  direction: z.enum(["income", "expense"]),
  parent_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type EditFormValues = z.infer<typeof editSchema>;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(
    () => getCache<Category[]>(CACHE_KEY) ?? [],
  );
  const [listLoading, setListLoading] = useState(
    () => !getCache<Category[]>(CACHE_KEY),
  );

  // Editing / deleting
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<Category | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterDirection, setFilterDirection] = useState<string>("");
  const [filterNameId, setFilterNameId] = useState<string>("");

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

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
    reset: resetEdit,
    watch: watchEdit,
    formState: { errors: editErrors, isSubmitting: editIsSubmitting },
  } = useForm<EditFormValues>({ resolver: zodResolver(editSchema) });

  const editDirectionValue = watchEdit("direction");
  const editParentIdValue = watchEdit("parent_id");

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
      loadCategories(true);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to create category");
    }
  }

  function openEditDialog(cat: Category) {
    setEditingCat(cat);
    resetEdit({
      name: cat.name,
      direction: cat.direction,
      parent_id: cat.parent_id ?? "__none__",
    });
  }

  async function onEditSubmit(values: EditFormValues) {
    if (!editingCat) return;
    try {
      await api.updateCategory(editingCat.id, {
        name: values.name,
        direction: values.direction,
        parent_id:
          values.parent_id === "__none__" ? null : values.parent_id || null,
      });
      toast.success("Category updated");
      setEditingCat(null);
      loadCategories(true);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to update category");
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteCat) return;
    setDeletingId(confirmDeleteCat.id);
    setConfirmDeleteCat(null);
    try {
      await api.deleteCategory(confirmDeleteCat.id);
      toast.success("Category deleted");
      loadCategories(true);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  }

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  function getParentName(id: string | null) {
    if (!id) return "—";
    return categoryMap.get(id)?.name ?? "—";
  }

  // Derived: filtered view
  const visibleCategories = categories.filter((c) => {
    if (filterDirection && c.direction !== filterDirection) return false;
    if (filterNameId && c.id !== filterNameId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize your transactions by income and expense categories.
        </p>
      </div>

      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New category</CardTitle>
          <CardDescription>
            Add a category to group your transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g. Groceries"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select
                  value={directionValue}
                  onValueChange={(v) =>
                    setValue("direction", v as "income" | "expense")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Parent (optional)</Label>
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
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create category"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Filters */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold">Filters</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <Select
              value={filterDirection || "__all__"}
              onValueChange={(v) =>
                setFilterDirection(v === "__all__" ? "" : v)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={filterNameId || "__all__"}
              onValueChange={(v) => setFilterNameId(v === "__all__" ? "" : v)}
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

          {(filterDirection || filterNameId) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterDirection("");
                setFilterNameId("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">
            Categories
            {visibleCategories.length !== categories.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({visibleCategories.length} of {categories.length})
              </span>
            )}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCategories(false)}
            disabled={listLoading}
          >
            Refresh
          </Button>
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : visibleCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                visibleCategories.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      {c.direction === "income" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          Income
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
                          Expense
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getParentName(c.parent_id)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDialog(c)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="Edit"
                        >
                          <FiEdit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCat(c)}
                          disabled={deletingId === c.id}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 disabled:opacity-40"
                          title="Delete"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editingCat}
        onOpenChange={(o) => !o && setEditingCat(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit_name">Name</Label>
              <Input id="edit_name" {...registerEdit("name")} />
              {editErrors.name && (
                <p className="text-sm text-destructive">
                  {editErrors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select
                value={editDirectionValue}
                onValueChange={(v) =>
                  setEditValue("direction", v as "income" | "expense")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Parent (optional)</Label>
              <Select
                value={editParentIdValue ?? "__none__"}
                onValueChange={(v) =>
                  setEditValue("parent_id", v === "__none__" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories
                    .filter((c) => c.id !== editingCat?.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditingCat(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editIsSubmitting}>
                {editIsSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <Dialog
        open={!!confirmDeleteCat}
        onOpenChange={(o) => !o && setConfirmDeleteCat(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>&ldquo;{confirmDeleteCat?.name}&rdquo;</strong>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteCat(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
