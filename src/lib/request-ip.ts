/**
 * Best-effort client IP from a `x-forwarded-for`/`x-real-ip` header, set by
 * Vercel/most reverse proxies in front of this app. Takes a plain
 * `(name) => value` getter so it works against both a Fetch `Headers`
 * (route handlers) and `next/headers`'s `ReadonlyHeaders` (server actions)
 * without depending on either type directly.
 *
 * This is a rate-limiting bucket key, not an auth decision — spoofable if
 * the app is ever exposed directly without a trusted proxy in front, which
 * is an acceptable trade-off here since it only ever makes a limit easier
 * to evade, never something to bypass an authorization check.
 */
export function extractClientIp(getHeader: (name: string) => string | null): string {
  const forwardedFor = getHeader("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return getHeader("x-real-ip") ?? "unknown";
}
