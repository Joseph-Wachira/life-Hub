import type { NextRequest } from "next/server";
import type { MobileWorkspace } from "@lifehub/shared";
import { listWorkspaces } from "@/lib/services/workspace";
import { authenticateMobileRequest } from "@/lib/mobile/auth";
import { toMobileWorkspace } from "@/lib/mobile/dto";
import { mobileJson, withMobileErrors } from "@/lib/mobile/http";

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const workspaces = await listWorkspaces(userId);
  return mobileJson<MobileWorkspace[]>(workspaces.map(toMobileWorkspace));
});
