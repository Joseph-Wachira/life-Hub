"use client";

import { useRouter } from "next/navigation";
import { addDays, addMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CalendarViewMode } from "./types";

export function CalendarNav({
  view,
  date,
  onNewEvent,
}: {
  view: CalendarViewMode;
  date: Date;
  onNewEvent: () => void;
}) {
  const router = useRouter();

  function navigate(nextView: CalendarViewMode, nextDate: Date) {
    router.push(`/calendar?view=${nextView}&date=${format(nextDate, "yyyy-MM-dd")}`);
  }

  function step(direction: -1 | 1) {
    if (view === "month") navigate(view, addMonths(date, direction));
    else if (view === "week") navigate(view, addDays(date, direction * 7));
    else navigate(view, addDays(date, direction));
  }

  const label =
    view === "month"
      ? format(date, "MMMM yyyy")
      : view === "week"
        ? `Week of ${format(date, "MMM d, yyyy")}`
        : format(date, "EEEE, MMM d, yyyy");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label="Previous">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(view, new Date())}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={() => step(1)} aria-label="Next">
          <ChevronRight className="size-4" />
        </Button>
        <h2 className="ml-2 text-base font-semibold">{label}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Tabs value={view} onValueChange={(v) => navigate(v as CalendarViewMode, date)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={onNewEvent}>
          <Plus className="size-4" /> New event
        </Button>
      </div>
    </div>
  );
}
