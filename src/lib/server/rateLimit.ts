// In-memory sliding-window rate limiter.
// For multi-instance deployments replace the Map with a shared Redis store.
const attempts = new Map<string, number[]>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// Purge stale entries every 30 minutes to avoid memory growth.
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, times] of attempts) {
    const fresh = times.filter((t) => t > cutoff);
    if (fresh.length === 0) attempts.delete(key);
    else attempts.set(key, fresh);
  }
}, 30 * 60 * 1000);

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const times = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (times.length >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((times[0] + WINDOW_MS - now) / 1000);
    attempts.set(ip, times);
    return { allowed: false, retryAfter };
  }

  times.push(now);
  attempts.set(ip, times);
  return { allowed: true };
}

export function clearRateLimitOnSuccess(ip: string): void {
  attempts.delete(ip);
}
