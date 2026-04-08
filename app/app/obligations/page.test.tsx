import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ObligationsPage from "./page";
import { getSiteText } from "@/lib/site";

const {
  createObligationMock,
  deleteObligationMock,
  getCategoriesMock,
  getFinancialAccountsMock,
  getObligationsMock,
  getProfileMock,
  invalidateCacheKeysMock,
  markObligationPaidMock,
  navigationState,
  setCacheMock,
  toastErrorMock,
  toastSuccessMock,
  updateObligationMock,
} = vi.hoisted(() => ({
  createObligationMock: vi.fn(),
  deleteObligationMock: vi.fn(),
  getCategoriesMock: vi.fn(),
  getFinancialAccountsMock: vi.fn(),
  getObligationsMock: vi.fn(),
  getProfileMock: vi.fn(),
  invalidateCacheKeysMock: vi.fn(),
  markObligationPaidMock: vi.fn(),
  navigationState: {
    search: "",
  },
  setCacheMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  updateObligationMock: vi.fn(),
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
    createObligation: createObligationMock,
    deleteObligation: deleteObligationMock,
    getCategories: getCategoriesMock,
    getFinancialAccounts: getFinancialAccountsMock,
    getObligations: getObligationsMock,
    markObligationPaid: markObligationPaidMock,
    updateObligation: updateObligationMock,
  },
}));

vi.mock("@/lib/cache", () => ({
  cacheKeys: {
    obligations: "cache:obligations",
    upcomingObligations: "cache:upcoming-obligations",
    transactions: "cache:transactions",
    ledgerBalances: "cache:ledger-balances",
    ledgerActivity: "cache:ledger-activity",
  },
  invalidateCacheKeys: invalidateCacheKeysMock,
  setCache: setCacheMock,
}));

vi.mock("@/components/providers/profile-provider", () => ({
  useProfile: () => ({
    profile: getProfileMock(),
  }),
}));

vi.mock("@/components/providers/site-preferences-provider", () => ({
  useSitePreferences: () => ({
    site: getSiteText("es"),
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigationState.search),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: ReactNode;
    open?: boolean;
  }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  type ElementProps = {
    children?: ReactNode;
    id?: string;
    value?: string;
  };

  function readText(node: ReactNode): string {
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

  function collectOptions(children: ReactNode) {
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
    children: ReactNode;
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

  function SelectContent({ children }: { children: ReactNode }) {
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

describe("ObligationsPage", () => {
  beforeEach(() => {
    createObligationMock.mockReset();
    deleteObligationMock.mockReset();
    getCategoriesMock.mockReset();
    getFinancialAccountsMock.mockReset();
    getObligationsMock.mockReset();
    getProfileMock.mockReset();
    invalidateCacheKeysMock.mockReset();
    markObligationPaidMock.mockReset();
    navigationState.search = "";
    setCacheMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    updateObligationMock.mockReset();

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
        id: "cat-expense",
        name: "Arriendo",
        direction: "expense",
        parent_id: null,
      },
      {
        id: "cat-income",
        name: "Nomina",
        direction: "income",
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
    ]);
    getObligationsMock.mockResolvedValue({
      counts: {
        active: 1,
        paused: 1,
        archived: 1,
      },
      items: [
        {
          id: "obl-1",
          name: "Arriendo",
          amount: "1200000.00",
          currency: "COP",
          cadence: "monthly",
          next_due_date: "2026-03-10",
          category_id: "cat-expense",
          category_name: "Arriendo",
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
          amount: "90000.00",
          currency: "COP",
          cadence: "monthly",
          next_due_date: "2026-03-15",
          category_id: "cat-expense",
          category_name: "Arriendo",
          expected_financial_account_id: null,
          expected_financial_account_name: null,
          status: "paused",
          urgency: "soon",
          days_until_due: 5,
          expected_account_current_balance: null,
          expected_account_shortfall_amount: null,
          created_at: "2026-03-01T00:00:00Z",
          updated_at: null,
        },
        {
          id: "obl-3",
          name: "Seguro",
          amount: "200000.00",
          currency: "COP",
          cadence: "monthly",
          next_due_date: "2026-03-25",
          category_id: "cat-expense",
          category_name: "Arriendo",
          expected_financial_account_id: null,
          expected_financial_account_name: null,
          status: "archived",
          urgency: "upcoming",
          days_until_due: 15,
          expected_account_current_balance: null,
          expected_account_shortfall_amount: null,
          created_at: "2026-03-01T00:00:00Z",
          updated_at: null,
        },
      ],
    });
    createObligationMock.mockResolvedValue({});
    deleteObligationMock.mockResolvedValue(undefined);
    markObligationPaidMock.mockResolvedValue({
      obligation: {},
      transaction: {},
    });
    updateObligationMock.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  it("renders prefilled creation state from Analysis and groups obligations by status", async () => {
    navigationState.search =
      "prefill_name=Arriendo+apartamento&prefill_amount=1200000.00&prefill_cadence=monthly&prefill_next_due_date=2026-04-05&prefill_category_id=cat-expense&prefill_recurring_candidate_key=candidate-expense-1";

    render(<ObligationsPage />);

    expect(await screen.findByText("Obligaciones")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nueva obligacion" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Arriendo apartamento")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1200000.00")).toBeInTheDocument();
    expect(
      (screen.getByLabelText("Proximo vencimiento") as HTMLInputElement).value,
    ).toBe("2026-04-05");
    expect(
      screen.getByText(
        "Completamos los datos con este patron detectado. Revisa y guardalo si te sirve.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Activas").length).toBeGreaterThan(0);
    expect(screen.getByText("Pausadas")).toBeInTheDocument();
    expect(screen.getByText("Archivadas")).toBeInTheDocument();
    expect(screen.getAllByText("Arriendo").length).toBeGreaterThan(0);
    expect(screen.getByText("Internet")).toBeInTheDocument();
    expect(screen.getByText("Seguro")).toBeInTheDocument();
  });

  it("persists the recurring candidate key when creating from a prefilled analysis flow", async () => {
    navigationState.search =
      "prefill_name=Arriendo+apartamento&prefill_amount=1200000.00&prefill_cadence=monthly&prefill_next_due_date=2026-04-05&prefill_category_id=cat-expense&prefill_recurring_candidate_key=candidate-expense-1";

    render(<ObligationsPage />);

    const createButton = await screen.findByRole("button", {
      name: "Crear obligacion",
    });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(createObligationMock).toHaveBeenCalledWith({
        name: "Arriendo apartamento",
        amount: "1200000.00",
        cadence: "monthly",
        next_due_date: "2026-04-05",
        category_id: "cat-expense",
        expected_financial_account_id: null,
        source_recurring_candidate_key: "candidate-expense-1",
      });
    });
  });

  it("captures the real payment data before marking an obligation as paid", async () => {
    render(<ObligationsPage />);

    const markPaidButton = await screen.findByRole("button", {
      name: "Marcar pagada",
    });
    fireEvent.click(markPaidButton);
    fireEvent.change(screen.getByLabelText("Fecha y hora real"), {
      target: { value: "2026-03-10T09:30" },
    });
    fireEvent.change(screen.getByLabelText("Descripcion del gasto"), {
      target: { value: "Arriendo de abril" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirmar pago",
      }),
    );

    await waitFor(() => {
      expect(markObligationPaidMock).toHaveBeenCalledWith("obl-1", {
        financial_account_id: "acc-1",
        paid_at: "2026-03-10T14:30:00.000Z",
        description: "Arriendo de abril",
      });
    });
    expect(invalidateCacheKeysMock).toHaveBeenCalledWith([
      "cache:obligations",
      "cache:upcoming-obligations",
      "cache:transactions",
      "cache:ledger-balances",
      "cache:ledger-activity",
    ]);
  });

  it("clarifies that only confirmed obligations appear when the list is empty", async () => {
    getObligationsMock.mockResolvedValueOnce({
      counts: {
        active: 0,
        paused: 0,
        archived: 0,
      },
      items: [],
    });

    render(<ObligationsPage />);

    expect(await screen.findByText("Obligaciones")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Aqui veras solo obligaciones que ya confirmaste. Puedes crear una nueva o convertir un gasto recurrente desde Analisis.",
      ),
    ).toBeInTheDocument();
  });

  it("allows deleting an obligation from the list", async () => {
    render(<ObligationsPage />);

    const deleteButtons = await screen.findAllByRole("button", {
      name: "Eliminar",
    });
    fireEvent.click(deleteButtons[0]);

    expect(await screen.findByText("Eliminar obligacion?")).toBeInTheDocument();
    expect(
      screen.getByText(
        'La obligacion "Arriendo" dejara de aparecer en tus proximos vencimientos. Los gastos que ya registraste seguiran en Transacciones.',
      ),
    ).toBeInTheDocument();

    const confirmDeleteButton = screen.getAllByRole("button", {
      name: "Eliminar",
    });
    fireEvent.click(confirmDeleteButton[confirmDeleteButton.length - 1]);

    await waitFor(() => {
      expect(deleteObligationMock).toHaveBeenCalledWith("obl-1");
    });
    expect(invalidateCacheKeysMock).toHaveBeenCalledWith([
      "cache:obligations",
      "cache:upcoming-obligations",
    ]);
  });
});
