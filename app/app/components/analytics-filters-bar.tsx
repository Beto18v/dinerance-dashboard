"use client";

import { type FinancialAccount } from "@/lib/api";
import { getFinancialAccountDisplayName } from "@/lib/financial-accounts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AnalyticsFiltersBarProps = {
  accountLabel: string;
  allAccountsLabel: string;
  monthLabel: string;
  hasBaseCurrency: boolean;
  hasMultipleFinancialAccounts: boolean;
  financialAccounts: FinancialAccount[];
  selectedFinancialAccountId: string;
  selectedMonth: string;
  mainFinancialAccountLabel: string;
  onSelectedFinancialAccountChange: (value: string) => void;
  onSelectedMonthChange: (value: string) => void;
};

export function AnalyticsFiltersBar({
  accountLabel,
  allAccountsLabel,
  monthLabel,
  hasBaseCurrency,
  hasMultipleFinancialAccounts,
  financialAccounts,
  selectedFinancialAccountId,
  selectedMonth,
  mainFinancialAccountLabel,
  onSelectedFinancialAccountChange,
  onSelectedMonthChange,
}: AnalyticsFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      {hasMultipleFinancialAccounts ? (
        <div className="space-y-1.5">
          <Label htmlFor="analytics-account">{accountLabel}</Label>
          <Select
            value={selectedFinancialAccountId || "__all__"}
            onValueChange={(value) =>
              onSelectedFinancialAccountChange(
                value === "__all__" ? "" : value,
              )
            }
          >
            <SelectTrigger id="analytics-account" className="w-52">
              <SelectValue placeholder={allAccountsLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{allAccountsLabel}</SelectItem>
              {financialAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {getFinancialAccountDisplayName(
                    account,
                    mainFinancialAccountLabel,
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="px-2 text-sm font-medium" htmlFor="analytics-month">
          {monthLabel}
        </label>
        <Input
          id="analytics-month"
          type="month"
          value={selectedMonth}
          disabled={!hasBaseCurrency}
          onChange={(event) => onSelectedMonthChange(event.target.value)}
          className="w-44"
        />
      </div>
    </div>
  );
}
