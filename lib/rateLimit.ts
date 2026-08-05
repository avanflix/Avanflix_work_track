/**
 * Minimal in-memory sliding-window rate limiter, suitable for a single
 * Node process. Swap for Redis/Upstash in a multi-instance deployment.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

export function getClientKey(req: Request) {
  return req.headers.get("x-forwarded-for") ?? "local";
}
