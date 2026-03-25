interface PaginationSummaryOptions {
  itemCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  pageOf: (page: number, total: number) => string;
  showingOfTotal: (visible: number, total: number) => string;
}

export function getPaginationSummary({
  itemCount,
  pageSize,
  currentPage,
  totalPages,
  pageOf,
  showingOfTotal,
}: PaginationSummaryOptions) {
  if (itemCount <= pageSize) {
    return showingOfTotal(itemCount, itemCount);
  }

  return pageOf(currentPage, totalPages);
}
