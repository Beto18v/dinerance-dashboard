"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useProfile } from "@/components/providers/profile-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import {
  api,
  ApiError,
  type FinancialAccount,
  type LedgerActivity,
  type LedgerBalances,
} from "@/lib/api";
import {
  cacheKeys,
  cacheTtls,
  getCache,
  setCache,
  subscribeToCacheKeys,
} from "@/lib/cache";
import {
  getFinancialAccountDisplayName,
  getFreshFinancialAccountsCache,
} from "@/lib/financial-accounts";

export function useLedgerPageState() {
  const { profile } = useProfile();
  const { site } = useSitePreferences();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedFinancialAccountId =
    searchParams.get("financial_account_id")?.trim() || "";
  const cachedFinancialAccounts = useMemo(
    () => getFreshFinancialAccountsCache(),
    [],
  );
  const cachedBalances = useMemo(() => getFreshLedgerBalancesCache(), []);
  const cachedActivity = useMemo(
    () =>
      selectedFinancialAccountId === "" ? getFreshLedgerActivityCache() : null,
    [selectedFinancialAccountId],
  );
  const cachedAdjustments = useMemo(
    () =>
      selectedFinancialAccountId === "" ? getFreshLedgerAdjustmentsCache() : null,
    [selectedFinancialAccountId],
  );

  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>(
    () => cachedFinancialAccounts ?? [],
  );
  const [balances, setBalances] = useState<LedgerBalances | null>(
    () => cachedBalances,
  );
  const [activity, setActivity] = useState<LedgerActivity | null>(
    () => cachedActivity,
  );
  const [adjustments, setAdjustments] = useState<LedgerActivity | null>(
    () => cachedAdjustments,
  );
  const [financialAccountsReady, setFinancialAccountsReady] = useState(
    () => cachedFinancialAccounts !== null,
  );
  const [loading, setLoading] = useState(
    () =>
      cachedBalances == null ||
      cachedActivity == null ||
      cachedAdjustments == null,
  );

  const hasBaseCurrency = Boolean(profile?.base_currency);
  const hasTimeZone = Boolean(profile?.timezone);
  const showOnboarding = !hasBaseCurrency || !hasTimeZone;

  const syncSelectedFinancialAccount = useCallback(
    (value: string | null) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (value) {
        nextParams.set("financial_account_id", value);
      } else {
        nextParams.delete("financial_account_id");
      }
      const query = nextParams.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router.push(href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const loadFinancialAccounts = useCallback(
    async (silent = false) => {
      try {
        const data = await api.getFinancialAccounts();
        setFinancialAccounts(data);
        setCache(cacheKeys.financialAccounts, data);
      } catch (error) {
        if (!silent) {
          if (error instanceof ApiError) {
            toast.error(error.message);
          } else {
            toast.error(site.pages.balance.failedLoadLedger);
          }
        }
      } finally {
        setFinancialAccountsReady(true);
      }
    },
    [site.pages.balance.failedLoadLedger],
  );

  const loadLedger = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!hasBaseCurrency || !hasTimeZone) {
        setBalances(null);
        setActivity(null);
        setAdjustments(null);
        setLoading(false);
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }

      try {
        const [nextBalances, nextActivity, nextAdjustments] = await Promise.all([
          api.getLedgerBalances(),
          api.getLedgerActivity({
            limit: 8,
            ...(selectedFinancialAccountId
              ? { financial_account_id: selectedFinancialAccountId }
              : {}),
          }),
          api.getLedgerAdjustments({
            limit: 12,
            ...(selectedFinancialAccountId
              ? { financial_account_id: selectedFinancialAccountId }
              : {}),
          }),
        ]);
        setBalances(nextBalances);
        setActivity(nextActivity);
        setAdjustments(nextAdjustments);
        setCache(cacheKeys.ledgerBalances, nextBalances);
        if (!selectedFinancialAccountId) {
          setCache(cacheKeys.ledgerActivity, nextActivity);
          setCache(cacheKeys.ledgerAdjustments, nextAdjustments);
        }
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 409) {
            setBalances(null);
            setActivity(null);
            setAdjustments(null);
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error(site.pages.balance.failedLoadLedger);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      hasBaseCurrency,
      hasTimeZone,
      selectedFinancialAccountId,
      site.pages.balance.failedLoadLedger,
    ],
  );

  useEffect(() => {
    void loadFinancialAccounts(Boolean(cachedFinancialAccounts));
  }, [cachedFinancialAccounts, loadFinancialAccounts]);

  useEffect(() => {
    void loadLedger({
      silent: Boolean(cachedBalances && cachedActivity && cachedAdjustments),
    });
  }, [cachedActivity, cachedAdjustments, cachedBalances, loadLedger]);

  useEffect(() => {
    return subscribeToCacheKeys(
      [
        cacheKeys.financialAccounts,
        cacheKeys.ledgerBalances,
        cacheKeys.ledgerActivity,
        cacheKeys.ledgerAdjustments,
      ],
      (changedKeys) => {
        if (changedKeys.includes(cacheKeys.financialAccounts)) {
          void loadFinancialAccounts(true);
        }
        if (
          changedKeys.includes(cacheKeys.ledgerBalances) ||
          changedKeys.includes(cacheKeys.ledgerActivity) ||
          changedKeys.includes(cacheKeys.ledgerAdjustments)
        ) {
          void loadLedger({ silent: true });
        }
      },
    );
  }, [loadFinancialAccounts, loadLedger]);

  useEffect(() => {
    if (
      financialAccountsReady &&
      selectedFinancialAccountId &&
      !financialAccounts.some((account) => account.id === selectedFinancialAccountId)
    ) {
      syncSelectedFinancialAccount(null);
    }
  }, [
    financialAccounts,
    financialAccountsReady,
    selectedFinancialAccountId,
    syncSelectedFinancialAccount,
  ]);

  const selectedFinancialAccount =
    financialAccounts.find((account) => account.id === selectedFinancialAccountId) ??
    null;
  const selectedFinancialAccountName = selectedFinancialAccount
    ? getFinancialAccountDisplayName(
        selectedFinancialAccount,
        site.common.mainFinancialAccount,
      )
    : null;
  const displayedAccountBalances = useMemo(() => {
    const accountBalances = balances?.accounts ?? [];
    return accountBalances.map((account) => ({
      ...account,
      financial_account_name:
        financialAccounts.find((item) => item.id === account.financial_account_id) !=
        null
          ? getFinancialAccountDisplayName(
              financialAccounts.find(
                (item) => item.id === account.financial_account_id,
              ) as FinancialAccount,
              site.common.mainFinancialAccount,
            )
          : account.financial_account_name,
    }));
  }, [balances?.accounts, financialAccounts, site.common.mainFinancialAccount]);
  const selectedAccountBalance =
    displayedAccountBalances.find(
      (item) => item.financial_account_id === selectedFinancialAccountId,
    ) ?? null;

  return {
    activity: activity?.items ?? [],
    adjustments: adjustments?.items ?? [],
    balanceCurrency: balances?.currency ?? profile?.base_currency ?? "COP",
    consolidatedBalance: balances?.consolidated_balance ?? "0.00",
    displayedAccountBalances,
    financialAccounts,
    handleSelectedFinancialAccountChange: syncSelectedFinancialAccount,
    hasBaseCurrency,
    hasMultipleFinancialAccounts: financialAccounts.length > 1,
    hasTimeZone,
    ledgerSkippedTransactions: balances?.skipped_transactions ?? 0,
    loading,
    profile,
    refreshLedger: loadLedger,
    selectedAccountBalance,
    selectedFinancialAccountId,
    selectedFinancialAccountName,
    showOnboarding,
    site,
    timeZone: profile?.timezone ?? "UTC",
  };
}

function getFreshLedgerBalancesCache() {
  return getCache<LedgerBalances>(cacheKeys.ledgerBalances, {
    maxAgeMs: cacheTtls.ledgerBalances,
  });
}

function getFreshLedgerActivityCache() {
  return getCache<LedgerActivity>(cacheKeys.ledgerActivity, {
    maxAgeMs: cacheTtls.ledgerActivity,
  });
}

function getFreshLedgerAdjustmentsCache() {
  return getCache<LedgerActivity>(cacheKeys.ledgerAdjustments, {
    maxAgeMs: cacheTtls.ledgerAdjustments,
  });
}
