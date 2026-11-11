import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError } from '@/shared/utils/workflowError'

import {
  MENU_COMMAND_CREATE_WORKFLOW_ID,
  MENU_COMMAND_DELETE_WORKFLOW_ID,
  MENU_COMMAND_DETAIL_WORKFLOW_ID,
  MENU_COMMAND_SEARCH_WORKFLOW_ID,
  MENU_COMMAND_UPDATE_WORKFLOW_ID,
  parseCommandNameLanguage
} from '../components/menuCommandHelpers'
import type {
  MenuCommandCreateRequest,
  MenuCommandDetailResponse,
  MenuCommandFilterModel,
  MenuCommandItem,
  MenuCommandSearchRequest,
  MenuCommandSearchResponse,
  MenuCommandUpdateRequest
} from '../types'

// `MenuCommandFilterModel.page_index` is the UI page (1-based). The workflow itself
// uses a zero-based page_index, so conversion happens at this service boundary.
const DEFAULT_PAGE_INDEX = 1
const DEFAULT_PAGE_SIZE = 10

const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

const toBoolean = (value: unknown) => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const getField = (item: any, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key]
  }

  return undefined
}

const toStringOrNull = (value: unknown) => (value === undefined || value === null ? null : String(value))

const getResponseRoot = (response: any) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data ?? response

  return data?.data ?? data?.input?.data ?? data?.input ?? data
}

const getErrors = (response: any) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse

  return dataresponse?.errors ?? dataresponse?.error ?? response?.payload?.errors ?? response?.errors ?? []
}

const assertWorkflowSuccess = (response: any, fallback: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const root = getResponseRoot(response)
  const errors = getErrors(response)
  const failed = response?.success === false
    || response?.payload?.success === false
    || dataresponse?.success === false
    || root?.success === false
    || dataresponse?.code === 'failed'
    || root?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    throw createWorkflowError(response, { fallback })
  }
}

const pickItems = (root: any) => {
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data

  return []
}

const mapMenuCommandItem = (value: unknown): MenuCommandItem => {
  const item = (value && typeof value === 'object') ? value as Record<string, unknown> : {}
  const rawCommandNameLanguage = getField(item, ['command_name_language', 'commandNameLanguage'])
  const displayOrder = getField(item, ['display_order', 'displayOrder'])

  return {
    parent_id: toStringOrNull(getField(item, ['parent_id', 'parentId'])),
    command_id: String(getField(item, ['command_id', 'commandId']) ?? ''),
    label: String(getField(item, ['label']) ?? ''),
    command_type: toStringOrNull(getField(item, ['command_type', 'commandType'])),
    href: toStringOrNull(getField(item, ['href'])),
    role_id: getField(item, ['role_id', 'roleId']) ?? null,
    role_name: toStringOrNull(getField(item, ['role_name', 'roleName'])),
    invoke: getField(item, ['invoke']) ?? null,
    approve: getField(item, ['approve']) ?? null,
    icon: toStringOrNull(getField(item, ['icon'])),
    group_menu_visible: toStringOrNull(getField(item, ['group_menu_visible', 'groupMenuVisible'])),
    prefix: toStringOrNull(getField(item, ['prefix'])),
    group_menu_list_authorize_form: toStringOrNull(getField(item, ['group_menu_list_authorize_form', 'groupMenuListAuthorizeForm'])),
    command_name_language: typeof rawCommandNameLanguage === 'string' ? rawCommandNameLanguage : null,
    command_name_language_parsed: parseCommandNameLanguage(rawCommandNameLanguage),
    group_menu_id: toStringOrNull(getField(item, ['group_menu_id', 'groupMenuId'])),
    display_order: displayOrder === undefined ? null : toNumber(displayOrder, 0),
    is_agreement: getField(item, ['is_agreement', 'isAgreement']) ?? null,
    children: Array.isArray(getField(item, ['children'])) ? getField(item, ['children']) as unknown[] : null,
    action_code: toStringOrNull(getField(item, ['action_code', 'actionCode'])),
    workflow_id: toStringOrNull(getField(item, ['workflow_id', 'workflowId']))
  }
}

const mapDetailResponse = (response: any): MenuCommandDetailResponse => {
  const root = getResponseRoot(response)
  const item = Array.isArray(root)
    ? root[0]
    : getField(root, ['command', 'user_command', 'userCommand', 'item'])
      ?? pickItems(root)[0]
      ?? root
  const commandId = getField(item, ['command_id', 'commandId'])

  return { item: commandId ? mapMenuCommandItem(item) : null }
}

const mapSearchResponse = (response: any, request: MenuCommandSearchRequest): MenuCommandSearchResponse => {
  const root = getResponseRoot(response)
  const totalCount = toNumber(getField(root, ['total_count', 'totalCount']), 0)
  const pageSize = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const totalPages = toNumber(getField(root, ['total_pages', 'totalPages']), pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0)

  return {
    items: pickItems(root).map(mapMenuCommandItem),
    total_count: totalCount,
    total_pages: totalPages,
    has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage'])),
    // Keep the response model aligned with the UI pagination component. The workflow
    // returns page_index as zero-based, whereas MUI Pagination is one-based.
    page_index: toNumber(getField(root, ['page_index', 'pageIndex']), request.page_index) + 1,
    page_size: pageSize
  }
}

export const menuCommandService = {
  getDefaultSearchResponse: (filter?: Partial<MenuCommandFilterModel>): MenuCommandSearchResponse => ({
    items: [],
    total_count: 0,
    total_pages: 0,
    has_previous_page: false,
    has_next_page: false,
    page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
    page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE
  }),

  searchUserCommands: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    filter: MenuCommandFilterModel
  }): Promise<MenuCommandSearchResponse> => {
    if (!sessiontoken) {
      return menuCommandService.getDefaultSearchResponse(filter)
    }

    // The UI is one-based, but WF_BO_SIMPLE_SEARCH_USER_COMMAND is zero-based.
    // Keep that conversion here so components never mix the two conventions.
    const request: MenuCommandSearchRequest = {
      search_text: filter.search_text.trim(),
      page_index: Math.max(filter.page_index - 1, 0),
      page_size: filter.page_size
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: MENU_COMMAND_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load menu list.')

    return mapSearchResponse(response, request)
  },

  getUserCommandById: async ({
    sessiontoken,
    language,
    commandId
  }: {
    sessiontoken?: string
    language?: Locale
    commandId: string
  }): Promise<MenuCommandDetailResponse> => {
    if (!sessiontoken) return { item: null }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: MENU_COMMAND_DETAIL_WORKFLOW_ID,
      input: { command_id: commandId, application_code: 'BO' },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load menu detail.')

    return mapDetailResponse(response)
  },

  updateUserCommand: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: MenuCommandUpdateRequest
  }): Promise<void> => {
    if (!sessiontoken) throw new Error('Unable to update menu without an active session.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: MENU_COMMAND_UPDATE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to update menu.')
  },

  deleteUserCommand: async ({
    sessiontoken,
    language,
    commandId
  }: {
    sessiontoken?: string
    language?: Locale
    commandId: string
  }): Promise<void> => {
    if (!sessiontoken) throw new Error('Unable to delete menu without an active session.')

    // Intentionally only application_code + command_id — the backend decides whether the
    // record can be deleted (children, dependencies, permission usage) and whether that cascades.
    // The frontend never fans this out into multiple delete calls for child rows.
    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: MENU_COMMAND_DELETE_WORKFLOW_ID,
      input: { application_code: 'BO', command_id: commandId },
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete menu.')
  },

  createUserCommand: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: MenuCommandCreateRequest
  }): Promise<void> => {
    if (!sessiontoken) throw new Error('Unable to create menu without an active session.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: MENU_COMMAND_CREATE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to create menu.')
  }
}
