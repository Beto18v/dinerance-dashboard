import { type FinancialAccount } from "@/lib/api";
import { cacheKeys, cacheTtls, getCache } from "@/lib/cache";

const DEFAULT_FINANCIAL_ACCOUNT_NAMES = new Set([
  "Main account",
  "Cuenta principal",
]);

export function getFreshFinancialAccountsCache() {
  return getCache<FinancialAccount[]>(cacheKeys.financialAccounts, {
    maxAgeMs: cacheTtls.financialAccounts,
  });
}

export function resolveDefaultFinancialAccountId(accounts: FinancialAccount[]) {
  return accounts.find((account) => account.is_default)?.id ?? accounts[0]?.id ?? "";
}

export function resolveFinancialAccountName(
  accounts: FinancialAccount[],
  accountId: string | null | undefined,
  defaultLabel?: string,
) {
  if (!accountId) {
    return null;
  }

  const account = accounts.find((item) => item.id === accountId);
  if (!account) {
    return accountId;
  }

  return getFinancialAccountDisplayName(account, defaultLabel);
}

export function getFinancialAccountDisplayName(
  account: FinancialAccount,
  defaultLabel?: string,
) {
  if (
    defaultLabel &&
    account.is_default &&
    DEFAULT_FINANCIAL_ACCOUNT_NAMES.has(account.name.trim())
  ) {
    return defaultLabel;
  }

  return account.name;
}
