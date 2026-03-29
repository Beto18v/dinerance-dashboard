"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { useProfile } from "@/components/providers/profile-provider";
import {
  cacheKeys,
  cacheTtls,
  getCache,
  subscribeToCacheKeys,
} from "@/lib/cache";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinancialProfileForm } from "./financial-profile-form";

export function FinancialProfileCard() {
  const { profile, setProfile } = useProfile();
  const { site } = useSitePreferences();
  const t = site.pages.profile;
  const [hasTransactions, setHasTransactions] = useState(
    () => readTransactionsPresenceFromCache() ?? false,
  );
  const formKey = `${profile?.base_currency ?? ""}:${profile?.timezone ?? ""}:${hasTransactions ? 1 : 0}`;

  const loadTransactionPresence = useCallback(async () => {
    const cachedPresence = readTransactionsPresenceFromCache();
    if (cachedPresence != null) {
      setHasTransactions(cachedPresence);
      return;
    }

    try {
      const transactions = await api.getTransactions({ limit: 1 });
      setHasTransactions((transactions.total_count ?? 0) > 0);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedLoadTransactionPresence);
      }
    }
  }, [t.failedLoadTransactionPresence]);

  useEffect(() => {
    if (readTransactionsPresenceFromCache() != null) {
      return;
    }

    let cancelled = false;

    async function fetchTransactionPresence() {
      try {
        const transactions = await api.getTransactions({ limit: 1 });
        if (!cancelled) {
          setHasTransactions((transactions.total_count ?? 0) > 0);
        }
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(t.failedLoadTransactionPresence);
        }
      }
    }

    void fetchTransactionPresence();

    return () => {
      cancelled = true;
    };
  }, [t.failedLoadTransactionPresence]);

  useEffect(() => {
    return subscribeToCacheKeys([cacheKeys.transactions], () => {
      void loadTransactionPresence();
    });
  }, [loadTransactionPresence]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.financeTitle}</CardTitle>
        <CardDescription>{t.financeCardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <FinancialProfileForm
          key={formKey}
          profile={profile}
          hasTransactions={hasTransactions}
          onProfileUpdated={setProfile}
        />
      </CardContent>
    </Card>
  );
}

function readTransactionsPresenceFromCache() {
  const cachedTransactions = getCache<{ total_count: number }>(
    cacheKeys.transactions,
    {
      maxAgeMs: cacheTtls.transactions,
    },
  );

  return cachedTransactions ? (cachedTransactions.total_count ?? 0) > 0 : null;
}
