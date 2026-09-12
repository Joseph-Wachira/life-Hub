import { QueryClient, onlineManager } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

// "offlineFirst" (rather than the default "online") is what makes a paused
// mutation/query resume automatically once `onlineManager` reports back
// online — this is the whole offline-mutation-queue for this app: no
// hand-rolled queue, just TanStack Query's built-in pause/resume wired to
// real connectivity state below.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 30,
      retry: 2,
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
      retry: 1,
    },
  },
});

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected === true && state.isInternetReachable !== false);
  });
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "lifehub-query-cache",
});

export const PERSIST_OPTIONS = {
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24,
  buster: "v1",
};
