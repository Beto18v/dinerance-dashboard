"use client";

import { useState, type ComponentProps } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { cacheKeys, invalidateCacheKey } from "@/lib/cache";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
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

type CreateFinancialAccountModalProps = {
  buttonClassName?: string;
  label?: string;
  onCreated?: () => void;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
};

export function CreateFinancialAccountModal({
  buttonClassName,
  label,
  onCreated,
  size = "default",
  variant = "default",
}: CreateFinancialAccountModalProps) {
  const { site } = useSitePreferences();
  const t = site.pages.profile;
  const triggerLabel = label ?? t.financialAccountsAdd;
  const [draftName, setDraftName] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function resetDialog() {
    setDraftName("");
    setSubmitting(false);
  }

  async function handleCreateAccount() {
    const normalizedName = draftName.trim();
    if (!normalizedName) {
      toast.error(t.financialAccountsNameRequired);
      return;
    }

    setSubmitting(true);
    try {
      await api.createFinancialAccount({ name: normalizedName });
      toast.success(t.financialAccountsCreated);
      setOpen(false);
      resetDialog();
      invalidateCacheKey(cacheKeys.financialAccounts);
      onCreated?.();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.financialAccountsFailedCreate);
      }
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={buttonClassName}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            resetDialog();
          }
          setOpen(nextOpen);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.financialAccountsCreateTitle}</DialogTitle>
            <DialogDescription>
              {t.financialAccountsDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="create_financial_account_name">
              {t.financialAccountsNameLabel}
            </Label>
            <Input
              id="create_financial_account_name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={t.financialAccountsNamePlaceholder}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {site.common.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreateAccount()}
              disabled={submitting}
            >
              {submitting ? t.saving : triggerLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
