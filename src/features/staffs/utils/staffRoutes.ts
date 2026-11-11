import type { Locale } from '@/configs/i18n'

const withQuery = (path: string, query?: string) => (query ? `${path}?${query}` : path)

/** Single bulk import/update screen — server validation determines Create vs Update per row via `action`. */
export const getStaffBulkImportHref = (locale: Locale, routeBase = '/users/staffs', query?: string) => (
    withQuery(`/${locale}${routeBase}/create-multiple`, query)
)
