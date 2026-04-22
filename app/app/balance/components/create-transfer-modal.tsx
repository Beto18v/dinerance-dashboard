"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiRepeat } from "react-icons/fi";
import { toast } from "sonner";

import { api, ApiError, type FinancialAccount } from "@/lib/api";
import { normalizeCurrencyCode } from "@/lib/finance";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { getFinancialAccountDisplayName } from "@/lib/financial-accounts";
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

const AMOUNT_PATTERN = /^\d+([.,]\d{0,2})?$/;

type FormValues = {
  source_financial_account_id: string;
  destination_financial_account_id: string;
  amount: string;
  occurred_at: string;
  description: string;
};

export function CreateTransferModal({
  defaultCurrency = "COP",
  financialAccounts,
  timeZone = "UTC",
  onCreated,
}: {
  defaultCurrency?: string;
  financialAccounts: FinancialAccount[];
  timeZone?: string;
  onCreated: () => void;
}) {
  const { site } = useSitePreferences();
  const t = site.pages.balance;
  const transactionValidations = site.pages.transactions.validations;
  const [open, setOpen] = useState(false);

  const defaultSourceAccountId =
    financialAccounts.find((account) => account.is_default)?.id ??
    financialAccounts[0]?.id ??
    "";
  const defaultDestinationAccountId =
    financialAccounts.find((account) => account.id !== defaultSourceAccountId)?.id ??
    "";

  const schema = useMemo(
    () =>
      z
        .object({
          source_financial_account_id: z
            .string()
            .min(1, transactionValidations.accountRequired),
          destination_financial_account_id: z
            .string()
            .min(1, transactionValidations.accountRequired),
          amount: z
            .string()
            .trim()
            .min(1, transactionValidations.amountRequired)
            .regex(AMOUNT_PATTERN, transactionValidations.amountInvalid),
          occurred_at: z.string().min(1, transactionValidations.dateRequired),
          description: z
            .string()
            .trim()
            .min(1, transactionValidations.descriptionRequired),
        })
        .refine(
          (values) =>
            values.source_financial_account_id !==
            values.destination_financial_account_id,
          {
            message: t.distinctAccountsRequired,
            path: ["destination_financial_account_id"],
          },
        ),
    [t.distinctAccountsRequired, transactionValidations],
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
    defaultValues: {
      source_financial_account_id: defaultSourceAccountId,
      destination_financial_account_id: defaultDestinationAccountId,
      amount: "",
      occurred_at: "",
      description: "",
    },
  });

  const sourceAccountId = useWatch({
    control,
    name: "source_financial_account_id",
  });
  const destinationAccountId = useWatch({
    control,
    name: "destination_financial_account_id",
  });
  const amountField = register("amount", {
    onChange: (event) => {
      event.target.value = sanitizeAmountInput(event.target.value);
    },
  });
  const sourceAccount =
    financialAccounts.find((account) => account.id === sourceAccountId) ??
    financialAccounts[0];
  const destinationAccount =
    financialAccounts.find((account) => account.id === destinationAccountId) ??
    financialAccounts.find((account) => account.id !== sourceAccount?.id) ??
    financialAccounts[0];
  const sourceCurrency = normalizeCurrencyCode(
    sourceAccount?.currency ?? defaultCurrency,
  );
  const destinationCurrency = normalizeCurrencyCode(
    destinationAccount?.currency ?? defaultCurrency,
  );
  const currenciesMatch = sourceCurrency === destinationCurrency;
  const resolvedTransferCurrency = currenciesMatch ? sourceCurrency : "";

  useEffect(() => {
    reset({
      source_financial_account_id: defaultSourceAccountId,
      destination_financial_account_id: defaultDestinationAccountId,
      amount: "",
      occurred_at: "",
      description: "",
    });
  }, [defaultDestinationAccountId, defaultSourceAccountId, reset]);

  async function onSubmit(values: FormValues) {
    if (!currenciesMatch) {
      toast.error(t.transferDifferentCurrenciesNotSupported);
      return;
    }

    try {
      await api.createTransfer({
        source_financial_account_id: values.source_financial_account_id,
        destination_financial_account_id: values.destination_financial_account_id,
        amount: normalizeAmountForApi(values.amount),
        currency: resolvedTransferCurrency,
        description: values.description.trim(),
        occurred_at: dateTimeLocalToUtcIso(values.occurred_at, timeZone),
      });
      toast.success(t.transferCreated);
      reset({
        source_financial_account_id: defaultSourceAccountId,
        destination_financial_account_id: defaultDestinationAccountId,
        amount: "",
        occurred_at: "",
        description: "",
      });
      setOpen(false);
      onCreated();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedCreateTransfer);
      }
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={financialAccounts.length < 2}
      >
        <FiRepeat className="mr-1.5" size={15} />
        {t.addTransfer}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            reset({
              source_financial_account_id: defaultSourceAccountId,
              destination_financial_account_id: defaultDestinationAccountId,
              amount: "",
              occurred_at: "",
              description: "",
            });
          }
          setOpen(nextOpen);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.transferTitle}</DialogTitle>
            <DialogDescription>{t.transferDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t.transferFrom}</Label>
                <Select
                  value={sourceAccountId ?? ""}
                  onValueChange={(value) =>
                    setValue("source_financial_account_id", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={site.pages.transactions.accountPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
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
                {errors.source_financial_account_id ? (
                  <p className="text-sm text-destructive">
                    {errors.source_financial_account_id.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>{t.transferTo}</Label>
                <Select
                  value={destinationAccountId ?? ""}
                  onValueChange={(value) =>
                    setValue("destination_financial_account_id", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={site.pages.transactions.accountPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
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
                {errors.destination_financial_account_id ? (
                  <p className="text-sm text-destructive">
                    {errors.destination_financial_account_id.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create_transfer_amount">
                  {site.pages.transactions.amount}
                </Label>
                <Input
                  id="create_transfer_amount"
                  {...amountField}
                  placeholder={site.pages.transactions.amountPlaceholder}
                  inputMode="decimal"
                  autoComplete="off"
                />
                {errors.amount ? (
                  <p className="text-sm text-destructive">
                    {errors.amount.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create_transfer_currency">
                  {site.pages.transactions.currency}
                </Label>
                <Input
                  id="create_transfer_currency"
                  value={resolvedTransferCurrency}
                  disabled
                  readOnly
                />
                {!currenciesMatch ? (
                  <p className="text-sm text-destructive">
                    {t.transferDifferentCurrenciesNotSupported}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create_transfer_occurred_at">
                  {site.pages.transactions.dateTime}
                </Label>
                <Input
                  id="create_transfer_occurred_at"
                  type="datetime-local"
                  {...register("occurred_at")}
                />
                {errors.occurred_at ? (
                  <p className="text-sm text-destructive">
                    {errors.occurred_at.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="create_transfer_description">
                  {site.common.description}
                </Label>
                <Input
                  id="create_transfer_description"
                  {...register("description")}
                />
                {errors.description ? (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                ) : null}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                {site.common.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting || !currenciesMatch}>
                {isSubmitting ? t.creatingTransfer : t.createTransfer}
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
