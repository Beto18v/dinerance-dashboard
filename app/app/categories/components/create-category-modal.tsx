"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FiPlus } from "react-icons/fi";

import { api, ApiError, type Category } from "@/lib/api";
import {
  findDuplicateCategory,
  getTopLevelCategoryOptions,
  normalizeCategoryName,
} from "@/lib/category-utils";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { getSiteText } from "@/lib/site";

import { Button } from "@/components/ui/button";
import { InfoHint } from "@/components/ui/info-hint";
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

const schemaText = getSiteText().pages.categories;

const schema = z.object({
  name: z.string().min(1, schemaText.validations.nameRequired),
  direction: z.enum(["income", "expense"]),
  parent_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateCategoryModalProps {
  categories: Category[];
  onCreated: () => void;
}

export function CreateCategoryModal({
  categories,
  onCreated,
}: CreateCategoryModalProps) {
  const { site } = useSitePreferences();
  const t = site.pages.categories;
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
    defaultValues: { direction: "expense" },
  });

  const directionValue = useWatch({
    control,
    name: "direction",
    defaultValue: "expense",
  });
  const parentIdValue = useWatch({
    control,
    name: "parent_id",
  });
  const groupOptions = useMemo(
    () => getTopLevelCategoryOptions(categories, undefined, directionValue),
    [categories, directionValue],
  );

  useEffect(() => {
    if (!parentIdValue) return;

    const parentStillAvailable = groupOptions.some(
      (category) => category.id === parentIdValue,
    );

    if (!parentStillAvailable) {
      setValue("parent_id", undefined);
    }
  }, [groupOptions, parentIdValue, setValue]);

  async function onSubmit(values: FormValues) {
    const normalizedName = normalizeCategoryName(values.name);
    const selectedParent = groupOptions.find(
      (category) => category.id === values.parent_id,
    );
    const duplicateCategory = findDuplicateCategory(categories, normalizedName);

    if (duplicateCategory) {
      toast.error(t.duplicateCategory(normalizedName));
      return;
    }

    if (values.parent_id && !selectedParent) {
      toast.error(t.groupMustMatchDirection);
      return;
    }

    try {
      await api.createCategory({
        name: normalizedName,
        direction: values.direction,
        parent_id: values.parent_id || null,
      });
      toast.success(t.created);
      reset({ direction: "expense" });
      setOpen(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 && err.message === "Category already exists") {
          toast.error(t.duplicateCategory(normalizedName));
        } else if (
          err.status === 409 &&
          err.message === "Parent category must be top-level"
        ) {
          toast.error(t.groupMustBeTopLevel);
        } else if (
          err.status === 409 &&
          err.message === "Parent category must have same direction"
        ) {
          toast.error(t.groupMustMatchDirection);
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error(t.failedCreate);
      }
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setOpen(true);
        }}
      >
        <FiPlus className="mr-1.5" size={15} />
        {t.addCategory}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            reset({ direction: "expense" });
          }
          setOpen(o);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.newCardTitle}</DialogTitle>
            <DialogDescription>{t.newCardDescription}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create_name">{t.name}</Label>
              <Input
                id="create_name"
                {...register("name")}
                placeholder={t.namePlaceholder}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>{t.direction}</Label>
                <InfoHint
                  title={t.directionHelpTitle}
                  description={t.directionHelpDescription}
                />
              </div>
              <Select
                value={directionValue}
                onValueChange={(v) =>
                  setValue("direction", v as "income" | "expense")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">{site.common.income}</SelectItem>
                  <SelectItem value="expense">{site.common.expense}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>{t.parentOptional}</Label>
                <InfoHint
                  title={t.parentHelpTitle}
                  description={t.parentHelpDescriptionSimple}
                />
              </div>
              <Select
                value={parentIdValue ?? "__none__"}
                onValueChange={(v) =>
                  setValue("parent_id", v === "__none__" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={site.common.none} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{site.common.none}</SelectItem>
                  {groupOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  reset({ direction: "expense" });
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
