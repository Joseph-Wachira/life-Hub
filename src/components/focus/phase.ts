/**
 * Pure, framework-free timer logic for the Focus module.
 * No imports from "@/lib/db" or any server-only module here — this file is
 * imported directly by the client-side timer component, so it must stay
 * safe to bundle for the browser (and trivially unit-testable).
 */

export type FocusPhase = "focus" | "short_break" | "long_break";

export const PHASE_LABELS: Record<FocusPhase, string> = {
  focus: "Focus",
  short_break: "Short break",
  long_break: "Long break",
};

/**
 * Determines the next Pomodoro phase.
 *
 * `completedFocusSessions` is the *total* number of focus sessions completed
 * so far, counting the one that just finished (i.e. increment the counter
 * before calling this when a focus phase completes). Because the check is a
 * modulo against that running total, the cycle repeats correctly forever
 * without needing to reset the counter after each long break.
 */
export function nextPhase(
  current: FocusPhase,
  completedFocusSessions: number,
  sessionsBeforeLongBreak: number
): FocusPhase {
  if (current === "focus") {
    const n = Math.max(1, Math.floor(sessionsBeforeLongBreak) || 1);
    if (completedFocusSessions > 0 && completedFocusSessions % n === 0) {
      return "long_break";
    }
    return "short_break";
  }
  // Both short and long breaks lead back to a focus phase.
  return "focus";
}

/** Formats a whole number of seconds as "MM:SS" (or "H:MM:SS" past an hour). */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
