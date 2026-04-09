"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FiUpload } from "react-icons/fi";
import { toast } from "sonner";

import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApiError,
  api,
  type Category,
  type FinancialAccount,
  type ImportSession,
  type ImportSessionItem,
  type ImportSessionListItem,
} from "@/lib/api";
import { formatCurrencyAmount } from "@/lib/finance";
import {
  getFinancialAccountDisplayName,
  resolveDefaultFinancialAccountId,
} from "@/lib/financial-accounts";

const RECENT_IMPORTS_LIMIT = 5;
const EMPTY_CATEGORY_VALUE = "__none__";

interface CsvImportCardProps {
  categories: Category[];
  financialAccounts: FinancialAccount[];
  displayLocale: string;
  timeZone: string;
  onImported: () => void;
}

export function CsvImportCard({
  categories,
  financialAccounts,
  displayLocale,
  timeZone,
  onImported,
}: CsvImportCardProps) {
  const { site } = useSitePreferences();
  const t = site.pages.transactions.imports;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    resolveDefaultFinancialAccountId(financialAccounts),
  );
  const [defaultIncomeCategoryId, setDefaultIncomeCategoryId] = useState("");
  const [defaultExpenseCategoryId, setDefaultExpenseCategoryId] = useState("");
  const [recentSessions, setRecentSessions] = useState<ImportSessionListItem[]>(
    [],
  );
  const [activeSession, setActiveSession] = useState<ImportSession | null>(
    null,
  );
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((left, right) =>
        left.name.localeCompare(right.name, displayLocale),
      ),
    [categories, displayLocale],
  );
  const incomeCategories = useMemo(
    () =>
      sortedCategories.filter((category) => category.direction === "income"),
    [sortedCategories],
  );
  const expenseCategories = useMemo(
    () =>
      sortedCategories.filter((category) => category.direction === "expense"),
    [sortedCategories],
  );
  const canAnalyze = financialAccounts.length > 0 && categories.length > 0;

  useEffect(() => {
    if (
      selectedAccountId &&
      financialAccounts.some((account) => account.id === selectedAccountId)
    ) {
      return;
    }

    setSelectedAccountId(resolveDefaultFinancialAccountId(financialAccounts));
  }, [financialAccounts, selectedAccountId]);

  const refreshSessions = useCallback(
    async (options?: {
      preferredSessionId?: string;
      selectLatest?: boolean;
      fallbackSessionId?: string | null;
    }) => {
      const {
        preferredSessionId,
        selectLatest = false,
        fallbackSessionId,
      } = options ?? {};
      setLoadingRecent(true);

      try {
        const sessions = await api.getImportSessions({
          limit: RECENT_IMPORTS_LIMIT,
        });
        setRecentSessions(sessions);

        const nextSessionId =
          preferredSessionId ??
          (selectLatest
            ? sessions[0]?.id
            : (fallbackSessionId ?? sessions[0]?.id));

        if (!nextSessionId) {
          return;
        }

        const detail = await api.getImportSession(nextSessionId);
        setActiveSession(detail);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.message);
        } else {
          toast.error(t.failedLoad);
        }
      } finally {
        setLoadingRecent(false);
      }
    },
    [t.failedLoad],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    void refreshSessions({ selectLatest: true });
  }, [open, refreshSessions]);

  async function handleAnalyze() {
    if (!selectedFile) {
      toast.error(t.validations.fileRequired);
      return;
    }
    if (!selectedAccountId) {
      toast.error(t.validations.accountRequired);
      return;
    }
    if (!canAnalyze) {
      toast.error(categories.length === 0 ? t.missingCategories : t.failedLoad);
      return;
    }

    setAnalyzing(true);
    try {
      const csvContent = await selectedFile.text();
      const session = await api.createCsvImport({
        file_name: selectedFile.name,
        csv_content: csvContent,
        financial_account_id: selectedAccountId,
        default_income_category_id: defaultIncomeCategoryId || null,
        default_expense_category_id: defaultExpenseCategoryId || null,
      });

      setActiveSession(session);
      setSelectedFile(null);
      await refreshSessions({ preferredSessionId: session.id });
      toast.success(t.analyzed);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedAnalyze);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSelectSession(sessionId: string) {
    setLoadingRecent(true);
    try {
      const detail = await api.getImportSession(sessionId);
      setActiveSession(detail);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedLoad);
      }
    } finally {
      setLoadingRecent(false);
    }
  }

  async function handleCategoryChange(itemId: string, categoryId: string) {
    if (!activeSession) return;

    setUpdatingItemId(itemId);
    try {
      const nextSession = await api.updateImportItem(activeSession.id, itemId, {
        category_id: categoryId === EMPTY_CATEGORY_VALUE ? null : categoryId,
      });
      setActiveSession(nextSession);
      await refreshRecentSummaries(nextSession.id);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedUpdateItem);
      }
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleIgnoredChange(
    item: ImportSessionItem,
    ignored: boolean,
  ) {
    if (!activeSession) return;

    setUpdatingItemId(item.id);
    try {
      const nextSession = await api.updateImportItem(
        activeSession.id,
        item.id,
        {
          ignored,
        },
      );
      setActiveSession(nextSession);
      await refreshRecentSummaries(nextSession.id);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedUpdateItem);
      }
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleCommit() {
    if (!activeSession) return;
    if (activeSession.summary.ready_count === 0) {
      toast.error(t.validations.nothingReady);
      return;
    }

    setCommitting(true);
    try {
      const nextSession = await api.commitImportSession(activeSession.id);
      setActiveSession(nextSession);
      await refreshRecentSummaries(nextSession.id);
      onImported();
      toast.success(t.imported(nextSession.summary.imported_count));
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedCommit);
      }
    } finally {
      setCommitting(false);
    }
  }

  async function refreshRecentSummaries(preferredSessionId: string) {
    try {
      const sessions = await api.getImportSessions({
        limit: RECENT_IMPORTS_LIMIT,
      });
      setRecentSessions(sessions);
      if (!activeSession || activeSession.id !== preferredSessionId) {
        return;
      }
    } catch {
      // Keep the active review available even if the summary refresh fails.
    }
  }

  const summaryCards = activeSession
    ? [
        {
          label: t.summaryReady,
          value: String(activeSession.summary.ready_count),
        },
        {
          label: t.summaryReview,
          value: String(activeSession.summary.needs_review_count),
        },
        {
          label: t.summaryDuplicates,
          value: String(activeSession.summary.duplicate_count),
        },
        {
          label: t.summaryImported,
          value: String(activeSession.summary.imported_count),
        },
        {
          label: t.summaryIgnored,
          value: String(activeSession.summary.ignored_count),
        },
      ]
    : [];
  const detectedColumns = Object.entries(
    activeSession?.analysis?.detected_columns ?? {},
  );
  const sourceHeaders = activeSession?.analysis?.source_headers ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSelectedFile(null);
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={t.trigger}
          className="px-2 text-xs sm:px-3 sm:text-sm"
        >
          <FiUpload size={14} className="sm:mr-1" />
          <span aria-hidden="true" className="sm:hidden">
            CSV
          </span>
          <span aria-hidden="true" className="hidden sm:inline">
            {t.trigger}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] flex-col overflow-hidden p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-6xl">
        <DialogHeader className="gap-3 border-b px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-1">
            <DialogTitle>{t.title}</DialogTitle>
            <DialogDescription>{t.description}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="csv-import-file">{t.file}</Label>
              <Input
                id="csv-import-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
              />
              <p className="text-xs text-muted-foreground">{t.fileHint}</p>
            </div>

            <div className="space-y-1.5">
              <Label>{t.account}</Label>
              <Select
                value={selectedAccountId || EMPTY_CATEGORY_VALUE}
                onValueChange={(value) =>
                  setSelectedAccountId(
                    value === EMPTY_CATEGORY_VALUE ? "" : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.accountPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {financialAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {getFinancialAccountDisplayName(
                        account,
                        site.common.mainFinancialAccount,
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t.defaultIncomeCategory}</Label>
              <Select
                value={defaultIncomeCategoryId || EMPTY_CATEGORY_VALUE}
                onValueChange={(value) =>
                  setDefaultIncomeCategoryId(
                    value === EMPTY_CATEGORY_VALUE ? "" : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.optionalPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_CATEGORY_VALUE}>
                    {t.optionalPlaceholder}
                  </SelectItem>
                  {incomeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t.defaultExpenseCategory}</Label>
              <Select
                value={defaultExpenseCategoryId || EMPTY_CATEGORY_VALUE}
                onValueChange={(value) =>
                  setDefaultExpenseCategoryId(
                    value === EMPTY_CATEGORY_VALUE ? "" : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.optionalPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_CATEGORY_VALUE}>
                    {t.optionalPlaceholder}
                  </SelectItem>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {categories.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {t.missingCategories}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzing || !canAnalyze}
            >
              {analyzing ? t.analyzing : t.analyze}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                void refreshSessions({
                  preferredSessionId: activeSession?.id,
                  fallbackSessionId: activeSession?.id,
                })
              }
              disabled={loadingRecent}
            >
              {site.common.refresh}
            </Button>
          </div>

          {recentSessions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{t.recentTitle}</h3>
                {loadingRecent ? (
                  <span className="text-xs text-muted-foreground">
                    {site.common.loading}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSessions.map((session) => {
                  const isActive = session.id === activeSession?.id;
                  return (
                    <Button
                      key={session.id}
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      onClick={() => void handleSelectSession(session.id)}
                    >
                      {session.file_name}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {activeSession ? (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <h4 className="text-sm font-semibold">
                    {t.detectedColumnsTitle}
                  </h4>
                  {detectedColumns.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {detectedColumns.map(([field, header]) => (
                        <Badge key={field} variant="outline">
                          {`${getImportFieldLabel(field, t)} -> ${header}`}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t.detectedColumnsEmpty}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <h4 className="text-sm font-semibold">
                    {t.sourceHeadersTitle}
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sourceHeaders.map((header) => (
                      <Badge key={header} variant="outline">
                        {header}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">
                    {activeSession.file_name}
                  </h3>
                  <Badge variant="outline">
                    {activeSession.financial_account_name ?? t.accountFallback}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.activeSessionDescription(activeSession.summary.total_rows)}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {summaryCards.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border bg-muted/20 px-4 py-3"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCommit}
                  disabled={
                    committing || activeSession.summary.ready_count === 0
                  }
                >
                  {committing
                    ? t.importing
                    : t.importReady(activeSession.summary.ready_count)}
                </Button>
                <p className="text-sm text-muted-foreground">{t.reviewHint}</p>
              </div>

              <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <Table showMobileScrollHint>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>{t.tableRow}</TableHead>
                      <TableHead>{site.common.date}</TableHead>
                      <TableHead>{site.common.description}</TableHead>
                      <TableHead>{site.common.amount}</TableHead>
                      <TableHead>{site.common.direction}</TableHead>
                      <TableHead>{site.common.category}</TableHead>
                      <TableHead>{t.tableStatus}</TableHead>
                      <TableHead>{t.tableReconciliation}</TableHead>
                      <TableHead className="text-right">
                        {site.common.actions}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSession.items.map((item) => {
                      const localizedStatusReason = getImportStatusReasonLabel(
                        item.status_reason,
                        t,
                      );

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.row_index}
                          </TableCell>
                          <TableCell>
                            {formatImportDate(item, displayLocale, timeZone)}
                          </TableCell>
                          <TableCell className="max-w-40 truncate">
                            {item.description ?? site.common.dash}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatImportAmount(item, displayLocale)}
                          </TableCell>
                          <TableCell>
                            {getDirectionLabel(item.transaction_type, site)}
                          </TableCell>
                          <TableCell className="min-w-44">
                            <Select
                              value={item.category_id ?? EMPTY_CATEGORY_VALUE}
                              onValueChange={(value) =>
                                void handleCategoryChange(item.id, value)
                              }
                              disabled={
                                item.status === "imported" ||
                                updatingItemId === item.id
                              }
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t.categoryPlaceholder}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={EMPTY_CATEGORY_VALUE}>
                                  {t.categoryPlaceholder}
                                </SelectItem>
                                {sortedCategories.map((category) => (
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge
                                className={resolveStatusBadgeClassName(
                                  item.status,
                                )}
                              >
                                {getStatusLabel(item.status, t)}
                              </Badge>
                              {localizedStatusReason ? (
                                <p className="max-w-52 whitespace-normal text-xs text-muted-foreground">
                                  {localizedStatusReason}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-60 whitespace-normal text-sm text-muted-foreground">
                            {getReconciliationText(
                              item,
                              displayLocale,
                              timeZone,
                              t,
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.status === "ignored" ? (
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                  void handleIgnoredChange(item, false)
                                }
                                disabled={updatingItemId === item.id}
                              >
                                {t.restore}
                              </Button>
                            ) : item.status === "imported" ? (
                              <span className="text-xs text-muted-foreground">
                                {t.importedLabel}
                              </span>
                            ) : (
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                  void handleIgnoredChange(item, true)
                                }
                                disabled={updatingItemId === item.id}
                              >
                                {t.ignore}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.emptyState}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatImportAmount(item: ImportSessionItem, locale: string) {
  if (!item.amount || !item.currency) {
    return "-";
  }

  return formatCurrencyAmount(item.amount, item.currency, locale);
}

function formatImportDate(
  item: ImportSessionItem,
  locale: string,
  timeZone: string,
) {
  if (item.occurred_at) {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone,
    }).format(new Date(item.occurred_at));
  }

  if (item.occurred_on) {
    return item.occurred_on;
  }

  return "-";
}

function getDirectionLabel(
  transactionType: string | null,
  site: ReturnType<typeof useSitePreferences>["site"],
) {
  if (transactionType === "income") return site.common.income;
  if (transactionType === "expense") return site.common.expense;
  return site.common.dash;
}

function getStatusLabel(
  status: ImportSessionItem["status"],
  t: ReturnType<
    typeof useSitePreferences
  >["site"]["pages"]["transactions"]["imports"],
) {
  if (status === "ready") return t.statusReady;
  if (status === "needs_review") return t.statusNeedsReview;
  if (status === "duplicate") return t.statusDuplicate;
  if (status === "ignored") return t.statusIgnored;
  return t.statusImported;
}

function resolveStatusBadgeClassName(status: ImportSessionItem["status"]) {
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "needs_review") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  if (status === "duplicate") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }
  if (status === "ignored") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  return "border-cyan-200 bg-cyan-50 text-cyan-800";
}

function getReconciliationText(
  item: ImportSessionItem,
  locale: string,
  timeZone: string,
  t: ReturnType<
    typeof useSitePreferences
  >["site"]["pages"]["transactions"]["imports"],
) {
  const reference = item.imported_transaction ?? item.duplicate_transaction;
  if (!reference) {
    return getImportStatusReasonLabel(item.status_reason, t) ?? t.noReconciliation;
  }

  const dateLabel = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(new Date(reference.occurred_at));
  const amountLabel = formatCurrencyAmount(
    reference.amount,
    reference.currency,
    locale,
  );
  const description = reference.description ?? t.noDescription;

  return t.reconciliationMatch(description, amountLabel, dateLabel);
}

function getImportFieldLabel(
  field: string,
  t: ReturnType<
    typeof useSitePreferences
  >["site"]["pages"]["transactions"]["imports"],
) {
  const labels = t.detectedFieldLabels as Record<string, string>;
  return labels[field] ?? field;
}

function getImportStatusReasonLabel(
  reason: string | null | undefined,
  t: ReturnType<
    typeof useSitePreferences
  >["site"]["pages"]["transactions"]["imports"],
) {
  if (!reason) {
    return null;
  }

  const categoryNotFoundMatch = reason.match(/^Category "(.+)" was not found$/);
  if (categoryNotFoundMatch) {
    return t.reasonCategoryNotFound(categoryNotFoundMatch[1]);
  }

  const localizedReasons: Record<string, string> = {
    "Ignored by user": t.reasonIgnoredByUser,
    "Row is missing required values": t.reasonMissingRequiredValues,
    "Category is required before importing": t.reasonCategoryRequired,
    "Matches an existing ledger transaction":
      t.reasonMatchesExistingTransaction,
    "Imported into ledger": t.reasonImportedIntoLedger,
    "Currency does not match the selected account": t.reasonCurrencyMismatch,
    "Category direction conflicts with the imported row":
      t.reasonCategoryConflict,
    "Date could not be parsed": t.reasonDateInvalid,
    "Amount must be greater than zero": t.reasonAmountInvalid,
    "Currency is required": t.reasonCurrencyRequired,
    "Duplicates another row in this import": t.reasonDuplicateWithinImport,
  };

  return localizedReasons[reason] ?? reason;
}
