import { History, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDateTime, pluralize } from "@/lib/utils";

export interface FocusHistorySession {
  id: string;
  type: string;
  plannedMinutes: number;
  actualMinutes: number;
  startedAt: Date;
  interruptions: number;
  notes: string | null;
  rating: number | null;
  task: { id: string; title: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  POMODORO: "Pomodoro",
  DEEP_WORK: "Deep work",
  CUSTOM: "Custom",
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-3.5",
            n <= rating ? "fill-[var(--warning)] text-[var(--warning)]" : "text-[var(--border-strong)]"
          )}
        />
      ))}
    </span>
  );
}

export function FocusHistory({ sessions }: { sessions: FocusHistorySession[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Session history</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <EmptyState
            icon={History}
            title="No focus sessions yet"
            description="Start the timer above — completed and stopped sessions will show up here."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {sessions.map((session) => (
              <li key={session.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{TYPE_LABELS[session.type] ?? session.type}</Badge>
                  <span className="text-sm font-medium">{session.actualMinutes} min</span>
                  {session.actualMinutes < session.plannedMinutes && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      of {session.plannedMinutes} planned
                    </span>
                  )}
                  {session.task && (
                    <span className="truncate text-sm text-[var(--muted-foreground)]">· {session.task.title}</span>
                  )}
                  <span className="ml-auto text-xs text-[var(--subtle-foreground)]">
                    {formatDateTime(session.startedAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted-foreground)]">
                  {session.rating != null && <RatingStars rating={session.rating} />}
                  {session.interruptions > 0 && (
                    <span>
                      {session.interruptions} {pluralize(session.interruptions, "interruption")}
                    </span>
                  )}
                  {session.notes && <span className="italic">"{session.notes}"</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
