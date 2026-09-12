import type { NextRequest } from "next/server";
import type { MeResponse } from "@lifehub/shared";
import { db } from "@/lib/db";
import { listWorkspaces } from "@/lib/services/workspace";
import { authenticateMobileRequest } from "@/lib/mobile/auth";
import { toMobileUser, toMobileWorkspace } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors, unauthorized } from "@/lib/mobile/http";

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized("Account no longer exists.");

  const workspaces = await listWorkspaces(userId);
  const response: MeResponse = {
    user: toMobileUser(user),
    workspaces: workspaces.map(toMobileWorkspace),
  };
  return mobileJson(response);
});
