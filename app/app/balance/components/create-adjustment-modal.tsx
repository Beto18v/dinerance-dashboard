"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiSliders } from "react-icons/fi";
import { toast } from "sonner";

import { api, ApiError, type FinancialAccount } from "@/lib/api";
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

type AdjustmentKind = "opening" | "correction";
type FormValues = {
  financial_account_id?: string;
  kind: AdjustmentKind;
  balance_direction: "in" | "out";
  amount: string;
  occurred_at: string;
  description: string;
};

export function CreateAdjustmentModal({
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
  const defaultAccountId =
    financialAccounts.find((account) => account.is_default)?.id ??
    financialAccounts[0]?.id ??
    "";

  const schema = useMemo(
    () =>
      z.object({
        financial_account_id: z.string().optional(),
        kind: z.enum(["opening", "correction"]),
        balance_direction: z.enum(["in", "out"]),
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
      }),
    [transactionValidations],
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
      financial_account_id: defaultAccountId,
      kind: "opening",
      balance_direction: "in",
      amount: "",
      occurred_at: "",
      description: "",
    },
  });

  const financialAccountId = useWatch({
    control,
    name: "financial_account_id",
  });
  const adjustmentKind = useWatch({
    control,
    name: "kind",
  });
  const balanceDirection = useWatch({
    control,
    name: "balance_direction",
  });
  const amountField = register("amount", {
    onChange: (event) => {
      event.target.value = sanitizeAmountInput(event.target.value);
    },
  });

  useEffect(() => {
    reset({
      financial_account_id: defaultAccountId,
      kind: "opening",
      balance_direction: "in",
      amount: "",
      occurred_at: "",
      description: "",
    });
  }, [defaultAccountId, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await api.createAdjustment({
        financial_account_id: values.financial_account_id || undefined,
        balance_direction: values.balance_direction,
        amount: normalizeAmountForApi(values.amount),
        currency: defaultCurrency,
        description: composeAdjustmentDescription(values.kind, values.description, {
          openingLabel: t.adjustmentTypeOpening,
          correctionLabel: t.adjustmentTypeCorrection,
        }),
        occurred_at: dateTimeLocalToUtcIso(values.occurred_at, timeZone),
      });
      toast.success(t.adjustmentCreated);
      reset({
        financial_account_id: defaultAccountId,
        kind: "opening",
        balance_direction: "in",
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
        toast.error(t.failedCreateAdjustment);
      }
    }
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <FiSliders className="mr-1.5" size={15} />
        {t.addAdjustment}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            reset({
              financial_account_id: defaultAccountId,
              kind: "opening",
              balance_direction: "in",
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
            <DialogTitle>{t.adjustmentTitle}</DialogTitle>
            <DialogDescription>{t.adjustmentDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{site.pages.transactions.account}</Label>
                <Select
                  value={financialAccountId ?? ""}
                  onValueChange={(value) => setValue("financial_account_id", value)}
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
                {errors.financial_account_id ? (
                  <p className="text-sm text-destructive">
                    {errors.financial_account_id.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label>{t.adjustmentType}</Label>
                <Select
                  value={adjustmentKind ?? "opening"}
                  onValueChange={(value) =>
                    setValue("kind", value as AdjustmentKind)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opening">
                      {t.adjustmentTypeOpening}
                    </SelectItem>
                    <SelectItem value="correction">
                      {t.adjustmentTypeCorrection}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t.adjustmentDirection}</Label>
                <Select
                  value={balanceDirection ?? "in"}
                  onValueChange={(value) =>
                    setValue("balance_direction", value as "in" | "out")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">{t.adjustmentDirectionIn}</SelectItem>
                    <SelectItem value="out">{t.adjustmentDirectionOut}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create_adjustment_amount">
                  {site.pages.transactions.amount}
                </Label>
                <Input
                  id="create_adjustment_amount"
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
                <Label htmlFor="create_adjustment_currency">
                  {site.pages.transactions.currency}
                </Label>
                <Input
                  id="create_adjustment_currency"
                  value={defaultCurrency}
                  disabled
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create_adjustment_occurred_at">
                  {site.pages.transactions.dateTime}
                </Label>
                <Input
                  id="create_adjustment_occurred_at"
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
                <Label htmlFor="create_adjustment_description">
                  {site.common.description}
                </Label>
                <Input
                  id="create_adjustment_description"
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t.creatingAdjustment : t.createAdjustment}
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

function composeAdjustmentDescription(
  kind: AdjustmentKind,
  description: string,
  labels: {
    openingLabel: string;
    correctionLabel: string;
  },
) {
  const trimmedDescription = description.trim();
  const prefix =
    kind === "opening" ? labels.openingLabel : labels.correctionLabel;

  if (
    trimmedDescription.toLowerCase().startsWith(
      `${prefix.toLowerCase()}:`,
    )
  ) {
    return trimmedDescription;
  }

  return `${prefix}: ${trimmedDescription}`;
}
