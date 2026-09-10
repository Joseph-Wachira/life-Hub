import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/session";
import { PageHeader } from "@/components/layout/page-header";
import { FocusTimer } from "@/components/focus/focus-timer";
import { FocusAnalytics } from "@/components/focus/focus-analytics";
import { FocusHistory } from "@/components/focus/focus-history";
import {
  getFocusAnalytics,
  getUserFocusSettings,
  listOpenTasks,
  listRecentFocusSessions,
} from "@/lib/services/focus";

export const metadata: Metadata = { title: "Focus" };

export default async function FocusPage() {
  const { userId, workspace } = await requireWorkspace();

  const [settings, tasks, sessions, analytics] = await Promise.all([
    getUserFocusSettings(userId),
    listOpenTasks(workspace.id),
    listRecentFocusSessions(workspace.id),
    getFocusAnalytics(workspace.id),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Focus"
        description="Run a Pomodoro or deep-work timer, then review how your focus time adds up."
      />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <FocusTimer settings={settings} tasks={tasks} />
        <FocusAnalytics
          sessionsToday={analytics.sessionsToday}
          weekMinutes={analytics.weekMinutes}
          averageRating={analytics.averageRating}
          dailyMinutes={analytics.dailyMinutes}
        />
        <FocusHistory sessions={sessions} />
      </div>
    </div>
  );
}
