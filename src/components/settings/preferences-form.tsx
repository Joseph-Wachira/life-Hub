"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updatePreferencesAction } from "@/lib/actions/settings";
import type { ActionResult } from "@/lib/actions/auth";
import type { UserSettings } from "@prisma/client";

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Lagos",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save preferences"}
    </Button>
  );
}

export function PreferencesForm({ settings }: { settings: UserSettings }) {
  const { setTheme } = useTheme();
  const [state, formAction] = useActionState<ActionResult | null, FormData>(updatePreferencesAction, null);
  const [theme, setThemeValue] = useState(settings.theme);
  const [weekStartsOn, setWeekStartsOn] = useState(String(settings.weekStartsOn));

  useEffect(() => {
    if (state && "success" in state) toast.success("Preferences saved");
    if (state && "error" in state) toast.error(state.error);
  }, [state]);

  function handleThemeChange(value: string) {
    setThemeValue(value);
    setTheme(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Personalize how Life Hub looks and behaves.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="theme" value={theme} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Week starts on</Label>
              <Select value={weekStartsOn} onValueChange={setWeekStartsOn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="weekStartsOn" value={weekStartsOn} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                list="timezone-options"
                defaultValue={settings.timezone}
                required
              />
              <datalist id="timezone-options">
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currency">Currency code</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={settings.currency}
                maxLength={3}
                className="uppercase"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-5">
            <div>
              <p className="text-sm font-medium">Focus timer</p>
              <p className="text-xs text-[var(--muted-foreground)]">Used by the Pomodoro timer in Focus mode.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pomodoroWorkMinutes">Work (min)</Label>
                <Input
                  id="pomodoroWorkMinutes"
                  name="pomodoroWorkMinutes"
                  type="number"
                  min={1}
                  max={180}
                  defaultValue={settings.pomodoroWorkMinutes}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pomodoroShortBreakMinutes">Short break (min)</Label>
                <Input
                  id="pomodoroShortBreakMinutes"
                  name="pomodoroShortBreakMinutes"
                  type="number"
                  min={1}
                  max={60}
                  defaultValue={settings.pomodoroShortBreakMinutes}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pomodoroLongBreakMinutes">Long break (min)</Label>
                <Input
                  id="pomodoroLongBreakMinutes"
                  name="pomodoroLongBreakMinutes"
                  type="number"
                  min={1}
                  max={120}
                  defaultValue={settings.pomodoroLongBreakMinutes}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sessionsBeforeLongBreak">Sessions / long break</Label>
                <Input
                  id="sessionsBeforeLongBreak"
                  name="sessionsBeforeLongBreak"
                  type="number"
                  min={1}
                  max={12}
                  defaultValue={settings.sessionsBeforeLongBreak}
                  required
                />
              </div>
            </div>
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
