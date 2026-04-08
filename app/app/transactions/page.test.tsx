import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TransactionsPage from "./page";
import { getSiteText } from "@/lib/site";

const {
  cacheStore,
  getCategoriesMock,
  getFinancialAccountsMock,
  getProfileMock,
  getTransactionsMock,
  setProfileMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  cacheStore: new Map<string, unknown>(),
  getCategoriesMock: vi.fn(),
  getFinancialAccountsMock: vi.fn(),
  getProfileMock: vi.fn(),
  getTransactionsMock: vi.fn(),
  setProfileMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
  api: {
    getCategories: getCategoriesMock,
    getFinancialAccounts: getFinancialAccountsMock,
    getTransactions: getTransactionsMock,
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

vi.mock("@/components/providers/profile-provider", () => ({
  useProfile: () => ({
    profile: getProfileMock(),
    setProfile: setProfileMock,
  }),
}));

vi.mock("@/components/providers/site-preferences-provider", () => ({
  useSitePreferences: () => ({
    site: getSiteText("es"),
  }),
}));

vi.mock("@/lib/cache", () => ({
  cacheKeys: {
    cashflowForecast: "cache:cashflow-forecast",
    categories: "cache:categories",
    financialAccounts: "cache:financial-accounts",
    transactions: "cache:transactions",
  },
  cacheTtls: {
    categories: 60_000,
    financialAccounts: 60_000,
    transactions: 30_000,
  },
  getCache: (key: string) => cacheStore.get(key) ?? null,
  setCache: (key: string, value: unknown) => {
    cacheStore.set(key, value);
  },
  invalidateCacheKey: (key: string) => {
    cacheStore.delete(key);
  },
  subscribeToCacheKeys: () => () => {},
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: vi.fn(),
  },
}));

vi.mock("../profile/components/financial-profile-form", () => ({
  FinancialProfileForm: () => <div>financial-profile-form</div>,
}));

vi.mock("./components", () => ({
  CreateTransactionModal: () => null,
  TransactionsFilters: ({
    onFilterFinancialAccountChange,
    onFilterCategoryChange,
  }: {
    onFilterFinancialAccountChange: (value: string) => void;
    onFilterCategoryChange: (value: string) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onFilterCategoryChange("cat-filtered")}
      >
        Aplicar filtro
      </button>
      <button
        type="button"
        onClick={() => onFilterFinancialAccountChange("acc-filtered")}
      >
        Filtrar cuenta
      </button>
    </div>
  ),
  TransactionsView: ({
    transactions,
    totalCount,
    listLoading,
    onPageChange,
  }: {
    transactions: { id: string }[];
    totalCount: number;
    listLoading: boolean;
    onPageChange: (page: number) => void;
  }) => (
    <div>
      <div data-testid="transactions-loading">
        {listLoading ? "loading" : "ready"}
      </div>
      <div data-testid="transactions-count">{transactions.length}</div>
      <div data-testid="transactions-total">{totalCount}</div>
      <div data-testid="transactions-first-id">{transactions[0]?.id ?? "none"}</div>
      <button type="button" onClick={() => onPageChange(2)}>
        Ir a pagina 2
      </button>
    </div>
  ),
}));

describe("TransactionsPage", () => {
  beforeEach(() => {
    cacheStore.clear();
    getCategoriesMock.mockReset();
    getFinancialAccountsMock.mockReset();
    getProfileMock.mockReset();
    getTransactionsMock.mockReset();
    setProfileMock.mockReset();
    toastErrorMock.mockReset();

    getProfileMock.mockReturnValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: "COP",
      timezone: "America/Bogota",
      created_at: "2026-03-01T00:00:00Z",
      deleted_at: null,
    });

    getCategoriesMock.mockResolvedValue([
      {
        id: "cat-1",
        name: "Food",
        direction: "expense",
        parent_id: null,
      },
    ]);
    getFinancialAccountsMock.mockResolvedValue([
      {
        id: "acc-1",
        name: "Main account",
        currency: "COP",
        is_default: true,
        created_at: "2026-03-01T00:00:00Z",
      },
      {
        id: "acc-filtered",
        name: "Wallet",
        currency: "COP",
        is_default: false,
        created_at: "2026-03-02T00:00:00Z",
      },
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it("loads only the requested backend page and fetches the next page on demand", async () => {
    getTransactionsMock.mockImplementation(async (params?: {
      category_id?: string;
      limit?: number;
      offset?: number;
      include_total_count?: boolean;
      include_summary?: boolean;
    }) => {
      if (params?.category_id === "cat-filtered") {
        return buildTransactionsPage(
          24,
          "cat-filtered",
          params?.offset ?? 0,
          params?.include_total_count !== false,
        );
      }

      return buildTransactionsPage(
        125,
        "cat-1",
        params?.offset ?? 0,
        params?.include_total_count !== false,
      );
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("transactions-loading")).toHaveTextContent("ready");
    });

    expect(
      screen.getByRole("button", { name: "Que entra aqui?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Como leer este resumen?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Resumen de estos movimientos")).toBeInTheDocument();
    expect(screen.getByTestId("transactions-count")).toHaveTextContent("12");
    expect(screen.getByTestId("transactions-total")).toHaveTextContent("125");
    expect(screen.getByTestId("transactions-first-id")).toHaveTextContent("txn-1");
    expect(getFinancialAccountsMock).toHaveBeenCalledTimes(1);
    expect(getTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 12, offset: 0 }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Ir a pagina 2" }));

    await waitFor(() => {
      expect(screen.getByTestId("transactions-first-id")).toHaveTextContent(
        "txn-13",
      );
    });

    expect(getTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 12, offset: 12 }),
    );
    expect(getTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 12,
        offset: 12,
        include_total_count: false,
        include_summary: false,
      }),
    );
    expect(
      getTransactionsMock.mock.calls.some(
        ([params]) => params?.offset === 100 || params?.offset === 24,
      ),
    ).toBe(false);
  });

  it("resets to the first backend page when filters change", async () => {
    getTransactionsMock.mockImplementation(async (params?: {
      category_id?: string;
      limit?: number;
      offset?: number;
      include_total_count?: boolean;
      include_summary?: boolean;
    }) => {
      if (params?.category_id === "cat-filtered") {
        return buildTransactionsPage(
          18,
          "cat-filtered",
          params?.offset ?? 0,
          params?.include_total_count !== false,
        );
      }

      return buildTransactionsPage(
        125,
        "cat-1",
        params?.offset ?? 0,
        params?.include_total_count !== false,
      );
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("transactions-first-id")).toHaveTextContent(
        "txn-1",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Ir a pagina 2" }));

    await waitFor(() => {
      expect(screen.getByTestId("transactions-first-id")).toHaveTextContent(
        "txn-13",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro" }));

    await waitFor(() => {
      expect(screen.getByTestId("transactions-count")).toHaveTextContent("12");
      expect(screen.getByTestId("transactions-total")).toHaveTextContent("18");
      expect(screen.getByTestId("transactions-first-id")).toHaveTextContent(
        "txn-1",
      );
    });

    expect(getTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: "cat-filtered",
        limit: 12,
        offset: 0,
      }),
    );
    expect(getTransactionsMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: "cat-filtered",
        include_total_count: false,
        include_summary: false,
      }),
    );
  });

  it("passes the selected financial account filter to the backend", async () => {
    getTransactionsMock.mockImplementation(async (params?: {
      financial_account_id?: string;
      limit?: number;
      offset?: number;
      include_total_count?: boolean;
      include_summary?: boolean;
    }) => {
      if (params?.financial_account_id === "acc-filtered") {
        return buildTransactionsPage(
          7,
          "cat-1",
          params?.offset ?? 0,
          params?.include_total_count !== false,
          "acc-filtered",
        );
      }

      return buildTransactionsPage(
        15,
        "cat-1",
        params?.offset ?? 0,
        params?.include_total_count !== false,
        "acc-1",
      );
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("transactions-first-id")).toHaveTextContent(
        "txn-1",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Ir a pagina 2" }));

    await waitFor(() => {
      expect(screen.getByTestId("transactions-first-id")).toHaveTextContent(
        "txn-13",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Filtrar cuenta" }));

    await waitFor(() => {
      expect(screen.getByTestId("transactions-first-id")).toHaveTextContent(
        "txn-1",
      );
      expect(screen.getByTestId("transactions-total")).toHaveTextContent("7");
    });

    expect(getTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        financial_account_id: "acc-filtered",
        limit: 12,
        offset: 0,
      }),
    );
  });

  it("does not render the financial profile card when the profile is incomplete", async () => {
    getProfileMock.mockReturnValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: null,
      timezone: null,
      created_at: "2026-03-01T00:00:00Z",
      deleted_at: null,
    });
    getTransactionsMock.mockResolvedValue(
      buildTransactionsPage(0, "cat-1", 0, true),
    );

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("transactions-loading")).toHaveTextContent("ready");
    });

    expect(screen.queryByText("Perfil financiero")).not.toBeInTheDocument();
    expect(screen.getByText("Resumen de estos movimientos")).toBeInTheDocument();
  });
});

function buildTransactionsPage(
  totalCount: number,
  categoryId: string,
  offset: number,
  includeMetadata = true,
  financialAccountId = "acc-1",
) {
  const pageSize = 12;
  const remaining = Math.max(0, totalCount - offset);
  const count = Math.min(pageSize, remaining);

  return {
    items: Array.from({ length: count }, (_, index) => ({
      id: `txn-${offset + index + 1}`,
      category_id: categoryId,
      financial_account_id: financialAccountId,
      amount: "1000.00",
      currency: "COP",
      description: `Transaction ${offset + index + 1}`,
      occurred_at: `2026-03-${String(((offset + index) % 28) + 1).padStart(2, "0")}T12:00:00Z`,
      created_at: "2026-03-01T12:00:00Z",
      fx_rate: "1.00000000",
      fx_rate_date: "2026-03-01",
      fx_rate_source: "identity",
      base_currency: "COP",
      amount_in_base_currency: "1000.00",
    })),
    total_count: includeMetadata ? totalCount : null,
    limit: pageSize,
    offset,
    summary: includeMetadata
      ? {
          active_categories_count: 1,
          skipped_transactions: 0,
          income_totals: [],
          expense_totals: [{ currency: "COP", amount: "1000.00" }],
          balance_totals: [{ currency: "COP", amount: "-1000.00" }],
        }
      : null,
  };
}
