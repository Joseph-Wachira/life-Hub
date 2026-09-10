import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { resolveActiveWorkspace } from "@/lib/services/workspace";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/constants/cookies";

/**
 * Canonical entry point for every protected server component / server action:
 * resolves the signed-in user and their active workspace in one call, or
 * redirects to the right place if either is missing.
 */
export async function requireWorkspace() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const jar = await cookies();
  const { workspaces, active } = await resolveActiveWorkspace(
    session.user.id,
    jar.get(ACTIVE_WORKSPACE_COOKIE)?.value
  );
  if (!active) redirect("/onboarding");

  return { userId: session.user.id, user: session.user, workspace: active, workspaces };
}
