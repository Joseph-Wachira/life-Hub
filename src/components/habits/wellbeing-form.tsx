"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Moon, Droplets, Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { upsertWellbeingLogAction } from "@/lib/actions/habits";
import type { ActionResult } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save today's log"}
    </Button>
  );
}

export function WellbeingForm({
  existing,
}: {
  existing: { sleepHours: number | null; exerciseMinutes: number | null; waterMl: number | null } | null;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(upsertWellbeingLogAction, null);

  useEffect(() => {
    if (state && "success" in state) toast.success("Wellbeing log saved");
    else if (state && "error" in state) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s wellbeing</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wb-sleep" className="flex items-center gap-1.5">
                <Moon className="size-3.5" /> Sleep (hrs)
              </Label>
              <Input
                id="wb-sleep"
                name="sleepHours"
                type="number"
                step="0.1"
                min={0}
                max={24}
                defaultValue={existing?.sleepHours ?? ""}
                placeholder="7.5"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wb-exercise" className="flex items-center gap-1.5">
                <Footprints className="size-3.5" /> Exercise (min)
              </Label>
              <Input
                id="wb-exercise"
                name="exerciseMinutes"
                type="number"
                min={0}
                max={600}
                defaultValue={existing?.exerciseMinutes ?? ""}
                placeholder="30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wb-water" className="flex items-center gap-1.5">
                <Droplets className="size-3.5" /> Water (ml)
              </Label>
              <Input
                id="wb-water"
                name="waterMl"
                type="number"
                min={0}
                max={10000}
                step={100}
                defaultValue={existing?.waterMl ?? ""}
                placeholder="2000"
              />
            </div>
          </div>
          <div>
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
