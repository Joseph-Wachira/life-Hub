"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/session";
import { createFocusSession, getOpenTaskById } from "@/lib/services/focus";
import { logFocusSessionSchema } from "@/lib/validations/focus";
import type { ActionResult } from "@/lib/actions/auth";

/**
 * Logs one completed (or manually stopped) focus/deep-work session.
 * Called once, right when the timer phase ends — notes and rating are
 * optional fields on the same submission, not a separate follow-up write.
 */
export async function logFocusSessionAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { userId, workspace } = await requireWorkspace();

  const parsed = logFocusSessionSchema.safeParse({
    type: formData.get("type"),
    plannedMinutes: formData.get("plannedMinutes"),
    actualMinutes: formData.get("actualMinutes"),
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt"),
    taskId: formData.get("taskId"),
    interruptions: formData.get("interruptions"),
    notes: formData.get("notes"),
    rating: formData.get("rating"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Couldn't save that session." };
  }

  const { taskId, startedAt, endedAt, ...rest } = parsed.data;

  // Silently drop the task link rather than erroring if it doesn't resolve
  // (e.g. it was deleted mid-session) — the session is still worth logging.
  const task = taskId ? await getOpenTaskById(workspace.id, taskId) : null;

  const startedAtDate = new Date(startedAt);
  const endedAtDate = new Date(endedAt);
  if (Number.isNaN(startedAtDate.getTime()) || Number.isNaN(endedAtDate.getTime())) {
    return { error: "Something went wrong timing that session. Please try again." };
  }

  await createFocusSession({
    ...rest,
    workspaceId: workspace.id,
    userId,
    taskId: task?.id,
    startedAt: startedAtDate,
    endedAt: endedAtDate,
  });

  revalidatePath("/focus");
  return { success: true };
}
