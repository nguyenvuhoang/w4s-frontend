import type { getDictionary } from '@/shared/utils/getDictionary'

import type { ProjectFilterModel, ProjectStatusFilter, PropertyStatus } from '../types'

export type ProjectDictionary = Awaited<ReturnType<typeof getDictionary>>

export type ProjectViewMode = 'grid' | 'list'

export const DEFAULT_PROJECT_VIEW_MODE: ProjectViewMode = 'grid'

export const PROJECT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

/** Business screen: only the project of the working-project context (View / Modify). */
export const PROJECT_CONTEXT_BASE_PATH = '/properties/project'
/**
 * Full project catalog management (search, filters, create...), under System Settings. Its routes are
 * guarded by the System Settings admin boundary (static super-admin policy of /system-settings in
 * configs/staticRouteAccess), not by the business Project rights.
 */
export const PROJECT_MANAGEMENT_BASE_PATH = '/system-settings/projects'
/** Business menu screen carrying the Project rights (MODIFY...) — used by the business area only. */
export const PROJECT_BUSINESS_PERMISSION_PATH = '/properties/project'

/**
 * Who decides the actions of a shared Project screen: `business` = business Project rights
 * (PermissionGuard / usePermission); `admin` = the System Settings admin boundary already passed at
 * route level, so every implemented action is available.
 */
export type ProjectAccessScope = 'business' | 'admin'

export const EMPTY_PROJECT_FILTER: ProjectFilterModel = {
  search_text: '',
  status: '',
  province: '',
  page_index: 0,
  page_size: 10
}

export const PROJECT_STATUS_FILTER_OPTIONS: ProjectStatusFilter[] = ['', 'A', 'I']

// Filter changes restart from the first page and keep every other criterion (search text, page size...).
export const withProjectStatus = (filter: ProjectFilterModel, status: ProjectStatusFilter): ProjectFilterModel => ({
  ...filter,
  status,
  page_index: 0
})

export const withProjectProvince = (filter: ProjectFilterModel, province: string): ProjectFilterModel => ({
  ...filter,
  province,
  page_index: 0
})

// "Làm mới" keeps the existing behavior of going back to the default filter (including the default page size).
export const resetProjectFilter = (): ProjectFilterModel => ({ ...EMPTY_PROJECT_FILTER })

export const projectText = (dictionary: ProjectDictionary, key: string, fallback: string) => dictionary.projectManagement?.[key] ?? fallback

export const projectCommonText = (dictionary: ProjectDictionary, key: string, fallback: string) => dictionary.common?.[key] ?? fallback

/** Texts of the shared Province lookup on the Project screens (list filter, create, edit). */
export const projectProvinceSelectMessages = (dictionary: ProjectDictionary) => ({
  loadingText: projectText(dictionary, 'provinceLoading', 'Loading provinces...'),
  emptyText: projectText(dictionary, 'provinceEmpty', 'No province/city found'),
  loadErrorText: projectText(dictionary, 'provinceLoadError', 'Unable to load provinces/cities.'),
  retryLabel: projectCommonText(dictionary, 'retry', 'Retry'),
  loadingMoreText: projectText(dictionary, 'provinceLoadingMore', 'Loading more...')
})

export const projectStatusColor = (status: PropertyStatus) => {
  if (status === 'active') return 'success'
  if (status === 'inactive') return 'error'
  if (status === 'draft') return 'warning'

  return 'default'
}

export const projectStatusLabel = (dictionary: ProjectDictionary, status: PropertyStatus) => {
  if (status === 'active') return projectText(dictionary, 'statusProjectActive', 'Active')
  if (status === 'inactive') return projectText(dictionary, 'statusProjectInactive', 'Inactive')

  return projectText(dictionary, `status${status}`, status)
}

export const projectStatusFilterLabel = (dictionary: ProjectDictionary, status: ProjectStatusFilter) => {
  if (status === 'A') return projectText(dictionary, 'statusProjectActive', 'Active')
  if (status === 'I') return projectText(dictionary, 'statusProjectInactive', 'Inactive')

  return projectText(dictionary, 'statusAll', 'All')
}

export const displayProjectAddress = (dictionary: ProjectDictionary, address: string) => (
  address.trim() || projectText(dictionary, 'addressNotUpdated', 'Not updated')
)

const projectCountFormat = new Intl.NumberFormat('vi-VN')

/** Aggregate count of the project summary: "--" when the Backend did not provide it (unknown); a real 0 stays 0. */
export const formatProjectCount = (value: number | null | undefined) => (
  value === null || value === undefined ? '--' : projectCountFormat.format(value)
)

/** Free text of the project summary: "--" when null / empty. */
export const formatProjectValue = (value: string | null | undefined) => value?.trim() || '--'
