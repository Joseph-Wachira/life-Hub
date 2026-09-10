"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { registerAction, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating your account…" : "Create account"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(registerAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" placeholder="Jordan Rivera" required autoFocus />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="At least 8 characters" required />
        <p className="text-xs text-[var(--subtle-foreground)]">
          Use 8+ characters with a mix of upper/lowercase letters and a number.
        </p>
      </div>

      {state && "error" in state && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
