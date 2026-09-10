"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/lib/actions/settings";
import type { ActionResult } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating…" : "Update password"}
    </Button>
  );
}

export function AccountPanel() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(changePasswordAction, null);
  const succeeded = !!(state && "success" in state);

  useEffect(() => {
    if (state && "success" in state) toast.success("Password updated");
    if (state && "error" in state) toast.error(state.error);
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Update the password you use to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4" key={succeeded ? "reset" : "form"}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-[var(--subtle-foreground)]">
                Use 8+ characters with a mix of upper/lowercase letters and a number.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
              />
            </div>
            {state && "error" in state && (
              <p role="alert" className="text-sm text-[var(--danger)]">
                {state.error}
              </p>
            )}
            <div>
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>Sign out of Life Hub on this device.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button type="button" variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
