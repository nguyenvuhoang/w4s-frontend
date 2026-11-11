import type { Locale } from '@/configs/i18n'

import type { MenuCommandFilterModel, MenuCommandItem, MenuManagementDictionary } from '../types'

export const MENU_COMMAND_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_USER_COMMAND'
export const MENU_COMMAND_DETAIL_WORKFLOW_ID = 'WF_BO_GET_USER_COMMAND_BY_ID'
export const MENU_COMMAND_UPDATE_WORKFLOW_ID = 'WF_BO_MODIFY_MENU'
export const MENU_COMMAND_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_MENU'
export const MENU_COMMAND_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_MENU'

export const emptyMenuCommandFilter: MenuCommandFilterModel = {
  search_text: '',
  page_index: 1,
  page_size: 10
}

export const menuManagementText = (dictionary: MenuManagementDictionary, key: string, fallback: string) => (
  dictionary.menu_management?.[key] ?? fallback
)

export const commonText = (dictionary: MenuManagementDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const displayValue = (value: unknown) => (
  value === null || value === undefined || value === '' ? '-' : String(value)
)

export const toMenuManagementPath = (locale: string, query?: string) => (
  `/${locale}/system-settings/menu-management${query ? `?${query}` : ''}`
)

export const toMenuCommandDetailPath = (locale: string, commandId: string, query?: string) => (
  `/${locale}/system-settings/menu-management/${encodeURIComponent(commandId)}${query ? `?${query}` : ''}`
)

export const toMenuCommandCreatePath = (locale: string) => `/${locale}/system-settings/menu-management/create`

// Shared by useMenuCommandSearch's syncUrl (keeps the list's own address bar in sync) and the
// list->detail row navigation (carries the same state onto the detail URL so a delete/back can
// return to the exact search_text/page_index/page_size the user left, instead of resetting to
// page 1 — see MenuManagementContent and useMenuCommandDelete).
export const buildMenuCommandQueryString = (filter: MenuCommandFilterModel) => {
  const params = new URLSearchParams()

  if (filter.search_text.trim()) params.set('search_text', filter.search_text.trim())
  if (filter.page_index > 1) params.set('page_index', String(filter.page_index))
  if (filter.page_size !== emptyMenuCommandFilter.page_size) params.set('page_size', String(filter.page_size))

  return params.toString()
}

/**
 * command_name_language comes back from the workflow as a JSON string, e.g.
 * "{\"en\":\"Banner list\",\"vi\":\"Danh sách banner\"}". Malformed/empty values must never
 * surface as raw JSON in the UI — callers fall back to `label` when parsing yields nothing.
 */
export const parseCommandNameLanguage = (raw: unknown) => {
  const result: { vi?: string; en?: string; la?: string } = {}

  if (typeof raw !== 'string' || !raw.trim()) return result

  try {
    const parsed: unknown = JSON.parse(raw)

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const key of ['vi', 'en', 'la'] as const) {
        const value = (parsed as Record<string, unknown>)[key]

        if (typeof value === 'string' && value.trim()) result[key] = value.trim()
      }
    }
  } catch {
    // malformed JSON — ignore and let the caller fall back to label
  }

  return result
}

// Caption priority: current locale -> vi -> en -> label, per the project's language fallback
// convention. `la` is only used when the current locale itself is `la`. Shared by the read-only
// caption (from the loaded item) and the edit-mode live preview (from in-progress form values).
export const resolveMenuCommandCaption = (
  names: { vi?: string; en?: string; la?: string },
  locale: Locale,
  fallbackLabel: string
) => (
  names[locale] || names.vi || names.en || (fallbackLabel ? fallbackLabel : '-')
)

export const getMenuCommandCaption = (item: MenuCommandItem, locale: Locale) => (
  resolveMenuCommandCaption(item.command_name_language_parsed, locale, item.label)
)

// Same fallback chain as getMenuCommandCaption, one step further: when there is no
// command_name_language value AND no label either, the delete confirmation still needs
// something to name the record by, so it falls back to command_id as the last resort.
export const getMenuCommandDisplayName = (item: MenuCommandItem, locale: Locale) => {
  const caption = getMenuCommandCaption(item, locale)

  return caption && caption !== '-' ? caption : item.command_id
}

export const getCommandTypeMeta = (dictionary: MenuManagementDictionary, commandType: string | null) => {
  if (commandType === 'M') {
    return { label: menuManagementText(dictionary, 'type_menu', 'Menu'), color: 'primary' as const }
  }

  if (commandType === 'C') {
    return { label: menuManagementText(dictionary, 'type_command', 'Chức năng'), color: 'secondary' as const }
  }

  return { label: displayValue(commandType), color: 'default' as const }
}

export const getGroupMenuVisibleMeta = (dictionary: MenuManagementDictionary, value: string | null) => {
  if (value === '1') return { label: menuManagementText(dictionary, 'visible_yes', 'Có'), color: 'success' as const }
  if (value === '0') return { label: menuManagementText(dictionary, 'visible_no', 'Không'), color: 'default' as const }

  return { label: displayValue(value), color: 'default' as const }
}

// Same "1"/"0" semantics as getGroupMenuVisibleMeta, but with the more glanceable phrasing the
// detail header uses ("Đang hiển thị" / "Đang ẩn") instead of the table's "Có" / "Không".
export const getMenuVisibleHeaderMeta = (dictionary: MenuManagementDictionary, value: string | null) => {
  if (value === '1') return { label: menuManagementText(dictionary, 'header_visible_yes', 'Đang hiển thị'), color: 'success' as const }
  if (value === '0') return { label: menuManagementText(dictionary, 'header_visible_no', 'Đang ẩn'), color: 'default' as const }

  return null
}

// "0" (root) has no parent-code prefix, so numeric suffixes stay whatever width the existing
// root-level command_ids already use. There's no real data to infer a width from until at least
// one sibling exists, so this is the same 3-digit convention the legacy Command-option codes in
// this codebase already used (e.g. "<parent>001".."<parent>006").
const DEFAULT_COMMAND_ID_SUFFIX_WIDTH = 3

const normalizeParentId = (parentId: string | null | undefined) => {
  const trimmed = (parentId ?? '').trim()

  return trimmed || '0'
}

export const getMenuSiblings = (items: MenuCommandItem[], parentId: string) => {
  const normalizedParentId = normalizeParentId(parentId)

  return items.filter(item => normalizeParentId(item.parent_id) === normalizedParentId)
}

// display_order is scoped per parent — siblings of the chosen parent (or of the root level, when
// parentId is "0") are what "menu con hiện có" means here, not the whole tree.
export const computeNextDisplayOrder = (items: MenuCommandItem[], parentId: string) => {
  const siblings = getMenuSiblings(items, parentId)
  const maxOrder = siblings.reduce((max, item) => Math.max(max, item.display_order ?? 0), 0)

  return maxOrder + 1
}

// Mirrors the numbering rule already visible in existing sibling command_ids: "<parent_id><suffix>"
// for a real parent, or a bare numeric code at the root. The suffix width and next number are
// both derived from the largest numeric suffix actually in use — never from sibling *count*,
// since a deleted record would otherwise make two live records collide on the same next code.
export const computeNextCommandId = (items: MenuCommandItem[], parentId: string) => {
  const normalizedParentId = normalizeParentId(parentId)
  const isRoot = normalizedParentId === '0'
  const prefix = isRoot ? '' : normalizedParentId

  const suffixes = getMenuSiblings(items, parentId)
    .map(item => item.command_id)
    .filter(commandId => commandId.startsWith(prefix) && commandId.length > prefix.length)
    .map(commandId => commandId.slice(prefix.length))
    .filter(suffix => /^\d+$/.test(suffix))

  const width = suffixes.length > 0
    ? Math.max(...suffixes.map(suffix => suffix.length))
    : DEFAULT_COMMAND_ID_SUFFIX_WIDTH
  const nextNumber = suffixes.length > 0 ? Math.max(...suffixes.map(Number)) + 1 : 1

  return `${prefix}${String(nextNumber).padStart(width, '0')}`
}

export const isMenuCommandIdTaken = (items: MenuCommandItem[], commandId: string) => (
  items.some(item => item.command_id === commandId.trim())
)

export const getBooleanDisplayLabel = (dictionary: MenuManagementDictionary, value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'

  if (value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y') {
    return menuManagementText(dictionary, 'boolean_yes', 'Có')
  }

  if (value === false || value === 0 || value === '0' || value === 'false' || value === 'F' || value === 'N') {
    return menuManagementText(dictionary, 'boolean_no', 'Không')
  }

  return displayValue(value)
}
