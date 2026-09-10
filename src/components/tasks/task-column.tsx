"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { TaskStatus } from "@prisma/client";
import type { TaskWithRelations } from "@/lib/services/tasks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: TaskWithRelations[];
  onAddTask: () => void;
  onEdit: (task: TaskWithRelations) => void;
  onDelete: (task: TaskWithRelations) => void;
  onStatusChange: (task: TaskWithRelations, status: TaskStatus) => void;
  showProject?: boolean;
}

export function TaskColumn({
  status,
  title,
  tasks,
  onAddTask,
  onEdit,
  onDelete,
  onStatusChange,
  showProject,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}` });

  return (
    <div className="flex w-full flex-col gap-3 sm:min-w-0 sm:flex-1">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onAddTask}
          aria-label={`Add task to ${title}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-32 flex-1 flex-col gap-2 rounded-[var(--radius-lg)] border border-dashed p-2 transition-colors",
          isOver
            ? "border-[var(--brand)] bg-[var(--brand-muted)]/40"
            : "border-[var(--border)] bg-[var(--surface-sunken)]/40"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task)}
              onStatusChange={(s) => onStatusChange(task, s)}
              showProject={showProject}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-[var(--subtle-foreground)]">
            Nothing here — drag a task over or add one.
          </p>
        )}
      </div>
    </div>
  );
}
