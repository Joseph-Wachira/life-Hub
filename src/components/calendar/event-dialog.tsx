"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEventAction, deleteEventAction, updateEventAction } from "@/lib/actions/events";
import type { ActionResult } from "@/lib/actions/auth";
import {
  DEFAULT_EVENT_COLOR,
  EVENT_COLORS,
  RECURRENCE_FREQ_LABELS,
  RECURRENCE_FREQ_OPTIONS,
  REMINDER_OPTIONS,
  WEEKDAY_LABELS,
  type RecurrenceFreqOption,
} from "@/lib/validations/events";
import { cn } from "@/lib/utils";
import type { SerializedEventInstance } from "./types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function toDateInput(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd");
}
function toTimeInputValue(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export function EventDialog({
  open,
  onOpenChange,
  instance,
  defaultStart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set when editing an existing occurrence. */
  instance?: SerializedEventInstance | null;
  /** Set when creating a new event at a specific date/time. */
  defaultStart?: Date | null;
}) {
  const isEdit = Boolean(instance);
  const action = isEdit ? updateEventAction : createEventAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);

  const [allDay, setAllDay] = useState(instance?.allDay ?? false);
  const [color, setColor] = useState(instance?.color ?? DEFAULT_EVENT_COLOR);
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFreqOption>(() => {
    if (!instance?.recurrenceRuleJson) return "NONE";
    try {
      const rule = JSON.parse(instance.recurrenceRuleJson);
      return (RECURRENCE_FREQ_OPTIONS as readonly string[]).includes(rule.freq) ? rule.freq : "NONE";
    } catch {
      return "NONE";
    }
  });
  const [byWeekday, setByWeekday] = useState<number[]>(() => {
    if (!instance?.recurrenceRuleJson) return [];
    try {
      return JSON.parse(instance.recurrenceRuleJson).byWeekday ?? [];
    } catch {
      return [];
    }
  });
  const [reminder, setReminder] = useState(
    instance?.reminderMinutesBefore != null ? String(instance.reminderMinutesBefore) : "none"
  );

  useEffect(() => {
    if (state && "success" in state) onOpenChange(false);
  }, [state, onOpenChange]);

  function toggleWeekday(day: number) {
    setByWeekday((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  function handleDelete() {
    if (!instance) return;
    if (!confirm(`Delete "${instance.title}"? ${instance.isRecurring ? "This removes the entire series." : ""}`)) return;
    deleteEventAction(instance.eventId).then((r) => {
      if (r && "error" in r) toast.error(r.error);
      else onOpenChange(false);
    });
  }

  const start = instance ? new Date(instance.eventStartAt) : defaultStart ?? new Date();
  const end = instance
    ? new Date(instance.eventEndAt)
    : new Date((defaultStart ?? new Date()).getTime() + 60 * 60 * 1000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>
            {isEdit && instance?.isRecurring ? "Changes apply to the whole series." : "Add it to your calendar."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={instance!.eventId} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input id="event-title" name="title" defaultValue={instance?.title ?? ""} required autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea id="event-description" name="description" defaultValue={instance?.description ?? ""} rows={2} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-location">Location</Label>
            <Input id="event-location" name="location" defaultValue={instance?.location ?? ""} placeholder="Optional" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={allDay} onCheckedChange={setAllDay} />
            All day
            <input type="hidden" name="allDay" value={allDay ? "on" : ""} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-start">Start</Label>
              <Input
                id="event-start"
                name="startAt"
                type={allDay ? "date" : "datetime-local"}
                defaultValue={allDay ? toDateInput(start.toISOString()) : toTimeInputValue(start.toISOString())}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-end">End</Label>
              <Input
                id="event-end"
                name="endAt"
                type={allDay ? "date" : "datetime-local"}
                defaultValue={allDay ? toDateInput(end.toISOString()) : toTimeInputValue(end.toISOString())}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn("size-7 rounded-full ring-offset-2 ring-offset-[var(--surface)] transition-shadow", color === c && "ring-2 ring-[var(--ring)]")}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <input type="hidden" name="color" value={color} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Repeats</Label>
            <Select value={recurrenceFreq} onValueChange={(v) => setRecurrenceFreq(v as RecurrenceFreqOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_FREQ_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {RECURRENCE_FREQ_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="recurrenceFreq" value={recurrenceFreq} />
          </div>

          {recurrenceFreq !== "NONE" && (
            <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-interval">Every</Label>
                  <Input id="event-interval" name="recurrenceInterval" type="number" min={1} max={365} defaultValue={1} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="event-until">Ends on (optional)</Label>
                  <Input id="event-until" name="recurrenceUntil" type="date" />
                </div>
              </div>
              {recurrenceFreq === "WEEKLY" && (
                <div className="flex flex-col gap-1.5">
                  <Label>On these days</Label>
                  <div className="flex gap-1.5">
                    {WEEKDAY_LABELS.map((label, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => toggleWeekday(i)}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                          byWeekday.includes(i)
                            ? "border-[var(--brand)] bg-[var(--brand-muted)] text-[var(--brand)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)]"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {byWeekday.map((d) => (
                    <input key={d} type="hidden" name="recurrenceByWeekday" value={d} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Reminder</Label>
            <Select value={reminder} onValueChange={setReminder}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="reminderMinutesBefore" value={reminder} />
          </div>

          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}

          <DialogFooter className="sm:justify-between">
            {isEdit && (
              <Button type="button" variant="ghost" className="text-[var(--danger)]" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <SubmitButton label={isEdit ? "Save changes" : "Create event"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
