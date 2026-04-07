"use client";

import { useEffect, useState } from "react";
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
import { InfoHint } from "@/components/ui/info-hint";
import { FinancialProfileForm } from "./financial-profile-form";

export function FinancialProfileCard() {
  const { profile, setProfile } = useProfile();
  const { site } = useSitePreferences();
  const t = site.pages.profile;
  const [hasTransactions, setHasTransactions] = useState(
    () => readRecordedActivityPresenceFromCache() ?? false,
  );
  const formKey = `${profile?.base_currency ?? ""}:${profile?.timezone ?? ""}:${hasTransactions ? 1 : 0}`;

  useEffect(() => {
    if (readRecordedActivityPresenceFromCache() != null) {
      return;
    }

    let cancelled = false;

    async function fetchTransactionPresence() {
      try {
        const hasRecordedActivity = await resolveRecordedActivityPresence(
          Boolean(profile?.base_currency),
        );
        if (!cancelled) {
          setHasTransactions(hasRecordedActivity);
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
  }, [profile?.base_currency, t.failedLoadTransactionPresence]);

  useEffect(() => {
    async function refreshTransactionPresence() {
      const cachedPresence = readRecordedActivityPresenceFromCache();
      if (cachedPresence != null) {
        setHasTransactions(cachedPresence);
        return;
      }

      try {
        const hasRecordedActivity = await resolveRecordedActivityPresence(
          Boolean(profile?.base_currency),
        );
        setHasTransactions(hasRecordedActivity);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(t.failedLoadTransactionPresence);
        }
      }
    }

    return subscribeToCacheKeys(
      [cacheKeys.transactions, cacheKeys.ledgerActivity],
      () => {
        void refreshTransactionPresence();
      },
    );
  }, [profile?.base_currency, t.failedLoadTransactionPresence]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{t.financeTitle}</CardTitle>
          <InfoHint
            title={t.financeHelpTitle}
            description={t.financeHelpDescription}
          />
        </div>
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

function readRecordedActivityPresenceFromCache() {
  const cachedLedgerActivity = getCache<{ items?: Array<{ id: string }> }>(
    cacheKeys.ledgerActivity,
    {
      maxAgeMs: cacheTtls.ledgerActivity,
    },
  );
  if (cachedLedgerActivity) {
    return (cachedLedgerActivity.items?.length ?? 0) > 0;
  }

  const cachedTransactions = getCache<{ total_count: number }>(
    cacheKeys.transactions,
    {
      maxAgeMs: cacheTtls.transactions,
    },
  );

  return cachedTransactions ? (cachedTransactions.total_count ?? 0) > 0 : null;
}

async function resolveRecordedActivityPresence(hasBaseCurrency: boolean) {
  if (hasBaseCurrency) {
    const ledgerActivity = await api.getLedgerActivity({ limit: 1 });
    return ledgerActivity.items.length > 0;
  }

  const transactions = await api.getTransactions({ limit: 1 });
  return (transactions.total_count ?? 0) > 0;
}
