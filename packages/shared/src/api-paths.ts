/**
 * Single source of truth for mobile API endpoint paths, so the Next.js route
 * folder structure and the Expo client's fetch calls can't silently drift.
 * All paths are relative to the API base URL (no leading `/api/mobile/v1`).
 */
export const mobileApiPaths = {
  login: () => "/auth/login",
  refresh: () => "/auth/refresh",
  logout: () => "/auth/logout",
  me: () => "/auth/me",

  workspaces: () => "/workspaces",

  today: (workspaceId: string) => `/today?workspaceId=${encodeURIComponent(workspaceId)}`,

  tasks: () => "/tasks",
  task: (id: string) => `/tasks/${encodeURIComponent(id)}`,

  events: () => "/events",
  event: (id: string) => `/events/${encodeURIComponent(id)}`,

  focusSettings: () => "/focus/settings",
  focusSessions: () => "/focus/sessions",
  focusSession: (id: string) => `/focus/sessions/${encodeURIComponent(id)}`,

  habits: () => "/habits",
  toggleHabit: (id: string) => `/habits/${encodeURIComponent(id)}/toggle`,

  financeSummary: () => "/finance/summary",
  transactions: () => "/finance/transactions",

  notes: () => "/notes",
  note: (id: string) => `/notes/${encodeURIComponent(id)}`,

  notifications: () => "/notifications",
  markNotificationRead: (id: string) => `/notifications/${encodeURIComponent(id)}/read`,
  markAllNotificationsRead: () => "/notifications/read-all",
  pushToken: () => "/notifications/push-token",
} as const;
