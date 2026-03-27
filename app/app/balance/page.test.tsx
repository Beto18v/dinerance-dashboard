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
  getMonthlyBalanceMock,
  getCategoriesMock,
  getProfileMock,
  getTransactionsMock,
  updateProfileMock,
  setProfileMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  getMonthlyBalanceMock: vi.fn(),
  getCategoriesMock: vi.fn(),
  getProfileMock: vi.fn(),
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
    getMonthlyBalance: getMonthlyBalanceMock,
    getCategories: getCategoriesMock,
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
  },
}));

describe("BalancePage", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    getMonthlyBalanceMock.mockReset();
    getCategoriesMock.mockReset();
    getProfileMock.mockReset();
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
    getTransactionsMock.mockResolvedValue([{ id: "txn-1" }]);
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
    getMonthlyBalanceMock.mockResolvedValue({
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
    });

    render(<BalancePage />);

    expect(screen.getByText("Cargando...")).toBeInTheDocument();

    await waitFor(() => {
      expect(getMonthlyBalanceMock).toHaveBeenCalledWith(undefined);
    });

    expect(
      await screen.findAllByText(/Resumen financiero - marzo de 2026/i),
    ).toHaveLength(2);
    expect(screen.getAllByText(/\$\s?2\.500\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$\s?1\.200\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$\s?1\.300\.000/).length).toBeGreaterThan(0);
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
    getMonthlyBalanceMock
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
      });

    render(<BalancePage />);

    const monthInput = await screen.findByLabelText("Mes");
    fireEvent.change(monthInput, { target: { value: "2026-02" } });

    await waitFor(() => {
      expect(getMonthlyBalanceMock).toHaveBeenNthCalledWith(2, {
        year: 2026,
        month: 2,
      });
    });

    expect(screen.getByDisplayValue("2026-02")).toBeInTheDocument();
  });

  it("shows onboarding when there are no categories or transactions", async () => {
    getCategoriesMock.mockResolvedValue([]);
    getTransactionsMock.mockResolvedValue([]);
    getMonthlyBalanceMock.mockResolvedValue({
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
    getTransactionsMock.mockResolvedValue([]);

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
