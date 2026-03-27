"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { api, ApiError, type Category } from "@/lib/api";
import {
  cacheKeys,
  cacheTtls,
  getCache,
  invalidateCacheKey,
  setCache,
  subscribeToCacheKeys,
} from "@/lib/cache";
import {
  findDuplicateCategory,
  getTopLevelCategoryOptions,
  isGroupCategory,
  normalizeCategoryName,
} from "@/lib/category-utils";
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
import { CreateCategoryModal } from "./components/create-category-modal";
import { GroupedCategoriesView } from "./components/grouped-categories-view";

const schemaText = getSiteText().pages.categories;

const schema = z.object({
  name: z.string().min(1, schemaText.validations.nameRequired),
  direction: z.enum(["income", "expense"]),
  parent_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CategoriesPage() {
  const { site } = useSitePreferences();
  const t = site.pages.categories;
  const [categories, setCategories] = useState<Category[]>(
    () =>
      getCache<Category[]>(cacheKeys.categories, {
        maxAgeMs: cacheTtls.categories,
      }) ?? [],
  );
  const [listLoading, setListLoading] = useState(
    () =>
      !getCache<Category[]>(cacheKeys.categories, {
        maxAgeMs: cacheTtls.categories,
      }),
  );
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<Category | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterDirection, setFilterDirection] = useState<string>("");
  const [filterNameId, setFilterNameId] = useState<string>("");

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
  const editingCatHasChildren = editingCat
    ? isGroupCategory(categories, editingCat.id)
    : false;
  const groupOptions = useMemo(
    () =>
      getTopLevelCategoryOptions(
        categories,
        editingCat?.id,
        editDirectionValue ?? editingCat?.direction,
      ),
    [categories, editDirectionValue, editingCat?.direction, editingCat?.id],
  );

  useEffect(() => {
    if (!editParentIdValue || editParentIdValue === "__none__") return;

    const parentStillAvailable = groupOptions.some(
      (category) => category.id === editParentIdValue,
    );

    if (!parentStillAvailable) {
      setEditValue("parent_id", undefined);
    }
  }, [editParentIdValue, groupOptions, setEditValue]);

  const loadCategories = useCallback(
    async (silent = false) => {
      if (!silent) setListLoading(true);
      try {
        const data = await api.getCategories();
        setCategories(data);
        setCache(cacheKeys.categories, data);
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
    loadCategories(
      !!getCache<Category[]>(cacheKeys.categories, {
        maxAgeMs: cacheTtls.categories,
      }),
    );
  }, [loadCategories]);

  useEffect(() => {
    return subscribeToCacheKeys([cacheKeys.categories], () => {
      void loadCategories(true);
    });
  }, [loadCategories]);

  function openEditDialog(category: Category) {
    setEditingCat(category);
    resetEdit({
      name: category.name,
      direction: category.direction,
      parent_id: category.parent_id ?? "__none__",
    });
  }

  async function onEditSubmit(values: FormValues) {
    if (!editingCat) return;

    const normalizedName = normalizeCategoryName(values.name);
    const selectedParentId =
      values.parent_id === "__none__" ? undefined : values.parent_id;
    const parentChanged = selectedParentId !== (editingCat.parent_id ?? undefined);
    const directionChanged = values.direction !== editingCat.direction;
    const duplicateCategory = findDuplicateCategory(
      categories,
      normalizedName,
      editingCat.id,
    );

    if (duplicateCategory) {
      toast.error(t.duplicateCategory(normalizedName));
      return;
    }

    if (editingCatHasChildren && directionChanged) {
      toast.error(t.groupDirectionCannotChange);
      return;
    }

    if (
      parentChanged &&
      selectedParentId &&
      isGroupCategory(categories, editingCat.id)
    ) {
      toast.error(t.groupCannotBecomeSubcategory);
      return;
    }

    if (
      selectedParentId &&
      !groupOptions.some((category) => category.id === selectedParentId)
    ) {
      toast.error(t.groupMustMatchDirection);
      return;
    }

    try {
      const updatePayload: {
        name: string;
        direction: "income" | "expense";
        parent_id?: string | null;
      } = {
        name: normalizedName,
        direction: values.direction,
      };

      if (parentChanged) {
        updatePayload.parent_id = selectedParentId || null;
      }

      await api.updateCategory(editingCat.id, updatePayload);
      toast.success(t.updated);
      setEditingCat(null);
      invalidateCacheKey(cacheKeys.categories);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 && err.message === "Category already exists") {
          toast.error(t.duplicateCategory(normalizedName));
        } else if (
          err.status === 409 &&
          err.message === "Category already acts as a group"
        ) {
          toast.error(t.groupCannotBecomeSubcategory);
        } else if (
          err.status === 409 &&
          err.message === "Parent category must be top-level"
        ) {
          toast.error(t.groupMustBeTopLevel);
        } else if (
          err.status === 409 &&
          err.message === "Parent category must have same direction"
        ) {
          toast.error(t.groupMustMatchDirection);
        } else if (
          err.status === 409 &&
          err.message === "Group direction cannot change while it has subcategories"
        ) {
          toast.error(t.groupDirectionCannotChange);
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error(t.failedUpdate);
      }
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteCat) return;

    setDeletingId(confirmDeleteCat.id);
    setConfirmDeleteCat(null);

    try {
      await api.deleteCategory(confirmDeleteCat.id);
      toast.success(t.deleted);
      invalidateCacheKey(cacheKeys.categories);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 && err.message === "Category has transactions") {
          toast.error(t.deleteBlockedByTransactions);
        } else if (
          err.status === 409 &&
          err.message === "Category has subcategories"
        ) {
          toast.error(t.deleteBlockedBySubcategories);
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error(t.failedDelete);
      }
    } finally {
      setDeletingId(null);
    }
  }

  const visibleCategories = categories.filter((category) => {
    if (filterDirection && category.direction !== filterDirection) return false;
    if (filterNameId && category.id !== filterNameId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold">{t.filters}</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>{t.direction}</Label>
            <Select
              value={filterDirection || "__all__"}
              onValueChange={(value) =>
                setFilterDirection(value === "__all__" ? "" : value)
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
              onValueChange={(value) => setFilterNameId(value === "__all__" ? "" : value)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={site.common.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{site.common.all}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
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
            onCreated={() => invalidateCacheKey(cacheKeys.categories)}
          />
        </div>

        {listLoading ? (
          <div className="rounded-lg border bg-card px-4 py-8 text-center text-muted-foreground shadow-sm">
            {t.loading}
          </div>
        ) : (
          <GroupedCategoriesView
            categories={visibleCategories}
            allCategories={categories}
            onEdit={openEditDialog}
            onDelete={setConfirmDeleteCat}
            deletingId={deletingId}
          />
        )}
      </div>

      <Dialog
        open={!!editingCat}
        onOpenChange={(open) => !open && setEditingCat(null)}
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
                onValueChange={(value) =>
                  setEditValue("direction", value as "income" | "expense")
                }
                disabled={editingCatHasChildren}
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
                onValueChange={(value) =>
                  setEditValue("parent_id", value === "__none__" ? undefined : value)
                }
                disabled={editingCatHasChildren}
              >
                <SelectTrigger>
                  <SelectValue placeholder={site.common.none} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{site.common.none}</SelectItem>
                  {groupOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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

      <Dialog
        open={!!confirmDeleteCat}
        onOpenChange={(open) => !open && setConfirmDeleteCat(null)}
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
