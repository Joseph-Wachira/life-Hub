import { useMutationState } from "@tanstack/react-query";

/** Counts in-flight AND offline-paused mutations (both report status "pending") for a global "N changes syncing" indicator. */
export function usePendingMutationsCount(): number {
  const pending = useMutationState({ filters: { status: "pending" }, select: (mutation) => mutation.state.status });
  return pending.length;
}
