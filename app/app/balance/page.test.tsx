import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BalancePage from "./page";
import { getSiteText } from "@/lib/site";

const {
  getAnalyticsCategoryBreakdownMock,
  getAnalyticsSummaryMock,
  getCategoriesMock,
  getFinancialAccountsMock,
  getProfileMock,
  navigationState,
  pushMock,
  replaceMock,
  getTransactionsMock,
  updateProfileMock,
  setProfileMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  getAnalyticsCategoryBreakdownMock: vi.fn(),
  getAnalyticsSummaryMock: vi.fn(),
  getCategoriesMock: vi.fn(),
  getFinancialAccountsMock: vi.fn(),
  getProfileMock: vi.fn(),
  navigationState: {
    pathname: "/app/balance",
    search: "",
  },
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  getTransactionsMock: vi.fn(),
  updateProfileMock: vi.fn(),
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
    getAnalyticsCategoryBreakdown: getAnalyticsCategoryBreakdownMock,
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
    navigationState.pathname = pathname || "/app/balance";
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

describe("BalancePage", () => {
  afterEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.clear();
    getAnalyticsCategoryBreakdownMock.mockReset();
    getAnalyticsSummaryMock.mockReset();
    getCategoriesMock.mockReset();
    getFinancialAccountsMock.mockReset();
    getProfileMock.mockReset();
    navigationState.pathname = "/app/balance";
    navigationState.search = "";
    pushMock.mockReset();
    replaceMock.mockReset();
    getTransactionsMock.mockReset();
    updateProfileMock.mockReset();
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
    getFinancialAccountsMock.mockResolvedValue([
      {
        id: "acc-1",
        name: "Main account",
        currency: "COP",
        is_default: true,
        created_at: "2026-03-01T00:00:00Z",
      },
    ]);
    getTransactionsMock.mockResolvedValue(buildTransactionsPresenceResponse(1));
    getAnalyticsCategoryBreakdownMock.mockResolvedValue({
      month_start: "2026-03-01",
      currency: "COP",
      direction: "income",
      total: "2500000.00",
      skipped_transactions: 0,
      breakdown: [
        {
          category_id: "cat-income",
          category_name: "Salario",
          direction: "income",
          amount: "2500000.00",
          percentage: "100.00",
          transaction_count: 1,
        },
      ],
    });
  });

  it("loads and renders the current balance overview", async () => {
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
      series: [
        {
          month_start: "2026-03-01",
          currency: "COP",
          income: "2500000.00",
          expense: "1200000.00",
          balance: "1300000.00",
          skipped_transactions: 0,
        },
      ],
      recent_transactions: [
        {
          id: "txn-1",
          category_id: "cat-1",
          category_name: "Salario",
          direction: "income",
          amount: "2500000.00",
          currency: "COP",
          base_currency: "COP",
          amount_in_base_currency: "2500000.00",
          description: "Nomina",
          occurred_at: "2026-03-10T12:00:00Z",
        },
      ],
    });

    render(<BalancePage />);

    expect(screen.getAllByText("Cargando...").length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(getAnalyticsSummaryMock).toHaveBeenCalledWith(undefined);
    });
    await waitFor(() => {
      expect(getAnalyticsCategoryBreakdownMock).toHaveBeenCalledWith({
        year: 2026,
        month: 3,
        direction: "income",
      });
    });

    expect(
      await screen.findAllByText(/Resumen financiero - marzo de 2026/i),
    ).toHaveLength(2);
    expect(screen.getAllByText(/\$\s?2\.500\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$\s?1\.200\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$\s?1\.300\.000/).length).toBeGreaterThan(0);
    expect(screen.getByText("Movimientos recientes")).toBeInTheDocument();
    expect(screen.getAllByText("Salario").length).toBeGreaterThan(0);
    expect(screen.getByText("Nomina")).toBeInTheDocument();
    expect(screen.getByText("Distribucion por categoria")).toBeInTheDocument();
    expect(screen.getAllByText("Salario").length).toBeGreaterThan(0);
  });

  it("hides the account selector when there is only one financial account", async () => {
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

    render(<BalancePage />);

    await waitFor(() => {
      expect(getFinancialAccountsMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByLabelText("Cuenta")).not.toBeInTheDocument();
  });

  it("refetches balance when the selected month changes", async () => {
    getCategoriesMock.mockResolvedValue([
      {
        id: "cat-1",
        name: "Salario",
        direction: "income",
        parent_id: null,
      },
    ]);
    getAnalyticsSummaryMock
      .mockResolvedValueOnce({
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
      })
      .mockResolvedValueOnce({
        currency: "COP",
        current: {
          month_start: "2026-02-01",
          currency: "COP",
          income: "2000000.00",
          expense: "800000.00",
          balance: "1200000.00",
          skipped_transactions: 0,
        },
        series: [],
        recent_transactions: [],
      });
    getAnalyticsCategoryBreakdownMock
      .mockResolvedValueOnce({
        month_start: "2026-03-01",
        currency: "COP",
        direction: "income",
        total: "2500000.00",
        skipped_transactions: 0,
        breakdown: [],
      })
      .mockResolvedValueOnce({
        month_start: "2026-02-01",
        currency: "COP",
        direction: "income",
        total: "2000000.00",
        skipped_transactions: 0,
        breakdown: [],
      });

    render(<BalancePage />);

    const monthInput = await screen.findByLabelText("Mes");
    fireEvent.change(monthInput, { target: { value: "2026-02" } });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/app/balance?month=2026-02", {
        scroll: false,
      });
    });
    await waitFor(() => {
      expect(getAnalyticsSummaryMock).toHaveBeenNthCalledWith(2, {
        year: 2026,
        month: 2,
      });
    });
    await waitFor(() => {
      expect(getAnalyticsCategoryBreakdownMock).toHaveBeenNthCalledWith(2, {
        year: 2026,
        month: 2,
        direction: "income",
      });
    });

    expect(screen.getByDisplayValue("2026-02")).toBeInTheDocument();
  });

  it("hydrates filters from the URL on first render", async () => {
    navigationState.search = "month=2026-02&financial_account_id=acc-2";
    getFinancialAccountsMock.mockResolvedValue([
      {
        id: "acc-1",
        name: "Main account",
        currency: "COP",
        is_default: true,
        created_at: "2026-03-01T00:00:00Z",
      },
      {
        id: "acc-2",
        name: "Wallet",
        currency: "COP",
        is_default: false,
        created_at: "2026-03-02T00:00:00Z",
      },
    ]);
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
        month_start: "2026-02-01",
        currency: "COP",
        income: "800000.00",
        expense: "300000.00",
        balance: "500000.00",
        skipped_transactions: 0,
      },
      series: [],
      recent_transactions: [],
    });
    getAnalyticsCategoryBreakdownMock.mockResolvedValue({
      month_start: "2026-02-01",
      currency: "COP",
      direction: "income",
      total: "800000.00",
      skipped_transactions: 0,
      breakdown: [],
    });

    render(<BalancePage />);

    await waitFor(() => {
      expect(getAnalyticsSummaryMock).toHaveBeenCalledWith({
        year: 2026,
        month: 2,
        financial_account_id: "acc-2",
      });
    });
    await waitFor(() => {
      expect(getAnalyticsCategoryBreakdownMock).toHaveBeenCalledWith({
        year: 2026,
        month: 2,
        direction: "income",
        financial_account_id: "acc-2",
      });
    });

    expect(await screen.findByLabelText("Cuenta")).toHaveValue("acc-2");
    expect(screen.getByDisplayValue("2026-02")).toBeInTheDocument();
  });

  it("shows a local account selector for multiple accounts and passes the filter to analytics", async () => {
    getFinancialAccountsMock.mockResolvedValue([
      {
        id: "acc-1",
        name: "Main account",
        currency: "COP",
        is_default: true,
        created_at: "2026-03-01T00:00:00Z",
      },
      {
        id: "acc-2",
        name: "Wallet",
        currency: "COP",
        is_default: false,
        created_at: "2026-03-02T00:00:00Z",
      },
    ]);
    getCategoriesMock.mockResolvedValue([
      {
        id: "cat-1",
        name: "Salario",
        direction: "income",
        parent_id: null,
      },
      {
        id: "cat-2",
        name: "Mercado",
        direction: "expense",
        parent_id: null,
      },
    ]);
    getAnalyticsSummaryMock
      .mockResolvedValueOnce({
        currency: "COP",
        current: {
          month_start: "2026-03-01",
          currency: "COP",
          income: "3000000.00",
          expense: "1200000.00",
          balance: "1800000.00",
          skipped_transactions: 0,
        },
        series: [],
        recent_transactions: [
          {
            id: "txn-1",
            financial_account_id: "acc-1",
            category_id: "cat-1",
            category_name: "Salario",
            direction: "income",
            amount: "2500000.00",
            currency: "COP",
            description: "Nomina principal",
            occurred_at: "2026-03-10T12:00:00Z",
          },
          {
            id: "txn-2",
            financial_account_id: "acc-2",
            category_id: "cat-2",
            category_name: "Mercado",
            direction: "expense",
            amount: "1200000.00",
            currency: "COP",
            description: "Mercado billetera",
            occurred_at: "2026-03-09T12:00:00Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        currency: "COP",
        current: {
          month_start: "2026-03-01",
          currency: "COP",
          income: "500000.00",
          expense: "200000.00",
          balance: "300000.00",
          skipped_transactions: 0,
        },
        series: [],
        recent_transactions: [
          {
            id: "txn-3",
            financial_account_id: "acc-2",
            category_id: "cat-1",
            category_name: "Salario",
            direction: "income",
            amount: "500000.00",
            currency: "COP",
            description: "Ingreso billetera",
            occurred_at: "2026-03-11T12:00:00Z",
          },
        ],
      });
    getAnalyticsCategoryBreakdownMock
      .mockResolvedValueOnce({
        month_start: "2026-03-01",
        currency: "COP",
        direction: "income",
        total: "3000000.00",
        skipped_transactions: 0,
        breakdown: [],
      })
      .mockResolvedValueOnce({
        month_start: "2026-03-01",
        currency: "COP",
        direction: "income",
        total: "500000.00",
        skipped_transactions: 0,
        breakdown: [],
      });

    render(<BalancePage />);

    const accountSelect = await screen.findByLabelText("Cuenta");
    expect(screen.getByRole("option", { name: "Todas las cuentas" })).toBeInTheDocument();

    await waitFor(() => {
      expect(getAnalyticsSummaryMock).toHaveBeenCalledWith(undefined);
    });
    expect(screen.getAllByText("Cuenta principal").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Wallet").length).toBeGreaterThan(0);

    fireEvent.change(accountSelect, { target: { value: "acc-2" } });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/app/balance?month=2026-03&financial_account_id=acc-2",
        {
          scroll: false,
        },
      );
    });
    await waitFor(() => {
      expect(getAnalyticsSummaryMock).toHaveBeenNthCalledWith(2, {
        year: 2026,
        month: 3,
        financial_account_id: "acc-2",
      });
    });
    await waitFor(() => {
      expect(getAnalyticsCategoryBreakdownMock).toHaveBeenNthCalledWith(2, {
        year: 2026,
        month: 3,
        direction: "income",
        financial_account_id: "acc-2",
      });
    });
  });

  it("ignores stale category breakdown responses when switching directions quickly", async () => {
    const delayedExpenseBreakdown = createDeferred<{
      month_start: string;
      currency: string;
      direction: "expense";
      total: string;
      skipped_transactions: number;
      breakdown: Array<{
        category_id: string;
        category_name: string;
        direction: "expense";
        amount: string;
        percentage: string;
        transaction_count: number;
      }>;
    }>();

    getCategoriesMock.mockResolvedValue([
      {
        id: "cat-1",
        name: "Salario",
        direction: "income",
        parent_id: null,
      },
      {
        id: "cat-2",
        name: "Mercado",
        direction: "expense",
        parent_id: null,
      },
    ]);
    getAnalyticsSummaryMock.mockResolvedValue({
      currency: "COP",
      current: {
        month_start: "2026-03-01",
        currency: "COP",
        income: "1000000.00",
        expense: "400000.00",
        balance: "600000.00",
        skipped_transactions: 0,
      },
      series: [],
      recent_transactions: [],
    });
    getAnalyticsCategoryBreakdownMock
      .mockResolvedValueOnce({
        month_start: "2026-03-01",
        currency: "COP",
        direction: "income",
        total: "555000.00",
        skipped_transactions: 0,
        breakdown: [
          {
            category_id: "cat-1",
            category_name: "Salario",
            direction: "income",
            amount: "555000.00",
            percentage: "100.00",
            transaction_count: 1,
          },
        ],
      })
      .mockImplementationOnce(() => delayedExpenseBreakdown.promise);

    render(<BalancePage />);

    expect((await screen.findAllByText(/\$\s?555\.000/)).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "Gastos" }));
    fireEvent.click(screen.getByRole("tab", { name: "Ingresos" }));

    await waitFor(() => {
      expect(getAnalyticsCategoryBreakdownMock).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText("Total de ingresos")).toBeInTheDocument();
    expect(screen.getAllByText(/\$\s?555\.000/).length).toBeGreaterThan(0);

    delayedExpenseBreakdown.resolve({
      month_start: "2026-03-01",
      currency: "COP",
      direction: "expense",
      total: "222000.00",
      skipped_transactions: 0,
      breakdown: [
        {
          category_id: "cat-2",
          category_name: "Mercado",
          direction: "expense",
          amount: "222000.00",
          percentage: "100.00",
          transaction_count: 1,
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText("Total de ingresos")).toBeInTheDocument();
      expect(screen.getAllByText(/\$\s?555\.000/).length).toBeGreaterThan(0);
    });
    expect(screen.queryAllByText(/\$\s?222\.000/)).toHaveLength(0);
  });

  it("does not refetch analytics when the profile object changes but analytics fields stay equal", async () => {
    getProfileMock
      .mockReturnValueOnce({
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        base_currency: "COP",
        timezone: "America/Bogota",
        created_at: "2026-03-01T00:00:00Z",
        deleted_at: null,
      })
      .mockReturnValue({
        id: "user-1",
        name: "Updated Name",
        email: "test@example.com",
        base_currency: "COP",
        timezone: "America/Bogota",
        created_at: "2026-03-01T00:00:00Z",
        deleted_at: null,
      });
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

    const { rerender } = render(<BalancePage />);

    await waitFor(() => {
      expect(getAnalyticsSummaryMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(getAnalyticsCategoryBreakdownMock).toHaveBeenCalledTimes(1);
    });

    rerender(<BalancePage />);

    await waitFor(() => {
      expect(getAnalyticsSummaryMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(getAnalyticsCategoryBreakdownMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows onboarding when there are no categories or transactions", async () => {
    getCategoriesMock.mockResolvedValue([]);
    getTransactionsMock.mockResolvedValue(buildTransactionsPresenceResponse(0));
    getAnalyticsSummaryMock.mockResolvedValue({
      currency: "COP",
      current: {
        month_start: "2026-03-01",
        currency: "COP",
        income: "0.00",
        expense: "0.00",
        balance: "0.00",
        skipped_transactions: 0,
      },
      series: [],
      recent_transactions: [],
    });

    const { container } = render(<BalancePage />);
    const scoped = within(container);

    expect(
      await scoped.findByText("Configura tu balance"),
    ).toBeInTheDocument();
    expect(scoped.getByText("Elegir moneda base")).toBeInTheDocument();
    expect(scoped.getByText("Elegir zona horaria")).toBeInTheDocument();
    expect(scoped.getByText("Crear una categoria")).toBeInTheDocument();
    expect(
      scoped.getByRole("button", { name: "Agregar categoria" }),
    ).toBeInTheDocument();
  });

  it("renders inline financial onboarding instead of redirecting to profile", async () => {
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
    getTransactionsMock.mockResolvedValue(buildTransactionsPresenceResponse(0));

    const { container } = render(<BalancePage />);
    const scoped = within(container);

    expect(scoped.getByText("Configura tu balance")).toBeInTheDocument();
    expect(scoped.getByText("Completa tu perfil financiero")).toBeInTheDocument();
    expect(scoped.getByLabelText("Moneda base")).toBeInTheDocument();
    expect(scoped.getByLabelText("Zona horaria")).toBeInTheDocument();
    expect(scoped.queryByText("Falta tu moneda base")).not.toBeInTheDocument();
  });

  it("shows the onboarding immediately while background data is still loading", () => {
    getProfileMock.mockReturnValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: null,
      timezone: null,
      created_at: "2026-03-01T00:00:00Z",
      deleted_at: null,
    });
    getCategoriesMock.mockImplementation(() => new Promise(() => {}));
    getTransactionsMock.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<BalancePage />);
    const scoped = within(container);

    expect(scoped.getByText("Configura tu balance")).toBeInTheDocument();
    expect(scoped.getByText("Completa tu perfil financiero")).toBeInTheDocument();
    expect(scoped.queryByText("Falta tu moneda base")).not.toBeInTheDocument();
  });
});

function buildTransactionsPresenceResponse(totalCount: number) {
  return {
    items: totalCount > 0 ? [{ id: "txn-1" }] : [],
    total_count: totalCount,
    limit: 1,
    offset: 0,
    summary: {
      active_categories_count: 0,
      skipped_transactions: 0,
      income_totals: [],
      expense_totals: [],
      balance_totals: [],
    },
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}
