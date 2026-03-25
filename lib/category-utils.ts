import { type Category } from "@/lib/api";

export function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function findDuplicateCategory(
  categories: Category[],
  name: string,
  excludedCategoryId?: string,
) {
  const normalizedName = normalizeCategoryName(name).toLocaleLowerCase();

  return (
    categories.find((category) => {
      if (category.id === excludedCategoryId) return false;

      return (
        normalizeCategoryName(category.name).toLocaleLowerCase() ===
        normalizedName
      );
    }) ?? null
  );
}
