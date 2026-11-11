import type { PermissionAction } from '@/shared/permissions/permissionTypes'

export type StaticRouteAccessPolicy = {
  path: string
  actions: PermissionAction[]
  superAdminOnly?: boolean
}

/** Root of the System Settings area (hub + every admin module below it). */
export const SYSTEM_SETTINGS_BASE_PATH = '/system-settings'

/**
 * Route access decided without the menu rights (checked by AuthorizedLayout before the menu).
 * A policy covers its path and every descendant (`/system-settings/provinces/1/edit` is covered by
 * `/system-settings`); when several match, the most specific (longest) path wins.
 */
export const STATIC_ROUTE_ACCESS_POLICIES: StaticRouteAccessPolicy[] = [
  {
    // System Settings is the Super Admin boundary: hub, projects, provinces, user roles, menu management,
    // audit / application logs, workflows, integrations, config files, service settings, general, [module]...
    path: SYSTEM_SETTINGS_BASE_PATH,
    superAdminOnly: true,
    actions: ['VIEW', 'DETAIL', 'ADD', 'MODIFY', 'DELETE', 'IMPORT', 'EXPORT']
  },
  {
    path: '/system-settings/application-logs',
    superAdminOnly: true,
    actions: ['VIEW']
  }
]

export const normalizeStaticRoutePath = (route: string) => {
  const segments = route.split('?')[0].split('#')[0].split('/').filter(Boolean)

  if (segments[0] && ['vi', 'en', 'la'].includes(segments[0].toLowerCase())) segments.shift()

  return `/${segments.join('/')}`.replace(/\/$/, '') || '/'
}

export const getStaticRouteAccessPolicy = (route: string) => {
  const normalizedRoute = normalizeStaticRoutePath(route)

  // Segment-safe descendant match: "/system-settings-x" is NOT under "/system-settings".
  return STATIC_ROUTE_ACCESS_POLICIES
    .filter(policy => normalizedRoute === policy.path || normalizedRoute.startsWith(`${policy.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]
}

export const hasStaticRouteAccess = ({
  route,
  action,
  isSuperAdmin
}: {
  route: string
  action: PermissionAction
  isSuperAdmin: boolean
}) => {
  const policy = getStaticRouteAccessPolicy(route)

  if (!policy || !policy.actions.includes(action)) return false
  if (policy.superAdminOnly && !isSuperAdmin) return false

  return true
}
