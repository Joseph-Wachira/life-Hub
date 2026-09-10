"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, Archive, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Priority, TaskStatus } from "@prisma/client";
import type { TaskWithRelations } from "@/lib/services/tasks";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskBoard } from "./task-board";
import { TaskDialog } from "./task-dialog";
import type { TagOption } from "./tag-multi-select";
import {
  deleteTaskAction,
  moveTaskAction,
  setTaskStatusAction,
} from "@/lib/actions/tasks";

interface TasksClientProps {
  tasks: TaskWithRelations[];
  projects: { id: string; name: string; color: string }[];
  goals: { id: string; title: string }[];
  tags: TagOption[];
}

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export function TasksClient({ tasks: initialTasks, projects, goals, tags: initialTags }: TasksClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [tags, setTags] = useState(initialTags);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "ALL">("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("TODO");
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (!search.trim()) return true;
      return t.title.toLowerCase().includes(search.trim().toLowerCase());
    });
  }, [tasks, search]);

  const boardFiltered = useMemo(() => {
    return filtered.filter((t) => {
      if (t.status === "ARCHIVED") return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (projectFilter !== "ALL" && t.projectId !== projectFilter) return false;
      if (tagFilter !== "ALL" && !t.tags.some((tag) => tag.id === tagFilter)) return false;
      return true;
    });
  }, [filtered, priorityFilter, projectFilter, tagFilter]);

  const archivedTasks = useMemo(() => filtered.filter((t) => t.status === "ARCHIVED"), [filtered]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithRelations[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
      ARCHIVED: [],
    };
    for (const t of boardFiltered) grouped[t.status].push(t);
    for (const status of STATUSES) grouped[status].sort((a, b) => a.position - b.position);
    return grouped;
  }, [boardFiltered]);

  function openCreate(status: TaskStatus) {
    setEditingTask(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  }

  function openEdit(task: TaskWithRelations) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  function handleSaved() {
    // Server actions revalidate the route; a light client refresh keeps the
    // in-memory list consistent without a full page reload.
    window.location.reload();
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
      else toast.success(`Moved to ${status.replace("_", " ").toLowerCase()}`);
    });
  }

  function handleDelete(task: TaskWithRelations) {
    if (!confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    startTransition(async () => {
      const result = await deleteTaskAction(task.id);
      if (result && "error" in result) toast.error(result.error);
      else toast.success("Task deleted");
    });
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Tasks"
        description="Drag cards between columns, or click one to edit."
        actions={
          <Button onClick={() => openCreate("TODO")}>
            <Plus className="size-4" /> New task
          </Button>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--subtle-foreground)]" />
            <Input
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as Priority | "ALL")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All tags</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} />
            Show archived
          </label>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No tasks yet"
            description="Create your first task to start organizing your work."
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
            onEdit={openEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onMove={handleMove}
            showProject
          />
        )}

        {showArchived && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
              <Archive className="size-4 text-[var(--subtle-foreground)]" />
              <h3 className="text-sm font-semibold">Archived ({archivedTasks.length})</h3>
            </div>
            {archivedTasks.length === 0 ? (
              <p className="px-1 text-sm text-[var(--subtle-foreground)]">No archived tasks.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {archivedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <span className="truncate text-[var(--muted-foreground)] line-through">{task.title}</span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Restore"
                        onClick={() => handleStatusChange(task, "TODO")}
                      >
                        <RotateCcw className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-[var(--danger)]"
                        aria-label="Delete"
                        onClick={() => handleDelete(task)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        defaultStatus={defaultStatus}
        projects={projects}
        goals={goals}
        tags={tags}
        onTagCreated={(tag) => setTags((prev) => [...prev, tag])}
        onSaved={handleSaved}
      />
    </div>
  );
}
