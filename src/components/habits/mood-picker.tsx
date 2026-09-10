"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { Mood } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upsertMoodCheckInAction } from "@/lib/actions/habits";
import type { ActionResult } from "@/lib/actions/auth";
import { MOOD_META, MOOD_ORDER } from "./constants";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save check-in"}
    </Button>
  );
}

export function MoodPicker({ existing }: { existing: { mood: Mood; energyLevel: number } | null }) {
  const [mood, setMood] = useState<Mood>(existing?.mood ?? "GOOD");
  const [energy, setEnergy] = useState(existing?.energyLevel ?? 3);
  const [state, formAction] = useActionState<ActionResult | null, FormData>(upsertMoodCheckInAction, null);

  useEffect(() => {
    if (state && "success" in state) toast.success("Check-in saved");
    else if (state && "error" in state) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are you feeling today?</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex justify-between gap-2">
            {MOOD_ORDER.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMood(m)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-[var(--radius-md)] border py-2 text-xs transition-colors",
                  mood === m ? "border-[var(--brand)] bg-[var(--brand-muted)]" : "border-[var(--border)] hover:border-[var(--border-strong)]"
                )}
              >
                <span className="text-xl">{MOOD_META[m].emoji}</span>
                {MOOD_META[m].label}
              </button>
            ))}
          </div>
          <input type="hidden" name="mood" value={mood} />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>Energy level</span>
              <span>{energy}/5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-[var(--brand)]"
            />
            <input type="hidden" name="energyLevel" value={energy} />
          </div>

          <div>
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
