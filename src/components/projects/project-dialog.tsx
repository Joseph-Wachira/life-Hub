"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { format } from "date-fns";
import type { ProjectStatus } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
import type { ActionResult } from "@/lib/actions/auth";
import { PROJECT_COLOR_OPTIONS } from "@/lib/validations/projects";
import { cn } from "@/lib/utils";

export interface ProjectRecord {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  color: string;
  goalId: string | null;
  startAt: Date | string | null;
  dueAt: Date | string | null;
}

const STATUS_LABEL: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  goals,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectRecord | null;
  goals: { id: string; title: string }[];
  onSaved?: () => void;
}) {
  const isEdit = Boolean(project);
  const action = isEdit ? updateProjectAction : createProjectAction;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "ACTIVE");
  const [color, setColor] = useState(project?.color ?? PROJECT_COLOR_OPTIONS[0]);
  const [goalId, setGoalId] = useState(project?.goalId ?? "");

  useEffect(() => {
    if (open) {
      setStatus(project?.status ?? "ACTIVE");
      setColor(project?.color ?? PROJECT_COLOR_OPTIONS[0]);
      setGoalId(project?.goalId ?? "");
    }
  }, [open, project]);

  useEffect(() => {
    if (state && "success" in state) {
      onOpenChange(false);
      onSaved?.();
    }
  }, [state, onOpenChange, onSaved]);

  const defaultStart = project?.startAt ? format(new Date(project.startAt), "yyyy-MM-dd") : "";
  const defaultDue = project?.dueAt ? format(new Date(project.dueAt), "yyyy-MM-dd") : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>Group related tasks and track overall progress.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={project!.id} />}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" name="name" defaultValue={project?.name ?? ""} required autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Textarea id="project-description" name="description" defaultValue={project?.description ?? ""} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="status" value={status} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Goal</Label>
              <Select value={goalId || "none"} onValueChange={(v) => setGoalId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="No goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="goalId" value={goalId} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-start">Start date</Label>
              <Input id="project-start" name="startAt" type="date" defaultValue={defaultStart} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-due">Due date</Label>
              <Input id="project-due" name="dueAt" type="date" defaultValue={defaultDue} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full ring-offset-2 ring-offset-[var(--surface)] transition-shadow",
                    color === c && "ring-2 ring-[var(--ring)]"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <input type="hidden" name="color" value={color} />
          </div>
          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <SubmitButton label={isEdit ? "Save changes" : "Create project"} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
