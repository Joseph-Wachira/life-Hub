"use client";

import { formatTime, cn } from "@/lib/utils";
import type { SerializedEventInstance } from "./types";

export function EventChip({
  instance,
  onClick,
  variant = "block",
  className,
}: {
  instance: SerializedEventInstance;
  onClick: () => void;
  variant?: "block" | "dot";
  className?: string;
}) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        instanceId: instance.instanceId,
        eventId: instance.eventId,
        occStart: instance.start,
        eventStartAt: instance.eventStartAt,
        eventEndAt: instance.eventEndAt,
      })
    );
    e.dataTransfer.effectAllowed = "move";
  }

  if (variant === "dot") {
    return (
      <button
        type="button"
        draggable
        onDragStart={handleDragStart}
        onClick={onClick}
        className={cn("flex w-full items-center gap-1.5 truncate rounded px-1 py-0.5 text-left text-xs hover:bg-[var(--surface-sunken)]", className)}
      >
        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: instance.color }} />
        <span className="truncate">{instance.title}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-0.5 truncate rounded-[var(--radius-sm)] px-2 py-1 text-left text-xs font-medium text-white shadow-sm transition-transform hover:scale-[1.01]",
        className
      )}
      style={{ backgroundColor: instance.color }}
    >
      <span className="truncate">{instance.title}</span>
      {!instance.allDay && <span className="text-[10px] opacity-80">{formatTime(instance.start)}</span>}
    </button>
  );
}
