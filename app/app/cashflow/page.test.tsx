import type { AnchorHTMLAttributes } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CashflowPage from "./page";
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
  getCacheMock,
  getCashflowForecastMock,
  getProfileMock,
  setCacheMock,
  subscribeToCacheKeysMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  getCacheMock: vi.fn(),
  getCashflowForecastMock: vi.fn(),
  getProfileMock: vi.fn(),
  setCacheMock: vi.fn(),
  subscribeToCacheKeysMock: vi.fn(),
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
    getCashflowForecast: getCashflowForecastMock,
  },
}));

vi.mock("@/lib/cache", () => ({
  cacheKeys: {
    cashflowForecast: "cache:cashflow-forecast",
    obligations: "cache:obligations",
    ledgerBalances: "cache:ledger-balances",
    transactions: "cache:transactions",
  },
  cacheTtls: {
    cashflowForecast: 30000,
  },
  getCache: getCacheMock,
  setCache: setCacheMock,
  subscribeToCacheKeys: subscribeToCacheKeysMock,
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

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
  },
}));

const mockForecast = {
  reference_date: "2026-07-15",
  currency: "COP",
  current_balance: "1500000.00",
  safe_to_spend: {
    reference_date: "2026-07-15",
    month_offset: 0,
    month_label: "Jul 2026",
    days_in_window: 17,
    currency: "COP",
    current_balance: "1500000.00",
    scheduled_payments_count: 3,
    confirmed_obligations_total: "1380000.00",
    projected_balance: "120000.00",
    safe_to_spend: "120000.00",
    safe_to_spend_per_day: "7058.82",
    shortfall_amount: "0.00",
    status: "covered",
  },
  horizons: [
    {
      month_offset: 0,
      month_label: "Jul 2026",
      days_in_window: 17,
      scheduled_payments_count: 3,
      confirmed_obligations_total: "1380000.00",
      projected_balance: "120000.00",
      safe_to_spend: "120000.00",
      safe_to_spend_per_day: "7058.82",
      shortfall_amount: "0.00",
      status: "covered",
    },
    {
      month_offset: 1,
      month_label: "Ago 2026",
      days_in_window: 31,
      scheduled_payments_count: 6,
      confirmed_obligations_total: "2760000.00",
      projected_balance: "-1260000.00",
      safe_to_spend: "0.00",
      safe_to_spend_per_day: "0.00",
      shortfall_amount: "1260000.00",
      status: "shortfall",
    },
    {
      month_offset: 2,
      month_label: "Sep 2026",
      days_in_window: 30,
      scheduled_payments_count: 9,
      confirmed_obligations_total: "4140000.00",
      projected_balance: "-2640000.00",
      safe_to_spend: "0.00",
      safe_to_spend_per_day: "0.00",
      shortfall_amount: "2640000.00",
      status: "shortfall",
    },
  ],
};

describe("CashflowPage", () => {
  beforeEach(() => {
    getCacheMock.mockReset();
    getCashflowForecastMock.mockReset();
    getProfileMock.mockReset();
    setCacheMock.mockReset();
    subscribeToCacheKeysMock.mockReset();
    toastErrorMock.mockReset();

    getCacheMock.mockReturnValue(null);
    subscribeToCacheKeysMock.mockReturnValue(() => {});
    getProfileMock.mockReturnValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: "COP",
      timezone: "America/Bogota",
      created_at: "2026-03-01T00:00:00Z",
      deleted_at: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the dedicated future cash view with monthly labels and links to obligations", async () => {
    getCashflowForecastMock.mockResolvedValue(mockForecast);

    render(<CashflowPage />);

    await waitFor(() => {
      expect(getCashflowForecastMock).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("Caja futura")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Planea tu gasto con una proyeccion clara del mes en curso y los dos siguientes, basada en saldo real y obligaciones confirmadas.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Disponible para gastar en Jul 2026"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Jul 2026").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Ago 2026")).toBeInTheDocument();
    expect(screen.getByText("Sep 2026")).toBeInTheDocument();
    expect(screen.queryByText("30 dias")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir obligaciones" }),
    ).toHaveAttribute("href", "/app/obligations");
  });

  it("shows the missing profile state without loading forecast", async () => {
    getProfileMock.mockReturnValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: null,
      timezone: null,
      created_at: "2026-03-01T00:00:00Z",
      deleted_at: null,
    });

    render(<CashflowPage />);

    expect(await screen.findByText("Caja futura")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Completa tu moneda base y tu zona horaria antes de usar caja futura.",
      ),
    ).toBeInTheDocument();
    expect(getCashflowForecastMock).not.toHaveBeenCalled();
  });
});
