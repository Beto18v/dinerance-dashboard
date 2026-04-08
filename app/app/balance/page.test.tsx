import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BalancePage from "./page";
import { getSiteText } from "@/lib/site";

const {
  getCategoriesMock,
  deleteAdjustmentMock,
  deleteTransferMock,
  getFinancialAccountsMock,
  getLedgerActivityMock,
  getLedgerBalancesMock,
  getUpcomingObligationsMock,
  getProfileMock,
  getTransactionsMock,
  navigationState,
  pushMock,
  setProfileMock,
  toastErrorMock,
  toastSuccessMock,
  updateProfileMock,
} = vi.hoisted(() => ({
  getCategoriesMock: vi.fn(),
  deleteAdjustmentMock: vi.fn(),
  deleteTransferMock: vi.fn(),
  getFinancialAccountsMock: vi.fn(),
  getLedgerActivityMock: vi.fn(),
  getLedgerBalancesMock: vi.fn(),
  getUpcomingObligationsMock: vi.fn(),
  getProfileMock: vi.fn(),
  getTransactionsMock: vi.fn(),
  navigationState: {
    pathname: "/app/balance",
    search: "",
  },
  pushMock: vi.fn(),
  setProfileMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  updateProfileMock: vi.fn(),
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
    deleteAdjustment: deleteAdjustmentMock,
    deleteTransfer: deleteTransferMock,
    getFinancialAccounts: getFinancialAccountsMock,
    getLedgerActivity: getLedgerActivityMock,
    getLedgerBalances: getLedgerBalancesMock,
    getUpcomingObligations: getUpcomingObligationsMock,
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

vi.mock("@/components/providers/site-preferences-provider", () => ({
  useSitePreferences: () => ({
    site: getSiteText("es"),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
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
    }),
  };
});

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

describe("BalancePage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    deleteAdjustmentMock.mockReset();
    deleteTransferMock.mockReset();
    getCategoriesMock.mockReset();
    getFinancialAccountsMock.mockReset();
    getLedgerActivityMock.mockReset();
    getLedgerBalancesMock.mockReset();
    getUpcomingObligationsMock.mockReset();
    getProfileMock.mockReset();
    getTransactionsMock.mockReset();
    navigationState.pathname = "/app/balance";
    navigationState.search = "";
    pushMock.mockReset();
    setProfileMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    updateProfileMock.mockReset();

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
      {
        id: "acc-2",
        name: "Wallet",
        currency: "COP",
        is_default: false,
        created_at: "2026-03-02T00:00:00Z",
      },
    ]);
    getLedgerBalancesMock.mockResolvedValue({
      currency: "COP",
      consolidated_balance: "1500000.00",
      accounts: [
        {
          financial_account_id: "acc-1",
          financial_account_name: "Main account",
          currency: "COP",
          balance: "1200000.00",
        },
        {
          financial_account_id: "acc-2",
          financial_account_name: "Wallet",
          currency: "COP",
          balance: "300000.00",
        },
      ],
    });
    getLedgerActivityMock.mockResolvedValue({
      limit: 8,
      items: [
        {
          id: "mov-1",
          financial_account_id: "acc-1",
          financial_account_name: "Main account",
          transaction_type: "income",
          balance_direction: "in",
          amount: "2500000.00",
          currency: "COP",
          description: "Nomina",
          occurred_at: "2026-03-10T12:00:00Z",
          created_at: "2026-03-10T12:00:00Z",
        },
      ],
    });
    getUpcomingObligationsMock.mockResolvedValue({
      reference_date: "2026-03-10",
      window_end_date: "2026-03-15",
      summary: {
        currency: "COP",
        total_active: 2,
        items_in_window: 2,
        overdue_count: 0,
        due_today_count: 1,
        due_soon_count: 1,
        expected_account_risk_count: 1,
        total_expected_amount: "1380000.00",
      },
      items: [
        {
          id: "obl-1",
          name: "Arriendo",
          amount: "1200000.00",
          currency: "COP",
          cadence: "monthly",
          next_due_date: "2026-03-10",
          category_id: "cat-1",
          category_name: "Salario",
          expected_financial_account_id: "acc-1",
          expected_financial_account_name: "Main account",
          status: "active",
          urgency: "today",
          days_until_due: 0,
          expected_account_current_balance: "900000.00",
          expected_account_shortfall_amount: "300000.00",
          created_at: "2026-03-01T00:00:00Z",
          updated_at: null,
        },
        {
          id: "obl-2",
          name: "Internet",
          amount: "180000.00",
          currency: "COP",
          cadence: "monthly",
          next_due_date: "2026-03-12",
          category_id: "cat-1",
          category_name: "Salario",
          expected_financial_account_id: null,
          expected_financial_account_name: null,
          status: "active",
          urgency: "soon",
          days_until_due: 2,
          expected_account_current_balance: null,
          expected_account_shortfall_amount: null,
          created_at: "2026-03-02T00:00:00Z",
          updated_at: null,
        },
      ],
    });
    getCategoriesMock.mockResolvedValue([
      {
        id: "cat-1",
        name: "Salario",
        direction: "income",
        parent_id: null,
      },
    ]);
    getTransactionsMock.mockResolvedValue({
      items: [{ id: "txn-1" }],
      total_count: 1,
      limit: 1,
      offset: 0,
      summary: {
        active_categories_count: 1,
        skipped_transactions: 0,
        income_totals: [],
        expense_totals: [],
        balance_totals: [],
      },
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    cleanup();
  });

  it("renders current cash, account balances, and recent ledger activity", async () => {
    render(<BalancePage />);

    await waitFor(() => {
      expect(getLedgerBalancesMock).toHaveBeenCalledTimes(1);
    });
    expect(getLedgerActivityMock).toHaveBeenCalledWith({ limit: 8 });
    expect(getUpcomingObligationsMock).toHaveBeenCalledWith({
      days_ahead: 5,
      limit: 4,
    });

    expect(screen.getByText("Resumen")).toBeInTheDocument();
    expect(screen.getByText("Dinero disponible hoy")).toBeInTheDocument();
    expect(screen.getByText("Dinero por cuenta")).toBeInTheDocument();
    expect(screen.getAllByText(/Cuenta principal/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Wallet").length).toBeGreaterThan(0);
    expect(screen.getByText("Ultimos movimientos")).toBeInTheDocument();
    expect(screen.getByText("Nomina")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Mover entre cuentas" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Ajustar saldo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Como funciona este resumen?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Proximos vencimientos")).toBeInTheDocument();
    expect(screen.getByText("Arriendo")).toBeInTheDocument();
    expect(
      screen.getByText("La cuenta Cuenta principal hoy no cubre $300.000."),
    ).toBeInTheDocument();
  });

  it("hides the upcoming obligations block when nothing is due within 5 days", async () => {
    getUpcomingObligationsMock.mockResolvedValueOnce({
      reference_date: "2026-03-10",
      window_end_date: "2026-03-15",
      summary: {
        currency: "COP",
        total_active: 0,
        items_in_window: 0,
        overdue_count: 0,
        due_today_count: 0,
        due_soon_count: 0,
        expected_account_risk_count: 0,
        total_expected_amount: "0.00",
      },
      items: [],
    });

    render(<BalancePage />);

    await waitFor(() => {
      expect(getUpcomingObligationsMock).toHaveBeenCalledWith({
        days_ahead: 5,
        limit: 4,
      });
    });
    expect(screen.queryByText("Proximos vencimientos")).not.toBeInTheDocument();
  });

  it("filters recent activity by financial account", async () => {
    getLedgerActivityMock
      .mockResolvedValueOnce({
        limit: 8,
        items: [
          {
            id: "mov-1",
            financial_account_id: "acc-1",
            financial_account_name: "Main account",
            transaction_type: "income",
            balance_direction: "in",
            amount: "2500000.00",
            currency: "COP",
            description: "Nomina",
            occurred_at: "2026-03-10T12:00:00Z",
            created_at: "2026-03-10T12:00:00Z",
          },
          {
            id: "mov-2",
            financial_account_id: "acc-2",
            financial_account_name: "Wallet",
            transaction_type: "adjustment",
            balance_direction: "in",
            amount: "300000.00",
            currency: "COP",
            description: "Apertura: Fondo inicial",
            occurred_at: "2026-03-11T12:00:00Z",
            created_at: "2026-03-11T12:00:00Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        limit: 8,
        items: [
          {
            id: "mov-2",
            financial_account_id: "acc-2",
            financial_account_name: "Wallet",
            transaction_type: "adjustment",
            balance_direction: "in",
            amount: "300000.00",
            currency: "COP",
            description: "Apertura: Fondo inicial",
            occurred_at: "2026-03-11T12:00:00Z",
            created_at: "2026-03-11T12:00:00Z",
          },
        ],
      });

    render(<BalancePage />);

    const accountFilter = await screen.findByLabelText("Cuenta");
    fireEvent.change(accountFilter, { target: { value: "acc-2" } });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        "/app/balance?financial_account_id=acc-2",
        {
          scroll: false,
        },
      );
    });
    await waitFor(() => {
      expect(getLedgerActivityMock).toHaveBeenNthCalledWith(2, {
        limit: 8,
        financial_account_id: "acc-2",
      });
    });
    expect(screen.getByText("Apertura: Fondo inicial")).toBeInTheDocument();
  });

  it("shows onboarding and keeps the summary visible when the financial profile is incomplete", async () => {
    getProfileMock.mockReturnValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: null,
      timezone: null,
      created_at: "2026-03-01T00:00:00Z",
      deleted_at: null,
    });

    render(<BalancePage />);

    expect(
      await screen.findByText("Configura tu balance"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Completa tu perfil para activar tu dinero disponible"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Mover entre cuentas")).not.toBeInTheDocument();
    expect(screen.getByText("Dinero disponible hoy")).toBeInTheDocument();
    expect(screen.getByText("Dinero por cuenta")).toBeInTheDocument();
    expect(getLedgerBalancesMock).not.toHaveBeenCalled();
    expect(getLedgerActivityMock).not.toHaveBeenCalled();
  });

  it("keeps onboarding hidden while setup requirements are still loading", () => {
    getCategoriesMock.mockImplementation(() => new Promise(() => {}));
    getTransactionsMock.mockImplementation(() => new Promise(() => {}));

    render(<BalancePage />);

    expect(screen.queryByText("Configura tu balance")).not.toBeInTheDocument();
    expect(screen.getByText("Dinero disponible hoy")).toBeInTheDocument();
    expect(screen.getByText("Dinero por cuenta")).toBeInTheDocument();
    expect(
      screen.queryByText("Empieza a mover tu caja real"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mover entre cuentas" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ajustar saldo" }),
    ).not.toBeInTheDocument();
  });
});
