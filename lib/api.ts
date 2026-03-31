import { createClient } from "@/lib/supabase/client";

function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!apiBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  }
  return apiBaseUrl.replace(/\/+$/, "");
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new ApiError(401, "No active session");
  }
  return session.access_token;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getAccessToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) message = body.detail;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  base_currency?: string | null;
  timezone?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface Category {
  id: string;
  name: string;
  direction: "income" | "expense";
  parent_id: string | null;
}

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "adjustment"
  | string;

export interface FinancialAccount {
  id: string;
  name: string;
  currency?: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  category_id: string | null;
  financial_account_id?: string;
  transaction_type?: TransactionType | null;
  transfer_group_id?: string | null;
  amount: string;
  currency: string;
  fx_rate?: string | null;
  fx_rate_date?: string | null;
  fx_rate_source?: string | null;
  base_currency?: string | null;
  amount_in_base_currency?: string | null;
  description: string | null;
  occurred_at: string;
  created_at: string;
}

export interface TransactionSummaryTotal {
  currency: string;
  amount: string;
}

export interface TransactionsSummary {
  active_categories_count: number;
  skipped_transactions: number;
  income_totals: TransactionSummaryTotal[];
  expense_totals: TransactionSummaryTotal[];
  balance_totals: TransactionSummaryTotal[];
}

export interface TransactionsPageResponse {
  items: Transaction[];
  total_count: number | null;
  limit: number;
  offset: number;
  summary: TransactionsSummary | null;
}

export interface BalanceMonth {
  month_start: string;
  currency?: string | null;
  income: string;
  expense: string;
  balance: string;
  skipped_transactions?: number;
}

export interface BalanceOverview {
  currency?: string | null;
  current: BalanceMonth;
  series: BalanceMonth[];
}

export interface AnalyticsSummaryTransaction {
  id: string;
  category_id: string | null;
  financial_account_id?: string | null;
  category_name: string;
  direction: TransactionType;
  amount: string;
  currency: string;
  base_currency?: string | null;
  amount_in_base_currency?: string | null;
  description?: string | null;
  occurred_at: string;
}

export interface AnalyticsSummary extends BalanceOverview {
  recent_transactions: AnalyticsSummaryTransaction[];
}

export interface AnalyticsCategoryBreakdownItem {
  category_id: string;
  category_name: string;
  direction: TransactionType;
  amount: string;
  percentage: string;
  transaction_count: number;
}

export interface AnalyticsCategoryBreakdown {
  month_start: string;
  currency?: string | null;
  direction?: "income" | "expense" | string | null;
  total: string;
  skipped_transactions: number;
  breakdown: AnalyticsCategoryBreakdownItem[];
}

export interface AnalyticsRecurringCandidate {
  label: string;
  description?: string | null;
  category_id: string;
  category_name: string;
  direction: "income" | "expense";
  cadence: "weekly" | "biweekly" | "monthly";
  match_basis: "description" | "category_amount";
  amount_pattern: "exact" | "stable";
  currency: string;
  typical_amount: string;
  amount_min: string;
  amount_max: string;
  occurrence_count: number;
  interval_days: number[];
  first_occurred_at: string;
  last_occurred_at: string;
}

export interface AnalyticsRecurringCandidates {
  month_start: string;
  history_window_start: string;
  candidates: AnalyticsRecurringCandidate[];
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export const api = {
  healthz: () => request<{ status: string }>("/healthz", {}, false),

  getProfile: () => request<UserProfile>("/users/me"),

  bootstrapProfile: (body?: { name?: string }) =>
    request<UserProfile>("/users/me/bootstrap", {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  createProfile: (body: { name: string; email: string }) =>
    request<UserProfile>("/users/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateProfile: (body: {
    name?: string;
    base_currency?: string;
    timezone?: string;
  }) =>
    request<UserProfile>("/users/me", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deactivateAccount: () => request<void>("/users/me", { method: "DELETE" }),

  getCategories: () => request<Category[]>("/categories/"),

  getFinancialAccounts: () =>
    request<FinancialAccount[]>("/financial-accounts/"),

  getFinancialAccount: (id: string) =>
    request<FinancialAccount>(`/financial-accounts/${id}`),

  createFinancialAccount: (body: {
    name: string;
    is_default?: boolean;
  }) =>
    request<FinancialAccount>("/financial-accounts/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateFinancialAccount: (
    id: string,
    body: {
      name?: string;
      is_default?: boolean;
    },
  ) =>
    request<FinancialAccount>(`/financial-accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteFinancialAccount: (id: string) =>
    request<void>(`/financial-accounts/${id}`, { method: "DELETE" }),

  createCategory: (body: {
    name: string;
    direction: "income" | "expense";
    parent_id?: string | null;
  }) =>
    request<Category>("/categories/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateCategory: (
    id: string,
    body: {
      name?: string;
      direction?: "income" | "expense";
      parent_id?: string | null;
    },
  ) =>
    request<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteCategory: (id: string) =>
    request<void>(`/categories/${id}`, { method: "DELETE" }),

  getTransactions: (params?: {
    financial_account_id?: string;
    category_id?: string;
    parent_category_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
    include_total_count?: boolean;
    include_summary?: boolean;
  }) => {
    const qs = new URLSearchParams();
    if (params?.financial_account_id) {
      qs.set("financial_account_id", params.financial_account_id);
    }
    if (params?.category_id) qs.set("category_id", params.category_id);
    if (params?.parent_category_id) {
      qs.set("parent_category_id", params.parent_category_id);
    }
    if (params?.start_date) qs.set("start_date", params.start_date);
    if (params?.end_date) qs.set("end_date", params.end_date);
    if (params?.limit != null) qs.set("limit", String(params.limit));
    if (params?.offset != null) qs.set("offset", String(params.offset));
    if (params?.include_total_count != null) {
      qs.set("include_total_count", String(params.include_total_count));
    }
    if (params?.include_summary != null) {
      qs.set("include_summary", String(params.include_summary));
    }
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<TransactionsPageResponse>(`/transactions/${query}`);
  },

  getMonthlyBalance: (params?: {
    year?: number;
    month?: number;
    financial_account_id?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.year != null) qs.set("year", String(params.year));
    if (params?.month != null) qs.set("month", String(params.month));
    if (params?.financial_account_id) {
      qs.set("financial_account_id", params.financial_account_id);
    }
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<BalanceOverview>(`/balance/monthly${query}`);
  },

  getAnalyticsSummary: (params?: {
    year?: number;
    month?: number;
    financial_account_id?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.year != null) qs.set("year", String(params.year));
    if (params?.month != null) qs.set("month", String(params.month));
    if (params?.financial_account_id) {
      qs.set("financial_account_id", params.financial_account_id);
    }
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<AnalyticsSummary>(`/analytics/summary${query}`);
  },

  getAnalyticsCategoryBreakdown: (params: {
    year: number;
    month: number;
    direction?: "income" | "expense";
    financial_account_id?: string;
  }) => {
    const qs = new URLSearchParams();
    qs.set("year", String(params.year));
    qs.set("month", String(params.month));
    if (params.direction) qs.set("direction", params.direction);
    if (params.financial_account_id) {
      qs.set("financial_account_id", params.financial_account_id);
    }
    return request<AnalyticsCategoryBreakdown>(
      `/analytics/category-breakdown?${qs.toString()}`,
    );
  },

  getAnalyticsRecurringCandidates: (params: {
    year: number;
    month: number;
    financial_account_id?: string;
  }) => {
    const qs = new URLSearchParams();
    qs.set("year", String(params.year));
    qs.set("month", String(params.month));
    if (params.financial_account_id) {
      qs.set("financial_account_id", params.financial_account_id);
    }
    return request<AnalyticsRecurringCandidates>(
      `/analytics/recurring-candidates?${qs.toString()}`,
    );
  },

  createTransaction: (body: {
    category_id: string;
    financial_account_id?: string;
    transaction_type?: TransactionType;
    amount: string;
    currency: string;
    description?: string | null;
    occurred_at: string;
  }) =>
    request<Transaction>("/transactions/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateTransaction: (
    id: string,
    body: {
      category_id?: string;
      financial_account_id?: string;
      transaction_type?: TransactionType;
      amount?: string;
      currency?: string;
      description?: string | null;
      occurred_at?: string;
    },
  ) =>
    request<Transaction>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteTransaction: (id: string) =>
    request<void>(`/transactions/${id}`, { method: "DELETE" }),
};
