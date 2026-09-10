"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/lib/actions/settings";
import type { ActionResult } from "@/lib/actions/auth";
import { initials } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function ProfileForm({
  profile,
}: {
  profile: { name: string | null; email: string; image: string | null };
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(updateProfileAction, null);
  const [imagePreview, setImagePreview] = useState(profile.image ?? "");

  useEffect(() => {
    if (state && "success" in state) toast.success("Profile updated");
    if (state && "error" in state) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>This is how you appear across Life Hub.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {imagePreview && <AvatarImage src={imagePreview} alt={profile.name ?? ""} />}
              <AvatarFallback className="text-lg">{initials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="image">Avatar image URL</Label>
              <Input
                id="image"
                name="image"
                placeholder="https://…"
                defaultValue={profile.image ?? ""}
                onChange={(e) => setImagePreview(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" name="name" defaultValue={profile.name ?? ""} required autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled readOnly />
            <p className="text-xs text-[var(--subtle-foreground)]">Your email can&apos;t be changed here.</p>
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
  );
}
