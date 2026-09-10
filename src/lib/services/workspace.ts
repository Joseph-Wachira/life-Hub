import { db } from "@/lib/db";

export async function listWorkspaces(userId: string) {
  return db.workspace.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
}

/** Resolves the active workspace: the cookie-selected one if it still belongs
 *  to the user, otherwise the default, otherwise the first one. */
export async function resolveActiveWorkspace(userId: string, cookieWorkspaceId?: string) {
  const workspaces = await listWorkspaces(userId);
  if (workspaces.length === 0) return { workspaces, active: null };

  const fromCookie = cookieWorkspaceId
    ? workspaces.find((w) => w.id === cookieWorkspaceId)
    : undefined;

  const active = fromCookie ?? workspaces.find((w) => w.isDefault) ?? workspaces[0];
  return { workspaces, active };
}

export async function updateWorkspace(
  userId: string,
  workspaceId: string,
  data: { name: string; color: string }
) {
  const result = await db.workspace.updateMany({
    where: { id: workspaceId, userId },
    data,
  });
  if (result.count === 0) throw new Error("Workspace not found.");
  return db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
}

export async function setDefaultWorkspace(userId: string, workspaceId: string) {
  const workspace = await db.workspace.findFirst({ where: { id: workspaceId, userId } });
  if (!workspace) throw new Error("Workspace not found.");
  if (workspace.isDefault) return workspace;

  await db.$transaction([
    db.workspace.updateMany({ where: { userId }, data: { isDefault: false } }),
    db.workspace.update({ where: { id: workspaceId }, data: { isDefault: true } }),
  ]);
}

/**
 * Pure guard deciding whether a workspace may be deleted, given the full list
 * of the user's workspaces. A workspace can't be deleted if it's the user's
 * only one, or if it's currently the default (pick a different default first).
 */
export function canDeleteWorkspace(
  workspaces: { id: string; isDefault: boolean }[],
  workspaceId: string
): { ok: true } | { ok: false; reason: string } {
  const target = workspaces.find((w) => w.id === workspaceId);
  if (!target) return { ok: false, reason: "Workspace not found." };
  if (workspaces.length <= 1) return { ok: false, reason: "You can't delete your only workspace." };
  if (target.isDefault) {
    return { ok: false, reason: "Set a different workspace as default before deleting this one." };
  }
  return { ok: true };
}

export async function deleteWorkspace(userId: string, workspaceId: string) {
  const workspaces = await listWorkspaces(userId);
  const verdict = canDeleteWorkspace(workspaces, workspaceId);
  if (!verdict.ok) throw new Error(verdict.reason);

  await db.workspace.delete({ where: { id: workspaceId } });
}
