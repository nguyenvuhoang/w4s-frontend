import type { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { workflowService } from '@/servers/system-service'
import { useWorkingProjectStore } from '@/@core/stores/useWorkingProjectStore'

/**
 * Shared, deduped WF_BO_LOAD_MENU request for the two client-side callers that both want the
 * current user's own navigation/permission menu tree — useDashboardMenu (builds the sidebar) and
 * PermissionProvider's fallback (unblocks permission checks before useDashboardMenu finishes).
 * When both fire around the same time AND observe the same `scope` (see buildCacheKey), this
 * guarantees exactly one HTTP request instead of two: the second caller awaits the same in-flight
 * promise. Single-flight dedupe is the actual goal here, not a long-lived cache — see
 * RESOLVED_CACHE_TTL_MS below for why a resolved response isn't kept forever.
 *
 * Deliberately NOT used by:
 * - AuthorizedLayout.tsx / serviceRequestAccess.server.ts — server-side route-authorization
 *   guards. Security-critical, run in a different process/runtime than this module-level cache,
 *   and must keep calling formService.getMenuInfo directly. Do not redirect them here.
 * - roleOperationApi.ts (fetchRoleMenuTree) — a different consumer entirely: the raw/unfiltered
 *   menu tree used by the role-management admin screens (roles-profile, role create) to configure
 *   Invoke/Approve rights. That data must always be fresh for whatever role is being edited and
 *   already has its own tab-scoped cache; sharing this cache with it would risk serving stale
 *   command flags mid-edit.
 *
 * Returns the exact same raw response shape `workflowService.runFODynamic` always has — this
 * module only dedupes/caches the request, it does not re-implement either caller's own
 * validation/extraction logic, so both keep behaving exactly as before.
 */

type GetMenuParams = {
  sessiontoken: string
  language?: Locale | string
  channel?: string
  /** Bypasses a cached/in-flight entry and issues a brand-new request — for an explicit
   * user-driven retry/refresh, as opposed to a failed request, which never needs this: a
   * rejected promise is already dropped from the cache on its own (see below). */
  forceRefresh?: boolean
}

type MenuResponse = ReturnType<typeof workflowService.runFODynamic>

type CacheEntry = {
  promise: MenuResponse
  /** null while the request is still in flight — an in-flight entry is always shared regardless
   * of age, since there's nothing "stale" about a request that hasn't resolved yet. Only starts
   * the TTL clock once it actually resolves. */
  resolvedAt: number | null
}

// How long a *resolved* response stays servable to a later caller before the next getMenu() call
// forces a brand-new request. This app has no runtime "permissions changed, reload the menu"
// signal today (no SignalR event, no polling — verified: the only way a user ever sees updated
// permissions today is a hard reload, logout/login, or the unused reload() this hook already
// exposes), so this TTL doesn't fix that gap — it only bounds how long *this cache* could add on
// top of it if some future caller ends up calling getMenu() repeatedly over a long session, rather
// than the current once-per-boot pattern. Short by design: the reason this cache exists is to
// dedupe near-simultaneous callers on boot, not to serve as a long-lived menu store.
const RESOLVED_CACHE_TTL_MS = 60_000

const cache = new Map<string, CacheEntry>()

// Mirrors src/servers/lib/http.ts's own `baseHeaders.scope` formula exactly (see the comment
// there): scope is only ever the current project's code once ProjectContext is READY, empty
// otherwise — never read the store's `project` directly regardless of `status`, or a stale/
// not-yet-authorized project still sitting in the store would leak into the key (and the request).
//
// This existed as a real gap once already: `runFODynamic`'s explicit `input` fields never include
// a project id/scope, which first looked like proof the request isn't project-scoped at all. It
// isn't proof of that — http.ts's `request()` (which every client call, including this one, goes
// through) unconditionally attaches this `scope` header to every outgoing request, invisibly to
// any caller that only looks at runFODynamic's own parameters. The request DOES carry a
// project-derived header, so the cache key has to match it or risk serving one project's response
// to a caller that expected another's.
const resolveScopeForCacheKey = (): string => {
  const projectState = useWorkingProjectStore.getState()

  return projectState.status === 'READY' ? projectState.project?.code ?? '' : ''
}

const buildCacheKey = (sessiontoken: string, channel: string, language: string): string =>
  `${sessiontoken}::${channel}::${language}::scope=${resolveScopeForCacheKey()}`

// Never log the raw sessiontoken (or anything else that could authenticate as the user) — only a
// short, non-reversible fingerprint, purely so dev logs can tell "same session" apart from
// "different session". Not a cryptographic hash, doesn't need to be: it only has to be
// impractical to reverse back into the original token, which a trivial checksum already is.
const fingerprintSessionToken = (sessiontoken: string): string => {
  let hash = 0

  for (let i = 0; i < sessiontoken.length; i++) {
    hash = (hash * 31 + sessiontoken.charCodeAt(i)) | 0
  }

  return Math.abs(hash).toString(36).slice(0, 8)
}

const isDev = process.env.NODE_ENV !== 'production'

const logCacheEvent = (event: 'cache hit' | 'cache miss', sessiontoken: string, channel: string, language: string) => {
  if (!isDev) return

}

export const menuService = {
  getMenu: ({ sessiontoken, language, channel, forceRefresh }: GetMenuParams): MenuResponse => {
    const resolvedLanguage = (language as string) ?? 'en'
    const resolvedChannel = channel ?? 'BO'
    const key = buildCacheKey(sessiontoken, resolvedChannel, resolvedLanguage)

    if (forceRefresh) {
      cache.delete(key)
    } else {
      const cached = cache.get(key)

      if (cached) {
        const stillFresh = cached.resolvedAt === null || Date.now() - cached.resolvedAt < RESOLVED_CACHE_TTL_MS

        if (stillFresh) {
          logCacheEvent('cache hit', sessiontoken, resolvedChannel, resolvedLanguage)

          return cached.promise
        }

        cache.delete(key)
      }
    }

    logCacheEvent('cache miss', sessiontoken, resolvedChannel, resolvedLanguage)

    const promise = workflowService.runFODynamic({
      sessiontoken,
      language: resolvedLanguage as Locale,
      workflowid: WORKFLOWCODE.WF_BO_LOAD_MENU,
      input: { channel: resolvedChannel }
    })

    const entry: CacheEntry = { promise, resolvedAt: null }

    cache.set(key, entry)

    promise
      .then(() => {
        // Only start the TTL clock if this entry is still the current one for `key` — a logout/
        // project-switch/forceRefresh that already replaced or deleted it must not be resurrected
        // by a slow-to-settle old promise.
        if (cache.get(key) === entry) entry.resolvedAt = Date.now()
      })
      .catch(() => {
        // Never cache a failure: drop the entry so the very next call — a caller-driven retry, or
        // a different consumer racing slightly behind this one — issues a brand-new request
        // instead of forever re-awaiting (and re-throwing) a dead rejected promise.
        if (cache.get(key) === entry) cache.delete(key)
      })

    return promise
  },

  /**
   * Wipes every cached/in-flight menu request. Call this wherever the app already wipes other
   * in-memory session-scoped state on logout/forced-logout (see clearBrowserSessionState in
   * src/servers/lib/http.ts and the two manual logout flows) — session/user changing is exactly
   * the case this cache must never straddle. Keying by sessiontoken (and scope) already prevents
   * a new user/project from ever being served a previous one's cached menu even without calling
   * this, but a long-lived tab that logs in/out or switches projects many times (no full page
   * reload — see SelectProjectScreen.tsx's "wrong account" logout) would otherwise keep
   * accumulating dead entries in memory for no benefit.
   */
  clearMenuCache: (): void => {
    cache.clear()
  }
}
