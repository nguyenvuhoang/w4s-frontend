import { i18n } from '@configs/i18n'
import type { VerticalMenuDataType, VerticalSubMenuDataType } from '@shared/types/menuTypes'

/**
 * Strips the locale prefix (e.g. `/vi`, `/en`) and any trailing slash from a pathname,
 * so route comparisons are locale-agnostic. The root route always normalizes to `/`.
 */
export const normalizeMenuPath = (path: string): string => {
  if (!path) return '/'

  const pathname = path.split(/[?#]/)[0] || '/'
  const localePattern = new RegExp(`^/(${i18n.locales.join('|')})(?=/|$)`)
  const withoutLocale = pathname.replace(localePattern, '') || '/'

  return withoutLocale.length > 1 && withoutLocale.endsWith('/') ? withoutLocale.slice(0, -1) : withoutLocale
}

/**
 * Determines whether a menu item's path should be considered active for the current pathname.
 * The home route (`/`) only matches exactly, since a naive prefix/startsWith check would
 * otherwise match every route. Other routes match themselves and their child routes
 * (e.g. `/resident` also matches `/resident/create`, `/resident/detail/1`).
 */
export const isMenuActive = (itemPath?: string, currentPathname?: string): boolean => {
  if (!itemPath || !currentPathname) return false

  const current = normalizeMenuPath(currentPathname)
  const target = normalizeMenuPath(itemPath)

  if (target === '/') {
    return current === '/'
  }

  return current === target || current.startsWith(`${target}/`)
}

export type SearchableMenuItem = {
  id: string
  title: string
  route?: string
  icon?: string
  description?: string
  breadcrumb: string
  favorite?: boolean
  commandCode?: string
  category?: string
  searchText: string
}

export const getMenuChildren = (item: any): VerticalMenuDataType[] => item?.children || item?.items || item?.submenus || []

const parseLocalizedTitle = (value: unknown, locale?: string): string => {
  if (!value) return ''

  if (typeof value === 'object') {
    const names = value as Record<string, unknown>
    const localized = (locale && names[locale]) || names.vi || names.en || Object.values(names).find(Boolean)

    return typeof localized === 'string' ? localized : ''
  }

  if (typeof value !== 'string') return ''

  try {
    const parsed = JSON.parse(value)

    if (parsed && typeof parsed === 'object') return parseLocalizedTitle(parsed, locale)
  } catch {
    // Plain string command names are valid too.
  }

  return value
}

export const getMenuTitle = (item: any, locale?: string): string => {
  if (!item) return ''

  return (
    parseLocalizedTitle(item.command_name_language, locale) ||
    parseLocalizedTitle(item.label, locale) ||
    parseLocalizedTitle(item.title, locale) ||
    parseLocalizedTitle(item.command_name, locale)
  )
}

export const getMenuRoute = (item: any): string | undefined => {
  return item?.href || item?.command_uri || item?.commandUri || item?.commandURI || item?.CommandURI || item?.command_url || item?.commandUrl || item?.commandURL || item?.CommandURL || undefined
}

export const isUsableMenuRoute = (route?: string): route is string => Boolean(route && route.trim() !== '#')

/**
 * Returns the first usable route below a menu node using depth-first order.
 * This gives a parent without its own route a real destination without relying
 * on placeholder URLs such as `#`.
 */
export const getFirstDescendantMenuRoute = (item: any): string | undefined => {
  for (const child of getMenuChildren(item)) {
    const route = getMenuRoute(child)

    if (isUsableMenuRoute(route)) return route

    const descendantRoute = getFirstDescendantMenuRoute(child)

    if (descendantRoute) return descendantRoute
  }

  return undefined
}

const getDescription = (item: any): string | undefined => {
  return item?.description || item?.command_description || item?.command_desc || item?.tooltip || undefined
}

const getCategory = (item: any): string | undefined => {
  return item?.category || item?.section || item?.group || item?.group_name || item?.module_group || undefined
}

const buildBreadcrumb = (item: any, parents: string[], locale?: string) => {
  const title = getMenuTitle(item, locale)

  return [...parents, title].filter(Boolean).join(' / ')
}

export const flattenMenus = (items: VerticalMenuDataType[], parents: string[] = [], locale?: string): SearchableMenuItem[] => {
  const flattened: SearchableMenuItem[] = []

  items.forEach((item: any) => {
    const title = getMenuTitle(item, locale)
    const route = getMenuRoute(item)
    const children = getMenuChildren(item)
    const commandType = item?.command_type ?? item?.commandType
    const isMenuNode = !commandType || String(commandType).toUpperCase() === 'M'
    const hasMenuChildren = children.some((child: any) => {
      const childType = child?.command_type ?? child?.commandType

      return !childType || String(childType).toUpperCase() === 'M'
    })
    const breadcrumb = buildBreadcrumb(item, parents, locale)
    const description = getDescription(item)
    const commandCode = item.command_code || item.command_id || item.id
    const favorite = Boolean(item.favorite ?? item.is_favorite)
    const category = getCategory(item)

    if (isMenuNode && (route || !hasMenuChildren)) {
      const searchText = [title, breadcrumb, route, description || '', commandCode || '', category || '']
        .join(' ')
        .toLowerCase()

      flattened.push({
        id: String(item.id ?? item.command_id ?? `${breadcrumb}-${route ?? 'no-route'}`),
        title,
        route,
        icon: item.icon || item.group_menu_icon || item.command_icon,
        description,
        breadcrumb,
        favorite,
        commandCode: commandCode ? String(commandCode) : undefined,
        category,
        searchText
      })
    }

    if (children.length > 0) {
      flattened.push(...flattenMenus(children, title ? [...parents, title] : parents, locale))
    }
  })

  return flattened
}

export const hasMenuChildren = (item: VerticalSubMenuDataType | null | undefined) => getMenuChildren(item).length > 0

/**
 * Backend-stable identifier for a menu node, used to address a parent menu independently of its
 * (locale-dependent) title — e.g. building the `/module/[commandId]` hub route or matching the
 * sidebar's active branch against it. Falls back to `id` only for older payloads without
 * `command_id`.
 */
export const getCommandId = (item: any): string | undefined => {
  const id = item?.command_id ?? item?.commandId ?? item?.id

  return id !== undefined && id !== null && String(id).length > 0 ? String(id) : undefined
}

/**
 * Depth-first search for the menu node whose command_id matches, across the whole tree (any
 * nesting level). Used by the `/module/[commandId]` hub route to resolve which parent menu it
 * represents.
 */
export const findMenuNodeByCommandId = (
  nodes: VerticalMenuDataType[] | null | undefined,
  commandId: string
): VerticalSubMenuDataType | null => {
  if (!Array.isArray(nodes) || !commandId) return null

  for (const node of nodes) {
    if (getCommandId(node) === commandId) return node as VerticalSubMenuDataType

    const found = findMenuNodeByCommandId(getMenuChildren(node), commandId)

    if (found) return found
  }

  return null
}

const MODULE_ROUTE_PATTERN = /^\/module\/([^/]+)/

/**
 * Extracts the command_id segment from a `/module/[commandId]` hub pathname (locale-agnostic), or
 * null when the pathname is not a module hub route. Used to derive sidebar active state for a
 * parent menu while its hub screen (submenu list) is open, since that route carries no business
 * screen path of its own to match against.
 */
export const getModuleCommandIdFromPath = (pathname?: string | null): string | null => {
  if (!pathname) return null

  const match = normalizeMenuPath(pathname).match(MODULE_ROUTE_PATTERN)

  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Menu routes that must not be rendered as a navigation entry (sidebar/top menu) even though the
 * backend WF_BO_LOAD_MENU tree still carries them. This is display-only: it must run after
 * permission-based filtering (filterMenuForSidebar) and must never be applied to the raw menu tree
 * fed into buildPermissionRegistry, or the screen's permissions (canView/canAdd/...) would resolve
 * as "not found" and the screen itself would lose access it should keep.
 */
const HIDDEN_NAV_ROUTES = new Set(['/users/staffs'])

/**
 * Recursively strips nodes whose route is in HIDDEN_NAV_ROUTES from an already permission-filtered
 * menu tree. A parent group that had menu children but ends up with none after this pass is dropped
 * too (same rule filterMenuForSidebar applies), so removing a lone entry never leaves an empty
 * expandable group behind.
 */
export const excludeMenuRoutes = <T extends VerticalMenuDataType>(items: T[]): T[] => {
  if (!Array.isArray(items)) return []

  return items.reduce<T[]>((acc, item: any) => {
    if (!item || typeof item !== 'object') return acc

    const route = getMenuRoute(item)

    if (route && HIDDEN_NAV_ROUTES.has(normalizeMenuPath(route))) return acc

    const children = getMenuChildren(item)

    if (children.length > 0) {
      const filteredChildren = excludeMenuRoutes(children)

      if (!isUsableMenuRoute(route) && filteredChildren.length === 0) return acc

      acc.push({ ...item, children: filteredChildren })

      return acc
    }

    acc.push(item)

    return acc
  }, [])
}
