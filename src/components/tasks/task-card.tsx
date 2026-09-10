"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, MoreHorizontal, ListChecks } from "lucide-react";
import type { TaskStatus } from "@prisma/client";
import type { TaskWithRelations } from "@/lib/services/tasks";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";
import { subtaskProgress } from "./subtask-progress";

const PRIORITY_META: Record<string, { label: string; variant: "secondary" | "default" | "warning" | "danger" }> = {
  LOW: { label: "Low", variant: "secondary" },
  MEDIUM: { label: "Medium", variant: "default" },
  HIGH: { label: "High", variant: "warning" },
  URGENT: { label: "Urgent", variant: "danger" },
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  ARCHIVED: "Archived",
};

interface TaskCardProps {
  task: TaskWithRelations;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  showProject?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange, showProject }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityMeta = PRIORITY_META[task.priority];
  const { done, total } = subtaskProgress(task.subtasks);
  const isOverdue = !!task.dueAt && task.status !== "DONE" && new Date(task.dueAt) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group flex touch-none flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onEdit}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-1 text-left text-sm font-medium leading-snug text-[var(--foreground)] hover:underline"
        >
          {task.title}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="Task actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onPointerDown={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to…</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {(Object.keys(STATUS_LABEL) as TaskStatus[])
                  .filter((s) => s !== task.status)
                  .map((s) => (
                    <DropdownMenuItem key={s} onSelect={() => onStatusChange(s)}>
                      {STATUS_LABEL[s]}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="line-clamp-2 text-xs text-[var(--muted-foreground)]">{task.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={priorityMeta.variant}>{priorityMeta.label}</Badge>
        {task.dueAt && (
          <Badge variant={isOverdue ? "danger" : "secondary"} className="gap-1">
            {isOverdue && <AlertCircle className="size-3" />}
            {formatDate(task.dueAt)}
          </Badge>
        )}
        {total > 0 && (
          <Badge variant="secondary" className="gap-1">
            <ListChecks className="size-3" />
            {done}/{total}
          </Badge>
        )}
        {showProject && task.project && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${task.project.color}1f`, color: task.project.color }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: task.project.color }} />
            {task.project.name}
          </span>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
