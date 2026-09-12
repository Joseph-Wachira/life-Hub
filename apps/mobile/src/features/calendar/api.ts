import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mobileApiPaths, type MobileEventOccurrence, type CreateEventInput } from "@lifehub/shared";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export function useEvents(from: Date, to: Date) {
  const { activeWorkspaceId } = useAuth();
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  return useQuery({
    queryKey: ["events", activeWorkspaceId, fromIso, toIso],
    queryFn: () =>
      apiClient.get<MobileEventOccurrence[]>(
        `${mobileApiPaths.events()}?workspaceId=${activeWorkspaceId}&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
      ),
    enabled: !!activeWorkspaceId,
  });
}

export function useEvent(id: string | null) {
  const { activeWorkspaceId } = useAuth();
  return useQuery({
    queryKey: ["event", activeWorkspaceId, id],
    queryFn: () => apiClient.get<MobileEventOccurrence>(`${mobileApiPaths.event(id as string)}?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId && !!id,
  });
}

export function useCreateEvent() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) =>
      apiClient.post<MobileEventOccurrence>(mobileApiPaths.events(), { ...input, workspaceId: activeWorkspaceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["today", activeWorkspaceId] });
    },
  });
}
