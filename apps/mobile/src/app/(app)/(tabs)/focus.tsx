import { useEffect, useMemo, useState } from "react";
import { View, Pressable, AppState, type AppStateStatus } from "react-native";
import { Play, Square, Timer as TimerIcon } from "lucide-react-native";
import type { FocusSessionType } from "@lifehub/shared";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { useFocusSettings, useFocusSessions, useStartFocusSession, useEndFocusSession } from "@/features/focus/api";
import { loadActiveSession, saveActiveSession, type StoredActiveSession } from "@/features/focus/active-session-storage";
import { useAppTheme } from "@/theme/use-app-theme";
import { formatDayLabel } from "@/lib/format/date";

const DURATIONS = [15, 25, 45, 60];
type Phase = "idle" | "running" | "completing";

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function sessionLabel(type: FocusSessionType, taskTitle?: string | null): string {
  if (taskTitle) return taskTitle;
  if (type === "POMODORO") return "Pomodoro";
  if (type === "DEEP_WORK") return "Deep work";
  return "Custom session";
}

export default function FocusScreen() {
  const theme = useAppTheme();
  const { data: settings } = useFocusSettings();
  const { data: sessions, isPending, isError, error, refetch, isRefetching } = useFocusSessions(15);
  const startSession = useStartFocusSession();
  const endSession = useEndFocusSession();

  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [active, setActive] = useState<StoredActiveSession | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [phase, setPhase] = useState<Phase>("idle");
  const [rating, setRating] = useState<number | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [elapsedAtEnd, setElapsedAtEnd] = useState(0);

  useEffect(() => {
    if (settings) setPlannedMinutes(settings.pomodoroWorkMinutes);
  }, [settings]);

  // Resume an in-progress session across app restarts.
  useEffect(() => {
    loadActiveSession().then((stored) => {
      if (stored) {
        setActive(stored);
        setPhase("running");
      }
    });
  }, []);

  // Tick every second while running, and immediately re-check on foreground
  // resume so a session that finished while backgrounded completes right
  // away instead of waiting for the next tick.
  useEffect(() => {
    if (phase !== "running") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener("change", (status: AppStateStatus) => {
      if (status === "active") setNow(Date.now());
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [phase]);

  const remainingSeconds = useMemo(() => {
    if (!active) return plannedMinutes * 60;
    const elapsed = Math.floor((now - new Date(active.startedAt).getTime()) / 1000);
    return active.plannedMinutes * 60 - elapsed;
  }, [active, now, plannedMinutes]);

  useEffect(() => {
    if (phase === "running" && active && remainingSeconds <= 0) {
      finishSession(active, active.plannedMinutes);
    }
  }, [phase, active, remainingSeconds]);

  function finishSession(session: StoredActiveSession, actualMinutes: number) {
    setPendingSessionId(session.id);
    setElapsedAtEnd(actualMinutes);
    setPhase("completing");
  }

  async function handleStart(type: FocusSessionType) {
    const session = await startSession.mutateAsync({ type, plannedMinutes });
    const stored: StoredActiveSession = { id: session.id, startedAt: session.startedAt, plannedMinutes, type };
    await saveActiveSession(stored);
    setActive(stored);
    setPhase("running");
  }

  function handleEndEarly() {
    if (!active) return;
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - new Date(active.startedAt).getTime()) / 60000));
    finishSession(active, elapsedMinutes);
  }

  async function confirmFinish(skipRating: boolean) {
    if (!pendingSessionId) return;
    await endSession.mutateAsync({
      id: pendingSessionId,
      patch: { actualMinutes: elapsedAtEnd, interruptions: 0, rating: skipRating || !rating ? undefined : rating },
    });
    await saveActiveSession(null);
    setActive(null);
    setPendingSessionId(null);
    setRating(null);
    setPhase("idle");
  }

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      <Text variant="largeTitle">Focus</Text>

      <Card style={{ alignItems: "center", gap: theme.spacing.lg, paddingVertical: theme.spacing.xl }}>
        {phase === "completing" ? (
          <View style={{ gap: theme.spacing.md, alignItems: "center", width: "100%" }}>
            <Text variant="subtitle">Nice work — {elapsedAtEnd} min focused</Text>
            <Text variant="caption" color="muted">
              Rate this session (optional)
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setRating(n)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${n} out of 5`}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: rating && rating >= n ? theme.colors.brand : theme.colors.surfaceSunken,
                    }}
                  >
                    <Text style={{ color: rating && rating >= n ? theme.colors.onBrand : theme.colors.mutedText }}>{n}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: theme.spacing.md, width: "100%" }}>
              <View style={{ flex: 1 }}>
                <Button label="Skip" variant="secondary" onPress={() => confirmFinish(true)} fullWidth />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Save" onPress={() => confirmFinish(false)} loading={endSession.isPending} fullWidth />
              </View>
            </View>
          </View>
        ) : phase === "running" ? (
          <>
            <Text style={{ fontSize: 56, fontWeight: "700", color: theme.colors.text, fontVariant: ["tabular-nums"] }}>
              {formatClock(remainingSeconds)}
            </Text>
            <Text variant="body" color="muted">
              Stay focused. You&apos;ve got this.
            </Text>
            <Button
              label="End session"
              variant="secondary"
              onPress={handleEndEarly}
              icon={<Square size={16} color={theme.colors.text} />}
            />
          </>
        ) : (
          <>
            <TimerIcon size={40} color={theme.colors.brand} />
            <SegmentedControl
              value={String(plannedMinutes)}
              onChange={(value) => setPlannedMinutes(Number(value))}
              options={DURATIONS.map((d) => ({ value: String(d), label: `${d}m` }))}
            />
            <Button
              label="Start Pomodoro"
              onPress={() => handleStart("POMODORO")}
              loading={startSession.isPending}
              icon={<Play size={16} color={theme.colors.onBrand} />}
              size="lg"
              fullWidth
            />
            <Button label="Start custom timer" variant="ghost" onPress={() => handleStart("CUSTOM")} fullWidth />
          </>
        )}
      </Card>

      <View>
        <Text variant="subtitle" style={{ marginBottom: theme.spacing.sm }}>
          Session history
        </Text>
        {isPending ? (
          <SkeletonList rows={3} />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : !sessions || sessions.length === 0 ? (
          <EmptyState icon={TimerIcon} title="No sessions yet" description="Start your first focus session above." />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {sessions.map((session) => (
              <Card key={session.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ gap: 2 }}>
                  <Text variant="body">{sessionLabel(session.type, session.task?.title)}</Text>
                  <Text variant="caption" color="muted">
                    {formatDayLabel(session.startedAt)}
                  </Text>
                </View>
                <Text variant="bodyStrong">{session.actualMinutes}m</Text>
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
