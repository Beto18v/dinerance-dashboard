"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FiPlus } from "react-icons/fi";

import { api, ApiError, type Category } from "@/lib/api";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { getSiteText } from "@/lib/site";
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

const schema = z.object({
  category_id: z.string().min(1, schemaText.validations.categoryRequired),
  amount: z.string().min(1, schemaText.validations.amountRequired),
  currency: z.string().min(1, schemaText.validations.currencyRequired),
  occurred_at: z.string().min(1, schemaText.validations.dateRequired),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateTransactionModalProps {
  categories: Category[];
  onCreated: () => void;
}

export function CreateTransactionModal({
  categories,
  onCreated,
}: CreateTransactionModalProps) {
  const { site } = useSitePreferences();
  const t = site.pages.transactions;
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "COP" },
  });

  const categoryIdValue = useWatch({
    control,
    name: "category_id",
  });

  async function onSubmit(values: FormValues) {
    try {
      await api.createTransaction({
        category_id: values.category_id,
        amount: values.amount,
        currency: values.currency,
        occurred_at: new Date(values.occurred_at).toISOString(),
        description: values.description || null,
      });
      toast.success(t.created);
      reset({ currency: "COP" });
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
        onOpenChange={(o) => {
          if (!o) reset({ currency: "COP" });
          setOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.newCardTitle}</DialogTitle>
            <DialogDescription>{t.newCardDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  {...register("amount")}
                  placeholder={t.amountPlaceholder}
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
                  {...register("currency")}
                  placeholder={t.currencyPlaceholder}
                />
                {errors.currency && (
                  <p className="text-sm text-destructive">
                    {errors.currency.message}
                  </p>
                )}
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
                  reset({ currency: "COP" });
                  setOpen(false);
                }}
              >
                {site.common.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t.creating : t.create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
