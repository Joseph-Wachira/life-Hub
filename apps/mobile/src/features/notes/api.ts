import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mobileApiPaths, type MobileNote, type CreateNoteInput, type UpdateNoteInput } from "@lifehub/shared";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export function useNotes(query?: string) {
  const { activeWorkspaceId } = useAuth();
  const params = new URLSearchParams({ workspaceId: activeWorkspaceId ?? "" });
  if (query) params.set("q", query);
  return useQuery({
    queryKey: ["notes", activeWorkspaceId, query ?? ""],
    queryFn: () => apiClient.get<MobileNote[]>(`${mobileApiPaths.notes()}?${params.toString()}`),
    enabled: !!activeWorkspaceId,
  });
}

export function useNote(id: string | null) {
  const { activeWorkspaceId } = useAuth();
  return useQuery({
    queryKey: ["note", activeWorkspaceId, id],
    queryFn: () => apiClient.get<MobileNote>(`${mobileApiPaths.note(id as string)}?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId && !!id,
  });
}

export function useCreateNote() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNoteInput) =>
      apiClient.post<MobileNote>(mobileApiPaths.notes(), { ...input, workspaceId: activeWorkspaceId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes", activeWorkspaceId] }),
  });
}

export function useUpdateNote() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateNoteInput }) =>
      apiClient.patch<MobileNote>(mobileApiPaths.note(id), { ...patch, workspaceId: activeWorkspaceId }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["notes", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["note", activeWorkspaceId, id] });
    },
  });
}
