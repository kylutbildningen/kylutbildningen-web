/**
 * Simple in-memory sliding-window rate limiter.
 *
 * State lives per server instance, so on Vercel it limits per warm instance
 * rather than globally — enough to stop casual abuse of the public form/AI
 * endpoints. For hard global limits, add a Vercel Firewall rate-limit rule.
 */

interface Limit {
  windowMs: number;
  max: number;
}

const hits = new Map<string, number[]>();
const MAX_WINDOW_MS = 24 * 3600_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < 600_000) return;
  lastCleanup = now;
  for (const [key, timestamps] of hits) {
    const fresh = timestamps.filter((t) => now - t < MAX_WINDOW_MS);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}

/**
 * Returns true if `key` has exceeded any of the limits. A request that is
 * allowed is counted; a rejected one is not.
 */
export function isRateLimited(key: string, limits: Limit[]): boolean {
  const now = Date.now();
  cleanup(now);

  const timestamps = hits.get(key) ?? [];
  const limited = limits.some(
    ({ windowMs, max }) => timestamps.filter((t) => now - t < windowMs).length >= max,
  );
  if (limited) return true;

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const MINUTE = 60_000;
export const HOUR = 3600_000;
export const DAY = 24 * HOUR;
