"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Pause, Play, Plus, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatClock, nextPhase, PHASE_LABELS, type FocusPhase } from "./phase";
import { SessionCompleteDialog, type PendingFocusSession } from "./session-complete-dialog";
import { clamp } from "@/lib/utils";
import type { FocusTimerSettings } from "@/lib/services/focus";

type TimerMode = "pomodoro" | "deep_work";
type RunState = "idle" | "running" | "paused";

const NO_TASK = "__none__";
const DEEP_WORK_PRESETS = [50, 90];

export interface FocusTaskOption {
  id: string;
  title: string;
}

export function FocusTimer({
  settings,
  tasks,
}: {
  settings: FocusTimerSettings;
  tasks: FocusTaskOption[];
}) {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [phase, setPhase] = useState<FocusPhase>("focus");
  const [deepWorkMinutes, setDeepWorkMinutes] = useState(50);
  const [completedFocusCount, setCompletedFocusCount] = useState(0);
  const [runState, setRunState] = useState<RunState>("idle");
  const [selectedTaskId, setSelectedTaskId] = useState(NO_TASK);
  const [interruptions, setInterruptions] = useState(0);
  const [pendingSession, setPendingSession] = useState<PendingFocusSession | null>(null);

  const [totalMs, setTotalMs] = useState(() => settings.pomodoroWorkMinutes * 60000);
  const [remainingMs, setRemainingMs] = useState(() => settings.pomodoroWorkMinutes * 60000);

  // Mutable run bookkeeping that shouldn't itself trigger re-renders.
  const accumulatedMsRef = useRef(0);
  const runStartRef = useRef<number | null>(null);
  const sessionStartedAtRef = useRef<Date | null>(null);

  function phaseDurationMinutesFor(p: FocusPhase) {
    if (p === "focus") return settings.pomodoroWorkMinutes;
    if (p === "short_break") return settings.pomodoroShortBreakMinutes;
    return settings.pomodoroLongBreakMinutes;
  }

  function currentDurationMinutes() {
    return mode === "deep_work" ? deepWorkMinutes : phaseDurationMinutesFor(phase);
  }

  const isFocusType = mode === "deep_work" || phase === "focus";

  // Keep the displayed duration in sync while idle (mode/phase/duration changes).
  useEffect(() => {
    if (runState !== "idle") return;
    const ms = currentDurationMinutes() * 60000;
    setTotalMs(ms);
    setRemainingMs(ms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, deepWorkMinutes, runState, settings]);

  // Tick the countdown while running — timestamp-based so it stays correct
  // even if the interval is throttled (e.g. a backgrounded tab).
  useEffect(() => {
    if (runState !== "running") return;
    const tick = () => {
      const runningElapsed = runStartRef.current != null ? Date.now() - runStartRef.current : 0;
      setRemainingMs(Math.max(0, totalMs - (accumulatedMsRef.current + runningElapsed)));
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [runState, totalMs]);

  // React to the countdown hitting zero while running.
  useEffect(() => {
    if (runState === "running" && remainingMs <= 0) {
      finishPhase(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, runState]);

  function finishPhase(completedFully: boolean) {
    const now = new Date();
    const runningElapsed = runStartRef.current != null ? Date.now() - runStartRef.current : 0;
    const elapsedMs = accumulatedMsRef.current + runningElapsed;
    const plannedMinutes = Math.max(1, Math.round(totalMs / 60000));
    const actualMinutes = completedFully ? plannedMinutes : Math.max(1, Math.round(elapsedMs / 60000));
    const startedAt = sessionStartedAtRef.current ?? now;
    const wasFocusType = mode === "deep_work" || phase === "focus";
    const interruptionsAtEnd = interruptions;
    const effectiveTaskId = selectedTaskId === NO_TASK ? undefined : selectedTaskId || undefined;
    const taskTitle = tasks.find((t) => t.id === effectiveTaskId)?.title;

    accumulatedMsRef.current = 0;
    runStartRef.current = null;
    sessionStartedAtRef.current = null;
    setInterruptions(0);
    setRunState("idle");

    if (mode === "pomodoro" && completedFully) {
      const wasBreak = phase !== "focus";
      let next: FocusPhase;
      if (phase === "focus") {
        const newCount = completedFocusCount + 1;
        setCompletedFocusCount(newCount);
        next = nextPhase("focus", newCount, settings.sessionsBeforeLongBreak);
      } else {
        next = nextPhase(phase, completedFocusCount, settings.sessionsBeforeLongBreak);
      }
      setPhase(next);
      const ms = phaseDurationMinutesFor(next) * 60000;
      setTotalMs(ms);
      setRemainingMs(ms);
      if (wasBreak) toast.success("Break's over — back to focus.");
    } else {
      // A manual stop, or a deep-work session ending: stay on the same
      // phase/mode and just reset the clock for another attempt.
      const ms = currentDurationMinutes() * 60000;
      setTotalMs(ms);
      setRemainingMs(ms);
    }

    if (wasFocusType) {
      setPendingSession({
        type: mode === "deep_work" ? "DEEP_WORK" : "POMODORO",
        plannedMinutes,
        actualMinutes,
        startedAt: startedAt.toISOString(),
        endedAt: now.toISOString(),
        taskId: effectiveTaskId,
        taskTitle,
        interruptions: interruptionsAtEnd,
        completedFully,
      });
    }
  }

  function handleStart() {
    if (runState === "paused") {
      runStartRef.current = Date.now();
      setRunState("running");
      return;
    }
    const ms = currentDurationMinutes() * 60000;
    accumulatedMsRef.current = 0;
    runStartRef.current = Date.now();
    sessionStartedAtRef.current = new Date();
    setInterruptions(0);
    setTotalMs(ms);
    setRemainingMs(ms);
    setRunState("running");
  }

  function handlePause() {
    if (runState !== "running") return;
    accumulatedMsRef.current += runStartRef.current != null ? Date.now() - runStartRef.current : 0;
    runStartRef.current = null;
    setRunState("paused");
  }

  function handleReset() {
    accumulatedMsRef.current = 0;
    runStartRef.current = null;
    sessionStartedAtRef.current = null;
    setInterruptions(0);
    setRunState("idle");
    const ms = currentDurationMinutes() * 60000;
    setTotalMs(ms);
    setRemainingMs(ms);
  }

  const progressPct = totalMs > 0 ? clamp(((totalMs - remainingMs) / totalMs) * 100, 0, 100) : 0;
  const sessionInCycle = useMemo(
    () => (completedFocusCount % Math.max(1, settings.sessionsBeforeLongBreak)) + 1,
    [completedFocusCount, settings.sessionsBeforeLongBreak]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] sm:p-10">
        <Tabs value={mode} onValueChange={(v) => runState === "idle" && setMode(v as TimerMode)}>
          <TabsList>
            <TabsTrigger value="pomodoro" disabled={runState !== "idle"}>
              Pomodoro
            </TabsTrigger>
            <TabsTrigger value="deep_work" disabled={runState !== "idle"}>
              Deep work
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "deep_work" && runState === "idle" && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {DEEP_WORK_PRESETS.map((m) => (
              <Button
                key={m}
                type="button"
                size="sm"
                variant={deepWorkMinutes === m ? "default" : "outline"}
                onClick={() => setDeepWorkMinutes(m)}
              >
                {m} min
              </Button>
            ))}
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                max={240}
                value={deepWorkMinutes}
                onChange={(e) => setDeepWorkMinutes(clamp(Number(e.target.value) || 1, 1, 240))}
                className="w-20"
                aria-label="Custom deep work minutes"
              />
              <span className="text-xs text-[var(--muted-foreground)]">min custom</span>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-1">
          <Badge variant={isFocusType ? "default" : "secondary"} className="text-sm">
            {mode === "deep_work" ? "Deep work" : PHASE_LABELS[phase]}
          </Badge>
          {mode === "pomodoro" && phase === "focus" && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Session {sessionInCycle} of {settings.sessionsBeforeLongBreak} before a long break
            </p>
          )}
        </div>

        <div className="text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl">
          {formatClock(remainingMs / 1000)}
        </div>

        <Progress value={progressPct} className="w-full max-w-sm" />

        <div className="flex flex-wrap items-center justify-center gap-2">
          {runState !== "running" ? (
            <Button size="lg" onClick={handleStart}>
              <Play /> {runState === "paused" ? "Resume" : "Start"}
            </Button>
          ) : (
            <Button size="lg" variant="secondary" onClick={handlePause}>
              <Pause /> Pause
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={handleReset} disabled={runState === "idle"}>
            <RotateCcw /> Reset
          </Button>
          {isFocusType && runState !== "idle" && (
            <Button size="lg" variant="outline" onClick={() => finishPhase(false)}>
              <Square /> Stop &amp; log
            </Button>
          )}
        </div>

        {isFocusType && runState !== "idle" && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setInterruptions((n) => n + 1)}>
            <Plus /> +1 interruption{interruptions > 0 ? ` (${interruptions})` : ""}
          </Button>
        )}

        {isFocusType && runState === "idle" ? (
          <div className="flex w-full max-w-sm flex-col gap-1.5">
            <Label htmlFor="focus-task">Working on (optional)</Label>
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger id="focus-task">
                <SelectValue placeholder="No task selected" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TASK}>No task</SelectItem>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : !isFocusType ? (
          <p className="text-sm text-[var(--muted-foreground)]">Take a breather — no task tracking during breaks.</p>
        ) : null}
      </div>

      <SessionCompleteDialog pending={pendingSession} onSaved={() => setPendingSession(null)} />
    </div>
  );
}
