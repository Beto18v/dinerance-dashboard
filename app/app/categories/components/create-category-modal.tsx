"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FiHelpCircle, FiPlus } from "react-icons/fi";

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
  const [parentHelpOpen, setParentHelpOpen] = useState(false);
  const [parentHelpUsesHover, setParentHelpUsesHover] = useState(false);

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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    function syncInteractionMode() {
      setParentHelpUsesHover(mediaQuery.matches);
      setParentHelpOpen(false);
    }

    syncInteractionMode();

    mediaQuery.addEventListener("change", syncInteractionMode);

    return () => {
      mediaQuery.removeEventListener("change", syncInteractionMode);
    };
  }, []);

  async function onSubmit(values: FormValues) {
    try {
      await api.createCategory({
        name: values.name,
        direction: values.direction,
        parent_id: values.parent_id || null,
      });
      toast.success(t.created);
      reset({ direction: "expense" });
      setParentHelpOpen(false);
      setOpen(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(t.failedCreate);
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          setParentHelpOpen(false);
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
            setParentHelpOpen(false);
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
              <Label>{t.direction}</Label>
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
              <div
                className="relative flex items-center gap-2"
                onMouseEnter={() => {
                  if (parentHelpUsesHover) setParentHelpOpen(true);
                }}
                onMouseLeave={() => {
                  if (parentHelpUsesHover) setParentHelpOpen(false);
                }}
              >
                <Label>{t.parentOptional}</Label>
                <button
                  type="button"
                  onClick={() => {
                    if (!parentHelpUsesHover) {
                      setParentHelpOpen((current) => !current);
                    }
                  }}
                  onFocus={() => setParentHelpOpen(true)}
                  onBlur={() => {
                    if (!parentHelpUsesHover) return;
                    setParentHelpOpen(false);
                  }}
                  aria-label={t.parentHelpTitle}
                  aria-expanded={parentHelpOpen}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <FiHelpCircle size={15} />
                </button>

                {parentHelpOpen && (
                  <div className="absolute left-0 top-full z-10 mt-2 w-72 max-w-[calc(100vw-6rem)] rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-md">
                    <p className="font-medium">{t.parentHelpTitle}</p>
                    <p className="mt-1 text-muted-foreground">
                      {t.parentHelpDescription}
                    </p>
                  </div>
                )}
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
                  {categories.map((c) => (
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
                  setParentHelpOpen(false);
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
