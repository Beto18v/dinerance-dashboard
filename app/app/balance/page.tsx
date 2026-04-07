"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  api,
  ApiError,
  type LedgerMovement,
} from "@/lib/api";
import {
  cacheKeys,
  invalidateCacheKeys,
} from "@/lib/cache";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountBalancesCard } from "./components/account-balances-card";
import { BalanceOnboardingCard } from "./components/balance-onboarding-card";
import { CurrentCashCard } from "./components/current-cash-card";
import { CreateAdjustmentModal } from "./components/create-adjustment-modal";
import { CreateTransferModal } from "./components/create-transfer-modal";
import { RecentActivityCard } from "./components/recent-activity-card";
import { useBalanceOnboardingState } from "./use-balance-onboarding-state";
import { useLedgerPageState } from "./use-ledger-page-state";

const ALL_ACCOUNTS_FILTER = "__all_accounts__";

export default function BalancePage() {
  const {
    activity,
    balanceCurrency,
    consolidatedBalance,
    displayedAccountBalances,
    financialAccounts,
    handleSelectedFinancialAccountChange,
    hasMultipleFinancialAccounts,
    loading,
    refreshLedger,
    selectedAccountBalance,
    selectedFinancialAccountId,
    selectedFinancialAccountName,
    site,
    timeZone,
  } = useLedgerPageState();
  const {
    categories,
    hasBaseCurrency,
    hasTimeZone,
    hasTransactions,
    isCheckingRequirements,
    onProfileUpdated,
    profile,
    showOnboarding,
  } = useBalanceOnboardingState();
  const t = site.pages.balance;
  const locale = displayLocale(site.metadata.htmlLang);
  const currentCashCardRef = useRef<HTMLDivElement | null>(null);
  const [movementPendingDelete, setMovementPendingDelete] =
    useState<LedgerMovement | null>(null);
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(
    null,
  );
  const [currentCashCardHeight, setCurrentCashCardHeight] = useState<
    number | null
  >(null);

  const hasLedgerActivity = activity.length > 0;
  const hasAccountBalances = displayedAccountBalances.length > 0;
  const hasNonZeroBalances = displayedAccountBalances.some(
    (account) => Number(account.balance) !== 0,
  );
  const showEmptyState =
    !showOnboarding &&
    !isCheckingRequirements &&
    !hasLedgerActivity &&
    !hasNonZeroBalances;
  const showOperationalActions = !showOnboarding && !isCheckingRequirements;
  const activityScopeLabel =
    selectedFinancialAccountName ?? t.allAccountsActivityLabel;

  useEffect(() => {
    const element = currentCashCardRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateHeight = () => {
      setCurrentCashCardHeight(Math.round(element.getBoundingClientRect().height));
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [showEmptyState, displayedAccountBalances.length, selectedAccountBalance]);

  const deleteDialog = useMemo(() => {
    if (!movementPendingDelete) {
      return {
        title: "",
        description: "",
      };
    }

    if (movementPendingDelete.transaction_type === "transfer") {
      return {
        title: t.deleteTransferTitle,
        description: t.deleteTransferDescription(
          movementPendingDelete.description,
        ),
      };
    }

    return {
      title: t.deleteAdjustmentTitle,
      description: t.deleteAdjustmentDescription(
        movementPendingDelete.description,
      ),
    };
  }, [movementPendingDelete, t]);

  async function handleDeleteConfirmed() {
    if (!movementPendingDelete) {
      return;
    }

    const movement = movementPendingDelete;
    setDeletingMovementId(movement.id);
    setMovementPendingDelete(null);

    try {
      if (
        movement.transaction_type === "transfer" &&
        movement.transfer_group_id
      ) {
        await api.deleteTransfer(movement.transfer_group_id);
        toast.success(t.transferDeleted);
      } else if (movement.transaction_type === "adjustment") {
        await api.deleteAdjustment(movement.id);
        toast.success(t.adjustmentDeleted);
      }

      invalidateCacheKeys([cacheKeys.ledgerBalances, cacheKeys.ledgerActivity]);
      void refreshLedger({ silent: true });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else if (movement.transaction_type === "transfer") {
        toast.error(t.failedDeleteTransfer);
      } else {
        toast.error(t.failedDeleteAdjustment);
      }
    } finally {
      setDeletingMovementId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {showOperationalActions && hasMultipleFinancialAccounts ? (
            <div className="w-full sm:w-64">
              <Label htmlFor="balance_account_filter">{t.accountLabel}</Label>
              <Select
                value={selectedFinancialAccountId || ALL_ACCOUNTS_FILTER}
                onValueChange={(value) =>
                  handleSelectedFinancialAccountChange(
                    value === ALL_ACCOUNTS_FILTER ? null : value,
                  )
                }
              >
                <SelectTrigger id="balance_account_filter" className="mt-1.5">
                  <SelectValue placeholder={t.allAccountsActivityLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ACCOUNTS_FILTER}>
                    {t.allAccountsActivityLabel}
                  </SelectItem>
                  {financialAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {displayedAccountBalances.find(
                        (item) => item.financial_account_id === account.id,
                      )?.financial_account_name ?? account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {showOperationalActions ? (
            <div className="flex flex-wrap gap-2">
              <CreateTransferModal
                defaultCurrency={balanceCurrency}
                financialAccounts={financialAccounts}
                timeZone={profile?.timezone ?? "UTC"}
                onCreated={() =>
                  invalidateCacheKeys([
                    cacheKeys.ledgerBalances,
                    cacheKeys.ledgerActivity,
                  ])
                }
              />
              <CreateAdjustmentModal
                defaultCurrency={balanceCurrency}
                financialAccounts={financialAccounts}
                timeZone={profile?.timezone ?? "UTC"}
                onCreated={() =>
                  invalidateCacheKeys([
                    cacheKeys.ledgerBalances,
                    cacheKeys.ledgerActivity,
                  ])
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      {showOnboarding ? (
        <BalanceOnboardingCard
          profile={profile}
          categories={categories}
          hasBaseCurrency={hasBaseCurrency}
          hasTimeZone={hasTimeZone}
          hasTransactions={hasTransactions}
          baseCurrency={profile?.base_currency ?? null}
          timeZone={profile?.timezone ?? null}
          onProfileUpdated={onProfileUpdated}
          onCategoryCreated={() => invalidateCacheKeys([cacheKeys.categories])}
          onTransactionCreated={() =>
            invalidateCacheKeys([
              cacheKeys.transactions,
              cacheKeys.ledgerBalances,
              cacheKeys.ledgerActivity,
            ])
          }
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:items-start">
        <div ref={currentCashCardRef}>
          <CurrentCashCard
            accounts={displayedAccountBalances}
            balanceCurrency={balanceCurrency}
            consolidatedBalance={consolidatedBalance}
            financialAccountsCount={financialAccounts.length}
            locale={locale}
            selectedAccountBalance={selectedAccountBalance}
            selectedFinancialAccountName={selectedFinancialAccountName}
            showEmptyState={showEmptyState}
            text={t}
          />
        </div>

        <AccountBalancesCard
          accounts={displayedAccountBalances}
          balanceCurrency={balanceCurrency}
          emptyLabel={t.recentActivityEmpty}
          loading={loading && !hasAccountBalances}
          loadingLabel={site.common.loading}
          locale={locale}
          matchHeight={currentCashCardHeight}
          onAccountCreated={() =>
            invalidateCacheKeys([cacheKeys.ledgerBalances])
          }
          selectedFinancialAccountId={selectedFinancialAccountId}
          showCreateAction={showOperationalActions}
          text={t}
          onToggleAccount={(financialAccountId, isSelected) =>
            handleSelectedFinancialAccountChange(
              isSelected ? null : financialAccountId,
            )
          }
        />
      </div>

      <RecentActivityCard
        activity={activity}
        activityScopeLabel={activityScopeLabel}
        balanceCurrency={balanceCurrency}
        deletingMovementId={deletingMovementId}
        loading={loading}
        locale={locale}
        onDeleteMovement={setMovementPendingDelete}
        site={site}
        timeZone={timeZone}
      />

      <Dialog
        open={movementPendingDelete != null}
        onOpenChange={(open) => !open && setMovementPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deleteDialog.title}</DialogTitle>
            <DialogDescription>{deleteDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMovementPendingDelete(null)}
            >
              {site.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirmed}
              disabled={deletingMovementId != null}
            >
              {site.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function displayLocale(language: string) {
  return language === "en" ? "en-US" : "es-CO";
}
