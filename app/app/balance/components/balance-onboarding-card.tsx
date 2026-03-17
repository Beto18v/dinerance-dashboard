"use client";

import { FiCheckCircle } from "react-icons/fi";

import type { Category } from "@/lib/api";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateCategoryModal } from "../../categories/components/create-category-modal";
import { CreateTransactionModal } from "../../transactions/components/create-transaction-modal";

interface BalanceOnboardingCardProps {
  categories: Category[];
  onCategoryCreated: () => void;
  onTransactionCreated: () => void;
}

export function BalanceOnboardingCard({
  categories,
  onCategoryCreated,
  onTransactionCreated,
}: BalanceOnboardingCardProps) {
  const { site } = useSitePreferences();
  const t = site.pages.balance;
  const hasCategories = categories.length > 0;

  return (
    <Card className="border-primary/15 bg-linear-to-br from-background via-primary/5 to-emerald-50/60 shadow-sm">
      <CardHeader className="gap-2">
        <CardTitle>{t.onboardingTitle}</CardTitle>
        <CardDescription>{t.onboardingDescription}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <OnboardingStep
            index={1}
            title={t.onboardingCategoryStepTitle}
            description={t.onboardingCategoryStepDescription}
            completed={hasCategories}
            statusLabel={
              hasCategories ? t.onboardingCompleted : t.onboardingPending
            }
          />

          <OnboardingStep
            index={2}
            title={t.onboardingTransactionStepTitle}
            description={t.onboardingTransactionStepDescription}
            completed={false}
            statusLabel={t.onboardingPending}
            muted={!hasCategories}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-xl border bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {hasCategories
                ? t.onboardingTransactionPromptTitle
                : t.onboardingCategoryPromptTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {hasCategories
                ? t.onboardingTransactionPromptDescription
                : t.onboardingCategoryPromptDescription}
            </p>
          </div>

          {hasCategories ? (
            <CreateTransactionModal
              categories={categories}
              onCreated={onTransactionCreated}
            />
          ) : (
            <CreateCategoryModal
              categories={categories}
              onCreated={onCategoryCreated}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OnboardingStep({
  index,
  title,
  description,
  completed,
  statusLabel,
  muted = false,
}: {
  index: number;
  title: string;
  description: string;
  completed: boolean;
  statusLabel: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition-colors ${
        muted
          ? "border-border/70 bg-background/60 text-muted-foreground"
          : "border-border bg-background"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
            completed
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-primary/20 bg-primary/10 text-primary"
          }`}
        >
          {completed ? <FiCheckCircle size={18} /> : index}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{title}</p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                completed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
