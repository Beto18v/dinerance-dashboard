"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FiPlus } from "react-icons/fi";

import {
  api,
  ApiError,
  type Category,
  type FinancialAccount,
} from "@/lib/api";
import { cacheKeys, setCache } from "@/lib/cache";
import {
  getFinancialAccountDisplayName,
  getFreshFinancialAccountsCache,
  resolveDefaultFinancialAccountId,
} from "@/lib/financial-accounts";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { getSiteText } from "@/lib/site";
import { normalizeCurrencyCode } from "@/lib/finance";
import { dateTimeLocalToUtcIso } from "@/lib/timezone";
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

const schemaText = getSiteText().pages.transactions;
const AMOUNT_PATTERN = /^\d+([.,]\d{0,2})?$/;

const schema = z.object({
  financial_account_id: z.string().optional(),
  category_id: z.string().min(1, schemaText.validations.categoryRequired),
  amount: z
    .string()
    .trim()
    .min(1, schemaText.validations.amountRequired)
    .regex(AMOUNT_PATTERN, schemaText.validations.amountInvalid),
  occurred_at: z.string().min(1, schemaText.validations.dateRequired),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateTransactionModalProps {
  categories: Category[];
  defaultCurrency?: string;
  financialAccounts?: FinancialAccount[];
  timeZone?: string;
  onCreated: () => void;
}

export function CreateTransactionModal({
  categories,
  defaultCurrency = "COP",
  financialAccounts,
  timeZone = "UTC",
  onCreated,
}: CreateTransactionModalProps) {
  const { site } = useSitePreferences();
  const t = site.pages.transactions;
  const cachedFinancialAccounts = getFreshFinancialAccountsCache();
  const [open, setOpen] = useState(false);
  const [internalFinancialAccounts, setInternalFinancialAccounts] = useState<
    FinancialAccount[]
  >(() => cachedFinancialAccounts ?? []);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const usesProvidedFinancialAccounts = financialAccounts !== undefined;
  const resolvedFinancialAccounts =
    financialAccounts ?? internalFinancialAccounts;
  const shouldShowAccountField = resolvedFinancialAccounts.length > 1;
  const defaultFinancialAccountId = resolveDefaultFinancialAccountId(
    resolvedFinancialAccounts,
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const categoryIdValue = useWatch({
    control,
    name: "category_id",
  });
  const financialAccountIdValue = useWatch({
    control,
    name: "financial_account_id",
  });
  const amountField = register("amount", {
    onChange: (event) => {
      event.target.value = sanitizeAmountInput(event.target.value);
    },
  });
  const normalizedDefaultCurrency = normalizeCurrencyCode(defaultCurrency || "COP");

  const loadFinancialAccounts = useCallback(async () => {
    if (usesProvidedFinancialAccounts) {
      return;
    }

    setAccountsLoading(true);
    try {
      const data = await api.getFinancialAccounts();
      setInternalFinancialAccounts(data);
      setCache(cacheKeys.financialAccounts, data);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedLoad);
      }
    } finally {
      setAccountsLoading(false);
    }
  }, [t.failedLoad, usesProvidedFinancialAccounts]);

  useEffect(() => {
    reset();
  }, [normalizedDefaultCurrency, reset]);

  useEffect(() => {
    if (
      shouldShowAccountField &&
      defaultFinancialAccountId &&
      !financialAccountIdValue
    ) {
      setValue("financial_account_id", defaultFinancialAccountId);
    }
  }, [
    defaultFinancialAccountId,
    financialAccountIdValue,
    setValue,
    shouldShowAccountField,
  ]);

  async function onSubmit(values: FormValues) {
    if (shouldShowAccountField && !values.financial_account_id) {
      toast.error(t.validations.accountRequired);
      return;
    }

    try {
      await api.createTransaction({
        financial_account_id: shouldShowAccountField
          ? values.financial_account_id
          : undefined,
        category_id: values.category_id,
        amount: normalizeAmountForApi(values.amount),
        currency: normalizedDefaultCurrency,
        occurred_at: dateTimeLocalToUtcIso(values.occurred_at, timeZone),
        description: values.description || null,
      });
      toast.success(t.created);
      reset();
      setOpen(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(t.failedCreate);
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <FiPlus className="mr-1.5" size={15} />
        {t.addTransaction}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            reset();
          } else if (!usesProvidedFinancialAccounts) {
            void loadFinancialAccounts();
          }
          setOpen(nextOpen);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.newCardTitle}</DialogTitle>
            <DialogDescription>{t.newCardDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {shouldShowAccountField ? (
                <div className="space-y-1.5">
                  <Label>{t.account}</Label>
                  <Select
                    value={financialAccountIdValue ?? ""}
                    onValueChange={(value) =>
                      setValue("financial_account_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.accountPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {resolvedFinancialAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {getFinancialAccountDisplayName(
                            account,
                            site.common.mainFinancialAccount,
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {accountsLoading && resolvedFinancialAccounts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {site.common.loading}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label>{t.category}</Label>
                <Select
                  value={categoryIdValue ?? ""}
                  onValueChange={(v) => setValue("category_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.categoryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-sm text-destructive">
                    {errors.category_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create_amount">{t.amount}</Label>
                <Input
                  id="create_amount"
                  {...amountField}
                  placeholder={t.amountPlaceholder}
                  inputMode="decimal"
                  autoComplete="off"
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create_currency">{t.currency}</Label>
                <Input
                  id="create_currency"
                  value={normalizedDefaultCurrency}
                  disabled
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create_occurred_at">{t.dateTime}</Label>
                <Input
                  id="create_occurred_at"
                  type="datetime-local"
                  {...register("occurred_at")}
                />
                {errors.occurred_at && (
                  <p className="text-sm text-destructive">
                    {errors.occurred_at.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="create_description">
                  {t.descriptionOptional}
                </Label>
                <Input id="create_description" {...register("description")} />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
              >
                {site.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  (!usesProvidedFinancialAccounts &&
                    accountsLoading &&
                    resolvedFinancialAccounts.length === 0)
                }
              >
                {isSubmitting ? t.creating : t.create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
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

function normalizeAmountForApi(value: string) {
  return value.replace(",", ".");
}
