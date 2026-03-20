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

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api.deleteAccount();
      await signOut();
      toast.success(t.deleted);
      router.replace("/auth/register");
    } catch (err) {
      setDeleting(false);
      setConfirmDelete(false);
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error(t.failedDeleteAccount);
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
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            {t.deleteAccount}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmDeleteTitle}</DialogTitle>
            <DialogDescription>{t.confirmDeleteDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              {site.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? t.deleting : t.confirmDeleteButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
