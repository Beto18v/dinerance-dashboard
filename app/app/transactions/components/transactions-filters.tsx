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
  filterCategoryId: string;
  filterStartDate: string;
  filterEndDate: string;
  onFilterCategoryChange: (value: string) => void;
  onFilterStartDateChange: (value: string) => void;
  onFilterEndDateChange: (value: string) => void;
  onClearFilters: () => void;
}

export function TransactionsFilters({
  categories,
  filterCategoryId,
  filterStartDate,
  filterEndDate,
  onFilterCategoryChange,
  onFilterStartDateChange,
  onFilterEndDateChange,
  onClearFilters,
}: TransactionsFiltersProps) {
  const { site } = useSitePreferences();
  const t = site.pages.transactions;
  const hasActiveFilters = !!(
    filterCategoryId ||
    filterStartDate ||
    filterEndDate
  );

  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold">{t.filters}</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>{t.category}</Label>
          <Select
            value={filterCategoryId || "__all__"}
            onValueChange={(value) =>
              onFilterCategoryChange(value === "__all__" ? "" : value)
            }
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

        <div className="space-y-1.5">
          <Label htmlFor="start_date">{t.startDate}</Label>
          <Input
            id="start_date"
            type="date"
            value={filterStartDate}
            onChange={(event) => onFilterStartDateChange(event.target.value)}
            className="w-40"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="end_date">{t.endDate}</Label>
          <Input
            id="end_date"
            type="date"
            value={filterEndDate}
            onChange={(event) => onFilterEndDateChange(event.target.value)}
            className="w-40"
          />
        </div>

        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            {site.common.clearFilters}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
