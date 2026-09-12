import type { NextRequest } from "next/server";
import { verifyAccessToken, InvalidAccessTokenError } from "@/lib/mobile/jwt";
import { unauthorized, forbidden } from "@/lib/mobile/http";
import { listWorkspaces } from "@/lib/services/workspace";

export interface MobileAuthContext {
  userId: string;
  email: string;
}

/** Extracts and verifies the `Authorization: Bearer <token>` header. Throws a MobileApiError(401) — let withMobileErrors turn it into a response. */
export async function authenticateMobileRequest(req: NextRequest): Promise<MobileAuthContext> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw unauthorized("Missing bearer token.");

  const token = header.slice("Bearer ".length).trim();
  if (!token) throw unauthorized("Missing bearer token.");

  try {
    const { userId, email } = await verifyAccessToken(token);
    return { userId, email };
  } catch (error) {
    if (error instanceof InvalidAccessTokenError) throw unauthorized("Invalid or expired access token.");
    throw error;
  }
}

/**
 * Confirms `workspaceId` belongs to `userId`, the mobile-API equivalent of
 * the web app's requireWorkspace() (src/lib/session.ts) minus the cookie —
 * the mobile client sends its selected workspace explicitly on every
 * request instead. Throws a MobileApiError(403) otherwise.
 */
export async function requireMobileWorkspace(userId: string, workspaceId: string | null | undefined) {
  if (!workspaceId) throw forbidden("workspaceId is required.");
  const workspaces = await listWorkspaces(userId);
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) throw forbidden("Workspace not found or not yours.");
  return workspace;
}
