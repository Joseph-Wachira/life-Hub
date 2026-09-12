import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mobileApiPaths, registerPushTokenSchema, type MobileNotification } from "@lifehub/shared";
import { z } from "zod";
import { apiClient } from "@/lib/api/client";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<MobileNotification[]>(mobileApiPaths.notifications()),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch<{ ok: true }>(mobileApiPaths.markNotificationRead(id)),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<MobileNotification[]>(["notifications"]);
      queryClient.setQueryData<MobileNotification[]>(["notifications"], (old) =>
        old?.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["notifications"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ ok: true; count: number }>(mobileApiPaths.markAllNotificationsRead()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export type RegisterPushTokenInput = z.infer<typeof registerPushTokenSchema>;

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: (input: RegisterPushTokenInput) => apiClient.post<{ ok: true }>(mobileApiPaths.pushToken(), input),
  });
}
