import { db } from "@/lib/db";
import type { Prisma, Priority, TaskStatus } from "@prisma/client";

export const taskInclude = {
  project: { select: { id: true, name: true, color: true } },
  goal: { select: { id: true, title: true } },
  tags: { orderBy: { name: "asc" } },
  subtasks: { orderBy: { position: "asc" } },
  attachments: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

/** Top-level tasks for a workspace (subtasks are nested under their parent, not listed here). */
export async function listTasks(workspaceId: string, opts?: { projectId?: string }) {
  return db.task.findMany({
    where: {
      workspaceId,
      parentTaskId: null,
      ...(opts?.projectId ? { projectId: opts.projectId } : {}),
    },
    include: taskInclude,
    orderBy: { position: "asc" },
  });
}

export async function getTask(id: string, workspaceId: string) {
  return db.task.findFirst({ where: { id, workspaceId, parentTaskId: null }, include: taskInclude });
}

export async function listWorkspaceTags(workspaceId: string) {
  return db.tag.findMany({ where: { workspaceId }, orderBy: { name: "asc" } });
}

export async function listProjectOptions(workspaceId: string) {
  return db.project.findMany({
    where: { workspaceId },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });
}

export async function listGoalOptions(workspaceId: string) {
  return db.goal.findMany({
    where: { workspaceId, status: "ACTIVE" },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
}

/** Creates a tag, or returns the existing one with the same name (case-sensitive match). */
export async function createTag(workspaceId: string, name: string) {
  const trimmed = name.trim();
  return db.tag.upsert({
    where: { workspaceId_name: { workspaceId, name: trimmed } },
    update: {},
    create: { workspaceId, name: trimmed },
  });
}

interface SubtaskInput {
  id?: string;
  title: string;
  done: boolean;
}

interface AttachmentLinkInput {
  id?: string;
  fileName: string;
  fileUrl: string;
}

export interface TaskWriteData {
  workspaceId: string;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  dueAt?: Date | null;
  projectId?: string | null;
  goalId?: string | null;
  tagIds: string[];
  subtasks: SubtaskInput[];
  attachments: AttachmentLinkInput[];
}

export async function createTask(data: TaskWriteData & { position: number }) {
  const task = await db.task.create({
    data: {
      workspaceId: data.workspaceId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority,
      status: data.status,
      dueAt: data.dueAt ?? null,
      completedAt: data.status === "DONE" ? new Date() : null,
      projectId: data.projectId ?? null,
      goalId: data.goalId ?? null,
      position: data.position,
      tags: data.tagIds.length ? { connect: data.tagIds.map((id) => ({ id })) } : undefined,
      subtasks: data.subtasks.length
        ? {
            create: data.subtasks.map((s, i) => ({
              workspaceId: data.workspaceId,
              title: s.title,
              status: s.done ? "DONE" : "TODO",
              completedAt: s.done ? new Date() : null,
              position: i * 1000,
            })),
          }
        : undefined,
      attachments: data.attachments.length
        ? {
            create: data.attachments.map((a) => ({
              workspaceId: data.workspaceId,
              fileName: a.fileName,
              fileUrl: a.fileUrl,
              fileType: "link",
            })),
          }
        : undefined,
    },
    include: taskInclude,
  });
  return task;
}

export async function updateTask(id: string, data: TaskWriteData) {
  const existing = await db.task.findFirst({
    where: { id, workspaceId: data.workspaceId },
    include: { subtasks: true, attachments: true },
  });
  if (!existing) throw new Error("Task not found");

  const keepSubtaskIds = new Set(data.subtasks.filter((s) => s.id).map((s) => s.id as string));
  const subtaskIdsToDelete = existing.subtasks.filter((s) => !keepSubtaskIds.has(s.id)).map((s) => s.id);

  const keepAttachmentIds = new Set(data.attachments.filter((a) => a.id).map((a) => a.id as string));
  const attachmentIdsToDelete = existing.attachments
    .filter((a) => !keepAttachmentIds.has(a.id))
    .map((a) => a.id);

  const willBeDone = data.status === "DONE";
  const wasDone = existing.status === "DONE";

  await db.$transaction([
    db.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description ?? null,
        priority: data.priority,
        status: data.status,
        dueAt: data.dueAt ?? null,
        projectId: data.projectId ?? null,
        goalId: data.goalId ?? null,
        completedAt: willBeDone ? (wasDone ? existing.completedAt : new Date()) : null,
        tags: { set: data.tagIds.map((tagId) => ({ id: tagId })) },
      },
    }),
    ...(subtaskIdsToDelete.length
      ? [db.task.deleteMany({ where: { id: { in: subtaskIdsToDelete } } })]
      : []),
    ...(attachmentIdsToDelete.length
      ? [db.attachment.deleteMany({ where: { id: { in: attachmentIdsToDelete } } })]
      : []),
    ...data.subtasks
      .filter((s) => s.id)
      .map((s) =>
        db.task.update({
          where: { id: s.id as string },
          data: {
            title: s.title,
            status: s.done ? "DONE" : "TODO",
            completedAt: s.done ? new Date() : null,
          },
        })
      ),
    ...data.subtasks
      .filter((s) => !s.id)
      .map((s, i) =>
        db.task.create({
          data: {
            workspaceId: data.workspaceId,
            parentTaskId: id,
            title: s.title,
            status: s.done ? "DONE" : "TODO",
            completedAt: s.done ? new Date() : null,
            position: (existing.subtasks.length + i) * 1000,
          },
        })
      ),
    ...data.attachments
      .filter((a) => !a.id)
      .map((a) =>
        db.attachment.create({
          data: {
            workspaceId: data.workspaceId,
            taskId: id,
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            fileType: "link",
          },
        })
      ),
  ]);

  return db.task.findUnique({ where: { id }, include: taskInclude });
}

/** Used by drag-and-drop: moves a task between/within columns, updating status + position. */
export async function moveTask(workspaceId: string, id: string, status: TaskStatus, position: number) {
  const existing = await db.task.findFirst({ where: { id, workspaceId }, select: { status: true, completedAt: true } });
  if (!existing) return null;
  const willBeDone = status === "DONE";
  return db.task.update({
    where: { id },
    data: {
      status,
      position,
      completedAt: willBeDone ? (existing.status === "DONE" ? existing.completedAt : new Date()) : null,
    },
  });
}

export async function setTaskStatus(workspaceId: string, id: string, status: TaskStatus) {
  const existing = await db.task.findFirst({ where: { id, workspaceId }, select: { status: true, completedAt: true } });
  if (!existing) return null;
  const willBeDone = status === "DONE";
  return db.task.update({
    where: { id },
    data: {
      status,
      completedAt: willBeDone ? (existing.status === "DONE" ? existing.completedAt : new Date()) : null,
    },
  });
}

export async function deleteTask(workspaceId: string, id: string) {
  return db.task.deleteMany({ where: { id, workspaceId } });
}

/** Append-to-end position for a new task in a given status column. */
export async function getNextPosition(workspaceId: string, status: TaskStatus) {
  const last = await db.task.findFirst({
    where: { workspaceId, status, parentTaskId: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return last?.position ?? null;
}
