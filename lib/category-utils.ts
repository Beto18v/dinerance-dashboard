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

export function isGroupCategory(categories: Category[], categoryId: string) {
  return categories.some((category) => category.parent_id === categoryId);
}

export function getTopLevelCategoryOptions(
  categories: Category[],
  excludedCategoryId?: string,
  direction?: Category["direction"],
) {
  return categories.filter((category) => {
    if (category.id === excludedCategoryId) return false;
    if (category.parent_id) return false;
    if (direction && category.direction !== direction) return false;
    return true;
  });
}
