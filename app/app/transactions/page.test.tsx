import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TransactionsPage from "./page";
import { getSiteText } from "@/lib/site";

const {
  cacheStore,
  getCategoriesMock,
  getTransactionsMock,
  setProfileMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  cacheStore: new Map<string, unknown>(),
  getCategoriesMock: vi.fn(),
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
    getTransactions: getTransactionsMock,
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

vi.mock("@/components/providers/profile-provider", () => ({
  useProfile: () => ({
    profile: {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: "COP",
      timezone: "America/Bogota",
      created_at: "2026-03-01T00:00:00Z",
      deleted_at: null,
    },
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
    categories: "cache:categories",
    transactions: "cache:transactions",
  },
  cacheTtls: {
    categories: 60_000,
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
    onFilterCategoryChange,
  }: {
    onFilterCategoryChange: (value: string) => void;
  }) => (
    <button type="button" onClick={() => onFilterCategoryChange("cat-filtered")}>
      Aplicar filtro
    </button>
  ),
  TransactionsView: ({
    transactions,
    listLoading,
  }: {
    transactions: { id: string }[];
    listLoading: boolean;
  }) => (
    <div>
      <div data-testid="transactions-loading">
        {listLoading ? "loading" : "ready"}
      </div>
      <div data-testid="transactions-count">{transactions.length}</div>
    </div>
  ),
}));

describe("TransactionsPage", () => {
  beforeEach(() => {
    cacheStore.clear();
    getCategoriesMock.mockReset();
    getTransactionsMock.mockReset();
    setProfileMock.mockReset();
    toastErrorMock.mockReset();

    getCategoriesMock.mockResolvedValue([
      {
        id: "cat-1",
        name: "Food",
        direction: "expense",
        parent_id: null,
      },
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it("loads every backend page on the initial unfiltered request", async () => {
    const allTransactions = buildTransactions(125, "cat-1");

    getTransactionsMock.mockImplementation(async (params?: {
      category_id?: string;
      limit?: number;
      offset?: number;
    }) => {
      if (params?.limit === 1) {
        return allTransactions.slice(0, 1);
      }

      if (params?.limit === 100 && params?.offset === 0) {
        return allTransactions.slice(0, 100);
      }

      if (params?.limit === 100 && params?.offset === 100) {
        return allTransactions.slice(100);
      }

      return [];
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("transactions-loading")).toHaveTextContent("ready");
    });

    expect(screen.getByTestId("transactions-count")).toHaveTextContent("125");
    expect(getTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100, offset: 0 }),
    );
    expect(getTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100, offset: 100 }),
    );
  });

  it("loads every backend page again when filters change", async () => {
    const initialTransactions = buildTransactions(125, "cat-1");
    const filteredTransactions = buildTransactions(105, "cat-1");

    getTransactionsMock.mockImplementation(async (params?: {
      category_id?: string;
      limit?: number;
      offset?: number;
    }) => {
      if (params?.limit === 1) {
        return initialTransactions.slice(0, 1);
      }

      if (params?.category_id === "cat-filtered") {
        if (params?.limit === 100 && params?.offset === 0) {
          return filteredTransactions.slice(0, 100);
        }

        if (params?.limit === 100 && params?.offset === 100) {
          return filteredTransactions.slice(100);
        }

        return [];
      }

      if (params?.limit === 100 && params?.offset === 0) {
        return initialTransactions.slice(0, 100);
      }

      if (params?.limit === 100 && params?.offset === 100) {
        return initialTransactions.slice(100);
      }

      return [];
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("transactions-count")).toHaveTextContent("125");
    });

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro" }));

    await waitFor(() => {
      expect(screen.getByTestId("transactions-count")).toHaveTextContent("105");
    });

    expect(getTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: "cat-filtered",
        limit: 100,
        offset: 0,
      }),
    );
    expect(getTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: "cat-filtered",
        limit: 100,
        offset: 100,
      }),
    );
  });
});

function buildTransactions(count: number, categoryId: string) {
  return Array.from({ length: count }, (_, index) => ({
    id: `txn-${index + 1}`,
    category_id: categoryId,
    amount: "1000.00",
    currency: "COP",
    description: `Transaction ${index + 1}`,
    occurred_at: `2026-03-${String((index % 28) + 1).padStart(2, "0")}T12:00:00Z`,
    created_at: "2026-03-01T12:00:00Z",
    fx_rate: "1.00000000",
    fx_rate_date: "2026-03-01",
    fx_rate_source: "identity",
    base_currency: "COP",
    amount_in_base_currency: "1000.00",
  }));
}
