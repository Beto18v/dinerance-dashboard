"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { api, ApiError } from "@/lib/api";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { useSession } from "@/components/providers/auth-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
import { getSiteText } from "@/lib/site";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

const MoneyRainBackground = dynamic(
  () =>
    import("@/components/backgrounds/money-rain").then(
      (mod) => mod.MoneyRainBackground,
    ),
  { ssr: false },
);

const schemaText = getSiteText().auth.login;

const schema = z.object({
  email: z.string().email(schemaText.validations.invalidEmail),
  password: z.string().min(1, schemaText.validations.passwordRequired),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const { site } = useSitePreferences();
  const t = site.auth.login;
  const background = site.pages.main.background;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!loading && session) {
      router.replace("/app/balance");
    }
  }, [session, loading, router]);

  async function onSubmit(values: FormValues) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    try {
      await api.getProfile();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        await supabase.auth.signOut();
        toast.error(t.notRegistered);
        router.replace("/auth/register");
        return;
      }

      await supabase.auth.signOut();
      toast.error(
        err instanceof ApiError ? err.message : site.common.unexpectedError,
      );
      return;
    }

    toast.success(t.successToast);
    router.replace("/app/balance");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <MoneyRainBackground
        billAmounts={background.billAmounts}
        billCode={background.billCode}
        currencySymbol={background.currencySymbol}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <Link href="/" className="mx-auto block w-fit">
              <Image
                src="/logo_Dinerance-removebg.png"
                alt="Dinerance Logo"
                width={100}
                height={100}
                className="mx-auto"
              />
            </Link>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <GoogleAuthButton
                label={t.google}
                loadingLabel={t.googleSubmitting}
                disabled={isSubmitting}
              />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {t.orContinueWithEmail}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">{t.email}</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t.submitting : t.submit}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t.noAccount}{" "}
                <Link href="/auth/register" className="underline">
                  {t.register}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
