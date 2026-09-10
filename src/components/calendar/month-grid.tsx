"use client";

import { useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { moveEventAction } from "@/lib/actions/events";
import { cn } from "@/lib/utils";
import { EventChip } from "./event-chip";
import type { DragPayload, SerializedEventInstance } from "./types";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE = 3;

export function MonthGrid({
  month,
  instances,
  onSelect,
  onCreateAt,
}: {
  month: Date;
  instances: SerializedEventInstance[];
  onSelect: (instance: SerializedEventInstance) => void;
  onCreateAt: (date: Date) => void;
}) {
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function instancesForDay(day: Date) {
    return instances
      .filter((i) => isSameDay(new Date(i.start), day))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  function handleDrop(e: React.DragEvent, day: Date) {
    e.preventDefault();
    setDragOverDay(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload = JSON.parse(raw) as DragPayload;

    const occStart = new Date(payload.occStart);
    const eventStart = new Date(payload.eventStartAt);
    const eventEnd = new Date(payload.eventEndAt);
    const durationMs = eventEnd.getTime() - eventStart.getTime();

    const dayDeltaMs = day.getTime() - new Date(occStart.getFullYear(), occStart.getMonth(), occStart.getDate()).getTime();
    const newEventStart = new Date(eventStart.getTime() + dayDeltaMs);
    const newEventEnd = new Date(newEventStart.getTime() + durationMs);

    moveEventAction(payload.eventId, newEventStart.toISOString(), newEventEnd.toISOString()).then((r) => {
      if (r && "error" in r) toast.error(r.error);
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
      <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface-sunken)]">
        {WEEKDAY_HEADERS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium text-[var(--muted-foreground)]">
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const dayKey = day.toISOString();
          const dayInstances = instancesForDay(day);
          const visible = dayInstances.slice(0, MAX_VISIBLE);
          const overflow = dayInstances.slice(MAX_VISIBLE);
          const inMonth = isSameMonth(day, month);

          return (
            <div
              key={dayKey}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDay(dayKey);
              }}
              onDragLeave={() => setDragOverDay((k) => (k === dayKey ? null : k))}
              onDrop={(e) => handleDrop(e, day)}
              onDoubleClick={() => onCreateAt(day)}
              className={cn(
                "flex min-h-24 flex-col gap-1 border-b border-r border-[var(--border)] p-1.5 transition-colors last:border-r-0",
                !inMonth && "bg-[var(--surface-sunken)]/40",
                dragOverDay === dayKey && "bg-[var(--brand-muted)]/50"
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday(day) ? "bg-[var(--brand)] text-[var(--brand-foreground)]" : "text-[var(--muted-foreground)]",
                  !inMonth && "opacity-50"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-col gap-0.5">
                {visible.map((instance) => (
                  <EventChip key={instance.instanceId} instance={instance} onClick={() => onSelect(instance)} />
                ))}
                {overflow.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="px-1 text-left text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                        +{overflow.length} more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="flex w-56 flex-col gap-1" align="start">
                      {overflow.map((instance) => (
                        <EventChip key={instance.instanceId} instance={instance} variant="dot" onClick={() => onSelect(instance)} />
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
