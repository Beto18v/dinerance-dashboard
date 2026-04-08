"use client";

import { type FormEvent } from "react";

import {
  type Category,
  type FinancialAccount,
  type ObligationCadence,
} from "@/lib/api";
import { getFinancialAccountDisplayName } from "@/lib/financial-accounts";
import { type SiteText } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ObligationFormState = {
  name: string;
  amount: string;
  cadence: ObligationCadence;
  next_due_date: string;
  category_id: string;
  expected_financial_account_id: string;
  source_recurring_candidate_key: string;
};

export const EMPTY_OBLIGATION_FORM: ObligationFormState = {
  name: "",
  amount: "",
  cadence: "monthly",
  next_due_date: "",
  category_id: "",
  expected_financial_account_id: "",
  source_recurring_candidate_key: "",
};

type ObligationFormModalProps = {
  canSubmit: boolean;
  expenseCategories: Category[];
  financialAccounts: FinancialAccount[];
  form: ObligationFormState;
  hasFinancialProfile: boolean;
  mainFinancialAccountLabel: string;
  mode: "create" | "edit";
  open: boolean;
  prefillApplied: boolean;
  site: SiteText;
  submitting: boolean;
  onFormChange: (updates: Partial<ObligationFormState>) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ObligationFormModal({
  canSubmit,
  expenseCategories,
  financialAccounts,
  form,
  hasFinancialProfile,
  mainFinancialAccountLabel,
  mode,
  open,
  prefillApplied,
  site,
  submitting,
  onFormChange,
  onOpenChange,
  onSubmit,
}: ObligationFormModalProps) {
  const t = site.pages.obligations;
  const isEditing = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t.editFormTitle : t.createFormTitle}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t.editFormDescription : t.createFormDescription}
          </DialogDescription>
        </DialogHeader>

        {!hasFinancialProfile ? (
          <p className="text-sm text-muted-foreground">{t.missingProfile}</p>
        ) : expenseCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.missingExpenseCategory}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {prefillApplied ? (
              <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                {t.prefillAppliedFriendly}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="obligation_name">{t.name}</Label>
                <Input
                  id="obligation_name"
                  value={form.name}
                  onChange={(event) =>
                    onFormChange({
                      name: event.target.value,
                    })
                  }
                  placeholder={t.namePlaceholder}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="obligation_amount">{t.amount}</Label>
                <Input
                  id="obligation_amount"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) =>
                    onFormChange({
                      amount: sanitizeAmountInput(event.target.value),
                    })
                  }
                  placeholder={t.amountPlaceholder}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="obligation_due_date">{t.nextDueDate}</Label>
                <Input
                  id="obligation_due_date"
                  type="date"
                  value={form.next_due_date}
                  onChange={(event) =>
                    onFormChange({
                      next_due_date: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="obligation_cadence">{t.cadence}</Label>
                <Select
                  value={form.cadence}
                  onValueChange={(value) =>
                    onFormChange({
                      cadence: resolveCadence(value),
                    })
                  }
                >
                  <SelectTrigger id="obligation_cadence">
                    <SelectValue placeholder={t.cadencePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t.cadenceMonthly}</SelectItem>
                    <SelectItem value="biweekly">{t.cadenceBiweekly}</SelectItem>
                    <SelectItem value="weekly">{t.cadenceWeekly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="obligation_category">{t.category}</Label>
                <Select
                  value={form.category_id || "__placeholder__"}
                  onValueChange={(value) =>
                    onFormChange({
                      category_id: value === "__placeholder__" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger id="obligation_category">
                    <SelectValue placeholder={t.categoryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__placeholder__">
                      {t.categoryPlaceholder}
                    </SelectItem>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="obligation_expected_account">
                  {t.expectedAccount}
                </Label>
                <Select
                  value={form.expected_financial_account_id || "__none__"}
                  onValueChange={(value) =>
                    onFormChange({
                      expected_financial_account_id:
                        value === "__none__" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger id="obligation_expected_account">
                    <SelectValue placeholder={t.expectedAccountPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t.noExpectedAccount}</SelectItem>
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
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                {site.common.cancel}
              </Button>
              <Button type="submit" disabled={submitting || !canSubmit}>
                {submitting
                  ? isEditing
                    ? t.updating
                    : t.creating
                  : isEditing
                    ? t.updateAction
                    : t.createAction}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function sanitizeAmountInput(value: string) {
  const sanitizedValue = value.replace(/[^\d.,]/g, "");
  const separatorIndex = sanitizedValue.search(/[.,]/);

  if (separatorIndex === -1) return sanitizedValue;

  const separator = sanitizedValue[separatorIndex];
  const integerPart = sanitizedValue
    .slice(0, separatorIndex)
    .replace(/[^\d]/g, "");
  const decimalPart = sanitizedValue
    .slice(separatorIndex + 1)
    .replace(/[^\d]/g, "");

  return `${integerPart || "0"}${separator}${decimalPart}`;
}

function resolveCadence(value: string): ObligationCadence {
  if (value === "weekly" || value === "biweekly" || value === "monthly") {
    return value;
  }

  return "monthly";
}
