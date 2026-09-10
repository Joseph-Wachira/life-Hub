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
