const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string) {
  const now = Date.now();
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const max = Number(process.env.RATE_LIMIT_MAX ?? 120);
  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  current.count += 1;
  return { ok: current.count <= max, remaining: Math.max(0, max - current.count) };
}
