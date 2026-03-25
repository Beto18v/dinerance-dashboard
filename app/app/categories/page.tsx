"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import { api, ApiError, type Category } from "@/lib/api";
import { getCache, setCache } from "@/lib/cache";
import {
  findDuplicateCategory,
  normalizeCategoryName,
} from "@/lib/category-utils";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { getSiteText } from "@/lib/site";
import { getPaginationSummary } from "@/lib/pagination";
import { cn } from "@/lib/utils";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CreateCategoryModal } from "./components/create-category-modal";

const CACHE_KEY = "cache:categories";
const CATEGORIES_PAGE_SIZE = 12;
const schemaText = getSiteText().pages.categories;

const schema = z.object({
  name: z.string().min(1, schemaText.validations.nameRequired),
  direction: z.enum(["income", "expense"]),
  parent_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type CategoryTableRow =
  | { type: "separator"; key: string; label: string }
  | { type: "category"; key: string; category: Category };

export default function CategoriesPage() {
  const { site } = useSitePreferences();
  const t = site.pages.categories;
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
  const [currentPage, setCurrentPage] = useState(1);

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
    reset: resetEdit,
    watch: watchEdit,
    formState: { errors: editErrors, isSubmitting: editIsSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const editDirectionValue = watchEdit("direction");
  const editParentIdValue = watchEdit("parent_id");

  const loadCategories = useCallback(
    async (silent = false) => {
      if (!silent) setListLoading(true);
      try {
        const data = await api.getCategories();
        setCategories(data);
        setCache(CACHE_KEY, data);
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
    loadCategories(!!getCache(CACHE_KEY));
  }, [loadCategories]);

  function openEditDialog(cat: Category) {
    setEditingCat(cat);
    resetEdit({
      name: cat.name,
      direction: cat.direction,
      parent_id: cat.parent_id ?? "__none__",
    });
  }

  async function onEditSubmit(values: FormValues) {
    if (!editingCat) return;
    const normalizedName = normalizeCategoryName(values.name);
    const duplicateCategory = findDuplicateCategory(
      categories,
      normalizedName,
      editingCat.id,
    );

    if (duplicateCategory) {
      toast.error(t.duplicateCategory(normalizedName));
      return;
    }

    try {
      await api.updateCategory(editingCat.id, {
        name: normalizedName,
        direction: values.direction,
        parent_id:
          values.parent_id === "__none__" ? null : values.parent_id || null,
      });
      toast.success(t.updated);
      setEditingCat(null);
      loadCategories(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) toast.error(t.duplicateCategory(normalizedName));
        else toast.error(err.message);
      }
      else toast.error(t.failedUpdate);
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteCat) return;
    setDeletingId(confirmDeleteCat.id);
    setConfirmDeleteCat(null);
    try {
      await api.deleteCategory(confirmDeleteCat.id);
      toast.success(t.deleted);
      loadCategories(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) toast.error(t.deleteBlockedByTransactions);
        else toast.error(err.message);
      }
      else toast.error(t.failedDelete);
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
    if (!id) return site.common.dash;
    return categoryMap.get(id)?.name ?? site.common.dash;
  }

  // Derived: filtered view
  const visibleCategories = categories.filter((c) => {
    if (filterDirection && c.direction !== filterDirection) return false;
    if (filterNameId && c.id !== filterNameId) return false;
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDirection, filterNameId]);

  const totalPages = Math.max(
    1,
    Math.ceil(visibleCategories.length / CATEGORIES_PAGE_SIZE),
  );
  const activePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== activePage) {
      setCurrentPage(activePage);
    }
  }, [activePage, currentPage]);

  const paginatedCategories = useMemo(() => {
    const start = (activePage - 1) * CATEGORIES_PAGE_SIZE;
    return visibleCategories.slice(start, start + CATEGORIES_PAGE_SIZE);
  }, [activePage, visibleCategories]);

  const paginationSummary = getPaginationSummary({
    itemCount: visibleCategories.length,
    pageSize: CATEGORIES_PAGE_SIZE,
    currentPage: activePage,
    totalPages,
    pageOf: t.pageOf,
    showingOfTotal: t.showingOfTotal,
  });

  const groupedCategoryRows = useMemo(() => {
    const directions = filterDirection
      ? [filterDirection as "income" | "expense"]
      : (["income", "expense"] as const);

    return directions.flatMap<CategoryTableRow>((direction) => {
      const rows = paginatedCategories
        .filter((category) => category.direction === direction)
        .map((category) => ({
          type: "category" as const,
          key: category.id,
          category,
        }));

      if (rows.length === 0) return [];

      return [
        {
          type: "separator" as const,
          key: `separator-${direction}`,
          label: direction === "income" ? site.common.income : site.common.expense,
        },
        ...rows,
      ];
    });
  }, [
    filterDirection,
    paginatedCategories,
    site.common.expense,
    site.common.income,
  ]);

  const rowPaddingClass = "py-2";
  const parentWidthClass = "max-w-44";
  const nameCellWidthClass = "min-w-[14rem]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold">{t.filters}</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label>{t.direction}</Label>
            <Select
              value={filterDirection || "__all__"}
              onValueChange={(v) =>
                setFilterDirection(v === "__all__" ? "" : v)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={site.common.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{site.common.all}</SelectItem>
                <SelectItem value="income">{site.common.income}</SelectItem>
                <SelectItem value="expense">{site.common.expense}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{site.common.category}</Label>
            <Select
              value={filterNameId || "__all__"}
              onValueChange={(v) => setFilterNameId(v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={site.common.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{site.common.all}</SelectItem>
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
              {site.common.clearFilters}
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">
            {t.listTitle}
            {visibleCategories.length !== categories.length && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {t.ofTotal(visibleCategories.length, categories.length)}
              </span>
            )}
          </h2>
          <CreateCategoryModal
            categories={categories}
            onCreated={() => loadCategories(true)}
          />
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <Table showMobileScrollHint>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{t.name}</TableHead>
                <TableHead>{t.parentOptional}</TableHead>
                <TableHead className="text-right">
                  {site.common.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t.loading}
                  </TableCell>
                </TableRow>
              ) : visibleCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {t.empty}
                  </TableCell>
                </TableRow>
              ) : (
                groupedCategoryRows.map((row) => {
                  if (row.type === "separator") {
                    return (
                      <TableRow
                        key={row.key}
                        className="bg-muted/15 hover:bg-muted/15"
                      >
                        <TableCell
                          colSpan={3}
                          className="border-y py-1.5 text-xs font-semibold text-muted-foreground"
                        >
                          {row.label}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  const category = row.category;

                  return (
                    <TableRow key={row.key} className="hover:bg-muted/30">
                      <TableCell className={cn(rowPaddingClass, "font-medium")}>
                        <div
                          className={cn(
                            nameCellWidthClass,
                            "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3",
                          )}
                        >
                          <span className="truncate">{category.name}</span>
                          <Badge
                            className={cn(
                              "shrink-0",
                              category.direction === "income"
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                : "bg-rose-100 text-rose-800 hover:bg-rose-100",
                            )}
                          >
                            {category.direction === "income"
                              ? site.common.income
                              : site.common.expense}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          rowPaddingClass,
                          parentWidthClass,
                          "truncate text-muted-foreground",
                        )}
                      >
                        {getParentName(category.parent_id)}
                      </TableCell>
                      <TableCell className={cn(rowPaddingClass, "text-right")}>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditDialog(category)}
                            className="rounded p-1.5 text-cyan-600 transition-colors hover:bg-cyan-500/10 hover:text-cyan-500 dark:text-cyan-300 dark:hover:bg-cyan-400/10 dark:hover:text-cyan-200"
                            title={site.common.edit}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCat(category)}
                            disabled={deletingId === category.id}
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
          {visibleCategories.length > 0 ? (
            <PaginationFooter
              currentPage={activePage}
              totalPages={totalPages}
              pageSizeLabel={t.pageSizeLabel(CATEGORIES_PAGE_SIZE)}
              summaryLabel={paginationSummary}
              previousLabel={t.previousPage}
              nextLabel={t.nextPage}
              onPageChange={setCurrentPage}
            />
          ) : null}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editingCat}
        onOpenChange={(o) => !o && setEditingCat(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit_name">{t.name}</Label>
              <Input id="edit_name" {...registerEdit("name")} />
              {editErrors.name && (
                <p className="text-sm text-destructive">
                  {editErrors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t.direction}</Label>
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
                  <SelectItem value="income">{site.common.income}</SelectItem>
                  <SelectItem value="expense">{site.common.expense}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t.parentOptional}</Label>
              <Select
                value={editParentIdValue ?? "__none__"}
                onValueChange={(v) =>
                  setEditValue("parent_id", v === "__none__" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={site.common.none} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{site.common.none}</SelectItem>
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
                {site.common.cancel}
              </Button>
              <Button type="submit" disabled={editIsSubmitting}>
                {editIsSubmitting ? t.saving : t.save}
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
            <DialogTitle>{t.deleteTitle}</DialogTitle>
            <DialogDescription>
              {t.deleteDescription(confirmDeleteCat?.name ?? "")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteCat(null)}>
              {site.common.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {site.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
