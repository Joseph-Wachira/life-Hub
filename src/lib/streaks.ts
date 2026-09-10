function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function midnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Pure streak calculation — no I/O, safe to use in both server and client
 * code (and to unit test directly). Only days whose weekday (0=Sun..6=Sat)
 * is in `activeDaysOfWeek` count toward or break a streak; other days are
 * skipped entirely.
 */
export function computeStreaks(
  loggedDates: Date[],
  activeDaysOfWeek: number[],
  today: Date
): { current: number; longest: number } {
  if (loggedDates.length === 0) return { current: 0, longest: 0 };

  const loggedSet = new Set(loggedDates.map(dateKey));
  const activeSet = new Set(activeDaysOfWeek);

  const earliest = loggedDates.reduce((min, d) => (d < min ? d : min), loggedDates[0]);
  const eligibleDays: Date[] = [];
  const cursor = midnight(earliest);
  const end = midnight(today);
  while (cursor <= end) {
    if (activeSet.has(cursor.getDay())) eligibleDays.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  let longest = 0;
  let run = 0;
  for (const day of eligibleDays) {
    if (loggedSet.has(dateKey(day))) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let i = eligibleDays.length - 1; i >= 0; i--) {
    if (loggedSet.has(dateKey(eligibleDays[i]))) current += 1;
    else break;
  }

  return { current, longest };
}

export function dateKeyOf(d: Date) {
  return dateKey(d);
}
