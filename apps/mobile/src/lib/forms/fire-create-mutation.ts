import { NetworkError } from "@/lib/api/client";

interface FireCreateMutationOptions<T> {
  mutateAsync: () => Promise<T>;
  /** Called once, either right after a fast success or after `timeoutMs` if the request is still in flight (offline/slow). */
  onNavigateAway: () => void;
  /** Called only for a real (non-network) failure the user is still around to see. */
  onError: (message: string) => void;
  timeoutMs?: number;
}

/**
 * Submits a "create X" mutation without blocking the modal on the network.
 * A create mutation runs with `networkMode: 'offlineFirst'`
 * (src/lib/api/query-client.ts), so while offline its promise stays pending
 * — queued, not failed — until connectivity returns. Waiting on that promise
 * directly would leave the modal stuck open. Instead: race a short timeout
 * against the real request. Fast success/failure (the common online case)
 * behaves normally — errors stay on screen so the user can fix them. If nothing
 * has settled after `timeoutMs`, navigate away anyway and trust the global
 * sync banner (usePendingMutationsCount) to reflect that it's still queued.
 */
export function fireCreateMutation<T>({ mutateAsync, onNavigateAway, onError, timeoutMs = 2500 }: FireCreateMutationOptions<T>): void {
  let navigated = false;

  const timer = setTimeout(() => {
    navigated = true;
    onNavigateAway();
  }, timeoutMs);

  mutateAsync()
    .then(() => {
      clearTimeout(timer);
      if (!navigated) onNavigateAway();
    })
    .catch((error: unknown) => {
      clearTimeout(timer);
      if (navigated) return;
      if (error instanceof NetworkError) {
        onNavigateAway();
        return;
      }
      onError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    });
}
