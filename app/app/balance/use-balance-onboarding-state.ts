"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useProfile } from "@/components/providers/profile-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import {
  api,
  ApiError,
  type Category,
  type TransactionsPageResponse,
  type UserProfile,
} from "@/lib/api";
import {
  cacheKeys,
  cacheTtls,
  getCache,
  setCache,
  subscribeToCacheKeys,
} from "@/lib/cache";

export function useBalanceOnboardingState() {
  const { profile, setProfile } = useProfile();
  const { site } = useSitePreferences();
  const cachedCategories = getFreshCategoriesCache();
  const cachedTransactions = getFreshTransactionsCache();
  const [categories, setCategories] = useState<Category[]>(
    () => cachedCategories ?? [],
  );
  const [categoriesReady, setCategoriesReady] = useState(
    () => cachedCategories !== null,
  );
  const [transactionsReady, setTransactionsReady] = useState(
    () => cachedTransactions !== null,
  );
  const [hasTransactions, setHasTransactions] = useState(
    () => (cachedTransactions?.total_count ?? 0) > 0,
  );

  const hasBaseCurrency = Boolean(profile?.base_currency);
  const hasTimeZone = Boolean(profile?.timezone);
  const hasCategories = categories.length > 0;
  const needsProfileSetup = !hasBaseCurrency || !hasTimeZone;
  const isCheckingRequirements =
    !needsProfileSetup && (!categoriesReady || !transactionsReady);
  const showOnboarding =
    needsProfileSetup ||
    (categoriesReady &&
      transactionsReady &&
      !(hasBaseCurrency && hasTimeZone && hasCategories && hasTransactions));

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
      setCache(cacheKeys.categories, data);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(site.common.unexpectedError);
      }
    } finally {
      setCategoriesReady(true);
    }
  }, [site.common.unexpectedError]);

  const loadTransactionsPresence = useCallback(async () => {
    const cachedData = getFreshTransactionsCache();
    if (cachedData) {
      setHasTransactions((cachedData.total_count ?? 0) > 0);
      setTransactionsReady(true);
      return;
    }

    try {
      const data = await api.getTransactions({ limit: 1 });
      setHasTransactions((data.total_count ?? 0) > 0);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(site.common.unexpectedError);
      }
    } finally {
      setTransactionsReady(true);
    }
  }, [site.common.unexpectedError]);

  const handleProfileUpdated = useCallback(
    (updatedProfile: UserProfile) => {
      setProfile(updatedProfile);
    },
    [setProfile],
  );

  useEffect(() => {
    void loadCategories();
    void loadTransactionsPresence();
  }, [loadCategories, loadTransactionsPresence]);

  useEffect(() => {
    return subscribeToCacheKeys(
      [cacheKeys.categories, cacheKeys.transactions],
      (changedKeys) => {
        if (changedKeys.includes(cacheKeys.categories)) {
          void loadCategories();
        }
        if (changedKeys.includes(cacheKeys.transactions)) {
          void loadTransactionsPresence();
        }
      },
    );
  }, [loadCategories, loadTransactionsPresence]);

  return {
    categories,
    hasBaseCurrency,
    hasTimeZone,
    hasTransactions,
    isCheckingRequirements,
    profile,
    showOnboarding,
    onProfileUpdated: handleProfileUpdated,
  };
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
