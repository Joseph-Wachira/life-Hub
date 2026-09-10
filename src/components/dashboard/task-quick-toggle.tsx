"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { setTaskStatusAction } from "@/lib/actions/tasks";

export function TaskQuickToggle({ taskId, done }: { taskId: string; done: boolean }) {
  const [checked, setChecked] = useState(done);
  const [, startTransition] = useTransition();

  function handleChange(value: boolean) {
    setChecked(value);
    startTransition(async () => {
      const result = await setTaskStatusAction(taskId, value ? "DONE" : "TODO");
      if (result && "error" in result) {
        toast.error(result.error);
        setChecked(!value);
      }
    });
  }

  return <Checkbox checked={checked} onCheckedChange={(c) => handleChange(c === true)} />;
}
