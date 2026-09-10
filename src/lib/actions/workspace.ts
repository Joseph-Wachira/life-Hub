"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/constants/cookies";
import type { ActionResult } from "@/lib/actions/auth";

export async function switchWorkspaceAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, userId: session.user.id },
  });
  if (!workspace) return;

  const jar = await cookies();
  jar.set(ACTIVE_WORKSPACE_COOKIE, workspace.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
}

export async function createWorkspaceAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  const workspace = await db.workspace.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  const jar = await cookies();
  jar.set(ACTIVE_WORKSPACE_COOKIE, workspace.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return { success: true };
}
