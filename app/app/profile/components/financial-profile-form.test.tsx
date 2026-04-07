import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FinancialProfileForm } from "./financial-profile-form";
import { getSiteText } from "@/lib/site";

vi.mock("@/components/providers/site-preferences-provider", () => ({
  useSitePreferences: () => ({
    site: getSiteText("es"),
  }),
}));

describe("FinancialProfileForm", () => {
  it("renders help buttons for technical finance settings", () => {
    render(
      <FinancialProfileForm
        profile={{
          id: "user-1",
          name: "Test User",
          email: "test@example.com",
          base_currency: "COP",
          timezone: "America/Bogota",
          created_at: "2026-03-01T00:00:00Z",
          deleted_at: null,
        }}
        hasTransactions={false}
        onProfileUpdated={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Que es la moneda principal?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Por que importa la zona horaria?",
      }),
    ).toBeInTheDocument();
  });
});
