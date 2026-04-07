"use client";

import { type CSSProperties } from "react";

import { type LedgerBalanceAccount } from "@/lib/api";
import { CreateFinancialAccountModal } from "@/app/app/components/create-financial-account-modal";
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

type AccountBalancesCardProps = {
  accounts: LedgerBalanceAccount[];
  balanceCurrency: string;
  emptyLabel: string;
  loading: boolean;
  loadingLabel: string;
  locale: string;
  matchHeight?: number | null;
  onAccountCreated?: () => void;
  selectedFinancialAccountId: string | null;
  showCreateAction?: boolean;
  text: SiteText["pages"]["balance"];
  onToggleAccount: (financialAccountId: string, isSelected: boolean) => void;
};

export function AccountBalancesCard({
  accounts,
  balanceCurrency,
  emptyLabel,
  loading,
  loadingLabel,
  locale,
  matchHeight,
  onAccountCreated,
  selectedFinancialAccountId,
  showCreateAction = true,
  text,
  onToggleAccount,
}: AccountBalancesCardProps) {
  const cardStyle =
    matchHeight != null
      ? ({
          "--account-balances-height": `${matchHeight}px`,
        } as CSSProperties)
      : undefined;

  return (
    <Card className="xl:h-(--account-balances-height)" style={cardStyle}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle>{text.accountsTitle}</CardTitle>
              <InfoHint
                title={text.accountsHelpTitle}
                description={text.accountsHelpDescription}
              />
            </div>
            <CardDescription>{text.accountsDescription}</CardDescription>
          </div>
          {showCreateAction ? (
            <CreateFinancialAccountModal
              size="sm"
              onCreated={onAccountCreated}
            />
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 xl:flex xl:flex-1 xl:min-h-0 xl:flex-col">
        {loading && accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{loadingLabel}</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="relative xl:flex-1 xl:min-h-0">
            <div className="space-y-3 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pr-2 xl:pb-0">
              {accounts.map((account) => {
                const isSelected =
                  selectedFinancialAccountId !== "" &&
                  selectedFinancialAccountId === account.financial_account_id;

                return (
                  <button
                    key={account.financial_account_id}
                    type="button"
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-border bg-background hover:bg-muted/40"
                    }`}
                    onClick={() =>
                      onToggleAccount(account.financial_account_id, isSelected)
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {account.financial_account_name}
                        </p>
                        <p
                          className={`text-sm ${
                            isSelected
                              ? "text-slate-300"
                              : "text-muted-foreground"
                          }`}
                        >
                          {account.currency ?? balanceCurrency}
                        </p>
                      </div>
                      <p className="shrink-0 text-right text-lg font-semibold tabular-nums">
                        {formatMoney(
                          account.balance,
                          account.currency ?? balanceCurrency,
                          locale,
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatMoney(value: string, currency: string, locale: string) {
  return formatCurrencyAmount(value, currency, locale);
}
