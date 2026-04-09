import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CsvImportCard } from "./csv-import-card";
import { getSiteText } from "@/lib/site";

const {
  commitImportSessionMock,
  createCsvImportMock,
  getImportCapabilitiesMock,
  getImportSessionMock,
  getImportSessionsMock,
  toastErrorMock,
  toastSuccessMock,
} = vi.hoisted(() => ({
  commitImportSessionMock: vi.fn(),
  createCsvImportMock: vi.fn(),
  getImportCapabilitiesMock: vi.fn(),
  getImportSessionMock: vi.fn(),
  getImportSessionsMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
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
    getImportSessions: getImportSessionsMock,
    getImportCapabilities: getImportCapabilitiesMock,
    getImportSession: getImportSessionMock,
    createCsvImport: createCsvImportMock,
    updateImportItem: vi.fn(),
    commitImportSession: commitImportSessionMock,
  },
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

describe("CsvImportCard", () => {
  const categories = [
    { id: "cat-income", name: "Salary", direction: "income", parent_id: null },
    { id: "cat-expense", name: "Food", direction: "expense", parent_id: null },
  ] as const;
  const financialAccounts = [
    {
      id: "acc-1",
      name: "Main account",
      currency: "COP",
      is_default: true,
      created_at: "2026-03-01T00:00:00Z",
    },
  ] as const;

  beforeEach(() => {
    getImportSessionsMock.mockReset();
    getImportCapabilitiesMock.mockReset();
    getImportSessionMock.mockReset();
    createCsvImportMock.mockReset();
    commitImportSessionMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    getImportSessionsMock.mockResolvedValue([]);
    getImportCapabilitiesMock.mockResolvedValue({
      max_rows: 1000,
      required_fields: {
        date: ["date", "fecha"],
        amount: ["amount", "monto"],
        debit: ["debit", "debito"],
        credit: ["credit", "credito"],
      },
      optional_fields: {
        description: ["description", "descripcion"],
        currency: ["currency", "moneda"],
        category: ["category", "categoria"],
        type: ["type", "tipo"],
      },
      type_aliases: ["income", "expense", "ingreso", "gasto"],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("uploads a CSV file and renders the analyzed session", async () => {
    const analyzedSession = buildImportSession({
      id: "session-1",
      file_name: "bank.csv",
      ready_count: 1,
      itemStatus: "ready",
    });

    getImportSessionsMock.mockResolvedValueOnce([]);
    createCsvImportMock.mockResolvedValue(analyzedSession);
    getImportSessionsMock.mockResolvedValueOnce([]);
    getImportSessionMock.mockResolvedValue(analyzedSession);

    render(
      <CsvImportCard
        categories={[...categories]}
        financialAccounts={[...financialAccounts]}
        displayLocale="es-CO"
        timeZone="UTC"
        onImported={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Importar CSV" }));
    expect(
      screen.getByText(
        "Cada fila debe tener fecha y monto. Si tu archivo trae descripcion, categoria o moneda, tambien intentamos reconocerlas.",
      ),
    ).toBeInTheDocument();

    const input = screen.getByLabelText("Archivo CSV");
    fireEvent.change(input, {
      target: {
        files: [
          new File(
            ["date,description,amount\n2026-03-10,Coffee,-5.00\n"],
            "bank.csv",
            { type: "text/csv" },
          ),
        ],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Analizar CSV" }));

    await waitFor(() => {
      expect(createCsvImportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          file_name: "bank.csv",
          financial_account_id: "acc-1",
        }),
      );
    });

    expect(
      createCsvImportMock.mock.calls[0][0].csv_content,
    ).toContain("Coffee");
    expect(await screen.findByText("bank.csv")).toBeInTheDocument();
    expect(
      screen.getByText("Columnas detectadas en este archivo"),
    ).toBeInTheDocument();
    expect(screen.getByText("Fecha -> date")).toBeInTheDocument();
    expect(screen.getByText("Listas")).toBeInTheDocument();
    expect(screen.getByText("Sin coincidencia todavia")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Importar 1 fila lista" }),
    ).toBeInTheDocument();
  });

  it("commits ready rows and notifies the parent page", async () => {
    const readySession = buildImportSession({
      id: "session-2",
      file_name: "statement.csv",
      ready_count: 1,
      itemStatus: "ready",
    });
    const committedSession = buildImportSession({
      id: "session-2",
      file_name: "statement.csv",
      ready_count: 0,
      imported_count: 1,
      itemStatus: "imported",
    });
    const onImported = vi.fn();

    getImportSessionsMock.mockResolvedValueOnce([
      {
        id: readySession.id,
        source_type: "csv",
        file_name: readySession.file_name,
        financial_account_id: readySession.financial_account_id,
        financial_account_name: readySession.financial_account_name,
        created_at: readySession.created_at,
        summary: readySession.summary,
      },
    ]);
    getImportSessionMock.mockResolvedValue(readySession);
    commitImportSessionMock.mockResolvedValue(committedSession);
    getImportSessionsMock.mockResolvedValueOnce([]);

    render(
      <CsvImportCard
        categories={[...categories]}
        financialAccounts={[...financialAccounts]}
        displayLocale="es-CO"
        timeZone="UTC"
        onImported={onImported}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Importar CSV" }));

    await screen.findByRole("button", { name: "statement.csv" });

    fireEvent.click(screen.getByRole("button", { name: "Importar 1 fila lista" }));

    await waitFor(() => {
      expect(commitImportSessionMock).toHaveBeenCalledWith("session-2");
    });
    expect(
      await screen.findByText("Ya se importo como transaccion real."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Imported into ledger")).not.toBeInTheDocument();
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it("keeps the selected recent import active", async () => {
    const firstSession = buildImportSession({
      id: "session-1",
      file_name: "first.csv",
      ready_count: 1,
      itemStatus: "ready",
    });
    const secondSession = buildImportSession({
      id: "session-2",
      file_name: "second.csv",
      ready_count: 1,
      itemStatus: "ready",
    });

    getImportSessionsMock.mockResolvedValueOnce([
      {
        id: firstSession.id,
        source_type: "csv",
        file_name: firstSession.file_name,
        financial_account_id: firstSession.financial_account_id,
        financial_account_name: firstSession.financial_account_name,
        created_at: firstSession.created_at,
        summary: firstSession.summary,
      },
      {
        id: secondSession.id,
        source_type: "csv",
        file_name: secondSession.file_name,
        financial_account_id: secondSession.financial_account_id,
        financial_account_name: secondSession.financial_account_name,
        created_at: secondSession.created_at,
        summary: secondSession.summary,
      },
    ]);
    getImportSessionMock.mockImplementation(async (sessionId: string) => {
      if (sessionId === secondSession.id) {
        return secondSession;
      }
      return firstSession;
    });

    render(
      <CsvImportCard
        categories={[...categories]}
        financialAccounts={[...financialAccounts]}
        displayLocale="es-CO"
        timeZone="UTC"
        onImported={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Importar CSV" }));

    await screen.findByRole("heading", { name: "first.csv" });

    fireEvent.click(screen.getByRole("button", { name: "second.csv" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "second.csv" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: "first.csv" }),
    ).not.toBeInTheDocument();
  });
});

function buildImportSession({
  id,
  file_name,
  ready_count,
  imported_count = 0,
  itemStatus,
}: {
  id: string;
  file_name: string;
  ready_count: number;
  imported_count?: number;
  itemStatus: "ready" | "imported";
}) {
  return {
    id,
    source_type: "csv",
    file_name,
    financial_account_id: "acc-1",
    financial_account_name: "Cuenta principal",
    created_at: "2026-03-10T12:00:00Z",
    summary: {
      total_rows: 1,
      ready_count,
      needs_review_count: 0,
      duplicate_count: 0,
      ignored_count: 0,
      imported_count,
    },
    items: [
      {
        id: `${id}-item-1`,
        row_index: 1,
        raw_row: { date: "2026-03-10", description: "Coffee", amount: "-5.00" },
        status: itemStatus,
        status_reason: itemStatus === "imported" ? "Imported into ledger" : null,
        occurred_at: "2026-03-10T12:00:00Z",
        occurred_on: "2026-03-10",
        amount: "5.00",
        currency: "COP",
        description: "Coffee",
        transaction_type: "expense",
        category_id: "cat-expense",
        category_name: "Food",
        duplicate_transaction: null,
        imported_transaction:
          itemStatus === "imported"
            ? {
                id: "txn-1",
                category_id: "cat-expense",
                financial_account_id: "acc-1",
                transaction_type: "expense",
                transfer_group_id: null,
                amount: "5.00",
                currency: "COP",
                fx_rate: null,
                fx_rate_date: null,
                fx_rate_source: null,
                base_currency: "COP",
                amount_in_base_currency: "5.00",
                description: "Coffee",
                occurred_at: "2026-03-10T12:00:00Z",
                created_at: "2026-03-10T12:00:00Z",
              }
            : null,
      },
    ],
    analysis: {
      source_headers: ["date", "description", "amount"],
      detected_columns: {
        date: "date",
        description: "description",
        amount: "amount",
      },
    },
  };
}
