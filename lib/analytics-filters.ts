export const analyticsFilterQueryKeys = {
  month: "month",
  financialAccountId: "financial_account_id",
} as const;

type SearchParamsSource = string | Pick<URLSearchParams, "toString">;

export type AnalyticsFilters = {
  month: string;
  financialAccountId: string;
};

export type AnalyticsFiltersPatch = {
  month?: string | null;
  financialAccountId?: string | null;
};

export type AnalyticsScopeParams = {
  year?: number;
  month?: number;
  financial_account_id?: string;
};

export function readAnalyticsFilters(
  searchParams: SearchParamsSource,
): AnalyticsFilters {
  const params = toUrlSearchParams(searchParams);

  return {
    month: normalizeAnalyticsMonth(params.get(analyticsFilterQueryKeys.month)) ?? "",
    financialAccountId: normalizeAnalyticsFilterValue(
      params.get(analyticsFilterQueryKeys.financialAccountId),
    ),
  };
}

export function resolveAnalyticsFiltersNavigation(
  pathname: string,
  currentSearchParams: SearchParamsSource,
  patch: AnalyticsFiltersPatch,
) {
  const currentQuery = toUrlSearchParams(currentSearchParams).toString();
  const nextParams = toUrlSearchParams(currentSearchParams);

  if ("month" in patch) {
    const nextMonth = normalizeAnalyticsMonth(patch.month) ?? "";
    if (nextMonth) {
      nextParams.set(analyticsFilterQueryKeys.month, nextMonth);
    } else {
      nextParams.delete(analyticsFilterQueryKeys.month);
    }
  }

  if ("financialAccountId" in patch) {
    const nextFinancialAccountId = normalizeAnalyticsFilterValue(
      patch.financialAccountId,
    );
    if (nextFinancialAccountId) {
      nextParams.set(
        analyticsFilterQueryKeys.financialAccountId,
        nextFinancialAccountId,
      );
    } else {
      nextParams.delete(analyticsFilterQueryKeys.financialAccountId);
    }
  }

  const nextQuery = nextParams.toString();

  return {
    currentQuery,
    nextQuery,
    hasChanged: currentQuery !== nextQuery,
    href: nextQuery ? `${pathname}?${nextQuery}` : pathname,
    filters: readAnalyticsFilters(nextParams),
  };
}

export function parseAnalyticsMonth(value: string | null | undefined) {
  const normalizedMonth = normalizeAnalyticsMonth(value);
  if (!normalizedMonth) {
    return null;
  }

  const [year, month] = normalizedMonth.split("-").map(Number);
  return { year, month };
}

export function buildAnalyticsScopeParams(
  filters: AnalyticsFiltersPatch,
): AnalyticsScopeParams | undefined {
  const monthParts = parseAnalyticsMonth(filters.month);
  const financialAccountId = normalizeAnalyticsFilterValue(
    filters.financialAccountId,
  );

  if (!monthParts && !financialAccountId) {
    return undefined;
  }

  return {
    ...(monthParts ?? {}),
    ...(financialAccountId
      ? { financial_account_id: financialAccountId }
      : {}),
  };
}

export function getAnalyticsFiltersViewKey(filters: AnalyticsFiltersPatch) {
  const month = normalizeAnalyticsMonth(filters.month) ?? "";
  const financialAccountId = normalizeAnalyticsFilterValue(
    filters.financialAccountId,
  );

  return [
    month || "__latest__",
    financialAccountId || "__all__",
  ].join(":");
}

function normalizeAnalyticsMonth(value: string | null | undefined) {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return null;
  }

  const match = trimmedValue.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }

  return `${match[1]}-${match[2]}`;
}

function normalizeAnalyticsFilterValue(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function toUrlSearchParams(searchParams: SearchParamsSource) {
  return new URLSearchParams(
    typeof searchParams === "string" ? searchParams : searchParams.toString(),
  );
}
