"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPrefsAction } from "@/lib/actions/settings";
import type { ActionResult } from "@/lib/actions/auth";
import type { NotificationPreference } from "@prisma/client";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save notification settings"}
    </Button>
  );
}

const TOGGLES: {
  key: "eventReminders" | "taskReminders" | "billReminders" | "habitReminders" | "goalUpdates";
  label: string;
  description: string;
}[] = [
  { key: "eventReminders", label: "Event reminders", description: "Get notified before calendar events start." },
  { key: "taskReminders", label: "Task reminders", description: "Get notified when tasks are coming due." },
  { key: "billReminders", label: "Bill reminders", description: "Get notified before recurring bills are due." },
  { key: "habitReminders", label: "Habit reminders", description: "Get a nudge to keep your habit streaks going." },
  { key: "goalUpdates", label: "Goal updates", description: "Get notified about milestones on your goals." },
];

export function NotificationsForm({ preference }: { preference: NotificationPreference }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    updateNotificationPrefsAction,
    null
  );

  useEffect(() => {
    if (state && "success" in state) toast.success("Notification settings saved");
    if (state && "error" in state) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what Life Hub should remind you about.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {TOGGLES.map((t) => (
              <div key={t.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{t.description}</p>
                </div>
                <Switch name={t.key} value="on" defaultChecked={preference[t.key]} />
              </div>
            ))}
          </div>

          <Separator />

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="defaultReminderMinutes">Default reminder (min before)</Label>
              <Input
                id="defaultReminderMinutes"
                name="defaultReminderMinutes"
                type="number"
                min={0}
                max={1440}
                defaultValue={preference.defaultReminderMinutes}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quietHoursStart">Quiet hours start</Label>
              <Input
                id="quietHoursStart"
                name="quietHoursStart"
                type="time"
                defaultValue={preference.quietHoursStart ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quietHoursEnd">Quiet hours end</Label>
              <Input
                id="quietHoursEnd"
                name="quietHoursEnd"
                type="time"
                defaultValue={preference.quietHoursEnd ?? ""}
              />
            </div>
          </div>
          <p className="-mt-3 text-xs text-[var(--subtle-foreground)]">
            Leave quiet hours blank if you don&apos;t want any notifications silenced.
          </p>

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
