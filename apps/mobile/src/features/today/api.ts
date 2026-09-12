import { useQuery } from "@tanstack/react-query";
import { mobileApiPaths, type TodaySummary } from "@lifehub/shared";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export function useTodaySummary() {
  const { activeWorkspaceId } = useAuth();
  return useQuery({
    queryKey: ["today", activeWorkspaceId],
    queryFn: () => apiClient.get<TodaySummary>(mobileApiPaths.today(activeWorkspaceId as string)),
    enabled: !!activeWorkspaceId,
  });
}
