import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  mobileApiPaths,
  type FocusSettings,
  type MobileFocusSession,
  type StartFocusSessionInput,
  type EndFocusSessionInput,
} from "@lifehub/shared";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export function useFocusSettings() {
  return useQuery({
    queryKey: ["focusSettings"],
    queryFn: () => apiClient.get<FocusSettings>(mobileApiPaths.focusSettings()),
  });
}

export function useFocusSessions(limit = 20) {
  const { activeWorkspaceId } = useAuth();
  return useQuery({
    queryKey: ["focusSessions", activeWorkspaceId, limit],
    queryFn: () =>
      apiClient.get<MobileFocusSession[]>(`${mobileApiPaths.focusSessions()}?workspaceId=${activeWorkspaceId}&limit=${limit}`),
    enabled: !!activeWorkspaceId,
  });
}

export function useStartFocusSession() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StartFocusSessionInput) =>
      apiClient.post<MobileFocusSession>(mobileApiPaths.focusSessions(), { ...input, workspaceId: activeWorkspaceId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["focusSessions", activeWorkspaceId] }),
  });
}

export function useEndFocusSession() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: EndFocusSessionInput }) =>
      apiClient.patch<MobileFocusSession>(mobileApiPaths.focusSession(id), { ...patch, workspaceId: activeWorkspaceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["focusSessions", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["today", activeWorkspaceId] });
    },
  });
}
