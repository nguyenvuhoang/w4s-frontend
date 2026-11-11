import { i18n } from '@/configs/i18n'
import { extractLocaleFromPath } from './locale'

const MAINTENANCE_SEGMENT = '/maintenance'

/**
 * Checks whether a pathname already points to the maintenance page,
 * used to avoid redirect loops when the backend is down.
 */
export const isMaintenancePath = (pathname: string) => {
  const { remainingPath } = extractLocaleFromPath(pathname)

  return remainingPath === MAINTENANCE_SEGMENT || remainingPath.startsWith(`${MAINTENANCE_SEGMENT}/`)
}

let isRedirectingToMaintenance = false

/**
 * Redirects the whole app to the maintenance page using location.replace
 * so the failing screen is not kept in browser history (no Back button loop).
 * No-op on the server and when already on the maintenance page.
 */
export const redirectToMaintenance = () => {
  if (typeof window === 'undefined') return

  const currentPath = window.location.pathname

  if (isMaintenancePath(currentPath) || isRedirectingToMaintenance) return

  isRedirectingToMaintenance = true

  const { validLocale } = extractLocaleFromPath(currentPath)

  window.location.replace(`/${validLocale || i18n.defaultLocale}${MAINTENANCE_SEGMENT}`)
}
