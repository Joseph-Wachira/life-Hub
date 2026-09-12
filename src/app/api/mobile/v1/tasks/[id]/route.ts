import type { NextRequest } from "next/server";
import { z } from "zod";
import { updateTaskSchema } from "@lifehub/shared";
import { getTask, updateTask, deleteTask } from "@/lib/services/tasks";
import { authenticateMobileRequest, requireMobileWorkspace } from "@/lib/mobile/auth";
import { toMobileTask } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, badRequest, notFound } from "@/lib/mobile/http";

type Params = { params: Promise<{ id: string }> };

const workspaceQuerySchema = z.object({ workspaceId: z.string().min(1) });

export const GET = withMobileErrors(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const { userId } = await authenticateMobileRequest(req);
  const parsed = workspaceQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("workspaceId is required.");
  await requireMobileWorkspace(userId, parsed.data.workspaceId);

  const task = await getTask(id, parsed.data.workspaceId);
  if (!task) throw notFound("Task not found.");
  return mobileJson(toMobileTask(task));
});

const patchBodySchema = updateTaskSchema.extend({ workspaceId: z.string().min(1) });

export const PATCH = withMobileErrors(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const { userId } = await authenticateMobileRequest(req);
  const body = await req.json().catch(() => null);
  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) throw badRequest("Please check your input.", parsed.error.flatten().fieldErrors as Record<string, string[]>);

  const { workspaceId, ...patch } = parsed.data;
  await requireMobileWorkspace(userId, workspaceId);

  const existing = await getTask(id, workspaceId);
  if (!existing) throw notFound("Task not found.");

  // updateTask() replaces tags/subtasks/attachments wholesale, so anything
  // the mobile app doesn't manage must be carried forward unchanged here —
  // otherwise editing a task's priority from a phone would silently wipe
  // its subtasks/attachments/tags.
  const updated = await updateTask(id, {
    workspaceId,
    title: patch.title ?? existing.title,
    description: patch.description === undefined ? existing.description : patch.description,
    priority: patch.priority ?? existing.priority,
    status: patch.status ?? existing.status,
    dueAt: patch.dueAt === undefined ? existing.dueAt : patch.dueAt,
    projectId: patch.projectId === undefined ? existing.projectId : patch.projectId,
    goalId: existing.goalId,
    tagIds: existing.tags.map((tag) => tag.id),
    subtasks: existing.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      done: subtask.status === "DONE",
    })),
    attachments: existing.attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
    })),
  });
  if (!updated) throw notFound("Task not found.");

  return mobileJson(toMobileTask(updated));
});

export const DELETE = withMobileErrors(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const { userId } = await authenticateMobileRequest(req);
  const parsed = workspaceQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) throw badRequest("workspaceId is required.");
  await requireMobileWorkspace(userId, parsed.data.workspaceId);

  const existing = await getTask(id, parsed.data.workspaceId);
  if (!existing) throw notFound("Task not found.");

  await deleteTask(id);
  return mobileJson({ ok: true });
});
