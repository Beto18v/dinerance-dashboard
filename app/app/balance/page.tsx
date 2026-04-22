"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type LedgerMovement } from "@/lib/api";
import { cacheKeys, invalidateCacheKeys } from "@/lib/cache";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountBalancesCard } from "./components/account-balances-card";
import { BalanceAdjustmentsCard } from "./components/balance-adjustments-card";
import { BalanceOnboardingCard } from "./components/balance-onboarding-card";
import { CurrentCashCard } from "./components/current-cash-card";
import { CreateAdjustmentModal } from "./components/create-adjustment-modal";
import { CreateTransferModal } from "./components/create-transfer-modal";
import { RecentActivityCard } from "./components/recent-activity-card";
import { useBalanceOnboardingState } from "./use-balance-onboarding-state";
import { useLedgerPageState } from "./use-ledger-page-state";

export default function BalancePage() {
  const {
    activity,
    adjustments,
    balanceCurrency,
    consolidatedBalance,
    displayedAccountBalances,
    financialAccounts,
    handleSelectedFinancialAccountChange,
    ledgerSkippedTransactions,
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
  const skippedNoticeStorageKey =
    profile?.id && profile.base_currency && ledgerSkippedTransactions > 0
      ? `balance-skipped-notice:${profile.id}:${profile.base_currency}:${ledgerSkippedTransactions}`
      : null;
  const [skippedNoticeHidden, setSkippedNoticeHidden] = useState(() =>
    skippedNoticeStorageKey
      ? typeof window !== "undefined" &&
        window.localStorage.getItem(skippedNoticeStorageKey) === "hidden"
      : false,
  );

  const hasLedgerActivity = activity.length > 0;
  const hasAccountBalances = displayedAccountBalances.length > 0;
  const hasAdjustments = adjustments.length > 0;
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

  useEffect(() => {
    if (!skippedNoticeStorageKey) {
      setSkippedNoticeHidden(false);
      return;
    }

    setSkippedNoticeHidden(
      typeof window !== "undefined" &&
        window.localStorage.getItem(skippedNoticeStorageKey) === "hidden",
    );
  }, [skippedNoticeStorageKey]);

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

      invalidateCacheKeys([
        cacheKeys.ledgerBalances,
        cacheKeys.ledgerActivity,
        cacheKeys.ledgerAdjustments,
      ]);
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

  function handleHideSkippedNotice() {
    if (skippedNoticeStorageKey && typeof window !== "undefined") {
      window.localStorage.setItem(skippedNoticeStorageKey, "hidden");
    }
    setSkippedNoticeHidden(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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
                    cacheKeys.ledgerAdjustments,
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

      {ledgerSkippedTransactions > 0 &&
      profile?.base_currency &&
      !skippedNoticeHidden ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p>
            {t.consolidatedSkippedNotice(
              ledgerSkippedTransactions,
              profile.base_currency,
            )}
          </p>
          <button
            type="button"
            className="font-medium underline underline-offset-4 transition-opacity hover:opacity-80"
            onClick={handleHideSkippedNotice}
          >
            {t.consolidatedSkippedNoticeHideAction}
          </button>
        </div>
      ) : null}

      <div
        className={`grid gap-6 ${hasAdjustments ? "xl:grid-cols-[1.15fr_0.85fr] xl:items-start" : ""}`}
      >
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

        {hasAdjustments ? (
          <BalanceAdjustmentsCard
            adjustments={adjustments}
            deletingMovementId={deletingMovementId}
            loading={loading}
            locale={locale}
            onDeleteAdjustment={setMovementPendingDelete}
            site={site}
            timeZone={timeZone}
          />
        ) : null}
      </div>

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
