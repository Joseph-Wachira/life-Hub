import type { Metadata } from "next";
import { requireWorkspace } from "@/lib/session";
import {
  listActiveHabits,
  listRecentHabitLogs,
  getTodayMoodCheckIn,
  listMoodHistory,
  getTodayWellbeingLog,
  listWellbeingHistory,
} from "@/lib/services/habits";
import { PageHeader } from "@/components/layout/page-header";
import { HabitsSection } from "@/components/habits/habits-section";
import { MoodPicker } from "@/components/habits/mood-picker";
import { MoodChart } from "@/components/habits/mood-chart";
import { WellbeingForm } from "@/components/habits/wellbeing-form";
import { WellbeingCharts } from "@/components/habits/wellbeing-charts";

export const metadata: Metadata = { title: "Habits" };

export default async function HabitsPage() {
  const { workspace } = await requireWorkspace();

  const [habits, logs, todayMood, moodHistory, todayWellbeing, wellbeingHistory] = await Promise.all([
    listActiveHabits(workspace.id),
    listRecentHabitLogs(workspace.id, 14),
    getTodayMoodCheckIn(workspace.id),
    listMoodHistory(workspace.id, 21),
    getTodayWellbeingLog(workspace.id),
    listWellbeingHistory(workspace.id, 14),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader title="Habits & Wellbeing" description="Streaks, mood check-ins, sleep, exercise, and water." />
      <div className="flex flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <HabitsSection habits={habits} logs={logs} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MoodPicker existing={todayMood} />
          <WellbeingForm existing={todayWellbeing} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MoodChart history={moodHistory} />
          <WellbeingCharts history={wellbeingHistory} />
        </div>
      </div>
    </div>
  );
}
