"use client";

import { useMemo } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import { type Category } from "@/lib/api";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface GroupedCategoriesViewProps {
  categories: Category[];
  allCategories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  deletingId: string | null;
}

type CategoryDirection = "income" | "expense";

interface CategoryGroup {
  key: string;
  parent: Category | null;
  label: string;
  parentVisible: boolean;
  children: Category[];
}

interface CategorySection {
  direction: CategoryDirection;
  groups: CategoryGroup[];
  standalone: Category[];
}

export function GroupedCategoriesView({
  categories,
  allCategories,
  onEdit,
  onDelete,
  deletingId,
}: GroupedCategoriesViewProps) {
  const { site } = useSitePreferences();
  const t = site.pages.categories;

  const groupedSections = useMemo(() => {
    const categoryMap = new Map<string, Category>();

    for (const category of allCategories) {
      categoryMap.set(category.id, category);
    }

    return (["income", "expense"] as const).reduce<CategorySection[]>(
      (sections, direction) => {
        const directionCategories = categories.filter(
          (category) => category.direction === direction,
        );

        if (directionCategories.length === 0) return sections;

        const visibleCategoryIds = new Set(
          directionCategories.map((category) => category.id),
        );
        const childCategoriesByParentId = new Map<string, Category[]>();

        for (const category of directionCategories) {
          if (!category.parent_id) continue;

          const siblings = childCategoriesByParentId.get(category.parent_id) ?? [];
          siblings.push(category);
          childCategoriesByParentId.set(category.parent_id, siblings);
        }

        const groups: CategoryGroup[] = [];
        const groupedParentIds = new Set<string>();

        for (const category of directionCategories) {
          const children = childCategoriesByParentId.get(category.id);

          if (category.parent_id || !children?.length) continue;

          groups.push({
            key: `parent-${category.id}`,
            parent: category,
            label: category.name,
            parentVisible: true,
            children: [...children].sort((a, b) => a.name.localeCompare(b.name)),
          });
          groupedParentIds.add(category.id);
        }

        for (const [parentId, children] of childCategoriesByParentId.entries()) {
          if (groupedParentIds.has(parentId) || visibleCategoryIds.has(parentId)) {
            continue;
          }

          groups.push({
            key: `context-${parentId}`,
            parent: categoryMap.get(parentId) ?? null,
            label: categoryMap.get(parentId)?.name ?? t.unknownParent,
            parentVisible: false,
            children: [...children].sort((a, b) => a.name.localeCompare(b.name)),
          });
        }

        const standalone = directionCategories
          .filter(
            (category) => !category.parent_id && !groupedParentIds.has(category.id),
          )
          .sort((a, b) => a.name.localeCompare(b.name));

        sections.push({
          direction,
          groups: groups.sort((a, b) => a.label.localeCompare(b.label)),
          standalone,
        });

        return sections;
      },
      [],
    );
  }, [allCategories, categories, t.unknownParent]);

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border bg-card px-4 py-8 text-center text-muted-foreground shadow-sm">
        {t.empty}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groupedSections.map((section) => (
        <div key={section.direction} className="space-y-3">
          <div className="border-b pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {section.direction === "income"
              ? site.common.income
              : site.common.expense}
          </div>

          {section.groups.map((group) => (
            <div
              key={group.key}
              className="overflow-hidden rounded-lg border bg-card shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 border-b bg-muted/25 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{group.label}</p>
                    <Badge
                      className={cn(
                        section.direction === "income"
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          : "bg-rose-100 text-rose-800 hover:bg-rose-100",
                      )}
                    >
                      {section.direction === "income"
                        ? site.common.income
                        : site.common.expense}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t.subcategoriesCount(group.children.length)}
                  </p>
                </div>
                {group.parent && group.parentVisible ? (
                  <CategoryRowActions
                    category={group.parent}
                    deletingId={deletingId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    editLabel={site.common.edit}
                    deleteLabel={site.common.delete}
                  />
                ) : null}
              </div>

              <div className="divide-y">
                {group.children.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.subcategoryLabel}
                      </p>
                    </div>
                    <CategoryRowActions
                      category={category}
                      deletingId={deletingId}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      editLabel={site.common.edit}
                      deleteLabel={site.common.delete}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {section.standalone.length > 0 ? (
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
              <div className="border-b bg-muted/25 px-4 py-3">
                <p className="font-semibold">{t.uncategorizedGroup}</p>
                <p className="text-xs text-muted-foreground">
                  {t.categoriesCount(section.standalone.length)}
                </p>
              </div>

              <div className="divide-y">
                {section.standalone.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{category.name}</p>
                        <Badge
                          className={cn(
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
                    </div>
                    <CategoryRowActions
                      category={category}
                      deletingId={deletingId}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      editLabel={site.common.edit}
                      deleteLabel={site.common.delete}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CategoryRowActions({
  category,
  deletingId,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  category: Category;
  deletingId: string | null;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <div className="flex shrink-0 justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(category)}
        className="rounded p-1.5 text-cyan-600 transition-colors hover:bg-cyan-500/10 hover:text-cyan-500 dark:text-cyan-300 dark:hover:bg-cyan-400/10 dark:hover:text-cyan-200"
        title={editLabel}
      >
        <FiEdit2 size={14} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(category)}
        disabled={deletingId === category.id}
        className="rounded p-1.5 text-rose-600 transition-colors hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-40 dark:text-rose-300 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
        title={deleteLabel}
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  );
}
