'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import { menuService } from '@/shared/services/menuService'
import { isValidResponse } from '@utils/isValidResponse'

export type DashboardMenuStatus = 'loading' | 'ready' | 'error'

type Params = {
  sessiontoken?: string
  language?: Locale | string
  /** From useMenuScope(): null while ProjectContext isn't READY yet (must not fetch/show any
   * menu), otherwise the exact project code the menu request's `scope` header will carry. Also
   * the sole trigger for reloading after the *initial* load — switching project changes this
   * value while the component stays mounted (no remount to rely on), so effect deps below key
   * off it directly instead of a plain `ready: boolean`. */
  menuScope: string | null
}

export function useDashboardMenu({
  sessiontoken,
  language,
  menuScope
}: Params) {
  const [status, setStatus] = useState<DashboardMenuStatus>('loading')
  const [menu, setMenu] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  // Which menuScope the state above actually belongs to. Reset during render (React's documented
  // "adjusting state when a prop changes" pattern — https://react.dev/learn/you-might-not-need-an-effect)
  // rather than as a setState-in-effect, which the project's lint config flags and which would
  // also cost an extra commit before the reset is visible. This still fires on the initial load
  // (loadedForScope starts as menuScope, so it's a no-op there) but matters for a later scope
  // change (project switch) with the component still mounted: the previous project's menu must
  // never keep rendering — and its commands stay clickable — for even one frame after the switch
  // is detected. ReadyDashboard mirrors this into AppContext.menuData (see DashboardContent.tsx)
  // so the permission registry drops the old project's rights in the same instant too, not just
  // the visible sidebar.
  const [loadedForScope, setLoadedForScope] = useState(menuScope)

  if (menuScope !== loadedForScope) {
    setLoadedForScope(menuScope)
    setStatus('loading')
    setMenu([])
    setError(null)
  }

  const requestIdRef = useRef(0)

  const reload = useCallback(() => {
    setStatus('loading')
    setError(null)
    setRetryKey(value => value + 1)
  }, [])

  useEffect(() => {
    if (menuScope === null || !sessiontoken) return

    const requestId = ++requestIdRef.current
    let active = true

    void (async () => {
      try {
        // A manual reload() (retryKey > 0) must bypass the shared cache — it's a deliberate
        // user-driven refresh, not the initial boot fetch PermissionProvider's fallback might
        // also be racing to share.
        const response: any = await menuService.getMenu({
          sessiontoken,
          language: language as Locale,
          channel: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
          forceRefresh: retryKey > 0
        })

        if (!active || requestId !== requestIdRef.current) {

          return
        }

        if (
          response?.status === 401 ||
          response?.payload?.requireLogout
        ) {

          setError('UNAUTHORIZED')
          setStatus('error')

          return
        }

        const menuPayload = response?.payload?.dataresponse

        const errors = menuPayload?.errors

        if (
          !isValidResponse(response) ||
          (Array.isArray(errors) && errors.length > 0)
        ) {
          const message =
            errors?.[0]?.info ?? 'Unable to load menu.'


          setError(message)
          setStatus('error')

          return
        }
        setMenu((menuPayload?.data?.data as any[]) ?? [])
        setError(null)
        setStatus('ready')

      } catch (err) {
        if (!active || requestId !== requestIdRef.current) {

          return
        }


        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load menu.'
        )
        setStatus('error')
      }
    })()

    return () => {
      active = false
    }
  }, [menuScope, sessiontoken, language, retryKey])

  return {
    status,
    menu,
    error,
    reload
  }
}
