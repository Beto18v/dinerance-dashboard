import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CurrentCashCard } from "./current-cash-card";
import { getSiteText } from "@/lib/site";

describe("CurrentCashCard", () => {
  it("keeps the distribution visible by grouping positive balances per currency", () => {
    const site = getSiteText("es");

    render(
      <CurrentCashCard
        accounts={[
          {
            financial_account_id: "acc-1",
            financial_account_name: "Cuenta principal",
            currency: "COP",
            balance: "1200000.00",
          },
          {
            financial_account_id: "acc-2",
            financial_account_name: "Ahorros",
            currency: "COP",
            balance: "300000.00",
          },
          {
            financial_account_id: "acc-3",
            financial_account_name: "Broker",
            currency: "USD",
            balance: "150.00",
          },
          {
            financial_account_id: "acc-4",
            financial_account_name: "Cash",
            currency: "USD",
            balance: "50.00",
          },
        ]}
        balanceCurrency="COP"
        consolidatedBalance="1500000.00"
        financialAccountsCount={4}
        locale="es-CO"
        selectedAccountBalance={null}
        selectedFinancialAccountName={null}
        showEmptyState={false}
        text={site.pages.balance}
      />,
    );

    expect(
      screen.getByText(
        "Como mezclas monedas, mostramos un bloque por moneda y calculamos sus porcentajes por separado.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });
});
