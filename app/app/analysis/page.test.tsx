import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AnalysisPage from "./page";
import { getSiteText } from "@/lib/site";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const {
  getAnalyticsCategoryBreakdownMock,
  getAnalyticsRecurringCandidatesMock,
  getAnalyticsSummaryMock,
  getCategoriesMock,
  getFinancialAccountsMock,
  getProfileMock,
  navigationState,
  getTransactionsMock,
  pushMock,
  replaceMock,
  setProfileMock,
  updateProfileMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  getAnalyticsCategoryBreakdownMock: vi.fn(),
  getAnalyticsRecurringCandidatesMock: vi.fn(),
  getAnalyticsSummaryMock: vi.fn(),
  getCategoriesMock: vi.fn(),
  getFinancialAccountsMock: vi.fn(),
  getProfileMock: vi.fn(),
  navigationState: {
    pathname: "/app/analysis",
    search: "",
  },
  getTransactionsMock: vi.fn(),
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  setProfileMock: vi.fn(),
  updateProfileMock: vi.fn(),
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
    getAnalyticsCategoryBreakdown: getAnalyticsCategoryBreakdownMock,
    getAnalyticsRecurringCandidates: getAnalyticsRecurringCandidatesMock,
    getAnalyticsSummary: getAnalyticsSummaryMock,
    getCategories: getCategoriesMock,
    getFinancialAccounts: getFinancialAccountsMock,
    getProfile: getProfileMock,
    getTransactions: getTransactionsMock,
    updateProfile: updateProfileMock,
  },
}));

vi.mock("@/components/providers/profile-provider", () => ({
  useProfile: () => ({
    profile: getProfileMock(),
    setProfile: setProfileMock,
  }),
}));

vi.mock("next/navigation", async () => {
  const React = await import("react");
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  function updateNavigation(href: string) {
    const [pathname, query = ""] = href.split("?");
    navigationState.pathname = pathname || "/app/analysis";
    navigationState.search = query;
    notify();
  }

  return {
    usePathname: () => navigationState.pathname,
    useSearchParams: () => {
      React.useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => navigationState.search,
      );

      return new URLSearchParams(navigationState.search);
    },
    useRouter: () => ({
      push: (href: string, options?: { scroll?: boolean }) => {
        pushMock(href, options);
        updateNavigation(href);
      },
      replace: (href: string, options?: { scroll?: boolean }) => {
        replaceMock(href, options);
        updateNavigation(href);
      },
    }),
  };
});

vi.mock("@/components/providers/site-preferences-provider", () => ({
  useSitePreferences: () => ({
    site: getSiteText("es"),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
  },
}));

vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  type ElementProps = {
    children?: React.ReactNode;
    id?: string;
    value?: string;
  };

  function readText(node: React.ReactNode): string {
    if (typeof node === "string" || typeof node === "number") {
      return String(node);
    }
    if (!node || typeof node !== "object") {
      return "";
    }
    if (Array.isArray(node)) {
      return node.map((item) => readText(item)).join("");
    }
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<ElementProps>;
      return readText(element.props.children);
    }
    return "";
  }

  function collectOptions(children: React.ReactNode) {
    const options: Array<{ value: string; label: string }> = [];
    let triggerId: string | undefined;

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        return;
      }

      const element = child as React.ReactElement<ElementProps>;

      if (element.type === SelectTrigger && element.props.id) {
        triggerId = element.props.id;
      }

      if (element.type === SelectItem) {
        options.push({
          value: element.props.value ?? "",
          label: readText(element.props.children),
        });
      }

      if (element.props.children) {
        const nested = collectOptions(element.props.children);
        if (!triggerId && nested.triggerId) {
          triggerId = nested.triggerId;
        }
        options.push(...nested.options);
      }
    });

    return { options, triggerId };
  }

  function Select({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
  }) {
    const { options, triggerId } = collectOptions(children);

    return (
      <select
        id={triggerId}
        value={value}
        onChange={(event) => onValueChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  function SelectContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  function SelectItem() {
    return null;
  }

  function SelectTrigger() {
    return null;
  }

  function SelectValue() {
    return null;
  }

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

vi.mock("@/components/ui/tabs", async () => {
  const React = await import("react");

  const TabsContext = React.createContext<{
    value?: string;
    onValueChange?: (value: string) => void;
  }>({});

  function Tabs({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
  }) {
    return (
      <TabsContext.Provider value={{ value, onValueChange }}>
        <div>{children}</div>
      </TabsContext.Provider>
    );
  }

  function TabsList({ children }: { children: React.ReactNode }) {
    return <div role="tablist">{children}</div>;
  }

  function TabsTrigger({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;

    return (
      <button
        type="button"
        role="tab"
        data-state={isActive ? "active" : "inactive"}
        aria-selected={isActive}
        onClick={() => context.onValueChange?.(value)}
      >
        {children}
      </button>
    );
  }

  return {
    Tabs,
    TabsList,
    TabsTrigger,
  };
});

describe("AnalysisPage", () => {
  afterEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.clear();
    getAnalyticsCategoryBreakdownMock.mockReset();
    getAnalyticsRecurringCandidatesMock.mockReset();
    getAnalyticsSummaryMock.mockReset();
    getCategoriesMock.mockReset();
    getFinancialAccountsMock.mockReset();
    getProfileMock.mockReset();
    navigationState.pathname = "/app/analysis";
    navigationState.search = "";
    getTransactionsMock.mockReset();
    pushMock.mockReset();
    replaceMock.mockReset();
    setProfileMock.mockReset();
    updateProfileMock.mockReset();
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
    getFinancialAccountsMock.mockResolvedValue([
      {
        id: "acc-1",
        name: "Main account",
        currency: "COP",
        is_default: true,
        created_at: "2026-03-01T00:00:00Z",
      },
    ]);
    getTransactionsMock.mockResolvedValue({
      items: [{ id: "txn-1" }],
      total_count: 1,
      limit: 1,
      offset: 0,
      summary: {
        active_categories_count: 0,
        skipped_transactions: 0,
        income_totals: [],
        expense_totals: [],
        balance_totals: [],
      },
    });
  });

  it("loads and renders recurring patterns and category distribution", async () => {
    getCategoriesMock.mockResolvedValue([
      {
        id: "cat-1",
        name: "Salario",
        direction: "income",
        parent_id: null,
      },
    ]);
    getAnalyticsSummaryMock.mockResolvedValue({
      currency: "COP",
      current: {
        month_start: "2026-03-01",
        currency: "COP",
        income: "2500000.00",
        expense: "1200000.00",
        balance: "1300000.00",
        skipped_transactions: 0,
      },
      series: [],
      recent_transactions: [],
    });
    getAnalyticsRecurringCandidatesMock.mockResolvedValue({
      month_start: "2026-03-01",
      history_window_start: "2025-03-01",
      candidates: [
        {
          label: "Nomina",
          description: null,
          category_id: "cat-1",
          category_name: "Salario",
          direction: "income",
          cadence: "monthly",
          match_basis: "category_amount",
          amount_pattern: "exact",
          currency: "COP",
          typical_amount: "2500000.00",
          amount_min: "2500000.00",
          amount_max: "2500000.00",
          occurrence_count: 3,
          interval_days: [29, 30],
          first_occurred_at: "2026-01-30T12:00:00Z",
          last_occurred_at: "2026-03-30T12:00:00Z",
        },
      ],
    });
    getAnalyticsCategoryBreakdownMock.mockResolvedValue({
      month_start: "2026-03-01",
      currency: "COP",
      direction: "income",
      total: "2500000.00",
      skipped_transactions: 0,
      breakdown: [
        {
          category_id: "cat-1",
          category_name: "Salario",
          direction: "income",
          amount: "2500000.00",
          percentage: "100.00",
          transaction_count: 1,
        },
      ],
    });

    render(<AnalysisPage />);

    await waitFor(() => {
      expect(getAnalyticsSummaryMock).toHaveBeenCalledWith(undefined);
    });
    await waitFor(() => {
      expect(getAnalyticsRecurringCandidatesMock).toHaveBeenCalledWith({
        year: 2026,
        month: 3,
      });
    });
    await waitFor(() => {
      expect(getAnalyticsCategoryBreakdownMock).toHaveBeenCalledWith({
        year: 2026,
        month: 3,
        direction: "income",
      });
    });

    expect(await screen.findByText("Analisis")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Que veras en Analisis?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ingresos y gastos frecuentes")).toBeInTheDocument();
    expect(screen.getByText("Distribucion por categoria")).toBeInTheDocument();
    expect(screen.getByText("Vimos 3 movimientos sin descripcion, pero con la misma categoria y el mismo monto.")).toBeInTheDocument();
    expect(screen.getAllByText("1 movimiento").length).toBeGreaterThan(0);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("hides frequent income and expenses when there are no candidates", async () => {
    getCategoriesMock.mockResolvedValue([
      {
        id: "cat-1",
        name: "Salario",
        direction: "income",
        parent_id: null,
      },
    ]);
    getAnalyticsSummaryMock.mockResolvedValue({
      currency: "COP",
      current: {
        month_start: "2026-03-01",
        currency: "COP",
        income: "2500000.00",
        expense: "1200000.00",
        balance: "1300000.00",
        skipped_transactions: 0,
      },
      series: [],
      recent_transactions: [],
    });
    getAnalyticsRecurringCandidatesMock.mockResolvedValue({
      month_start: "2026-03-01",
      history_window_start: "2025-03-01",
      candidates: [],
    });
    getAnalyticsCategoryBreakdownMock.mockResolvedValue({
      month_start: "2026-03-01",
      currency: "COP",
      direction: "income",
      total: "2500000.00",
      skipped_transactions: 0,
      breakdown: [
        {
          category_id: "cat-1",
          category_name: "Salario",
          direction: "income",
          amount: "2500000.00",
          percentage: "100.00",
          transaction_count: 1,
        },
      ],
    });

    render(<AnalysisPage />);

    expect(await screen.findByText("Distribucion por categoria")).toBeInTheDocument();
    await waitFor(() => {
      expect(getAnalyticsRecurringCandidatesMock).toHaveBeenCalledWith({
        year: 2026,
        month: 3,
      });
    });

    const distributionCard = screen
      .getByText("Distribucion por categoria")
      .closest("[data-slot='card']");
    expect(distributionCard).not.toBeNull();
    expect(
      within(distributionCard as HTMLElement).getByText("Total de ingresos"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Ingresos y gastos frecuentes"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Todavia no encontramos ingresos o gastos frecuentes con suficiente evidencia.",
      ),
    ).not.toBeInTheDocument();
  });

  it("does not render onboarding in analysis when the profile is incomplete", async () => {
    getProfileMock.mockReturnValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: null,
      timezone: null,
      created_at: "2026-03-01T00:00:00Z",
      deleted_at: null,
    });
    getCategoriesMock.mockResolvedValue([]);
    getTransactionsMock.mockResolvedValue({
      items: [],
      total_count: 0,
      limit: 1,
      offset: 0,
      summary: {
        active_categories_count: 0,
        skipped_transactions: 0,
        income_totals: [],
        expense_totals: [],
        balance_totals: [],
      },
    });

    render(<AnalysisPage />);

    expect(await screen.findByText("Analisis")).toBeInTheDocument();
    expect(screen.queryByText("Configura tu balance")).not.toBeInTheDocument();
    expect(
      screen.getByText("Distribucion por categoria"),
    ).toBeInTheDocument();
  });
});
