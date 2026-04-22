import {
  createClient,
  getOptimisticAccessToken,
} from "@/lib/supabase/client";

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
  const optimisticAccessToken = getOptimisticAccessToken();
  if (optimisticAccessToken) {
    return optimisticAccessToken;
  }

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

export type BalanceDirection = "in" | "out" | string;

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
  recurring_candidate_key: string;
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
  confirmed_obligation_id?: string | null;
  confirmed_obligation_status?: ObligationStatus | null;
}

export interface AnalyticsRecurringCandidates {
  month_start: string;
  history_window_start: string;
  candidates: AnalyticsRecurringCandidate[];
}

export type ObligationCadence = "weekly" | "biweekly" | "monthly";
export type ObligationStatus = "active" | "paused" | "archived";
export type ObligationUrgency = "overdue" | "today" | "soon" | "upcoming";

export interface Obligation {
  id: string;
  name: string;
  amount: string;
  currency: string;
  cadence: ObligationCadence;
  next_due_date: string;
  category_id: string;
  category_name: string;
  expected_financial_account_id?: string | null;
  expected_financial_account_name?: string | null;
  source_recurring_candidate_key?: string | null;
  status: ObligationStatus;
  urgency: ObligationUrgency;
  days_until_due: number;
  expected_account_current_balance?: string | null;
  expected_account_shortfall_amount?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ObligationCounts {
  active: number;
  paused: number;
  archived: number;
}

export interface ObligationsResponse {
  items: Obligation[];
  counts: ObligationCounts;
}

export interface UpcomingObligationsSummary {
  currency: string;
  total_active: number;
  items_in_window: number;
  overdue_count: number;
  due_today_count: number;
  due_soon_count: number;
  expected_account_risk_count: number;
  total_expected_amount: string;
}

export interface UpcomingObligationsResponse {
  reference_date: string;
  window_end_date: string;
  summary: UpcomingObligationsSummary;
  items: Obligation[];
}

export interface ObligationPaymentResponse {
  obligation: Obligation;
  transaction: Transaction;
}

export type ForecastWindowStatus = "covered" | "tight" | "shortfall";

export interface ForecastWindow {
  horizon_days: number;
  window_end_date: string;
  scheduled_payments_count: number;
  confirmed_obligations_total: string;
  projected_balance: string;
  safe_to_spend: string;
  safe_to_spend_per_day: string;
  shortfall_amount: string;
  status: ForecastWindowStatus;
}

export interface SafeToSpend {
  reference_date: string;
  horizon_days: number;
  window_end_date: string;
  currency: string;
  current_balance: string;
  scheduled_payments_count: number;
  confirmed_obligations_total: string;
  projected_balance: string;
  safe_to_spend: string;
  safe_to_spend_per_day: string;
  shortfall_amount: string;
  status: ForecastWindowStatus;
}

export interface CashflowForecast {
  reference_date: string;
  currency: string;
  current_balance: string;
  safe_to_spend: SafeToSpend;
  horizons: ForecastWindow[];
}

export interface LedgerBalanceAccount {
  financial_account_id: string;
  financial_account_name: string;
  currency?: string | null;
  balance: string;
  balance_in_base_currency?: string | null;
}

export interface LedgerBalances {
  currency?: string | null;
  consolidated_balance: string;
  skipped_transactions?: number;
  accounts: LedgerBalanceAccount[];
}

export interface LedgerMovement {
  id: string;
  category_id?: string | null;
  category_name?: string | null;
  financial_account_id: string;
  financial_account_name?: string | null;
  counterparty_financial_account_id?: string | null;
  counterparty_financial_account_name?: string | null;
  transaction_type: TransactionType;
  balance_direction: BalanceDirection;
  transfer_group_id?: string | null;
  amount: string;
  currency: string;
  base_currency?: string | null;
  amount_in_base_currency?: string | null;
  description?: string | null;
  occurred_at: string;
  created_at: string;
}

export interface LedgerActivity {
  items: LedgerMovement[];
  limit: number;
}

export interface TransferResponse {
  transfer_group_id: string;
  source_transaction: LedgerMovement;
  destination_transaction: LedgerMovement;
}

export type ImportItemStatus =
  | "ready"
  | "needs_review"
  | "duplicate"
  | "ignored"
  | "imported";

export interface ImportSessionSummary {
  total_rows: number;
  ready_count: number;
  needs_review_count: number;
  duplicate_count: number;
  ignored_count: number;
  imported_count: number;
}

export interface ImportSessionAnalysis {
  source_headers: string[];
  detected_columns: Record<string, string>;
}

export interface ImportCapabilities {
  max_rows: number;
  required_fields: Record<string, string[]>;
  optional_fields: Record<string, string[]>;
  type_aliases: string[];
}

export interface ImportSessionItem {
  id: string;
  row_index: number;
  raw_row: Record<string, string | null>;
  status: ImportItemStatus;
  status_reason: string | null;
  occurred_at: string | null;
  occurred_on: string | null;
  amount: string | null;
  currency: string | null;
  description: string | null;
  transaction_type: TransactionType | null;
  category_id: string | null;
  category_name: string | null;
  duplicate_transaction: Transaction | null;
  imported_transaction: Transaction | null;
}

export interface ImportSession {
  id: string;
  source_type: string;
  file_name: string;
  financial_account_id: string;
  financial_account_name: string | null;
  analysis: ImportSessionAnalysis | null;
  created_at: string;
  summary: ImportSessionSummary;
  items: ImportSessionItem[];
}

export interface ImportSessionListItem {
  id: string;
  source_type: string;
  file_name: string;
  financial_account_id: string;
  financial_account_name: string | null;
  created_at: string;
  summary: ImportSessionSummary;
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
    currency?: string;
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
      currency?: string;
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

  getObligations: (params?: {
    status?: ObligationStatus;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<ObligationsResponse>(`/obligations/${query}`);
  },

  getUpcomingObligations: (params?: {
    days_ahead?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.days_ahead != null) {
      qs.set("days_ahead", String(params.days_ahead));
    }
    if (params?.limit != null) qs.set("limit", String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<UpcomingObligationsResponse>(`/obligations/upcoming${query}`);
  },

  getCashflowForecast: () =>
    request<CashflowForecast>("/cashflow/forecast"),

  getSafeToSpend: (params?: { horizon_days?: number }) => {
    const qs = new URLSearchParams();
    if (params?.horizon_days != null) {
      qs.set("horizon_days", String(params.horizon_days));
    }
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<SafeToSpend>(`/cashflow/safe-to-spend${query}`);
  },

  createObligation: (body: {
    name: string;
    amount: string;
    currency?: string;
    cadence: ObligationCadence;
    next_due_date: string;
    category_id: string;
    expected_financial_account_id?: string | null;
    source_recurring_candidate_key?: string | null;
    status?: ObligationStatus;
  }) =>
    request<Obligation>("/obligations/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateObligation: (
    id: string,
    body: {
      name?: string;
      amount?: string;
      currency?: string;
      cadence?: ObligationCadence;
      next_due_date?: string;
      category_id?: string;
      expected_financial_account_id?: string | null;
      status?: ObligationStatus;
    },
  ) =>
    request<Obligation>(`/obligations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deleteObligation: (id: string) =>
    request<void>(`/obligations/${id}`, { method: "DELETE" }),

  markObligationPaid: (
    id: string,
    body?: {
      financial_account_id?: string;
      paid_at?: string;
      description?: string | null;
    },
  ) =>
    request<ObligationPaymentResponse>(`/obligations/${id}/mark-paid`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }),

  getLedgerBalances: () => request<LedgerBalances>("/ledger/balances"),

  getLedgerActivity: (params?: {
    financial_account_id?: string;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.financial_account_id) {
      qs.set("financial_account_id", params.financial_account_id);
    }
    if (params?.limit != null) qs.set("limit", String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<LedgerActivity>(`/ledger/activity${query}`);
  },

  getLedgerAdjustments: (params?: {
    financial_account_id?: string;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.financial_account_id) {
      qs.set("financial_account_id", params.financial_account_id);
    }
    if (params?.limit != null) qs.set("limit", String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<LedgerActivity>(`/ledger/adjustments${query}`);
  },

  createTransfer: (body: {
    source_financial_account_id: string;
    destination_financial_account_id: string;
    amount: string;
    currency: string;
    description: string;
    occurred_at: string;
  }) =>
    request<TransferResponse>("/transfers/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteTransfer: (transferGroupId: string) =>
    request<void>(`/transfers/${transferGroupId}`, { method: "DELETE" }),

  createAdjustment: (body: {
    financial_account_id?: string;
    balance_direction: BalanceDirection;
    amount: string;
    currency: string;
    description: string;
    occurred_at: string;
  }) =>
    request<LedgerMovement>("/adjustments/", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteAdjustment: (adjustmentId: string) =>
    request<void>(`/adjustments/${adjustmentId}`, { method: "DELETE" }),

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

  getImportSessions: (params?: { limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.limit != null) qs.set("limit", String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<ImportSessionListItem[]>(`/ingestion/imports${query}`);
  },

  getImportCapabilities: () =>
    request<ImportCapabilities>("/ingestion/import-capabilities"),

  getImportSession: (id: string) =>
    request<ImportSession>(`/ingestion/imports/${id}`),

  createCsvImport: (body: {
    file_name: string;
    csv_content: string;
    financial_account_id?: string;
    default_income_category_id?: string | null;
    default_expense_category_id?: string | null;
  }) =>
    request<ImportSession>("/ingestion/imports/csv", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateImportItem: (
    sessionId: string,
    itemId: string,
    body: {
      category_id?: string | null;
      ignored?: boolean;
    },
  ) =>
    request<ImportSession>(`/ingestion/imports/${sessionId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  commitImportSession: (sessionId: string) =>
    request<ImportSession>(`/ingestion/imports/${sessionId}/commit`, {
      method: "POST",
    }),
};
