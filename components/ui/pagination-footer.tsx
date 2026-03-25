"use client";

import { Button } from "@/components/ui/button";

interface PaginationFooterProps {
  currentPage: number;
  totalPages: number;
  pageSizeLabel: string;
  summaryLabel: string;
  previousLabel: string;
  nextLabel: string;
  onPageChange: (page: number) => void;
}

export function PaginationFooter({
  currentPage,
  totalPages,
  pageSizeLabel,
  summaryLabel,
  previousLabel,
  nextLabel,
  onPageChange,
}: PaginationFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">{pageSizeLabel}</p>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          {previousLabel}
        </Button>
        <span className="min-w-30 text-center text-sm font-medium tabular-nums">
          {summaryLabel}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
