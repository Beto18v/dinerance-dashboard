"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  FiArchive,
  FiCheckCircle,
  FiEdit2,
  FiPauseCircle,
  FiPlus,
  FiRotateCcw,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";

import { useProfile } from "@/components/providers/profile-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfoHint } from "@/components/ui/info-hint";
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
  api,
  ApiError,
  type Category,
  type FinancialAccount,
  type Obligation,
  type ObligationStatus,
  type ObligationsResponse,
} from "@/lib/api";
import { cacheKeys, invalidateCacheKeys, setCache } from "@/lib/cache";
import {
  getFinancialAccountDisplayName,
  resolveDefaultFinancialAccountId,
} from "@/lib/financial-accounts";
import { formatCurrencyAmount } from "@/lib/finance";
import {
  dateTimeLocalToUtcIso,
  formatDateTimeLocalInTimeZone,
  getTodayDateInputValue,
  resolveTimeZone,
} from "@/lib/timezone";
import {
  EMPTY_OBLIGATION_FORM,
  ObligationFormModal,
  type ObligationFormState,
} from "./components/obligation-form-modal";

type ObligationPaymentFormState = {
  financial_account_id: string;
  paid_at: string;
  description: string;
};

const EMPTY_PAYMENT_FORM: ObligationPaymentFormState = {
  financial_account_id: "",
  paid_at: "",
  description: "",
};

const statusTone = {
  active:
    "border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
  paused:
    "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
  archived:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-100",
} as const;

const urgencyTone = {
  overdue:
    "border-rose-200 bg-rose-50/80 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100",
  today:
    "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
  soon: "border-sky-200 bg-sky-50/80 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100",
  upcoming:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-100",
} as const;

const actionToneClassNames = {
  archive:
    "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-100 dark:hover:bg-slate-500/20",
  delete:
    "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100 dark:hover:bg-rose-500/20",
  edit: "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100 dark:hover:bg-sky-500/20",
  markPaid:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20",
  pause:
    "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 dark:hover:bg-amber-500/20",
  reactivate:
    "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100 dark:hover:bg-cyan-500/20",
} as const;

export default function ObligationsPage() {
  const { profile } = useProfile();
  const { site } = useSitePreferences();
  const searchParams = useSearchParams();
  const timeZone = resolveTimeZone(profile?.timezone);
  const locale = site.metadata.htmlLang === "en" ? "en-US" : "es-CO";
  const t = site.pages.obligations;
  const [obligationsResponse, setObligationsResponse] =
    useState<ObligationsResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [financialAccounts, setFinancialAccounts] = useState<
    FinancialAccount[]
  >([]);
  const [form, setForm] = useState<ObligationFormState>(EMPTY_OBLIGATION_FORM);
  const [editingObligationId, setEditingObligationId] = useState<string | null>(
    null,
  );
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentObligationId, setPaymentObligationId] = useState<string | null>(
    null,
  );
  const [paymentForm, setPaymentForm] =
    useState<ObligationPaymentFormState>(EMPTY_PAYMENT_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Obligation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const appliedPrefillRef = useRef<string | null>(null);

  const expenseCategories = useMemo(
    () =>
      categories
        .filter((category) => category.direction === "expense")
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [categories, locale],
  );
  const obligations = obligationsResponse?.items ?? [];
  const counts = obligationsResponse?.counts ?? {
    active: 0,
    paused: 0,
    archived: 0,
  };
  const activeObligations = obligations.filter(
    (obligation) => obligation.status === "active",
  );
  const pausedObligations = obligations.filter(
    (obligation) => obligation.status === "paused",
  );
  const archivedObligations = obligations.filter(
    (obligation) => obligation.status === "archived",
  );
  const overdueCount = activeObligations.filter(
    (obligation) => obligation.urgency === "overdue",
  ).length;
  const urgentCount = activeObligations.filter((obligation) =>
    ["overdue", "today", "soon"].includes(obligation.urgency),
  ).length;
  const riskCount = activeObligations.filter(
    (obligation) =>
      obligation.expected_account_shortfall_amount != null &&
      Number(obligation.expected_account_shortfall_amount) > 0,
  ).length;
  const hasFinancialProfile = Boolean(
    profile?.base_currency && profile?.timezone,
  );
  const canSubmit = hasFinancialProfile && expenseCategories.length > 0;

  useEffect(() => {
    void loadObligationsPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const searchKey = searchParams.toString();
    if (!searchKey || appliedPrefillRef.current === searchKey) {
      return;
    }

    const prefillName = searchParams.get("prefill_name");
    const prefillAmount = searchParams.get("prefill_amount");
    const prefillCadence = searchParams.get("prefill_cadence");
    const prefillNextDueDate = searchParams.get("prefill_next_due_date");
    const prefillCategoryId = searchParams.get("prefill_category_id");
    const prefillRecurringCandidateKey = searchParams.get(
      "prefill_recurring_candidate_key",
    );

    if (
      !prefillName ||
      !prefillAmount ||
      !prefillCadence ||
      !prefillNextDueDate ||
      !prefillCategoryId
    ) {
      return;
    }

    appliedPrefillRef.current = searchKey;
    resetPaymentForm();
    setEditingObligationId(null);
    setPrefillApplied(true);
    setForm({
      name: prefillName,
      amount: prefillAmount,
      cadence: resolveCadence(prefillCadence),
      next_due_date: prefillNextDueDate,
      category_id: prefillCategoryId,
      expected_financial_account_id:
        searchParams.get("prefill_expected_financial_account_id") ?? "",
      source_recurring_candidate_key: prefillRecurringCandidateKey ?? "",
    });
    setFormModalOpen(true);
  }, [searchParams]);

  async function loadObligationsPage() {
    setLoading(true);
    try {
      const [nextObligations, nextCategories, nextFinancialAccounts] =
        await Promise.all([
          api.getObligations(),
          api.getCategories(),
          api.getFinancialAccounts(),
        ]);
      setObligationsResponse(nextObligations);
      setCategories(nextCategories);
      setFinancialAccounts(nextFinancialAccounts);
      setCache(cacheKeys.obligations, nextObligations);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedLoad);
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingObligationId(null);
    setForm({
      ...EMPTY_OBLIGATION_FORM,
      next_due_date: getTodayDateInputValue(timeZone),
    });
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setPrefillApplied(false);
    resetForm();
  }

  function openCreateModal() {
    resetPaymentForm();
    setPrefillApplied(false);
    resetForm();
    setFormModalOpen(true);
  }

  function openEditModal(obligation: Obligation) {
    resetPaymentForm();
    setPrefillApplied(false);
    setEditingObligationId(obligation.id);
    setForm({
      name: obligation.name,
      amount: obligation.amount,
      cadence: obligation.cadence,
      next_due_date: obligation.next_due_date,
      category_id: obligation.category_id,
      expected_financial_account_id:
        obligation.expected_financial_account_id ?? "",
      source_recurring_candidate_key:
        obligation.source_recurring_candidate_key ?? "",
    });
    setFormModalOpen(true);
  }

  function resetPaymentForm() {
    setPaymentObligationId(null);
    setPaymentForm(EMPTY_PAYMENT_FORM);
  }

  function openPaymentForm(obligation: Obligation) {
    setFormModalOpen(false);
    setPrefillApplied(false);
    resetForm();

    if (paymentObligationId === obligation.id) {
      resetPaymentForm();
      return;
    }

    setEditingObligationId(null);
    setPaymentObligationId(obligation.id);
    setPaymentForm({
      financial_account_id:
        obligation.expected_financial_account_id ||
        resolveDefaultFinancialAccountId(financialAccounts) ||
        "",
      paid_at: getCurrentDateTimeInputValue(timeZone),
      description: obligation.name,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    if (
      !form.name.trim() ||
      !form.amount.trim() ||
      !form.next_due_date ||
      !form.category_id
    ) {
      toast.error(t.validations.requiredFields);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        amount: normalizeAmountForApi(form.amount),
        cadence: form.cadence,
        next_due_date: form.next_due_date,
        category_id: form.category_id,
        expected_financial_account_id:
          form.expected_financial_account_id || null,
      };

      if (editingObligationId) {
        await api.updateObligation(editingObligationId, payload);
        toast.success(t.updated);
      } else {
        await api.createObligation({
          ...payload,
          source_recurring_candidate_key:
            form.source_recurring_candidate_key || null,
        });
        toast.success(t.created);
      }

      invalidateCacheKeys([
        cacheKeys.cashflowForecast,
        cacheKeys.obligations,
        cacheKeys.obligationAlerts,
        cacheKeys.upcomingObligations,
      ]);
      await loadObligationsPage();
      closeFormModal();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else if (editingObligationId) {
        toast.error(t.failedUpdate);
      } else {
        toast.error(t.failedCreate);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(
    obligationId: string,
    status: ObligationStatus,
  ) {
    setUpdatingStatusId(obligationId);
    try {
      await api.updateObligation(obligationId, { status });
      invalidateCacheKeys([
        cacheKeys.cashflowForecast,
        cacheKeys.obligations,
        cacheKeys.obligationAlerts,
        cacheKeys.upcomingObligations,
      ]);
      await loadObligationsPage();
      toast.success(
        status === "paused"
          ? t.paused
          : status === "archived"
            ? t.archived
            : t.reactivated,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedStatusUpdate);
      }
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function handleMarkPaid(obligation: Obligation) {
    if (!paymentForm.financial_account_id) {
      toast.error(t.validations.paymentAccountRequired);
      return;
    }

    if (!paymentForm.paid_at) {
      toast.error(t.validations.paymentDateRequired);
      return;
    }

    setPayingId(obligation.id);
    try {
      await api.markObligationPaid(obligation.id, {
        financial_account_id: paymentForm.financial_account_id,
        paid_at: dateTimeLocalToUtcIso(paymentForm.paid_at, timeZone),
        description: paymentForm.description.trim() || null,
      });
      invalidateCacheKeys([
        cacheKeys.cashflowForecast,
        cacheKeys.obligations,
        cacheKeys.obligationAlerts,
        cacheKeys.upcomingObligations,
        cacheKeys.transactions,
        cacheKeys.ledgerBalances,
        cacheKeys.ledgerActivity,
      ]);
      await loadObligationsPage();
      resetPaymentForm();
      toast.success(t.markedPaid);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedMarkPaid);
      }
    } finally {
      setPayingId(null);
    }
  }

  async function handleDeleteObligation() {
    if (!deleteTarget) {
      return;
    }

    setDeletingId(deleteTarget.id);
    try {
      await api.deleteObligation(deleteTarget.id);
      invalidateCacheKeys([
        cacheKeys.cashflowForecast,
        cacheKeys.obligations,
        cacheKeys.obligationAlerts,
        cacheKeys.upcomingObligations,
      ]);
      await loadObligationsPage();
      toast.success(t.deleted);
      if (editingObligationId === deleteTarget.id) {
        closeFormModal();
      }
      if (paymentObligationId === deleteTarget.id) {
        resetPaymentForm();
      }
      setDeleteTarget(null);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(t.failedDelete);
      }
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!hasFinancialProfile) {
      return;
    }
    setForm((current) =>
      current.next_due_date
        ? current
        : {
            ...current,
            next_due_date: getTodayDateInputValue(timeZone),
          },
    );
  }, [hasFinancialProfile, timeZone]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <InfoHint title={t.helpTitle} description={t.helpDescription} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3 lg:flex-1 lg:max-w-2xl">
            <SummaryMetric
              label={t.summaryActive}
              value={String(counts.active)}
            />
            <SummaryMetric
              label={t.summaryUrgent}
              value={String(urgentCount)}
            />
            <SummaryMetric
              label={t.summaryRisk}
              value={String(riskCount)}
              hintTitle={t.summaryRiskHelpTitle}
              hintDescription={t.summaryRiskHelpDescription}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 self-start px-3 lg:self-end"
            onClick={openCreateModal}
          >
            <FiPlus className="mr-1.5" size={15} />
            {t.openCreateModal}
          </Button>
        </div>
      </div>

      <ObligationFormModal
        canSubmit={canSubmit}
        expenseCategories={expenseCategories}
        financialAccounts={financialAccounts}
        form={form}
        hasFinancialProfile={hasFinancialProfile}
        mainFinancialAccountLabel={site.common.mainFinancialAccount}
        mode={editingObligationId ? "edit" : "create"}
        open={formModalOpen}
        prefillApplied={prefillApplied}
        site={site}
        submitting={submitting}
        onFormChange={(updates) =>
          setForm((current) => ({
            ...current,
            ...updates,
          }))
        }
        onOpenChange={(open) => {
          if (!open) {
            closeFormModal();
            return;
          }
          setFormModalOpen(true);
        }}
        onSubmit={handleSubmit}
      />

      <ObligationSection
        title={t.activeSectionTitle}
        description={t.activeSectionDescription}
        items={activeObligations}
        emptyLabel={t.emptyActive}
        locale={locale}
        timeZone={timeZone}
        site={site}
        financialAccounts={financialAccounts}
        updatingStatusId={updatingStatusId}
        payingId={payingId}
        deletingId={deletingId}
        paymentObligationId={paymentObligationId}
        paymentForm={paymentForm}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
        onOpenPaymentForm={openPaymentForm}
        onCancelPaymentForm={resetPaymentForm}
        onPaymentFormChange={(updates) =>
          setPaymentForm((current) => ({
            ...current,
            ...updates,
          }))
        }
        onMarkPaid={handleMarkPaid}
        onStatusChange={handleStatusChange}
      />

      <ObligationSection
        title={t.pausedSectionTitle}
        description={t.pausedSectionDescription}
        items={pausedObligations}
        emptyLabel={t.emptyPaused}
        locale={locale}
        timeZone={timeZone}
        site={site}
        financialAccounts={financialAccounts}
        updatingStatusId={updatingStatusId}
        payingId={payingId}
        deletingId={deletingId}
        paymentObligationId={paymentObligationId}
        paymentForm={paymentForm}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
        onOpenPaymentForm={openPaymentForm}
        onCancelPaymentForm={resetPaymentForm}
        onPaymentFormChange={(updates) =>
          setPaymentForm((current) => ({
            ...current,
            ...updates,
          }))
        }
        onMarkPaid={handleMarkPaid}
        onStatusChange={handleStatusChange}
      />

      <ObligationSection
        title={t.archivedSectionTitle}
        description={t.archivedSectionDescription}
        items={archivedObligations}
        emptyLabel={t.emptyArchived}
        locale={locale}
        timeZone={timeZone}
        site={site}
        financialAccounts={financialAccounts}
        updatingStatusId={updatingStatusId}
        payingId={payingId}
        deletingId={deletingId}
        paymentObligationId={paymentObligationId}
        paymentForm={paymentForm}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
        onOpenPaymentForm={openPaymentForm}
        onCancelPaymentForm={resetPaymentForm}
        onPaymentFormChange={(updates) =>
          setPaymentForm((current) => ({
            ...current,
            ...updates,
          }))
        }
        onMarkPaid={handleMarkPaid}
        onStatusChange={handleStatusChange}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">{site.common.loading}</p>
      ) : null}
      {counts.archived + counts.active + counts.paused === 0 && !loading ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            {t.emptyState}
          </CardContent>
        </Card>
      ) : null}
      {overdueCount > 0 ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          {t.overdueNotice(overdueCount)}
        </p>
      ) : null}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteTitle}</DialogTitle>
            <DialogDescription>
              {deleteTarget ? t.deleteDescription(deleteTarget.name) : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              {site.common.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingId === deleteTarget?.id}
              onClick={handleDeleteObligation}
            >
              {deletingId === deleteTarget?.id
                ? t.deleting
                : site.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ObligationSection({
  title,
  description,
  items,
  emptyLabel,
  locale,
  timeZone,
  site,
  financialAccounts,
  updatingStatusId,
  payingId,
  deletingId,
  paymentObligationId,
  paymentForm,
  onEdit,
  onDelete,
  onOpenPaymentForm,
  onCancelPaymentForm,
  onPaymentFormChange,
  onMarkPaid,
  onStatusChange,
}: {
  title: string;
  description: string;
  items: Obligation[];
  emptyLabel: string;
  locale: string;
  timeZone: string;
  site: ReturnType<typeof useSitePreferences>["site"];
  financialAccounts: FinancialAccount[];
  updatingStatusId: string | null;
  payingId: string | null;
  deletingId: string | null;
  paymentObligationId: string | null;
  paymentForm: ObligationPaymentFormState;
  onEdit: (obligation: Obligation) => void;
  onDelete: (obligation: Obligation) => void;
  onOpenPaymentForm: (obligation: Obligation) => void;
  onCancelPaymentForm: () => void;
  onPaymentFormChange: (updates: Partial<ObligationPaymentFormState>) => void;
  onMarkPaid: (obligation: Obligation) => void;
  onStatusChange: (obligationId: string, status: ObligationStatus) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {items.map((obligation) => (
              <ObligationCard
                key={obligation.id}
                obligation={obligation}
                locale={locale}
                timeZone={timeZone}
                site={site}
                financialAccounts={financialAccounts}
                updatingStatusId={updatingStatusId}
                payingId={payingId}
                deletingId={deletingId}
                paymentObligationId={paymentObligationId}
                paymentForm={paymentForm}
                onEdit={onEdit}
                onDelete={onDelete}
                onOpenPaymentForm={onOpenPaymentForm}
                onCancelPaymentForm={onCancelPaymentForm}
                onPaymentFormChange={onPaymentFormChange}
                onMarkPaid={onMarkPaid}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ObligationCard({
  obligation,
  locale,
  timeZone,
  site,
  financialAccounts,
  updatingStatusId,
  payingId,
  deletingId,
  paymentObligationId,
  paymentForm,
  onEdit,
  onDelete,
  onOpenPaymentForm,
  onCancelPaymentForm,
  onPaymentFormChange,
  onMarkPaid,
  onStatusChange,
}: {
  obligation: Obligation;
  locale: string;
  timeZone: string;
  site: ReturnType<typeof useSitePreferences>["site"];
  financialAccounts: FinancialAccount[];
  updatingStatusId: string | null;
  payingId: string | null;
  deletingId: string | null;
  paymentObligationId: string | null;
  paymentForm: ObligationPaymentFormState;
  onEdit: (obligation: Obligation) => void;
  onDelete: (obligation: Obligation) => void;
  onOpenPaymentForm: (obligation: Obligation) => void;
  onCancelPaymentForm: () => void;
  onPaymentFormChange: (updates: Partial<ObligationPaymentFormState>) => void;
  onMarkPaid: (obligation: Obligation) => void;
  onStatusChange: (obligationId: string, status: ObligationStatus) => void;
}) {
  const t = site.pages.obligations;
  const dueDateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone,
  });
  const isPaymentFormOpen = paymentObligationId === obligation.id;

  return (
    <div className="rounded-2xl border bg-muted/15 p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={statusTone[obligation.status]}>
              {resolveStatusLabel(obligation.status, t)}
            </Badge>
            <Badge
              variant="outline"
              className={urgencyTone[obligation.urgency]}
            >
              {resolveUrgencyLabel(obligation.urgency, t)}
            </Badge>
            <Badge variant="outline">{obligation.category_name}</Badge>
          </div>

          <div>
            <p className="font-semibold text-foreground">{obligation.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.nextDueLabel(
                dueDateFormatter.format(
                  new Date(`${obligation.next_due_date}T12:00:00Z`),
                ),
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.cadenceLabel(resolveCadenceLabel(obligation.cadence, t))}
            </p>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              {t.expectedAccountLabel(
                obligation.expected_financial_account_name ??
                  t.noExpectedAccount,
              )}
            </p>
            {obligation.expected_account_shortfall_amount ? (
              <p className="text-amber-900 dark:text-amber-100">
                {t.accountRiskLabel(
                  formatCurrencyAmount(
                    obligation.expected_account_shortfall_amount,
                    obligation.currency,
                    locale,
                  ),
                )}
              </p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-left md:text-right">
          <p className="text-lg font-bold tabular-nums text-foreground">
            {formatCurrencyAmount(
              obligation.amount,
              obligation.currency,
              locale,
            )}
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {obligation.currency}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton
          className={actionToneClassNames.edit}
          icon={<FiEdit2 size={14} />}
          label={site.common.edit}
          onClick={() => onEdit(obligation)}
        />

        {obligation.status === "active" ? (
          <>
            <ActionButton
              className={actionToneClassNames.markPaid}
              disabled={payingId === obligation.id}
              icon={<FiCheckCircle size={14} />}
              label={t.markPaid}
              onClick={() => onOpenPaymentForm(obligation)}
            />
            <ActionButton
              className={actionToneClassNames.pause}
              disabled={updatingStatusId === obligation.id}
              icon={<FiPauseCircle size={14} />}
              label={t.pause}
              onClick={() => onStatusChange(obligation.id, "paused")}
            />
            <ActionButton
              className={actionToneClassNames.archive}
              disabled={updatingStatusId === obligation.id}
              icon={<FiArchive size={14} />}
              label={t.archive}
              onClick={() => onStatusChange(obligation.id, "archived")}
            />
          </>
        ) : null}

        {obligation.status === "paused" ? (
          <>
            <ActionButton
              className={actionToneClassNames.reactivate}
              disabled={updatingStatusId === obligation.id}
              icon={<FiRotateCcw size={14} />}
              label={t.reactivate}
              onClick={() => onStatusChange(obligation.id, "active")}
            />
            <ActionButton
              className={actionToneClassNames.archive}
              disabled={updatingStatusId === obligation.id}
              icon={<FiArchive size={14} />}
              label={t.archive}
              onClick={() => onStatusChange(obligation.id, "archived")}
            />
          </>
        ) : null}

        {obligation.status === "archived" ? (
          <ActionButton
            className={actionToneClassNames.reactivate}
            disabled={updatingStatusId === obligation.id}
            icon={<FiRotateCcw size={14} />}
            label={t.reactivate}
            onClick={() => onStatusChange(obligation.id, "active")}
          />
        ) : null}

        <ActionButton
          className={actionToneClassNames.delete}
          disabled={deletingId === obligation.id}
          icon={<FiTrash2 size={14} />}
          label={site.common.delete}
          onClick={() => onDelete(obligation)}
        />
      </div>

      {obligation.status === "active" && isPaymentFormOpen ? (
        <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`payment_account_${obligation.id}`}>
                {t.paymentAccount}
              </Label>
              <Select
                value={paymentForm.financial_account_id || "__placeholder__"}
                onValueChange={(value) =>
                  onPaymentFormChange({
                    financial_account_id:
                      value === "__placeholder__" ? "" : value,
                  })
                }
              >
                <SelectTrigger id={`payment_account_${obligation.id}`}>
                  <SelectValue placeholder={t.paymentAccountPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__placeholder__">
                    {t.paymentAccountPlaceholder}
                  </SelectItem>
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
              <Label htmlFor={`payment_paid_at_${obligation.id}`}>
                {t.paymentDateTime}
              </Label>
              <Input
                id={`payment_paid_at_${obligation.id}`}
                type="datetime-local"
                value={paymentForm.paid_at}
                onChange={(event) =>
                  onPaymentFormChange({
                    paid_at: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor={`payment_description_${obligation.id}`}>
                {t.paymentDescription}
              </Label>
              <Input
                id={`payment_description_${obligation.id}`}
                value={paymentForm.description}
                onChange={(event) =>
                  onPaymentFormChange({
                    description: event.target.value,
                  })
                }
                placeholder={t.paymentDescriptionPlaceholder}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={payingId === obligation.id}
              onClick={() => onMarkPaid(obligation)}
            >
              {payingId === obligation.id ? t.markingPaid : t.confirmMarkPaid}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={payingId === obligation.id}
              onClick={onCancelPaymentForm}
            >
              {site.common.cancel}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ActionButton({
  className,
  disabled,
  icon,
  label,
  onClick,
}: {
  className: string;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="mr-1.5">{icon}</span>
      {label}
    </Button>
  );
}

function SummaryMetric({
  label,
  value,
  hintTitle,
  hintDescription,
}: {
  label: string;
  value: string;
  hintTitle?: string;
  hintDescription?: string;
}) {
  return (
    <div className="rounded-2xl border bg-muted/10 px-4 py-3">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        {hintTitle && hintDescription ? (
          <InfoHint
            title={hintTitle}
            description={hintDescription}
            buttonClassName="text-muted-foreground/80 transition-colors hover:text-foreground"
            panelClassName="top-full border bg-popover text-popover-foreground"
            align="right"
          />
        ) : null}
      </div>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function normalizeAmountForApi(value: string) {
  return value.replace(",", ".");
}

function getCurrentDateTimeInputValue(timeZone: string) {
  return formatDateTimeLocalInTimeZone(new Date().toISOString(), timeZone);
}

function resolveCadence(value: string): Obligation["cadence"] {
  if (value === "weekly" || value === "biweekly" || value === "monthly") {
    return value;
  }
  return "monthly";
}

function resolveStatusLabel(
  status: ObligationStatus,
  text: ReturnType<typeof useSitePreferences>["site"]["pages"]["obligations"],
) {
  if (status === "active") return text.statusActive;
  if (status === "paused") return text.statusPaused;
  return text.statusArchived;
}

function resolveUrgencyLabel(
  urgency: Obligation["urgency"],
  text: ReturnType<typeof useSitePreferences>["site"]["pages"]["obligations"],
) {
  if (urgency === "overdue") return text.urgencyOverdue;
  if (urgency === "today") return text.urgencyToday;
  if (urgency === "soon") return text.urgencySoon;
  return text.urgencyUpcoming;
}

function resolveCadenceLabel(
  cadence: Obligation["cadence"],
  text: ReturnType<typeof useSitePreferences>["site"]["pages"]["obligations"],
) {
  if (cadence === "monthly") return text.cadenceMonthly;
  if (cadence === "biweekly") return text.cadenceBiweekly;
  return text.cadenceWeekly;
}
