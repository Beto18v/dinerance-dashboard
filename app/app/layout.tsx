"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, signOut } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!session) return null;

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center gap-4">
        <nav className="flex items-center gap-4 flex-1">
          <Link
            href="/app/transactions"
            className="text-sm font-medium hover:underline"
          >
            Transactions
          </Link>
          <Link
            href="/app/categories"
            className="text-sm font-medium hover:underline"
          >
            Categories
          </Link>
          <Link
            href="/app/profile"
            className="text-sm font-medium hover:underline"
          >
            Profile
          </Link>
        </nav>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </header>
      <Separator />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
