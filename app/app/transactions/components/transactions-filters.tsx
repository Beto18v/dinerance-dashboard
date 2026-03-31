"use client";

import type { Category, FinancialAccount } from "@/lib/api";
import { getFinancialAccountDisplayName } from "@/lib/financial-accounts";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionsFiltersProps {
  financialAccounts: FinancialAccount[];
  categories: Category[];
  parentCategories: Category[];
  filterFinancialAccountId: string;
  filterCategoryId: string;
  filterParentCategoryId: string;
  filterStartDate: string;
  filterEndDate: string;
  activeQuickRange: "today" | "last7" | "thisMonth" | null;
  displayMode: "desktop" | "mobile";
  onFilterFinancialAccountChange: (value: string) => void;
  onFilterCategoryChange: (value: string) => void;
  onFilterParentCategoryChange: (value: string) => void;
  onFilterStartDateChange: (value: string) => void;
  onFilterEndDateChange: (value: string) => void;
  onQuickRangeChange: (range: "today" | "last7" | "thisMonth") => void;
  onDisplayModeChange: (value: "desktop" | "mobile") => void;
  onClearFilters: () => void;
}

export function TransactionsFilters({
  financialAccounts,
  categories,
  parentCategories,
  filterFinancialAccountId,
  filterCategoryId,
  filterParentCategoryId,
  filterStartDate,
  filterEndDate,
  activeQuickRange,
  displayMode,
  onFilterFinancialAccountChange,
  onFilterCategoryChange,
  onFilterParentCategoryChange,
  onFilterStartDateChange,
  onFilterEndDateChange,
  onQuickRangeChange,
  onDisplayModeChange,
  onClearFilters,
}: TransactionsFiltersProps) {
  const { site } = useSitePreferences();
  const t = site.pages.transactions;
  const showFinancialAccountFilter = financialAccounts.length > 1;
  const hasActiveFilters = !!(
    filterFinancialAccountId ||
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
        <div className="relative hidden h-9 min-w-40 items-center rounded-lg border bg-muted/60 p-1 md:ml-auto md:grid md:grid-cols-2">
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-background shadow-sm transition-transform duration-200 ease-out",
              displayMode === "mobile" && "translate-x-full",
            )}
          />
          <button
            type="button"
            onClick={() => onDisplayModeChange("desktop")}
            className={cn(
              "relative z-10 rounded-md px-3 text-sm font-medium transition-colors",
              displayMode === "desktop"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={displayMode === "desktop"}
          >
            {t.desktopView}
          </button>
          <button
            type="button"
            onClick={() => onDisplayModeChange("mobile")}
            className={cn(
              "relative z-10 rounded-md px-3 text-sm font-medium transition-colors",
              displayMode === "mobile"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={displayMode === "mobile"}
          >
            {t.mobileView}
          </button>
        </div>
      </div>

      <details className="rounded-lg border bg-card/40 px-3 py-2">
        <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
          {t.moreFilters}
        </summary>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {showFinancialAccountFilter ? (
            <div className="space-y-1.5">
              <Label>{t.account}</Label>
              <Select
                value={filterFinancialAccountId || "__all__"}
                onValueChange={(value) =>
                  onFilterFinancialAccountChange(value === "__all__" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={site.common.all} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{site.common.all}</SelectItem>
                  {financialAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {getFinancialAccountDisplayName(
                        account,
                        site.common.mainFinancialAccount,
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

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
