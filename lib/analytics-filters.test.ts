import { describe, expect, it } from "vitest";

import {
  buildAnalyticsScopeParams,
  getAnalyticsFiltersViewKey,
  readAnalyticsFilters,
  resolveAnalyticsFiltersNavigation,
} from "./analytics-filters";

describe("analytics filter helpers", () => {
  it("reads and normalizes analytics filters from the URL", () => {
    expect(
      readAnalyticsFilters("month=2026-03&financial_account_id=%20acc-2%20"),
    ).toEqual({
      month: "2026-03",
      financialAccountId: "acc-2",
    });

    expect(
      readAnalyticsFilters("month=2026-13&financial_account_id=%20%20"),
    ).toEqual({
      month: "",
      financialAccountId: "",
    });
  });

  it("builds analytics scope params only with supported filters", () => {
    expect(
      buildAnalyticsScopeParams({
        month: "2026-02",
        financialAccountId: "acc-7",
      }),
    ).toEqual({
      year: 2026,
      month: 2,
      financial_account_id: "acc-7",
    });

    expect(
      buildAnalyticsScopeParams({
        month: "2026-99",
        financialAccountId: "acc-7",
      }),
    ).toEqual({
      financial_account_id: "acc-7",
    });

    expect(buildAnalyticsScopeParams({})).toBeUndefined();
  });

  it("resolves URL updates while preserving unrelated query params", () => {
    expect(
      resolveAnalyticsFiltersNavigation(
        "/app/balance",
        "tab=history&month=2026-03",
        {
          financialAccountId: "acc-2",
        },
      ),
    ).toMatchObject({
      hasChanged: true,
      href: "/app/balance?tab=history&month=2026-03&financial_account_id=acc-2",
      filters: {
        month: "2026-03",
        financialAccountId: "acc-2",
      },
    });

    expect(
      resolveAnalyticsFiltersNavigation(
        "/app/balance",
        "tab=history&month=2026-03&financial_account_id=acc-2",
        {
          month: null,
          financialAccountId: "",
        },
      ),
    ).toMatchObject({
      hasChanged: true,
      href: "/app/balance?tab=history",
      filters: {
        month: "",
        financialAccountId: "",
      },
    });
  });

  it("builds a stable view key for deduping analytics requests", () => {
    expect(getAnalyticsFiltersViewKey({})).toBe("__latest__:__all__");
    expect(
      getAnalyticsFiltersViewKey({
        month: "2026-03",
        financialAccountId: "acc-2",
      }),
    ).toBe("2026-03:acc-2");
  });
});
