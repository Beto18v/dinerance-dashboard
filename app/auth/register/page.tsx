"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { ApiError } from "@/lib/api";
import {
  getPostAuthAppPath,
  getPreferredSessionName,
  resolveAuthenticatedProfile,
} from "@/lib/profile";
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

const schemaText = getSiteText().auth.register;

const schema = z
  .object({
    name: z.string().min(1, schemaText.validations.nameRequired),
    email: z.string().email(schemaText.validations.invalidEmail),
    password: z.string().min(8, schemaText.validations.passwordMin),
    confirmPassword: z.string().min(1, schemaText.validations.confirmRequired),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: schemaText.validations.passwordsDontMatch,
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const { site } = useSitePreferences();
  const t = site.auth.register;
  const background = site.pages.main.background;
  const handledSessionUserIdRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!session) {
      handledSessionUserIdRef.current = null;
    }

    if (!loading && session) {
      if (handledSessionUserIdRef.current === session.user.id) {
        return;
      }

      handledSessionUserIdRef.current = session.user.id;
      resolveAuthenticatedProfile({
        preferredName: getPreferredSessionName(session),
        sessionUserId: session.user.id,
      })
        .then((profile) => router.replace(getPostAuthAppPath(profile)))
        .catch(async (err) => {
          if (err instanceof ApiError) toast.error(err.message);
          else toast.error(site.common.unexpectedError);
          handledSessionUserIdRef.current = null;
          await createClient().auth.signOut();
        });
    }
  }, [loading, router, session, site.common.unexpectedError]);

  async function onSubmit(values: FormValues) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.name },
      },
    });

    if (error) {
      const alreadyRegistered =
        /already registered|already exists|user exists/i.test(error.message);

      if (!alreadyRegistered) {
        toast.error(error.message);
        return;
      }

      const signIn = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signIn.error) {
        toast.error(signIn.error.message);
        return;
      }

      try {
        const profile = await resolveAuthenticatedProfile({
          preferredName: values.name,
          sessionUserId: signIn.data.session?.user.id,
        });
        toast.success(t.profileCreatedToast);
        router.replace(getPostAuthAppPath(profile));
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : site.common.unexpectedError,
        );
        await supabase.auth.signOut();
      }
      return;
    }

    // If session is already available, bootstrap and continue directly.
    if (data.session) {
      try {
        const profile = await resolveAuthenticatedProfile({
          preferredName: values.name,
          sessionUserId: data.session.user.id,
        });
        toast.success(t.profileCreatedToast);
        router.replace(getPostAuthAppPath(profile));
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : site.common.unexpectedError,
        );
        await supabase.auth.signOut();
      }
      return;
    }

    // Fallback: try immediate login to avoid email-confirm required UX.
    const signIn = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (!signIn.error) {
      try {
        const profile = await resolveAuthenticatedProfile({
          preferredName: values.name,
          sessionUserId: signIn.data.session?.user.id,
        });
        toast.success(t.profileCreatedToast);
        router.replace(getPostAuthAppPath(profile));
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : site.common.unexpectedError,
        );
        await supabase.auth.signOut();
      }
      return;
    }

    toast.error(signIn.error.message);
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
                <Label htmlFor="name">{t.name}</Label>
                <Input id="name" type="text" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
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
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t.submitting : t.submit}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t.hasAccount}{" "}
                <Link href="/auth/login" className="underline">
                  {t.signIn}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
