'use client'

import { createContext, Suspense, useCallback, useContext, useEffect, useRef, useSyncExternalStore, useTransition } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useProgress } from '@bprogress/react'

import { navTrace, navTraceCommit, setNavProviderInstance } from '@/shared/utils/navigationDebug'

import { navigationLifecycle, normalizeNavigationUrl } from './navigationLifecycle'

let providerInstanceSeq = 0

type Navigate = (href: string, action: () => void, options?: { force?: boolean; showProgress?: boolean }) => void
const NavigationTransitionContext = createContext<Navigate | null>(null)
const serverSnapshot = () => null

export const usePendingNavigation = () => useSyncExternalStore(
  navigationLifecycle.subscribe, navigationLifecycle.getSnapshot, serverSnapshot
)

export const useNavigationTransition = () => {
  const navigate = useContext(NavigationTransitionContext)

  if (!navigate) throw new Error('Navigation requires NavigationLifecycleProvider')

  return navigate
}

const RouteCompletion = () => {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  useEffect(() => {
    navTrace('RouteCompletion:mount')

    return () => navTrace('RouteCompletion:unmount')
  }, [])

  useEffect(() => {
    navTrace('RouteCompletion:commit', { pathname, search: search ? '[present]' : '', pendingId: navigationLifecycle.getSnapshot()?.id ?? null })
    navTraceCommit(window.location.href)
    navigationLifecycle.completeRoute(window.location.href)
  }, [pathname, search])

  return null
}

export const NavigationLifecycleProvider = ({ children }: { children: ReactNode }) => {
  const [isPending, startTransition] = useTransition()
  const transitionId = useRef<number | null>(null)
  const barStarted = useRef(false)
  const pending = usePendingNavigation()
  const { set, inc } = useProgress()

  const navigate = useCallback<Navigate>((href, action, options) => {
    const current = window.location.href
    const target = normalizeNavigationUrl(href, current)

    // External/invalid destinations belong to the router/browser, without a blocking overlay.
    if (!target || new URL(target).origin !== window.location.origin) {
      action()

      return
    }

    const id = navigationLifecycle.begin(href, current, options?.force, options?.showProgress, true)

    navTrace('provider:navigate(owned)', { targetUrl: target, id })
    if (id === null) return
    transitionId.current = id
    startTransition(() => {
      try {
        action()
      } catch (error) {
        navigationLifecycle.finish(id)
        throw error
      }
    })
  }, [startTransition])

  // A transition also settles on redirect, cancellation and route errors, even when the URL
  // does not change. Only its ID can finish it; an older transition cannot clear a newer link.
  useEffect(() => {
    navTrace('transition:isPending', { isPending, ownedId: transitionId.current })
    if (!isPending && transitionId.current !== null) {
      navigationLifecycle.finish(transitionId.current, 'owned-transition-settled')
      transitionId.current = null
    }
  }, [isPending])

  // Own delayed bar timers here, avoiding races between the library's start/stop timers.
  useEffect(() => {
    let trickle: ReturnType<typeof setInterval> | undefined
    const timer = setTimeout(() => {
      if (pending?.showProgress) {
        barStarted.current = true
        set(0.08)
        trickle = setInterval(() => inc(), 800)
      } else {
        if (barStarted.current) set(1)
        barStarted.current = false
        document.documentElement.classList.remove('bprogress-busy')
      }
    }, pending?.showProgress ? 100 : 200)

    return () => {
      clearTimeout(timer)
      clearInterval(trickle)
    }
  }, [pending, set, inc])

  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const element = event.target instanceof Element ? event.target : null
      const anchor = element?.closest<HTMLAnchorElement>('a[href]')

      if (!anchor || element?.closest('[data-prevent-progress="true"]') || anchor.hasAttribute('download')) return
      if (anchor.target && anchor.target !== '_self') return

      const current = window.location.href
      const target = normalizeNavigationUrl(anchor.href, current)

      if (!target || new URL(target).origin !== window.location.origin) return
      if (target === normalizeNavigationUrl(current, current) || navigationLifecycle.getSnapshot()?.url === target) {
        event.preventDefault()

        return
      }

      // Next Link uses pushState for hash changes, which emits no hashchange event.
      // Scrolling within the current document needs no page-loading lifecycle.
      const destination = new URL(target)
      const source = new URL(normalizeNavigationUrl(current, current)!)

      if (destination.pathname === source.pathname && destination.search === source.search) return

      navigationLifecycle.begin(target, current)
    }

    // Back/Forward never begins a lifecycle (see settleHistoryTraversal): the App Router owns the
    // traversal and can commit it before this listener runs, so a begin() here would open a pending
    // navigation that no route commit will ever close. Listener order is therefore irrelevant.
    const popstate = () => {
      navTrace('provider:popstate', { instance })
      navigationLifecycle.settleHistoryTraversal(window.location.href)
    }
    const hashchange = () => navigationLifecycle.completeRoute(window.location.href)

    const instance = ++providerInstanceSeq

    setNavProviderInstance(instance)
    navTrace('provider:mount(listeners registered)', { instance })
    document.addEventListener('click', click, true)
    window.addEventListener('popstate', popstate)
    window.addEventListener('hashchange', hashchange)

    return () => {
      navTrace('provider:unmount(listeners removed)', { instance })
      setNavProviderInstance(null)
      document.removeEventListener('click', click, true)
      window.removeEventListener('popstate', popstate)
      window.removeEventListener('hashchange', hashchange)
      navigationLifecycle.dispose()
      if (barStarted.current) set(1)
      barStarted.current = false
      document.documentElement.classList.remove('bprogress-busy')
    }
  }, [set])

  return (
    <NavigationTransitionContext.Provider value={navigate}>
      <Suspense fallback={null}><RouteCompletion /></Suspense>
      {children}
    </NavigationTransitionContext.Provider>
  )
}
