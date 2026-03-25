"use client";

import type { Category } from "@/lib/api";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
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

interface TransactionsFiltersProps {
  categories: Category[];
  parentCategories: Category[];
  filterCategoryId: string;
  filterParentCategoryId: string;
  filterStartDate: string;
  filterEndDate: string;
  activeQuickRange: "today" | "last7" | "thisMonth" | null;
  onFilterCategoryChange: (value: string) => void;
  onFilterParentCategoryChange: (value: string) => void;
  onFilterStartDateChange: (value: string) => void;
  onFilterEndDateChange: (value: string) => void;
  onQuickRangeChange: (range: "today" | "last7" | "thisMonth") => void;
  onClearFilters: () => void;
}

export function TransactionsFilters({
  categories,
  parentCategories,
  filterCategoryId,
  filterParentCategoryId,
  filterStartDate,
  filterEndDate,
  activeQuickRange,
  onFilterCategoryChange,
  onFilterParentCategoryChange,
  onFilterStartDateChange,
  onFilterEndDateChange,
  onQuickRangeChange,
  onClearFilters,
}: TransactionsFiltersProps) {
  const { site } = useSitePreferences();
  const t = site.pages.transactions;
  const hasActiveFilters = !!(
    filterCategoryId ||
    filterParentCategoryId ||
    filterStartDate ||
    filterEndDate
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={activeQuickRange === "today" ? "default" : "outline"}
          onClick={() => onQuickRangeChange("today")}
        >
          {t.quickRangeToday}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeQuickRange === "last7" ? "default" : "outline"}
          onClick={() => onQuickRangeChange("last7")}
        >
          {t.quickRangeLast7}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeQuickRange === "thisMonth" ? "default" : "outline"}
          onClick={() => onQuickRangeChange("thisMonth")}
        >
          {t.quickRangeThisMonth}
        </Button>
        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            {site.common.clearFilters}
          </Button>
        ) : null}
      </div>

      <details className="rounded-lg border bg-card/40 px-3 py-2">
        <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
          {t.moreFilters}
        </summary>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label>{t.parentCategory}</Label>
            <Select
              value={filterParentCategoryId || "__all__"}
              onValueChange={(value) =>
                onFilterParentCategoryChange(value === "__all__" ? "" : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={site.common.all} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{site.common.all}</SelectItem>
                {parentCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t.category}</Label>
            <Select
              value={filterCategoryId || "__all__"}
              onValueChange={(value) =>
                onFilterCategoryChange(value === "__all__" ? "" : value)
              }
            >
              <SelectTrigger className="w-full">
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

          <div className="space-y-1.5">
            <Label htmlFor="start_date">{t.startDate}</Label>
            <Input
              id="start_date"
              type="date"
              value={filterStartDate}
              onChange={(event) => onFilterStartDateChange(event.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="end_date">{t.endDate}</Label>
            <Input
              id="end_date"
              type="date"
              value={filterEndDate}
              onChange={(event) => onFilterEndDateChange(event.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </details>
    </div>
  );
}
