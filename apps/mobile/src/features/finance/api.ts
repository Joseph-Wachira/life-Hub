import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mobileApiPaths, type FinanceSnapshot, type MobileTransaction, type CreateTransactionInput } from "@lifehub/shared";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export function useFinanceSummary() {
  const { activeWorkspaceId } = useAuth();
  return useQuery({
    queryKey: ["financeSummary", activeWorkspaceId],
    queryFn: () => apiClient.get<FinanceSnapshot>(`${mobileApiPaths.financeSummary()}?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });
}

export function useTransactions(limit = 20) {
  const { activeWorkspaceId } = useAuth();
  return useQuery({
    queryKey: ["transactions", activeWorkspaceId, limit],
    queryFn: () =>
      apiClient.get<MobileTransaction[]>(`${mobileApiPaths.transactions()}?workspaceId=${activeWorkspaceId}&limit=${limit}`),
    enabled: !!activeWorkspaceId,
  });
}

export function useCreateTransaction() {
  const { activeWorkspaceId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      apiClient.post<MobileTransaction>(mobileApiPaths.transactions(), { ...input, workspaceId: activeWorkspaceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["financeSummary", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["today", activeWorkspaceId] });
    },
  });
}
