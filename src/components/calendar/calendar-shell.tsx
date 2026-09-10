"use client";

import { useState } from "react";
import { startOfWeek } from "date-fns";
import { CalendarNav } from "./calendar-nav";
import { MonthGrid } from "./month-grid";
import { TimeGrid } from "./time-grid";
import { EventDialog } from "./event-dialog";
import type { CalendarViewMode, SerializedEventInstance } from "./types";

export function CalendarShell({
  view,
  date,
  instances,
}: {
  view: CalendarViewMode;
  date: Date;
  instances: SerializedEventInstance[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<SerializedEventInstance | null>(null);
  const [createAt, setCreateAt] = useState<Date | null>(null);

  function openCreate(at?: Date) {
    setEditingInstance(null);
    setCreateAt(at ?? date);
    setDialogOpen(true);
  }

  function openEdit(instance: SerializedEventInstance) {
    setEditingInstance(instance);
    setCreateAt(null);
    setDialogOpen(true);
  }

  const weekDays =
    view === "week"
      ? Array.from({ length: 7 }, (_, i) => {
          const d = startOfWeek(date, { weekStartsOn: 0 });
          d.setDate(d.getDate() + i);
          return d;
        })
      : [date];

  return (
    <div className="flex flex-col gap-4">
      <CalendarNav view={view} date={date} onNewEvent={() => openCreate()} />

      {view === "month" && <MonthGrid month={date} instances={instances} onSelect={openEdit} onCreateAt={openCreate} />}
      {(view === "week" || view === "day") && (
        <TimeGrid days={weekDays} instances={instances} onSelect={openEdit} onCreateAt={openCreate} />
      )}

      <EventDialog open={dialogOpen} onOpenChange={setDialogOpen} instance={editingInstance} defaultStart={createAt} />
    </div>
  );
}
