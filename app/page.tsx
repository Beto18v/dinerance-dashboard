"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { useSession } from "@/components/providers/auth-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { Button } from "@/components/ui/button";

const MoneyRainBackground = dynamic(
  () =>
    import("@/components/backgrounds/money-rain").then(
      (mod) => mod.MoneyRainBackground,
    ),
  { ssr: false },
);

export default function Home() {
  const { session } = useSession();
  const { site } = useSitePreferences();
  const main = site.pages.main;

  const headerHref = session ? "/app/balance" : "/auth/login";
  const headerLabel = session ? main.header.dashboard : main.header.signIn;
  const ctaHref = session ? "/app/balance" : "/auth/register";
  const ctaLabel = session ? main.hero.ctaAuthenticated : main.hero.ctaGuest;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05010d] text-slate-50">
      <MoneyRainBackground
        billAmounts={main.background.billAmounts}
        billCode={main.background.billCode}
        currencySymbol={main.background.currencySymbol}
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.05),rgba(2,6,23,0.74)_72%,rgba(2,6,23,0.94))]" />

      <section className="relative mx-auto flex min-h-[90vh] w-full max-w-6xl flex-col px-5 py-4 sm:px-8 sm:py-5 lg:py-6">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-4 py-3 shadow-[0_20px_64px_rgba(1,8,20,0.28)] backdrop-blur-md">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo_Dinerance-removebg.png"
              alt={main.header.logoAlt}
              width={36}
              height={36}
              className="h-9 w-auto"
              sizes="36px"
            />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold tracking-wide text-white/95">
                {main.header.brand}
              </p>
              <p className="truncate text-xs text-slate-400">
                {main.header.subtitle}
              </p>
            </div>
          </Link>

          <Button
            asChild
            size="sm"
            className="rounded-full bg-[#4da9ff] px-4 font-semibold text-slate-950 shadow-[0_12px_30px_rgba(77,169,255,0.28)] hover:bg-[#78bfff]"
          >
            <Link href={headerHref}>{headerLabel}</Link>
          </Button>
        </header>

        <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center pt-12 pb-16 sm:pt-16 sm:pb-20 text-center">
          {" "}
          <div className="relative mb-2">
            <div className="absolute inset-0 scale-125 rounded-full bg-[radial-gradient(circle,rgba(126,255,163,0.22),rgba(82,170,255,0.08),transparent_72%)] blur-3xl" />
            <Image
              src="/logo_Dinerance-removebg.png"
              alt={main.hero.logoAlt}
              width={220}
              height={220}
              className="relative h-30 w-auto sm:h-30 lg:h-36"
              priority
              sizes="(max-width: 640px) 80px, (max-width: 1024px) 112px, 144px"
            />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-50/85 shadow-[0_16px_50px_rgba(17,24,39,0.2)] sm:px-4 sm:py-2 sm:text-xs">
            <Sparkles className="size-3.5 text-[#7effa3]" />
            {main.hero.badge}
          </span>
          <h1 className="mt-3 max-w-3xl text-balance text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:mt-4 sm:text-5xl lg:text-6xl">
            {main.hero.title}
            <span className="mt-1.5 block bg-linear-to-r from-[#87ffab] via-[#52ddd2] to-[#52aaff] bg-clip-text text-transparent">
              {main.hero.accent}
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-6 text-slate-300 sm:mt-4 sm:text-lg">
            {main.hero.description}
          </p>
          <div className="mt-4 flex justify-center sm:mt-6">
            <Button
              asChild
              size="lg"
              className="h-11 rounded-full bg-[#4da9ff] px-6 text-sm font-semibold text-slate-950 shadow-[0_20px_50px_rgba(77,169,255,0.35)] hover:bg-[#78bfff] hover:scale-105 transition-all duration-300 sm:h-12 sm:px-7"
            >
              <Link href={ctaHref}>
                {ctaLabel}
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex max-w-md items-start gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-left shadow-[0_20px_64px_rgba(2,12,27,0.18)] backdrop-blur-md sm:mt-8">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#7effa3]" />
            <p className="text-[12px] sm:text-[15px] leading-5 text-slate-300">
              {main.hero.supporting}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
