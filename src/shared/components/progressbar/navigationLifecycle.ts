import { isNavDebugEnabled, navTrace, registerNavContext } from '@/shared/utils/navigationDebug'

// Recovery is a last resort for browser/link navigations with no completion signal.
// Normal cleanup is driven by route commits or the owning React transition.
export const NAVIGATION_RECOVERY_MS = 30000

export const normalizeNavigationUrl = (href: string, current: string): string | null => {
  try {
    const url = new URL(href, current)

    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.searchParams.sort() // Stable sort: preserve the order of repeated values.

    return url.href
  } catch {
    return null
  }
}

export type PendingNavigation = { id: number; url: string; source: string; showProgress: boolean; owned: boolean }

export function createNavigationLifecycle() {
  let pending: PendingNavigation | null = null
  // Last URL the App Router actually committed (reported by RouteCompletion). A navigation can never
  // "begin" toward it: whatever produced that request (late event listener, duplicate signal) is
  // already done, and nothing would ever complete it.
  let committedUrl: string | null = null
  let committedSequence = 0 // Last navigation id that existed when committedUrl was reported.
  let sequence = 0
  let startedAt = 0
  let recoveryTimer: ReturnType<typeof setTimeout> | undefined
  const listeners = new Set<() => void>()
  const superseded = new Set<string>()
  const emit = () => listeners.forEach(listener => listener())
  const clearRecovery = () => {
    clearTimeout(recoveryTimer)
    recoveryTimer = undefined
  }
  const finish = (id: number, reason = 'finish') => {
    if (pending?.id !== id) {
      navTrace('lifecycle:finish(ignored)', { id, reason, pendingId: pending?.id ?? null })

      return
    }
    navTrace('lifecycle:finish', { id, reason, pendingUrl: pending.url, ageMs: Date.now() - startedAt })
    clearRecovery()
    pending = null
    superseded.clear()
    emit()
  }

  return {
    getSnapshot: () => pending,
    subscribe: (listener: () => void) => {
      listeners.add(listener)

      return () => { listeners.delete(listener) }
    },
    begin: (href: string, current: string, force = false, showProgress = true, owned = false) => {
      const url = normalizeNavigationUrl(href, current)
      const currentUrl = normalizeNavigationUrl(current, current)

      if (!url || !currentUrl || new URL(url).origin !== new URL(currentUrl).origin) {
        navTrace('lifecycle:begin(skip:invalid/external)', { targetUrl: href, sourceUrl: current })

        return null
      }
      if ((!force && url === currentUrl) || pending?.url === url) {
        navTrace('lifecycle:begin(skip:same/duplicate)', { targetUrl: url, sourceUrl: currentUrl, pendingId: pending?.id ?? null })

        return null
      }
      if (!force && url === committedUrl) {
        navTrace('lifecycle:begin(skip:already-committed)', { targetUrl: url, sourceUrl: currentUrl })

        return null
      }

      clearRecovery()
      if (pending) superseded.add(pending.url.split('#')[0])
      const id = ++sequence

      pending = { id, url, source: currentUrl, showProgress, owned }
      startedAt = Date.now()
      navTrace('lifecycle:begin', { id, targetUrl: url, sourceUrl: currentUrl, owned, showProgress, force })
      recoveryTimer = setTimeout(() => {
        navTrace('lifecycle:TIMEOUT', { id, pendingUrl: pending?.url ?? null })
        finish(id, 'RECOVERY_TIMEOUT_30s')
      }, NAVIGATION_RECOVERY_MS)
      // Debug watchdog only (navTrace is a no-op when disabled): flags a navigation nobody finished.
      if (isNavDebugEnabled()) {
        setTimeout(() => {
          if (pending?.id === id) navTrace('lifecycle:STUCK>3s', { id, pendingUrl: pending.url, pendingSource: pending.source, owned })
        }, 3000)
      }
      emit()

      return id
    },
    finish,
    completeRoute: (current: string) => {
      committedUrl = normalizeNavigationUrl(current, current)
      committedSequence = sequence
      if (!pending) {
        navTrace('lifecycle:completeRoute(no-pending)', { committedUrl: current })

        return
      }
      const url = normalizeNavigationUrl(current, current)
      const route = url?.split('#')[0]

      if (url === pending.url || (!pending.owned && route && route !== pending.source.split('#')[0] && !superseded.has(route))) {
        finish(pending.id, 'route-committed')
      } else {
        navTrace('lifecycle:completeRoute(no-match)', {
          committedUrl: url, pendingId: pending.id, pendingUrl: pending.url, pendingSource: pending.source, owned: pending.owned
        })
      }
    },
    /**
     * Browser Back/Forward is owned end-to-end by the App Router: it restores the route from its own
     * history state, and Next 16 + React 19 may commit that route before any `popstate` listener of
     * ours runs. A traversal therefore never starts a lifecycle; it only supersedes whatever
     * navigation was in flight (the browser has moved to another entry, so that one will never commit).
     */
    settleHistoryTraversal: (current: string) => {
      navTrace('lifecycle:history-traversal', { committedUrl: current, pendingId: pending?.id ?? null })
      if (!pending) return
      // The restored page may already have started its own navigation (e.g. a URL-sync replace)
      // after the router committed it but before popstate reached us; that one must stay.
      if (committedUrl === normalizeNavigationUrl(current, current) && pending.id > committedSequence) return
      finish(pending.id, 'history-traversal')
    },
    dispose: () => {
      navTrace('lifecycle:dispose', { pendingId: pending?.id ?? null, pendingUrl: pending?.url ?? null })
      clearRecovery()
      pending = null
      committedUrl = null // RouteCompletion re-reports the committed route when it mounts again.
      superseded.clear()
      emit()
    }
  }
}

export const navigationLifecycle = createNavigationLifecycle()

// Every [NAV] trace line carries the lifecycle state, so one Back can be followed end-to-end.
registerNavContext(() => {
  const current = navigationLifecycle.getSnapshot()

  return {
    navId: current?.id ?? null,
    pending: Boolean(current),
    owner: current ? (current.owned ? 'router-transition' : 'link-click') : null
  }
})
