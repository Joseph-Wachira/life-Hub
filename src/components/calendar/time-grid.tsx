"use client";

import { useState } from "react";
import { format, isSameDay, isToday } from "date-fns";
import { toast } from "sonner";
import { moveEventAction } from "@/lib/actions/events";
import { cn } from "@/lib/utils";
import { EventChip } from "./event-chip";
import type { DragPayload, SerializedEventInstance } from "./types";

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 56;

function hourLabel(hour: number) {
  const h = hour % 24;
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
}

export function TimeGrid({
  days,
  instances,
  onSelect,
  onCreateAt,
}: {
  days: Date[];
  instances: SerializedEventInstance[];
  onSelect: (instance: SerializedEventInstance) => void;
  onCreateAt: (date: Date) => void;
}) {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const allDayInstances = instances.filter((i) => i.allDay);
  const timedInstances = instances.filter((i) => !i.allDay);

  function instancesForDay(day: Date) {
    return timedInstances.filter((i) => isSameDay(new Date(i.start), day));
  }

  function handleDrop(e: React.DragEvent, day: Date, hour: number) {
    e.preventDefault();
    setDragOverSlot(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload = JSON.parse(raw) as DragPayload;

    const eventStart = new Date(payload.eventStartAt);
    const eventEnd = new Date(payload.eventEndAt);
    const durationMs = eventEnd.getTime() - eventStart.getTime();

    const newStart = new Date(day);
    newStart.setHours(hour, eventStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    moveEventAction(payload.eventId, newStart.toISOString(), newEnd.toISOString()).then((r) => {
      if (r && "error" in r) toast.error(r.error);
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
      <div className="grid border-b border-[var(--border)] bg-[var(--surface-sunken)]" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="flex flex-col items-center border-l border-[var(--border)] py-2">
            <span className="text-xs text-[var(--muted-foreground)]">{format(day, "EEE")}</span>
            <span className={cn("flex size-6 items-center justify-center rounded-full text-sm font-medium", isToday(day) && "bg-[var(--brand)] text-[var(--brand-foreground)]")}>
              {format(day, "d")}
            </span>
          </div>
        ))}
      </div>

      {allDayInstances.length > 0 && (
        <div className="grid border-b border-[var(--border)]" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
          <div className="border-r border-[var(--border)] py-1 text-center text-[10px] text-[var(--subtle-foreground)]">All day</div>
          {days.map((day) => (
            <div key={day.toISOString()} className="flex flex-col gap-0.5 border-l border-[var(--border)] p-1">
              {allDayInstances
                .filter((i) => isSameDay(new Date(i.start), day))
                .map((instance) => (
                  <EventChip key={instance.instanceId} instance={instance} onClick={() => onSelect(instance)} />
                ))}
            </div>
          ))}
        </div>
      )}

      <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
          <div>
            {hours.map((h) => (
              <div key={h} className="relative border-b border-[var(--border)] text-right pr-2" style={{ height: HOUR_HEIGHT }}>
                <span className="absolute -top-2.5 right-2 text-[10px] text-[var(--subtle-foreground)]">{hourLabel(h)}</span>
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day.toISOString()} className="relative border-l border-[var(--border)]">
              {hours.map((h) => {
                const slotKey = `${day.toISOString()}-${h}`;
                return (
                  <div
                    key={h}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverSlot(slotKey);
                    }}
                    onDragLeave={() => setDragOverSlot((k) => (k === slotKey ? null : k))}
                    onDrop={(e) => handleDrop(e, day, h)}
                    onDoubleClick={() => {
                      const d = new Date(day);
                      d.setHours(h, 0, 0, 0);
                      onCreateAt(d);
                    }}
                    className={cn("border-b border-[var(--border)] transition-colors", dragOverSlot === slotKey && "bg-[var(--brand-muted)]/50")}
                    style={{ height: HOUR_HEIGHT }}
                  />
                );
              })}

              {instancesForDay(day).map((instance) => {
                const start = new Date(instance.start);
                const end = new Date(instance.end);
                const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
                const durationMinutes = Math.max(20, (end.getTime() - start.getTime()) / 60000);
                const top = (startMinutes / 60) * HOUR_HEIGHT;
                const height = (durationMinutes / 60) * HOUR_HEIGHT;

                return (
                  <div key={instance.instanceId} className="absolute inset-x-0.5 z-10" style={{ top, height }}>
                    <EventChip instance={instance} onClick={() => onSelect(instance)} className="h-full" />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
