import type { Metadata } from "next";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { requireWorkspace } from "@/lib/session";
import { listEventInstancesInRange } from "@/lib/services/events";
import { CalendarShell } from "@/components/calendar/calendar-shell";
import type { CalendarViewMode, SerializedEventInstance } from "@/components/calendar/types";

export const metadata: Metadata = { title: "Calendar" };

function resolveRange(view: CalendarViewMode, date: Date) {
  if (view === "month") {
    return { start: startOfWeek(startOfMonth(date), { weekStartsOn: 0 }), end: endOfWeek(endOfMonth(date), { weekStartsOn: 0 }) };
  }
  if (view === "week") {
    return { start: startOfWeek(date, { weekStartsOn: 0 }), end: endOfWeek(date, { weekStartsOn: 0 }) };
  }
  return { start: startOfDay(date), end: endOfDay(date) };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const { view: rawView, date: rawDate } = await searchParams;

  const view: CalendarViewMode = rawView === "week" || rawView === "day" ? rawView : "month";
  const parsedDate = rawDate ? new Date(rawDate) : new Date();
  const date = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const { start, end } = resolveRange(view, date);
  const rawInstances = await listEventInstancesInRange(workspace.id, start, end);

  const instances: SerializedEventInstance[] = rawInstances.map((i) => ({
    instanceId: i.instanceId,
    eventId: i.event.id,
    title: i.event.title,
    description: i.event.description,
    location: i.event.location,
    color: i.event.color,
    allDay: i.event.allDay,
    start: i.start.toISOString(),
    end: i.end.toISOString(),
    isRecurring: i.isRecurring,
    recurrenceRuleJson: i.event.recurrenceRuleJson,
    recurrenceEndAt: i.event.recurrenceEndAt ? i.event.recurrenceEndAt.toISOString() : null,
    reminderMinutesBefore: i.event.reminderMinutesBefore,
    eventStartAt: i.event.startAt.toISOString(),
    eventEndAt: i.event.endAt.toISOString(),
  }));

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <CalendarShell view={view} date={date} instances={instances} />
    </div>
  );
}
