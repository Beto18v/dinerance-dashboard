"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { useSession } from "@/components/providers/auth-provider";
import { useSitePreferences } from "@/components/providers/site-preferences-provider";
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

export function DangerZoneCard() {
  const router = useRouter();
  const { signOut } = useSession();
  const { site } = useSitePreferences();
  const t = site.pages.profile;

  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  async function handleDeactivateAccount() {
    setDeactivating(true);
    try {
      await api.deactivateAccount();
      await signOut();
      toast.success(t.deactivated);
      router.replace("/auth/login");
    } catch (err) {
      setDeactivating(false);
      setConfirmDeactivate(false);
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(t.failedDeactivateAccount);
    }
  }

  return (
    <>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            {t.dangerTitle}
          </CardTitle>
          <CardDescription>{t.dangerDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setConfirmDeactivate(true)}
          >
            {t.deactivateAccount}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmDeactivateTitle}</DialogTitle>
            <DialogDescription>
              {t.confirmDeactivateDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeactivate(false)}
              disabled={deactivating}
            >
              {site.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateAccount}
              disabled={deactivating}
            >
              {deactivating ? t.deactivating : t.confirmDeactivateButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
