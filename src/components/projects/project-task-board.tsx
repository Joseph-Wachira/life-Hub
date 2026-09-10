"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { TaskStatus } from "@prisma/client";
import type { TaskWithRelations } from "@/lib/services/tasks";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { TagOption } from "@/components/tasks/tag-multi-select";
import { deleteTaskAction, moveTaskAction, setTaskStatusAction } from "@/lib/actions/tasks";

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export function ProjectTaskBoard({
  project,
  tasks: initialTasks,
  goals,
  tags: initialTags,
}: {
  project: { id: string; name: string; color: string };
  tasks: TaskWithRelations[];
  goals: { id: string; title: string }[];
  tags: TagOption[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [tags, setTags] = useState(initialTags);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("TODO");
  const [, startTransition] = useTransition();

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithRelations[]> = { TODO: [], IN_PROGRESS: [], DONE: [], ARCHIVED: [] };
    for (const t of tasks) if (t.status !== "ARCHIVED") grouped[t.status].push(t);
    for (const s of STATUSES) grouped[s].sort((a, b) => a.position - b.position);
    return grouped;
  }, [tasks]);

  function openCreate(status: TaskStatus) {
    setEditingTask(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  }

  function handleMove(taskId: string, status: TaskStatus, position: number) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status, position } : t)));
    startTransition(async () => {
      const result = await moveTaskAction(taskId, status, position);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleStatusChange(task: TaskWithRelations, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    startTransition(async () => {
      const result = await setTaskStatusAction(task.id, status);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  function handleDelete(task: TaskWithRelations) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    startTransition(async () => {
      const result = await deleteTaskAction(task.id);
      if (result && "error" in result) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No tasks in this project yet"
          description="Add a task to start tracking work here."
          action={
            <Button onClick={() => openCreate("TODO")}>
              <Plus className="size-4" /> New task
            </Button>
          }
        />
      ) : (
        <TaskBoard
          tasksByStatus={tasksByStatus}
          onAddTask={openCreate}
          onEdit={(task) => {
            setEditingTask(task);
            setDialogOpen(true);
          }}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onMove={handleMove}
        />
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        defaultStatus={defaultStatus}
        defaultProjectId={project.id}
        lockProject
        projects={[project]}
        goals={goals}
        tags={tags}
        onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
        onSaved={() => window.location.reload()}
      />
    </div>
  );
}
