import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * expo-secure-store has no web implementation. The app targets iOS/Android
 * only, but `expo start --web` is still handy for quick UI iteration, so
 * this falls back to an in-memory store there rather than crashing — it's
 * explicitly NOT secure and doesn't survive a reload, which is fine since
 * web is a dev convenience here, not a shipping target.
 */
const memoryFallback = new Map<string, string>();
const isWeb = Platform.OS === "web";

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    memoryFallback.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return memoryFallback.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    memoryFallback.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

const ACCESS_TOKEN_KEY = "lifehub.accessToken";
const REFRESH_TOKEN_KEY = "lifehub.refreshToken";
const ACTIVE_WORKSPACE_KEY = "lifehub.activeWorkspaceId";

export const tokenStorage = {
  async getTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const [accessToken, refreshToken] = await Promise.all([getItem(ACCESS_TOKEN_KEY), getItem(REFRESH_TOKEN_KEY)]);
    return { accessToken, refreshToken };
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([setItem(ACCESS_TOKEN_KEY, accessToken), setItem(REFRESH_TOKEN_KEY, refreshToken)]);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(REFRESH_TOKEN_KEY)]);
  },

  async getActiveWorkspaceId(): Promise<string | null> {
    return getItem(ACTIVE_WORKSPACE_KEY);
  },

  async setActiveWorkspaceId(workspaceId: string): Promise<void> {
    await setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
  },
};
