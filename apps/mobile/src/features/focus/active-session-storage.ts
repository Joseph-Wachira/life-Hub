import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FocusSessionType } from "@lifehub/shared";

const KEY = "lifehub.activeFocusSession";

export interface StoredActiveSession {
  id: string;
  startedAt: string;
  plannedMinutes: number;
  type: FocusSessionType;
}

/**
 * Persists only the session id + start time — never a countdown value —
 * so resuming after the app is backgrounded or killed is just "now minus
 * startedAt" instead of trying to keep a timer alive in the background.
 */
export async function loadActiveSession(): Promise<StoredActiveSession | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as StoredActiveSession) : null;
}

export async function saveActiveSession(session: StoredActiveSession | null): Promise<void> {
  if (session) await AsyncStorage.setItem(KEY, JSON.stringify(session));
  else await AsyncStorage.removeItem(KEY);
}
