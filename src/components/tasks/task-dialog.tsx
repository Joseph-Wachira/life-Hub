"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { format } from "date-fns";
import { Link as LinkIcon, Plus, X } from "lucide-react";
import type { Priority, TaskStatus } from "@prisma/client";
import type { TaskWithRelations } from "@/lib/services/tasks";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTaskAction, updateTaskAction } from "@/lib/actions/tasks";
import type { ActionResult } from "@/lib/actions/auth";
import { TagMultiSelect, type TagOption } from "./tag-multi-select";
import { toast } from "sonner";

interface SubtaskDraft {
  id?: string;
  title: string;
  done: boolean;
}

interface AttachmentDraft {
  id?: string;
  fileName: string;
  fileUrl: string;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskWithRelations | null;
  defaultStatus?: TaskStatus;
  defaultProjectId?: string;
  projects: { id: string; name: string; color: string }[];
  goals: { id: string; title: string }[];
  tags: TagOption[];
  onTagCreated: (tag: TagOption) => void;
  onSaved: () => void;
  lockProject?: boolean;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEditing ? "Save changes" : "Create task"}
    </Button>
  );
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultStatus,
  defaultProjectId,
  projects,
  goals,
  tags,
  onTagCreated,
  onSaved,
  lockProject,
}: TaskDialogProps) {
  const isEditing = !!task;
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    isEditing ? updateTaskAction : createTaskAction,
    null
  );

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "TODO");
  const [dueAt, setDueAt] = useState(task?.dueAt ? format(new Date(task.dueAt), "yyyy-MM-dd") : "");
  const [projectId, setProjectId] = useState(task?.projectId ?? defaultProjectId ?? "");
  const [goalId, setGoalId] = useState(task?.goalId ?? "");
  const [tagIds, setTagIds] = useState<string[]>(task?.tags.map((t) => t.id) ?? []);
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>(
    task?.subtasks.map((s) => ({ id: s.id, title: s.title, done: s.status === "DONE" })) ?? []
  );
  const [attachments, setAttachments] = useState<AttachmentDraft[]>(
    task?.attachments.map((a) => ({ id: a.id, fileName: a.fileName, fileUrl: a.fileUrl })) ?? []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");

  useEffect(() => {
    if (state && "success" in state) {
      onSaved();
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function addSubtask() {
    const value = newSubtaskTitle.trim();
    if (!value) return;
    setSubtasks((prev) => [...prev, { title: value, done: false }]);
    setNewSubtaskTitle("");
  }

  function updateSubtask(index: number, patch: Partial<SubtaskDraft>) {
    setSubtasks((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeSubtask(index: number) {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  }

  function addAttachment() {
    const name = newAttachmentName.trim();
    let url = newAttachmentUrl.trim();
    if (!name || !url) {
      toast.error("Enter both a name and a URL for the link.");
      return;
    }
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setAttachments((prev) => [...prev, { fileName: name, fileUrl: url }]);
    setNewAttachmentName("");
    setNewAttachmentUrl("");
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details below." : "Add a task to your board."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {isEditing && <input type="hidden" name="id" value={task!.id} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="priority" value={priority} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="status" value={status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                name="dueAt"
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Project</Label>
              <Select
                value={projectId || "none"}
                onValueChange={(v) => setProjectId(v === "none" ? "" : v)}
                disabled={lockProject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="projectId" value={projectId} />
            </div>
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

          <div className="flex flex-col gap-1.5">
            <Label>Tags</Label>
            <TagMultiSelect options={tags} selectedIds={tagIds} onChange={setTagIds} onOptionCreated={onTagCreated} />
            <input type="hidden" name="tagIdsJson" value={JSON.stringify(tagIds)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Subtasks</Label>
            {subtasks.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {subtasks.map((s, i) => (
                  <div key={s.id ?? `new-${i}`} className="flex items-center gap-2">
                    <Checkbox
                      checked={s.done}
                      onCheckedChange={(checked) => updateSubtask(i, { done: checked === true })}
                    />
                    <Input
                      value={s.title}
                      onChange={(e) => updateSubtask(i, { title: e.target.value })}
                      className="h-8 flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeSubtask(i)}
                      className="text-[var(--subtle-foreground)] transition-colors hover:text-[var(--danger)]"
                      aria-label="Remove subtask"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Add a subtask…"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                className="h-8 flex-1 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addSubtask}>
                <Plus className="size-3.5" />
              </Button>
            </div>
            <input type="hidden" name="subtasksJson" value={JSON.stringify(subtasks)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Links</Label>
            {attachments.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {attachments.map((a, i) => (
                  <div
                    key={a.id ?? `new-${i}`}
                    className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-2.5 py-1.5 text-sm"
                  >
                    <LinkIcon className="size-3.5 shrink-0 text-[var(--subtle-foreground)]" />
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 truncate text-[var(--brand)] hover:underline"
                    >
                      {a.fileName}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="text-[var(--subtle-foreground)] transition-colors hover:text-[var(--danger)]"
                      aria-label="Remove link"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
              <Input
                placeholder="Name"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                placeholder="https://…"
                value={newAttachmentUrl}
                onChange={(e) => setNewAttachmentUrl(e.target.value)}
                className="h-8 text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addAttachment}>
                <Plus className="size-3.5" />
              </Button>
            </div>
            <input type="hidden" name="attachmentsJson" value={JSON.stringify(attachments)} />
          </div>

          {state && "error" in state && (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
