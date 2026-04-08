// ─── Types ────────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: Date
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

// ─── In-memory store ──────────────────────────────────────────────────────────

const store = new Map<string, RateLimitEntry>()

// ─── checkRateLimit ───────────────────────────────────────────────────────────

export function checkRateLimit(
  ip: string,
  limit = 5,
  windowMs = 15 * 60 * 1000,
): RateLimitResult {
  const now = Date.now()

  // Clean up expired entries on every call
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt.getTime() <= now) {
      store.delete(key)
    }
  }

  const existing = store.get(ip)

  if (!existing || existing.resetAt.getTime() <= now) {
    // First request in this window (or expired)
    const resetAt = new Date(now + windowMs)
    store.set(ip, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  // Increment within the existing window
  existing.count += 1
  store.set(ip, existing)

  const remaining = Math.max(0, limit - existing.count)
  const allowed = existing.count <= limit

  return { allowed, remaining, resetAt: existing.resetAt }
}
