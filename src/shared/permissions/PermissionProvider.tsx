'use client'

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

import { menuService } from '@/shared/services/menuService'
import { useWorkingProjectStatus } from '@/@core/stores/useWorkingProjectStore'
import { useAppContext } from '@contexts/AppContext'
import type { VerticalSubMenuDataType } from '@shared/types/menuTypes'
import type { UserInRole } from '@shared/types/systemTypes'

import { buildPermissionRegistry, resolvePermission, resolveScreenRoute } from './permissionUtils'
import type { PermissionRegistry } from './permissionTypes'

type PermissionContextValue = {
  registry: PermissionRegistry
  /** Mirrors AppContext.isLoaded — false until the WF_BO_LOAD_MENU tree has been fetched. */
  isLoaded: boolean
}

const PermissionContext = createContext<PermissionContextValue | null>(null)
let menuFallbackRequest: Promise<VerticalSubMenuDataType[]> | null = null

const pickMenuTree = (response: any): VerticalSubMenuDataType[] => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse ?? response
  const data = dataresponse?.data?.data ?? dataresponse?.data ?? response?.payload?.data ?? response?.data

  return Array.isArray(data) ? data : []
}

const getLocaleFromPathname = (pathname: string | null): string => {
  const locale = pathname?.split('/').filter(Boolean)[0]

  return locale || 'en'
}

/**
 * Derives a stable identity key (login_name + role ids) from AppContext.userInfo. The registry
 * must rebuild whenever this changes, not just when `menuData` happens to change reference — we do
 * not assume logout/role switch always goes through a full page navigation (see PermissionProvider
 * doc). Returns '' when userInfo isn't loaded yet; buildPermissionRegistry([]) already denies
 * everything in that case via `isLoaded`, so an empty key is safe.
 */
const getIdentityKey = (userInfo: { login_name?: string; role?: UserInRole[] } | null): string => {
  if (!userInfo) return ''

  const roleKey = Array.isArray(userInfo.role)
    ? userInfo.role.map(r => `${r.role_id}:${r.user_code}`).join(',')
    : ''

  return `${userInfo.login_name ?? ''}|${roleKey}`
}

/**
 * Derives the permission registry from AppContext.menuData (the raw usercommand tree already
 * fetched server-side and stored client-side). Rebuilds whenever `menuData` OR the resolved user
 * identity (login_name/role ids) changes — deliberately not relying on the assumption that
 * logout/login/role change always happens through a full page navigation. If a future flow updates
 * identity client-side without also refreshing `menuData` (e.g. a partial context update), this
 * still forces a registry recompute rather than silently keeping stale permissions.
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
  const { menuData, userInfo, isLoaded, setMenuData } = useAppContext()
  const { data: session } = useSession()
  const pathname = usePathname()
  const projectStatus = useWorkingProjectStatus()

  const identityKey = useMemo(() => getIdentityKey(userInfo), [userInfo])

  useEffect(() => {
    const sessiontoken = session?.user?.token

    if (!sessiontoken || isLoaded || menuData.length > 0) return

    // PermissionProvider mounts app-wide (every route, dashboard or not — see Providers.tsx), so
    // it can't assume a project is even relevant to the current screen. But every real consumer
    // of usePermissionContext() today lives under the dashboard (resident/contracts/assets/...
    // detail pages — verified by grep, none outside it), where WF_BO_LOAD_MENU's response is
    // scoped by the current project's `scope` header (see menuService.ts). Firing this fallback
    // before that's resolved used to send scope="" — a real request logged in production, not a
    // hypothetical — which could seed AppContext.menuData with a project-independent (or wrong)
    // tree that then never gets corrected once DashboardContent's own fetch actually lands
    // (isLoaded/menuData.length > 0 would already be true by then). Routes that never touch a
    // project (login, select-project, ...) never call usePermissionContext(), so simply staying
    // unloaded there is correct, not a regression — nothing reads it.
    if (projectStatus !== 'READY') return

    if (!menuFallbackRequest) {
      menuFallbackRequest = menuService.getMenu({
        sessiontoken,
        language: getLocaleFromPathname(pathname) as any,
        channel: 'BO'
      })
        .then(pickMenuTree)
        .finally(() => {
          menuFallbackRequest = null
        })
    }

    let active = true

    menuFallbackRequest.then(nextMenuData => {
      if (active && nextMenuData.length > 0) setMenuData(nextMenuData)
    }).catch(error => {
    })

    return () => {
      active = false
    }
  }, [isLoaded, menuData.length, pathname, session?.user?.token, projectStatus, setMenuData])

  const registry = useMemo(() => {
    // `identityKey` is a deliberate cache-busting dependency (see doc above): buildPermissionRegistry
    // only reads `menuData`, but referencing identityKey here forces a rebuild on identity change
    // even if `menuData`'s reference happened to stay the same.
    void identityKey

    return buildPermissionRegistry(menuData)
  }, [menuData, identityKey])

  const value = useMemo<PermissionContextValue>(() => ({ registry, isLoaded }), [registry, isLoaded])

  // Dev-only inspection hook: open the browser console on any screen and run
  // `__debugPermission('/resident/list')` to see exactly what the menu tree resolved for that
  // route (screen invoke flag, every command with its action/invoke) — the fastest way to tell
  // "no permission granted by the backend menu" apart from an actual frontend bug, without
  // digging through the raw WF_BO_LOAD_MENU network payload by hand. Never runs in production.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return undefined

    const debugPermission = (path: string) => {
      const route = resolveScreenRoute(registry, path)
      const entry = route ? registry.byRoute.get(route) : undefined
      const resolved = resolvePermission(registry, path, isLoaded)

      const summary = {
        requestedPath: path,
        resolvedRoute: route,
        isLoaded,
        isLoading: !isLoaded,
        screenInvoke: entry?.menuNode ? Boolean(entry.menuNode.invoke) : null,
        screenCommandId: entry?.menuNode?.commandId ?? null,
        commands: (entry?.commands ?? []).map(command => ({
          commandId: command.commandId,
          action: command.action,
          invoke: command.invoke,
          approve: command.approve,
          rawActionCode: (command.raw as any)?.action_code ?? (command.raw as any)?.actionCode,
          commandName: (command.raw as any)?.command_name ?? (command.raw as any)?.label
        })),
        permission: resolved
      }

      // eslint-disable-next-line no-console

      return summary
    }

    ;(window as any).__debugPermission = debugPermission

    return () => {
      delete (window as any).__debugPermission
    }
  }, [registry, isLoaded])

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export function usePermissionContext(): PermissionContextValue {
  const context = useContext(PermissionContext)

  if (!context) {
    throw new Error('usePermissionContext must be used within a PermissionProvider')
  }

  return context
}
