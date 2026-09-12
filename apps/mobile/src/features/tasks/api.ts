import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  mobileApiPaths,
  type MobileTask,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskStatus,
  type TaskPriority,
} from "@lifehub/shared";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
}

function taskListPath(workspaceId: string, filters: TaskFilters) {
  const params = new URLSearchParams({ workspaceId });
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.search) params.set("search", filters.search);
  return `${mobileApiPaths.tasks()}?${params.toString()}`;
}

export function useTasks(filters: TaskFilters = {}) {
  const { activeWorkspaceId } = useAuth();
  return useQuery({
    queryKey: ["tasks", activeWorkspaceId, filters],
    queryFn: () => apiClient.get<MobileTask[]>(taskListPath(activeWorkspaceId as string, filters)),
    enabled: !!activeWorkspaceId,
  });
}

export function useTask(id: string | null) {
  const { activeWorkspaceId } = useAuth();
  return useQuery({
    queryKey: ["task", activeWorkspaceId, id],
    queryFn: () => apiClient.get<MobileTask>(`${mobileApiPaths.task(id as string)}?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId && !!id,
  });
}

export function useCreateTask() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      apiClient.post<MobileTask>(mobileApiPaths.tasks(), { ...input, workspaceId: activeWorkspaceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["today", activeWorkspaceId] });
    },
  });
}

/** Full edit (title/priority/due date/etc). Not optimistic — this comes from an explicit form submit, not a tap. */
export function useUpdateTask() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTaskInput }) =>
      apiClient.patch<MobileTask>(mobileApiPaths.task(id), { ...patch, workspaceId: activeWorkspaceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["today", activeWorkspaceId] });
    },
  });
}

/** One-tap complete/reopen from a list row — optimistic so it feels instant, including while offline (the mutation just queues). */
export function useToggleTaskDone() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      apiClient.patch<MobileTask>(mobileApiPaths.task(id), {
        status: done ? "DONE" : "TODO",
        workspaceId: activeWorkspaceId,
      }),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", activeWorkspaceId] });
      const previous = queryClient.getQueriesData<MobileTask[]>({ queryKey: ["tasks", activeWorkspaceId] });
      queryClient.setQueriesData<MobileTask[]>({ queryKey: ["tasks", activeWorkspaceId] }, (old) =>
        old?.map((task) => (task.id === id ? { ...task, status: done ? "DONE" : "TODO" } : task))
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["today", activeWorkspaceId] });
    },
  });
}

export function useDeleteTask() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ ok: true }>(`${mobileApiPaths.task(id)}?workspaceId=${activeWorkspaceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["today", activeWorkspaceId] });
    },
  });
}
