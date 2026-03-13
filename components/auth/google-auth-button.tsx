"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

import { signInWithGoogle } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface GoogleAuthButtonProps {
  label: string;
  loadingLabel: string;
  disabled?: boolean;
}

export function GoogleAuthButton({
  label,
  loadingLabel,
  disabled = false,
}: GoogleAuthButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const { error } = await signInWithGoogle();

    if (error) {
      setPending(false);
      toast.error(error.message);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="h-12 w-full gap-3 rounded-lg px-4 text-sm font-medium"
      onClick={handleClick}
      disabled={disabled || pending}
    >
      <FcGoogle className="h-5 w-5" />
      {pending ? loadingLabel : label}
    </Button>
  );
}
