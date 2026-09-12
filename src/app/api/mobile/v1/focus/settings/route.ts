import type { NextRequest } from "next/server";
import { getUserFocusSettings } from "@/lib/services/focus";
import { authenticateMobileRequest } from "@/lib/mobile/auth";
import { mobileJson, withMobileErrors } from "@/lib/mobile/http";

export const GET = withMobileErrors(async (req: NextRequest) => {
  const { userId } = await authenticateMobileRequest(req);
  const settings = await getUserFocusSettings(userId);
  return mobileJson(settings);
});
