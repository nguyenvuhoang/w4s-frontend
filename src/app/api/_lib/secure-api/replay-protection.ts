import 'server-only'

/**
 * In-memory anti-replay cache: rejects a request whose `ts` is outside the allowed clock skew,
 * or whose `rid` has already been seen. In-memory is deliberate — this deployment currently runs
 * as a single container (see docker-compose.yml, no replicas). If this app is ever scaled to
 * multiple instances/pods without sticky sessions, replace the Map below with a shared store
 * (e.g. Redis SETNX with TTL) so replay protection stays correct across instances.
 */
const MAX_CLOCK_SKEW_MS = 60_000

const seenRequestIds = new Map<string, number>() // rid -> expiry timestamp (ms)

const cleanupExpired = (now: number) => {
  for (const [rid, expiresAt] of seenRequestIds) {
    if (expiresAt <= now) seenRequestIds.delete(rid)
  }
}

export interface ReplayCheckResult {
  ok: boolean
  reason?: 'expired' | 'replayed'
}

/**
 * Validates and records a request's (rid, ts) pair. Must be called exactly once per request,
 * after signature/decryption succeeds — recording before that would let an attacker burn
 * legitimate rids with garbage requests.
 */
export function checkAndRecordRequest(rid: string, ts: number): ReplayCheckResult {
  const now = Date.now()

  if (Math.abs(now - ts) > MAX_CLOCK_SKEW_MS) {
    return { ok: false, reason: 'expired' }
  }

  if (seenRequestIds.size > 10_000) cleanupExpired(now)

  if (seenRequestIds.has(rid)) {
    return { ok: false, reason: 'replayed' }
  }

  seenRequestIds.set(rid, now + MAX_CLOCK_SKEW_MS)

  return { ok: true }
}
