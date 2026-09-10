"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate, positionBetween } from "@/lib/utils";
import {
  createMilestoneAction,
  deleteMilestoneAction,
  reorderMilestoneAction,
  toggleMilestoneAction,
} from "@/lib/actions/goals";

export interface MilestoneItem {
  id: string;
  title: string;
  dueAt: Date | null;
  completedAt: Date | null;
  position: number;
}

export function MilestoneList({ goalId, milestones }: { goalId: string; milestones: MilestoneItem[] }) {
  const [items, setItems] = useState(milestones);
  const [newTitle, setNewTitle] = useState("");
  const [, startTransition] = useTransition();

  const sorted = [...items].sort((a, b) => a.position - b.position);

  function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("goalId", goalId);
      fd.set("title", title);
      const result = await createMilestoneAction(null, fd);
      if (result && "error" in result) toast.error(result.error);
      else window.location.reload();
    });
  }

  function handleToggle(id: string, completed: boolean) {
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, completedAt: completed ? new Date() : null } : m)));
    startTransition(async () => {
      const result = await toggleMilestoneAction(goalId, id, completed);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((m) => m.id !== id));
    startTransition(async () => {
      const result = await deleteMilestoneAction(goalId, id);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const moving = sorted[index];
    const before = direction === -1 ? sorted[targetIndex - 1] : sorted[targetIndex];
    const after = direction === -1 ? sorted[targetIndex] : sorted[targetIndex + 1];
    const newPosition = positionBetween(before?.position ?? null, after?.position ?? null);

    setItems((prev) => prev.map((m) => (m.id === moving.id ? { ...m, position: newPosition } : m)));
    startTransition(async () => {
      const result = await reorderMilestoneAction(goalId, moving.id, newPosition);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.length === 0 ? (
        <p className="text-sm text-[var(--subtle-foreground)]">No milestones yet — add your first step below.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {sorted.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2"
            >
              <Checkbox
                checked={!!m.completedAt}
                onCheckedChange={(checked) => handleToggle(m.id, checked === true)}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={m.completedAt ? "text-sm line-through text-[var(--subtle-foreground)]" : "text-sm"}>
                  {m.title}
                </span>
                {m.dueAt && (
                  <span className="text-xs text-[var(--subtle-foreground)]">Due {formatDate(m.dueAt)}</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => handleMove(i, -1)} disabled={i === 0}>
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => handleMove(i, 1)}
                  disabled={i === sorted.length - 1}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-[var(--danger)]"
                  onClick={() => handleDelete(m.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add a milestone…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="h-9 flex-1"
        />
        <Button type="button" variant="outline" onClick={handleAdd}>
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </div>
  );
}
