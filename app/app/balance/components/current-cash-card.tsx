"use client";

import { type ReactNode } from "react";

import { type LedgerBalanceAccount } from "@/lib/api";
import { formatCurrencyAmount } from "@/lib/finance";
import { type SiteText } from "@/lib/site";
import { InfoHint } from "@/components/ui/info-hint";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CurrentCashCardProps = {
  accounts: LedgerBalanceAccount[];
  balanceCurrency: string;
  consolidatedBalance: string;
  financialAccountsCount: number;
  locale: string;
  selectedAccountBalance: LedgerBalanceAccount | null;
  selectedFinancialAccountName: string | null;
  showEmptyState: boolean;
  text: SiteText["pages"]["balance"];
};

export function CurrentCashCard({
  accounts,
  balanceCurrency,
  consolidatedBalance,
  financialAccountsCount,
  locale,
  selectedAccountBalance,
  selectedFinancialAccountName,
  showEmptyState,
  text,
}: CurrentCashCardProps) {
  const distribution = buildCurrentCashDistribution(accounts, balanceCurrency, locale);
  const visibleDistribution = distribution.slice(0, 4);
  const hiddenAccountsCount = distribution.length - visibleDistribution.length;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2">
          <CardTitle>{text.currentCashTitle}</CardTitle>
          <InfoHint
            title={text.currentCashHelpTitle}
            description={text.currentCashHelpDescription}
          />
        </div>
        <CardDescription>
          {text.currentCashDescription(
            balanceCurrency,
            selectedFinancialAccountName,
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <CurrentCashStat
            label={
              <span className="inline-flex items-center gap-1.5">
                <span>{text.consolidatedBalanceLabel}</span>
                <InfoHint
                  title={text.consolidatedBalanceHelpTitle}
                  description={text.consolidatedBalanceHelpDescription}
                  align="right"
                />
              </span>
            }
            value={formatMoney(consolidatedBalance, balanceCurrency, locale)}
          />

          {selectedAccountBalance ? (
            <CurrentCashStat
              label={text.selectedAccountBalanceLabel(
                selectedAccountBalance.financial_account_name,
              )}
              value={formatMoney(
                selectedAccountBalance.balance,
                selectedAccountBalance.currency ?? balanceCurrency,
                locale,
              )}
            />
          ) : (
            <CurrentCashStat
              label={text.actionsTitle}
              value={String(financialAccountsCount)}
              compact
            />
          )}
        </div>

        {showEmptyState ? (
          <div className="rounded-2xl border bg-muted/15 p-5 shadow-sm">
            <p className="text-lg font-semibold">{text.emptyStateTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {text.emptyStateDescription}
            </p>
          </div>
        ) : null}

        {visibleDistribution.length > 0 ? (
          <div className="rounded-2xl border bg-muted/10 p-5 shadow-sm">
            <div className="flex items-start gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold tracking-tight">
                    {text.currentCashDistributionTitle}
                  </p>
                  <InfoHint
                    title={text.currentCashDistributionHelpTitle}
                    description={text.currentCashDistributionHelpDescription}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {text.currentCashDistributionDescription}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {visibleDistribution.map((account, index) => (
                <div key={account.financial_account_id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {account.financial_account_name}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {account.formattedBalance}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs font-semibold tracking-[0.04em] text-muted-foreground tabular-nums">
                      {account.shareLabel}
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full bg-linear-to-r from-cyan-400 to-sky-500 ${index > 0 ? "opacity-80" : ""}`}
                      style={{ width: `${account.shareWidth}%` }}
                    />
                  </div>
                </div>
              ))}

              {hiddenAccountsCount > 0 ? (
                <p className="text-xs font-medium text-muted-foreground">
                  {text.currentCashDistributionOtherAccounts(hiddenAccountsCount)}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CurrentCashStat({
  label,
  value,
  compact = false,
}: {
  label: ReactNode;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-muted/15 p-5 shadow-sm">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <p
        className={`mt-3 font-semibold tracking-tight tabular-nums ${compact ? "text-3xl" : "text-4xl"}`}
      >
        {value}
      </p>
    </div>
  );
}

function formatMoney(value: string, currency: string, locale: string) {
  return formatCurrencyAmount(value, currency, locale);
}

function buildCurrentCashDistribution(
  accounts: LedgerBalanceAccount[],
  currency: string,
  locale: string,
) {
  const accountsWithBalance = accounts
    .map((account) => ({
      ...account,
      numericBalance: Number(account.balance) || 0,
    }))
    .filter((account) => account.numericBalance > 0)
    .sort((left, right) => right.numericBalance - left.numericBalance);

  const totalBalance = accountsWithBalance.reduce(
    (sum, account) => sum + account.numericBalance,
    0,
  );

  if (totalBalance <= 0) {
    return [];
  }

  return accountsWithBalance.map((account) => {
    const share = (account.numericBalance / totalBalance) * 100;
    return {
      financial_account_id: account.financial_account_id,
      financial_account_name: account.financial_account_name,
      formattedBalance: formatMoney(
        account.balance,
        account.currency ?? currency,
        locale,
      ),
      shareLabel: formatShare(share, locale),
      shareWidth: Math.max(share, 8),
    };
  });
}

function formatShare(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  }).format(value) + "%";
}
