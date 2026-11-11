import { createHash } from 'node:crypto'

/**
 * Remembers, per backend session token, whether WF_BO_GET_BO_CONTEXT last said the user is a
 * super admin — used ONLY to decide *when* AuthorizedLayout starts WF_BO_LOAD_MENU:
 *
 *  - hint says "not super admin" (or unknown): start the menu call in parallel with the context
 *    call (saves one backend round trip per navigation for regular users);
 *  - hint says "super admin": do not start it speculatively — super admins never need the menu,
 *    so this avoids a wasted backend call on every navigation.
 *
 * It is never an authorization input: every render still calls WF_BO_GET_BO_CONTEXT and decides
 * access from that fresh result. A stale/wrong hint can only cost latency (menu fetched after the
 * context instead of alongside it) or one unused call — never grant or deny access. Keys are a
 * SHA-256 of the token (the token itself is never stored), so entries are partitioned per
 * session; bounded in size and time.
 */

const TTL_MS = 30 * 60 * 1000
const MAX_ENTRIES = 1000

type Entry = { isSuperAdmin: boolean; expiresAt: number }

const hints = new Map<string, Entry>()

const keyOf = (token: string) => createHash('sha256').update(token).digest('hex')

export const getSuperAdminHint = (token: string | null | undefined, now = Date.now()): boolean | null => {
  if (!token) return null

  const key = keyOf(token)
  const entry = hints.get(key)

  if (!entry) return null

  if (entry.expiresAt <= now) {
    hints.delete(key)

    return null
  }

  return entry.isSuperAdmin
}

export const recordSuperAdminHint = (token: string | null | undefined, isSuperAdmin: boolean, now = Date.now()) => {
  if (!token) return

  const key = keyOf(token)

  hints.delete(key)
  hints.set(key, { isSuperAdmin, expiresAt: now + TTL_MS })

  while (hints.size > MAX_ENTRIES) {
    const oldest = hints.keys().next().value

    if (oldest === undefined) break
    hints.delete(oldest)
  }
}

/** Whether AuthorizedLayout should start WF_BO_LOAD_MENU together with WF_BO_GET_BO_CONTEXT. */
export const shouldStartMenuInParallel = (token: string | null | undefined, hasStaticPolicy: boolean) =>
  !hasStaticPolicy && getSuperAdminHint(token) !== true

/** Test helper. */
export const resetSuperAdminHints = () => {
  hints.clear()
}
