"use server";

import { revalidatePath } from "next/cache";
import type { TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/session";
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  setTaskStatus,
  getNextPosition,
  createTag as createTagService,
} from "@/lib/services/tasks";
import { taskFormSchema, createTagSchema, taskStatusSchema } from "@/lib/validations/tasks";
import { positionBetween } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/auth";

function parseJsonArray(formData: FormData, key: string): unknown[] {
  const raw = formData.get(key);
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readTaskForm(formData: FormData) {
  return taskFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    dueAt: formData.get("dueAt"),
    projectId: formData.get("projectId"),
    goalId: formData.get("goalId"),
    tagIds: parseJsonArray(formData, "tagIdsJson"),
    subtasks: parseJsonArray(formData, "subtasksJson"),
    attachments: parseJsonArray(formData, "attachmentsJson"),
  });
}

export async function createTaskAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsed = readTaskForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the task details." };
  }

  const previousPosition = await getNextPosition(workspace.id, parsed.data.status);

  await createTask({
    workspaceId: workspace.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority,
    status: parsed.data.status,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    projectId: parsed.data.projectId ?? null,
    goalId: parsed.data.goalId ?? null,
    tagIds: parsed.data.tagIds,
    subtasks: parsed.data.subtasks,
    attachments: parsed.data.attachments,
    position: positionBetween(previousPosition, null),
  });

  revalidatePath("/tasks");
  revalidatePath("/projects");
  return { success: true };
}

export async function updateTaskAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing task id." };

  const existing = await db.task.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!existing) return { error: "Task not found." };

  const parsed = readTaskForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the task details." };
  }

  await updateTask(id, {
    workspaceId: workspace.id,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority,
    status: parsed.data.status,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    projectId: parsed.data.projectId ?? null,
    goalId: parsed.data.goalId ?? null,
    tagIds: parsed.data.tagIds,
    subtasks: parsed.data.subtasks,
    attachments: parsed.data.attachments,
  });

  revalidatePath("/tasks");
  revalidatePath("/projects");
  return { success: true };
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const existing = await db.task.findFirst({ where: { id: taskId, workspaceId: workspace.id } });
  if (!existing) return { error: "Task not found." };

  await deleteTask(taskId);
  revalidatePath("/tasks");
  revalidatePath("/projects");
  return { success: true };
}

/** Used by the kanban board's drag-and-drop to move a task between/within columns. */
export async function moveTaskAction(taskId: string, status: TaskStatus, position: number): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsedStatus = taskStatusSchema.safeParse(status);
  if (!parsedStatus.success) return { error: "Invalid status." };

  const existing = await db.task.findFirst({ where: { id: taskId, workspaceId: workspace.id } });
  if (!existing) return { error: "Task not found." };

  await moveTask(taskId, parsedStatus.data, position);
  revalidatePath("/tasks");
  revalidatePath("/projects");
  return { success: true };
}

export async function setTaskStatusAction(taskId: string, status: TaskStatus): Promise<ActionResult> {
  const { workspace } = await requireWorkspace();
  const parsedStatus = taskStatusSchema.safeParse(status);
  if (!parsedStatus.success) return { error: "Invalid status." };

  const existing = await db.task.findFirst({ where: { id: taskId, workspaceId: workspace.id } });
  if (!existing) return { error: "Task not found." };

  await setTaskStatus(taskId, parsedStatus.data);
  revalidatePath("/tasks");
  revalidatePath("/projects");
  return { success: true };
}

export async function createTagAction(
  name: string
): Promise<{ id: string; name: string; color: string } | { error: string }> {
  const { workspace } = await requireWorkspace();
  const parsed = createTagSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid tag name." };
  }

  const tag = await createTagService(workspace.id, parsed.data.name);
  revalidatePath("/tasks");
  return { id: tag.id, name: tag.name, color: tag.color };
}
