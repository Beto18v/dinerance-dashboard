"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useProfile } from "@/components/providers/profile-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import {
  api,
  ApiError,
  type AnalyticsCategoryBreakdown,
  type AnalyticsRecurringCandidates,
  type AnalyticsSummary,
  type AnalyticsSummaryTransaction,
  type Category,
  type FinancialAccount,
  type TransactionsPageResponse,
  type UserProfile,
} from "@/lib/api";
import {
  buildAnalyticsScopeParams,
  getAnalyticsFiltersViewKey,
  parseAnalyticsMonth,
  readAnalyticsFilters,
  resolveAnalyticsFiltersNavigation,
  type AnalyticsFiltersPatch,
  type AnalyticsScopeParams,
} from "@/lib/analytics-filters";
import {
  cacheKeys,
  cacheTtls,
  getCache,
  setCache,
  subscribeToCacheKeys,
} from "@/lib/cache";
import {
  getFreshFinancialAccountsCache,
  getFinancialAccountDisplayName,
  resolveFinancialAccountName,
} from "@/lib/financial-accounts";
import { getCurrentMonthValue } from "@/lib/timezone";

type BreakdownDirection = "expense" | "income";
type BreakdownParams = AnalyticsScopeParams & {
  direction?: BreakdownDirection;
};
type UrlSyncMode = "push" | "replace";

type UseBalancePageStateOptions = {
  includeCategoryBreakdown?: boolean;
  includeRecurringCandidates?: boolean;
};

export function useBalancePageState(
  options: UseBalancePageStateOptions = {},
) {
  const { site } = useSitePreferences();
  const { profile, setProfile } = useProfile();
  const includeCategoryBreakdown = options.includeCategoryBreakdown ?? true;
  const includeRecurringCandidates = options.includeRecurringCandidates ?? true;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const selectedFilters = readAnalyticsFilters(searchParams);
  const cachedCategories = getFreshCategoriesCache();
  const cachedFinancialAccounts = getFreshFinancialAccountsCache();
  const cachedTransactions = getFreshTransactionsCache();
  const selectedMonth = selectedFilters.month;
  const selectedFinancialAccountId = selectedFilters.financialAccountId;

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] =
    useState<AnalyticsCategoryBreakdown | null>(null);
  const [categoryBreakdownLoading, setCategoryBreakdownLoading] =
    useState(false);
  const [recurringCandidates, setRecurringCandidates] =
    useState<AnalyticsRecurringCandidates | null>(null);
  const [recurringCandidatesLoading, setRecurringCandidatesLoading] =
    useState(false);
  const [categoryBreakdownDirection, setCategoryBreakdownDirection] =
    useState<BreakdownDirection>("income");
  const [categories, setCategories] = useState<Category[]>(
    () => cachedCategories ?? [],
  );
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>(
    () => cachedFinancialAccounts ?? [],
  );
  const [financialAccountsReady, setFinancialAccountsReady] = useState(
    () => cachedFinancialAccounts !== null,
  );
  const [categoriesReady, setCategoriesReady] = useState(
    () => !!cachedCategories,
  );
  const [transactionsReady, setTransactionsReady] = useState(
    () => cachedTransactions !== null,
  );
  const [hasTransactions, setHasTransactions] = useState(
    () => (cachedTransactions?.total_count ?? 0) > 0,
  );
  const [loading, setLoading] = useState(true);
  const profileRef = useRef<UserProfile | null>(profile);
  const categoryBreakdownDirectionRef = useRef<BreakdownDirection>(
    categoryBreakdownDirection,
  );
  const summaryResolvedKeyRef = useRef<string | null>(null);
  const summaryResolvedViewKeyRef = useRef<string | null>(null);
  const summaryInFlightKeyRef = useRef<string | null>(null);
  const summaryRequestIdRef = useRef(0);
  const categoryBreakdownCacheRef = useRef(
    new Map<string, AnalyticsCategoryBreakdown>(),
  );
  const categoryBreakdownExpectedKeyRef = useRef<string | null>(null);
  const categoryBreakdownResolvedKeyRef = useRef<string | null>(null);
  const categoryBreakdownInFlightKeyRef = useRef<string | null>(null);
  const categoryBreakdownRequestIdRef = useRef(0);
  const recurringCandidatesCacheRef = useRef(
    new Map<string, AnalyticsRecurringCandidates>(),
  );
  const recurringCandidatesExpectedKeyRef = useRef<string | null>(null);
  const recurringCandidatesResolvedKeyRef = useRef<string | null>(null);
  const recurringCandidatesInFlightKeyRef = useRef<string | null>(null);
  const recurringCandidatesRequestIdRef = useRef(0);
  const skipNextUrlDrivenLoadKeyRef = useRef<string | null>(null);

  const hasBaseCurrency = Boolean(profile?.base_currency);
  const hasTimeZone = Boolean(profile?.timezone);
  const hasCategories = categories.length > 0;
  const needsProfileSetup = !hasBaseCurrency || !hasTimeZone;
  const showOnboarding =
    needsProfileSetup ||
    (categoriesReady &&
      transactionsReady &&
      !(hasBaseCurrency && hasTimeZone && hasCategories && hasTransactions));
  const profileAnalyticsKey = getProfileAnalyticsKey(profile);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    categoryBreakdownDirectionRef.current = categoryBreakdownDirection;
  }, [categoryBreakdownDirection]);

  const syncUrlFilters = useCallback(
    (filters: AnalyticsFiltersPatch, mode: UrlSyncMode) => {
      const navigation = resolveAnalyticsFiltersNavigation(
        pathname,
        searchParamsKey,
        filters,
      );
      if (!navigation.hasChanged) {
        return;
      }

      if (mode === "replace") {
        router.replace(navigation.href, { scroll: false });
        return;
      }

      router.push(navigation.href, { scroll: false });
    },
    [pathname, router, searchParamsKey],
  );

  const loadCategoryBreakdown = useCallback(
    async (
      params?: BreakdownParams,
      activeProfile?: UserProfile | null,
      options?: { force?: boolean },
    ) => {
      const resolvedProfile = activeProfile ?? profileRef.current;
      if (
        !includeCategoryBreakdown ||
        !resolvedProfile?.base_currency ||
        params?.year == null ||
        params?.month == null
      ) {
        categoryBreakdownExpectedKeyRef.current = null;
        categoryBreakdownResolvedKeyRef.current = null;
        categoryBreakdownInFlightKeyRef.current = null;
        setCategoryBreakdown(null);
        setCategoryBreakdownLoading(false);
        return;
      }

      const requestKey = getCategoryBreakdownRequestKey({
        baseCurrency: resolvedProfile.base_currency,
        year: params.year,
        month: params.month,
        direction: params.direction,
        financialAccountId: params.financial_account_id,
      });
      categoryBreakdownExpectedKeyRef.current = requestKey;
      const cachedBreakdown = categoryBreakdownCacheRef.current.get(requestKey);

      if (cachedBreakdown) {
        categoryBreakdownResolvedKeyRef.current = requestKey;
        setCategoryBreakdown(cachedBreakdown);
        setCategoryBreakdownLoading(false);
      }

      if (
        (!options?.force &&
          requestKey === categoryBreakdownResolvedKeyRef.current) ||
        requestKey === categoryBreakdownInFlightKeyRef.current
      ) {
        return;
      }

      const requestId = categoryBreakdownRequestIdRef.current + 1;
      categoryBreakdownRequestIdRef.current = requestId;
      categoryBreakdownInFlightKeyRef.current = requestKey;
      if (!cachedBreakdown) {
        setCategoryBreakdown(null);
      }
      setCategoryBreakdownLoading(true);
      try {
        const data = await api.getAnalyticsCategoryBreakdown({
          year: params.year,
          month: params.month,
          direction: params.direction,
          ...(params.financial_account_id
            ? { financial_account_id: params.financial_account_id }
            : {}),
        });
        if (requestId !== categoryBreakdownRequestIdRef.current) {
          return;
        }
        categoryBreakdownCacheRef.current.set(requestKey, data);
        if (requestKey !== categoryBreakdownExpectedKeyRef.current) {
          return;
        }
        categoryBreakdownResolvedKeyRef.current = requestKey;
        setCategoryBreakdown(data);
      } catch (err) {
        if (requestId !== categoryBreakdownRequestIdRef.current) {
          return;
        }
        if (requestKey !== categoryBreakdownExpectedKeyRef.current) {
          return;
        }
        if (err instanceof ApiError && err.status === 409) {
          categoryBreakdownCacheRef.current.delete(requestKey);
          categoryBreakdownResolvedKeyRef.current = null;
          setCategoryBreakdown(null);
        } else if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error(site.common.unexpectedError);
        }
      } finally {
        if (requestId === categoryBreakdownRequestIdRef.current) {
          categoryBreakdownInFlightKeyRef.current = null;
          if (requestKey === categoryBreakdownExpectedKeyRef.current) {
            setCategoryBreakdownLoading(false);
          }
        }
      }
    },
    [includeCategoryBreakdown, site.common.unexpectedError],
  );

  const loadRecurringCandidates = useCallback(
    async (
      params?: AnalyticsScopeParams,
      activeProfile?: UserProfile | null,
      options?: { force?: boolean },
    ) => {
      const resolvedProfile = activeProfile ?? profileRef.current;
      if (
        !includeRecurringCandidates ||
        params?.year == null ||
        params?.month == null
      ) {
        recurringCandidatesExpectedKeyRef.current = null;
        recurringCandidatesResolvedKeyRef.current = null;
        recurringCandidatesInFlightKeyRef.current = null;
        setRecurringCandidates(null);
        setRecurringCandidatesLoading(false);
        return;
      }

      const requestKey = getRecurringCandidatesRequestKey({
        profileKey: getProfileAnalyticsKey(resolvedProfile),
        year: params.year,
        month: params.month,
        financialAccountId: params.financial_account_id,
      });
      recurringCandidatesExpectedKeyRef.current = requestKey;
      const cachedCandidates =
        recurringCandidatesCacheRef.current.get(requestKey);

      if (cachedCandidates) {
        recurringCandidatesResolvedKeyRef.current = requestKey;
        setRecurringCandidates(cachedCandidates);
        setRecurringCandidatesLoading(false);
      }

      if (
        (!options?.force &&
          requestKey === recurringCandidatesResolvedKeyRef.current) ||
        requestKey === recurringCandidatesInFlightKeyRef.current
      ) {
        return;
      }

      const requestId = recurringCandidatesRequestIdRef.current + 1;
      recurringCandidatesRequestIdRef.current = requestId;
      recurringCandidatesInFlightKeyRef.current = requestKey;
      if (!cachedCandidates) {
        setRecurringCandidates(null);
      }
      setRecurringCandidatesLoading(true);

      try {
        const data = await api.getAnalyticsRecurringCandidates({
          year: params.year,
          month: params.month,
          ...(params.financial_account_id
            ? { financial_account_id: params.financial_account_id }
            : {}),
        });
        if (requestId !== recurringCandidatesRequestIdRef.current) {
          return;
        }
        recurringCandidatesCacheRef.current.set(requestKey, data);
        if (requestKey !== recurringCandidatesExpectedKeyRef.current) {
          return;
        }
        recurringCandidatesResolvedKeyRef.current = requestKey;
        setRecurringCandidates(data);
      } catch (err) {
        if (requestId !== recurringCandidatesRequestIdRef.current) {
          return;
        }
        if (requestKey !== recurringCandidatesExpectedKeyRef.current) {
          return;
        }
        recurringCandidatesCacheRef.current.delete(requestKey);
        recurringCandidatesResolvedKeyRef.current = null;
        setRecurringCandidates(null);
        if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error(site.common.unexpectedError);
        }
      } finally {
        if (requestId === recurringCandidatesRequestIdRef.current) {
          recurringCandidatesInFlightKeyRef.current = null;
          if (requestKey === recurringCandidatesExpectedKeyRef.current) {
            setRecurringCandidatesLoading(false);
          }
        }
      }
    },
    [includeRecurringCandidates, site.common.unexpectedError],
  );

  const loadBalance = useCallback(
    async (
      params?: AnalyticsScopeParams,
      activeProfile?: UserProfile | null,
      options?: { force?: boolean; syncResolvedMonthToUrl?: boolean },
    ) => {
      const resolvedProfile = activeProfile ?? profileRef.current;
      const fallbackMonth = getCurrentMonthValue(
        resolvedProfile?.timezone ?? "UTC",
      );
      const requestKey = getAnalyticsSummaryRequestKey(resolvedProfile, params);

      if (!resolvedProfile?.base_currency) {
        summaryResolvedKeyRef.current = null;
        summaryResolvedViewKeyRef.current = null;
        summaryInFlightKeyRef.current = null;
        setSummary(null);
        categoryBreakdownResolvedKeyRef.current = null;
        categoryBreakdownInFlightKeyRef.current = null;
        setCategoryBreakdown(null);
        setCategoryBreakdownLoading(false);
        recurringCandidatesResolvedKeyRef.current = null;
        recurringCandidatesInFlightKeyRef.current = null;
        setRecurringCandidates(null);
        setRecurringCandidatesLoading(false);
        setLoading(false);
        return;
      }

      if (
        !options?.force &&
        (requestKey === summaryResolvedKeyRef.current ||
          requestKey === summaryResolvedViewKeyRef.current ||
          requestKey === summaryInFlightKeyRef.current)
      ) {
        return;
      }

      const requestId = summaryRequestIdRef.current + 1;
      summaryRequestIdRef.current = requestId;
      summaryInFlightKeyRef.current = requestKey;
      setLoading(true);
      try {
        const data = await api.getAnalyticsSummary(params);
        if (requestId !== summaryRequestIdRef.current) {
          return;
        }

        setSummary(data);

        const resolvedMonthValue = data.current.month_start.slice(0, 7);
        summaryResolvedKeyRef.current = requestKey;
        summaryResolvedViewKeyRef.current = getAnalyticsSummaryRequestKey(
          resolvedProfile,
          buildAnalyticsScopeParams({
            month: resolvedMonthValue,
            financialAccountId: params?.financial_account_id,
          }),
        );
        const shouldSyncResolvedMonth =
          options?.syncResolvedMonthToUrl !== false &&
          (!params?.year || !params?.month) &&
          resolvedMonthValue !== selectedMonth;

        if (shouldSyncResolvedMonth) {
          skipNextUrlDrivenLoadKeyRef.current = getAnalyticsFiltersViewKey({
            month: resolvedMonthValue,
            financialAccountId: params?.financial_account_id,
          });
          syncUrlFilters(
            {
              month: resolvedMonthValue,
            },
            "replace",
          );
        }

        const resolvedMonth = parseAnalyticsMonth(resolvedMonthValue);
        if (resolvedMonth) {
          if (includeCategoryBreakdown) {
            void loadCategoryBreakdown(
              {
                ...resolvedMonth,
                direction: categoryBreakdownDirectionRef.current,
                financial_account_id: params?.financial_account_id,
              },
              resolvedProfile,
              { force: options?.force },
            );
          }
          if (includeRecurringCandidates) {
            void loadRecurringCandidates(
              {
                ...resolvedMonth,
                financial_account_id: params?.financial_account_id,
              },
              resolvedProfile,
              { force: options?.force },
            );
          }
        }
      } catch (err) {
        if (requestId !== summaryRequestIdRef.current) {
          return;
        }

        if (err instanceof ApiError && err.status === 409) {
          summaryResolvedKeyRef.current = requestKey;
          summaryResolvedViewKeyRef.current = null;
          setSummary(null);
          categoryBreakdownResolvedKeyRef.current = null;
          categoryBreakdownInFlightKeyRef.current = null;
          setCategoryBreakdown(null);
          setCategoryBreakdownLoading(false);
          recurringCandidatesResolvedKeyRef.current = null;
          recurringCandidatesInFlightKeyRef.current = null;
          setRecurringCandidates(null);
          setRecurringCandidatesLoading(false);

          if (!selectedMonth) {
            skipNextUrlDrivenLoadKeyRef.current = getAnalyticsFiltersViewKey({
              month: fallbackMonth,
              financialAccountId: params?.financial_account_id,
            });
            syncUrlFilters(
              {
                month: fallbackMonth,
              },
              "replace",
            );
          }
        } else if (err instanceof ApiError) {
          toast.error(err.message);
        } else {
          toast.error(site.common.unexpectedError);
        }
      } finally {
        if (requestId === summaryRequestIdRef.current) {
          summaryInFlightKeyRef.current = null;
          setLoading(false);
        }
      }
    },
    [
      loadCategoryBreakdown,
      loadRecurringCandidates,
      includeCategoryBreakdown,
      includeRecurringCandidates,
      selectedMonth,
      site.common.unexpectedError,
      syncUrlFilters,
    ],
  );

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
      setCache(cacheKeys.categories, data);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(site.common.unexpectedError);
    } finally {
      setCategoriesReady(true);
    }
  }, [site.common.unexpectedError]);

  const loadFinancialAccounts = useCallback(
    async (silent = false) => {
      try {
        const data = await api.getFinancialAccounts();
        setFinancialAccounts(data);
        setCache(cacheKeys.financialAccounts, data);
      } catch (err) {
        if (!silent) {
          if (err instanceof ApiError) toast.error(err.message);
          else toast.error(site.common.unexpectedError);
        }
      } finally {
        setFinancialAccountsReady(true);
      }
    },
    [site.common.unexpectedError],
  );

  const refreshProfileFromOnboarding = useCallback(
    async (updatedProfile: UserProfile) => {
      setProfile(updatedProfile);
      await loadBalance(
        buildAnalyticsScopeParams({
          month: selectedMonth,
          financialAccountId: selectedFinancialAccountId,
        }),
        updatedProfile,
      );
    },
    [loadBalance, selectedFinancialAccountId, selectedMonth, setProfile],
  );

  const loadTransactionsPresence = useCallback(async () => {
    const freshTransactions = getFreshTransactionsCache();
    if (freshTransactions) {
      setHasTransactions((freshTransactions.total_count ?? 0) > 0);
      setTransactionsReady(true);
      return;
    }

    try {
      const data = await api.getTransactions({ limit: 1 });
      setHasTransactions((data.total_count ?? 0) > 0);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(site.common.unexpectedError);
    } finally {
      setTransactionsReady(true);
    }
  }, [site.common.unexpectedError]);

  const refreshSelectedMonth = useCallback(() => {
    void loadBalance(
      buildAnalyticsScopeParams({
        month: selectedMonth,
        financialAccountId: selectedFinancialAccountId,
      }),
      undefined,
      { force: true, syncResolvedMonthToUrl: false },
    );
  }, [loadBalance, selectedFinancialAccountId, selectedMonth]);

  useEffect(() => {
    const selectedViewKey = getAnalyticsFiltersViewKey({
      month: selectedMonth,
      financialAccountId: selectedFinancialAccountId,
    });
    if (
      skipNextUrlDrivenLoadKeyRef.current &&
      skipNextUrlDrivenLoadKeyRef.current === selectedViewKey
    ) {
      skipNextUrlDrivenLoadKeyRef.current = null;
      return;
    }

    void loadBalance(
      buildAnalyticsScopeParams({
        month: selectedMonth,
        financialAccountId: selectedFinancialAccountId,
      }),
    );
  }, [loadBalance, profileAnalyticsKey, selectedFinancialAccountId, selectedMonth]);

  useEffect(() => {
    void Promise.all([loadCategories(), loadTransactionsPresence()]);
  }, [loadCategories, loadTransactionsPresence]);

  useEffect(() => {
    void loadFinancialAccounts(Boolean(getFreshFinancialAccountsCache()));
  }, [loadFinancialAccounts]);

  useEffect(() => {
    return subscribeToCacheKeys(
      [
        cacheKeys.categories,
        cacheKeys.financialAccounts,
        cacheKeys.transactions,
      ],
      (changedKeys) => {
        if (changedKeys.includes(cacheKeys.categories)) {
          void loadCategories();
        }
        if (changedKeys.includes(cacheKeys.financialAccounts)) {
          void loadFinancialAccounts(true);
        }
        if (changedKeys.includes(cacheKeys.transactions)) {
          void loadTransactionsPresence();
          refreshSelectedMonth();
        }
      },
    );
  }, [
    loadCategories,
    loadFinancialAccounts,
    loadTransactionsPresence,
    refreshSelectedMonth,
  ]);

  useEffect(() => {
    if (
      financialAccountsReady &&
      selectedFinancialAccountId &&
      !financialAccounts.some(
        (account) => account.id === selectedFinancialAccountId,
      )
    ) {
      syncUrlFilters(
        {
          financialAccountId: null,
        },
        "replace",
      );
    }
  }, [
    financialAccountsReady,
    financialAccounts,
    selectedFinancialAccountId,
    selectedMonth,
    syncUrlFilters,
  ]);

  const current = summary?.current;
  const history = summary?.series ?? [];
  const recentTransactions = summary?.recent_transactions ?? [];
  const hasMultipleFinancialAccounts = financialAccounts.length > 1;
  const selectedFinancialAccount =
    financialAccounts.find(
      (account) => account.id === selectedFinancialAccountId,
    ) ?? null;
  const selectedFinancialAccountName = selectedFinancialAccount
    ? getFinancialAccountDisplayName(
        selectedFinancialAccount,
        site.common.mainFinancialAccount,
      )
    : null;
  const showRecentTransactionAccountNames =
    hasMultipleFinancialAccounts && !selectedFinancialAccountId;
  const monthHeadingDate =
    current?.month_start ??
    `${selectedMonth || getCurrentMonthValue(profile?.timezone ?? "UTC")}-01`;
  const balanceCurrency = current?.currency ?? profile?.base_currency ?? "COP";
  const timeZone = profile?.timezone ?? "UTC";
  const totalSkippedTransactions = history.reduce(
    (total, item) => total + (item.skipped_transactions ?? 0),
    0,
  );

  const handleSelectedMonthChange = useCallback(
    (value: string) => {
      syncUrlFilters(
        {
          month: value,
        },
        "push",
      );
    },
    [syncUrlFilters],
  );

  const handleSelectedFinancialAccountChange = useCallback(
    (value: string) => {
      syncUrlFilters(
        {
          financialAccountId: value || null,
        },
        "push",
      );
    },
    [syncUrlFilters],
  );

  const handleCategoryBreakdownDirectionChange = useCallback(
    (direction: BreakdownDirection) => {
      const selectedMonthParts = parseAnalyticsMonth(selectedMonth);
      categoryBreakdownDirectionRef.current = direction;
      setCategoryBreakdownDirection(direction);
      if (!selectedMonthParts) {
        return;
      }

      void loadCategoryBreakdown({
        ...selectedMonthParts,
        direction,
        financial_account_id: selectedFinancialAccountId || undefined,
      });
    },
    [loadCategoryBreakdown, selectedFinancialAccountId, selectedMonth],
  );

  const resolveRecentTransactionAccountName = useCallback(
    (transaction: AnalyticsSummaryTransaction) => {
      if (!showRecentTransactionAccountNames) {
        return null;
      }

      return resolveFinancialAccountName(
        financialAccounts,
        transaction.financial_account_id,
        site.common.mainFinancialAccount,
      );
    },
    [
      financialAccounts,
      showRecentTransactionAccountNames,
      site.common.mainFinancialAccount,
    ],
  );

  return {
    balanceCurrency,
    categories,
    categoryBreakdown,
    categoryBreakdownDirection,
    categoryBreakdownLoading,
    current,
    financialAccounts,
    handleCategoryBreakdownDirectionChange,
    handleSelectedFinancialAccountChange,
    handleSelectedMonthChange,
    hasBaseCurrency,
    hasMultipleFinancialAccounts,
    hasTimeZone,
    hasTransactions,
    history,
    loading,
    monthHeadingDate,
    profile,
    recentTransactions,
    recurringCandidates,
    recurringCandidatesLoading,
    refreshProfileFromOnboarding,
    resolveRecentTransactionAccountName,
    selectedFinancialAccountId,
    selectedFinancialAccountName,
    selectedMonth,
    showOnboarding,
    site,
    timeZone,
    totalSkippedTransactions,
  };
}

function getProfileAnalyticsKey(profile: UserProfile | null) {
  if (!profile) {
    return "anonymous";
  }

  return [profile.id, profile.base_currency ?? "", profile.timezone ?? ""].join(
    ":",
  );
}

function getAnalyticsSummaryRequestKey(
  profile: UserProfile | null,
  params?: AnalyticsScopeParams,
) {
  return [
    getProfileAnalyticsKey(profile),
    params?.year != null && params?.month != null
      ? `${params.year}-${String(params.month).padStart(2, "0")}`
      : "__latest__",
    params?.financial_account_id ?? "",
  ].join(":");
}

function getCategoryBreakdownRequestKey({
  baseCurrency,
  year,
  month,
  direction,
  financialAccountId,
}: {
  baseCurrency: string;
  year: number;
  month: number;
  direction?: BreakdownDirection;
  financialAccountId?: string;
}) {
  return [baseCurrency, year, month, direction ?? "", financialAccountId ?? ""].join(
    ":",
  );
}

function getRecurringCandidatesRequestKey({
  profileKey,
  year,
  month,
  financialAccountId,
}: {
  profileKey: string;
  year: number;
  month: number;
  financialAccountId?: string;
}) {
  return [profileKey, year, month, financialAccountId ?? ""].join(":");
}

function getFreshCategoriesCache() {
  return getCache<Category[]>(cacheKeys.categories, {
    maxAgeMs: cacheTtls.categories,
  });
}

function getFreshTransactionsCache() {
  return getCache<TransactionsPageResponse>(cacheKeys.transactions, {
    maxAgeMs: cacheTtls.transactions,
  });
}
