import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mobileApiPaths, type MobileHabit } from "@lifehub/shared";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export function useHabits() {
  const { activeWorkspaceId } = useAuth();
  return useQuery({
    queryKey: ["habits", activeWorkspaceId],
    queryFn: () => apiClient.get<MobileHabit[]>(`${mobileApiPaths.habits()}?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });
}

export function useToggleHabit() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) =>
      apiClient.post<MobileHabit>(mobileApiPaths.toggleHabit(habitId), { workspaceId: activeWorkspaceId }),
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: ["habits", activeWorkspaceId] });
      const previous = queryClient.getQueryData<MobileHabit[]>(["habits", activeWorkspaceId]);
      queryClient.setQueryData<MobileHabit[]>(["habits", activeWorkspaceId], (old) =>
        old?.map((habit) => {
          if (habit.id !== habitId) return habit;
          const nextCount = habit.todayCompletedCount >= habit.targetPerDay ? 0 : habit.todayCompletedCount + 1;
          return { ...habit, todayCompletedCount: nextCount, doneToday: nextCount >= habit.targetPerDay };
        })
      );
      return { previous };
    },
    onError: (_error, _habitId, context) => {
      if (context?.previous) queryClient.setQueryData(["habits", activeWorkspaceId], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["today", activeWorkspaceId] });
    },
  });
}
