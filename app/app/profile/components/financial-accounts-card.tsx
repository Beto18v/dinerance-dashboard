"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type FinancialAccount } from "@/lib/api";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { CreateFinancialAccountModal } from "@/app/app/components/create-financial-account-modal";
import {
  cacheKeys,
  invalidateCacheKey,
  setCache,
  subscribeToCacheKeys,
} from "@/lib/cache";
import {
  getFinancialAccountDisplayName,
  getFreshFinancialAccountsCache,
} from "@/lib/financial-accounts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoHint } from "@/components/ui/info-hint";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FinancialAccountsCard() {
  const { site } = useSitePreferences();
  const t = site.pages.profile;
  const cachedAccounts = getFreshFinancialAccountsCache();
  const [accounts, setAccounts] = useState<FinancialAccount[]>(
    () => cachedAccounts ?? [],
  );
  const [loading, setLoading] = useState(() => !cachedAccounts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(
    null,
  );
  const [confirmDeleteAccount, setConfirmDeleteAccount] =
    useState<FinancialAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingDefaultId, setUpdatingDefaultId] = useState<string | null>(null);

  const loadAccounts = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const data = await api.getFinancialAccounts();
        setAccounts(data);
        setCache(cacheKeys.financialAccounts, data);
      } catch (error) {
        if (!silent) {
          if (error instanceof ApiError) {
            toast.error(getFinancialAccountErrorMessage(error, t));
          } else {
            toast.error(t.financialAccountsFailedLoad);
          }
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [t],
  );

  useEffect(() => {
    void loadAccounts(Boolean(getFreshFinancialAccountsCache()));
  }, [loadAccounts]);

  useEffect(() => {
    return subscribeToCacheKeys([cacheKeys.financialAccounts], () => {
      void loadAccounts(true);
    });
  }, [loadAccounts]);

  function openEditDialog(account: FinancialAccount) {
    setEditingAccount(account);
    setDraftName(getAccountDisplayName(account));
    setDialogOpen(true);
  }

  function getAccountDisplayName(account: FinancialAccount) {
    return getFinancialAccountDisplayName(account, site.common.mainFinancialAccount);
  }

  async function handleSaveAccount() {
    if (!editingAccount) {
      return;
    }

    const normalizedName = draftName.trim();
    if (!normalizedName) {
      toast.error(t.financialAccountsNameRequired);
      return;
    }

    setSubmitting(true);
    try {
      await api.updateFinancialAccount(editingAccount.id, {
        name: normalizedName,
      });
      toast.success(t.financialAccountsUpdated);

      setDialogOpen(false);
      setDraftName("");
      setEditingAccount(null);
      invalidateCacheKey(cacheKeys.financialAccounts);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(getFinancialAccountErrorMessage(error, t));
      } else {
        toast.error(t.financialAccountsFailedUpdate);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetDefault(account: FinancialAccount) {
    if (account.is_default) {
      return;
    }

    setUpdatingDefaultId(account.id);
    try {
      await api.updateFinancialAccount(account.id, { is_default: true });
      toast.success(t.financialAccountsDefaultUpdated);
      invalidateCacheKey(cacheKeys.financialAccounts);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(getFinancialAccountErrorMessage(error, t));
      } else {
        toast.error(t.financialAccountsFailedSetDefault);
      }
    } finally {
      setUpdatingDefaultId(null);
    }
  }

  async function handleDeleteAccount() {
    if (!confirmDeleteAccount) {
      return;
    }

    setDeletingId(confirmDeleteAccount.id);
    try {
      await api.deleteFinancialAccount(confirmDeleteAccount.id);
      toast.success(t.financialAccountsDeleted);
      setConfirmDeleteAccount(null);
      invalidateCacheKey(cacheKeys.financialAccounts);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(getFinancialAccountErrorMessage(error, t));
      } else {
        toast.error(t.financialAccountsFailedDelete);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  {t.financialAccountsTitle}
                </CardTitle>
                <InfoHint
                  title={t.financialAccountsHelpTitle}
                  description={t.financialAccountsHelpDescription}
                />
              </div>
              <CardDescription>
                {t.financialAccountsDescription}
              </CardDescription>
            </div>
            <CreateFinancialAccountModal size="sm" />
          </div>
          <p className="text-xs text-muted-foreground">
            {t.financialAccountsDefaultHint}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{site.common.loading}</p>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-xl border bg-muted/20 px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">
                        {getAccountDisplayName(account)}
                      </p>
                      {account.is_default ? (
                        <Badge variant="secondary">
                          {t.financialAccountsDefaultBadge}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {account.currency ?? site.common.dash}
                    </p>
                  </div>

                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                    {!account.is_default ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-primary/25 text-primary hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        onClick={() => void handleSetDefault(account)}
                        disabled={updatingDefaultId === account.id}
                      >
                        {t.financialAccountsSetDefault}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-foreground/75 hover:bg-accent/60 hover:text-foreground"
                      onClick={() => openEditDialog(account)}
                    >
                      {site.common.edit}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setConfirmDeleteAccount(account)}
                      disabled={accounts.length === 1 || deletingId === account.id}
                    >
                      {site.common.delete}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAccount(null);
            setDraftName("");
          }
          setDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.financialAccountsEditTitle}</DialogTitle>
            <DialogDescription>
              {t.financialAccountsDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="financial_account_name">
              {t.financialAccountsNameLabel}
            </Label>
            <Input
              id="financial_account_name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={t.financialAccountsNamePlaceholder}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              {site.common.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveAccount()}
              disabled={submitting}
            >
              {submitting ? t.saving : site.common.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDeleteAccount}
        onOpenChange={(open) => !open && setConfirmDeleteAccount(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.financialAccountsDeleteTitle}</DialogTitle>
            <DialogDescription>
              {t.financialAccountsDeleteDescription(
                confirmDeleteAccount
                  ? getAccountDisplayName(confirmDeleteAccount)
                  : "",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteAccount(null)}
            >
              {site.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDeleteAccount()}
              disabled={deletingId === confirmDeleteAccount?.id}
            >
              {site.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getFinancialAccountErrorMessage(
  error: ApiError,
  t: ReturnType<typeof useSitePreferences>["site"]["pages"]["profile"],
) {
  const blockedByTransactionsMatch = error.message.match(
    /^Financial account has (\d+) transaction(?:s)?$/,
  );
  if (blockedByTransactionsMatch) {
    return t.financialAccountsDeleteBlockedByTransactions(
      Number(blockedByTransactionsMatch[1]),
    );
  }

  if (error.message === "At least one financial account is required") {
    return t.financialAccountsCannotDeleteLast;
  }

  if (error.message === "A default financial account is required") {
    return t.financialAccountsDefaultRequired;
  }

  if (error.message === "Financial account not found") {
    return t.financialAccountsNotFound;
  }

  return error.message;
}
