export type CalendarViewMode = "month" | "week" | "day";

/** A single concrete occurrence of an event (recurring events expand into many of these), flattened for client rendering. */
export interface SerializedEventInstance {
  /** Stable per-occurrence key — the event id for single events, `${eventId}::${startIso}` for recurring ones. */
  instanceId: string;
  eventId: string;
  title: string;
  description: string | null;
  location: string | null;
  color: string;
  allDay: boolean;
  /** This occurrence's start/end, ISO strings. */
  start: string;
  end: string;
  isRecurring: boolean;
  recurrenceRuleJson: string | null;
  recurrenceEndAt: string | null;
  reminderMinutesBefore: number | null;
  /** The underlying Event row's own start/end (the recurrence series anchor) — needed to move a whole series. */
  eventStartAt: string;
  eventEndAt: string;
}

export interface DragPayload {
  instanceId: string;
  eventId: string;
  occStart: string;
  eventStartAt: string;
  eventEndAt: string;
}

export type DropTarget =
  | { kind: "day"; dateKey: string }
  | { kind: "slot"; dateKey: string; hour: number };
