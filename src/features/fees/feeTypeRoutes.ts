/**
 * Where the fee type screens live. The same feature components are mounted under two route trees:
 * - `/fees/fee-type` (legacy menu screen) — actions are gated by the menu rights of that route.
 * - `/system-settings/fee-management/fee-types` — the System Settings layout already enforces the
 *   Super Admin boundary, so `permissionHref` is omitted (same convention as other settings modules).
 */
export type FeeTypeRouteConfig = {
  basePath: string
  permissionHref?: string
  /** Optional parent screen shown as a "back" link on the list page. */
  parentPath?: string
}

export const LEGACY_FEE_TYPE_ROUTES: FeeTypeRouteConfig = {
  basePath: '/fees/fee-type',
  permissionHref: '/fees/fee-type'
}

export const SETTINGS_FEE_TYPE_ROUTES: FeeTypeRouteConfig = {
  basePath: '/system-settings/fee-management/fee-types',
  parentPath: '/system-settings/fee-management'
}

export const feeTypeHref = (locale: string, routes: FeeTypeRouteConfig, suffix = '') => (
  `/${locale}${routes.basePath}${suffix}`
)
