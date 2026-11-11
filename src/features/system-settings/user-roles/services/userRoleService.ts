import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError } from '@/shared/utils/workflowError'
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

import { USER_ROLE_CREATE_WORKFLOW_ID, USER_ROLE_DELETE_WORKFLOW_ID, USER_ROLE_DETAIL_WORKFLOW_ID, USER_ROLE_SEARCH_WORKFLOW_ID, USER_ROLE_UPDATE_WORKFLOW_ID } from '../components/userRoleHelpers'
import type { UserRoleCreateRequest, UserRoleDetailResponse, UserRoleItem, UserRolePermissionItem, UserRoleSearchRequest, UserRoleSearchResponse, UserRoleUpdateRequest } from '../types'

type SearchParams = {
  sessiontoken?: string
  language?: Locale
  filter: {
    search_text: string
    channel_code: 'BO'
    page_index: number
    page_size: number
  }
}

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
  if (Array.isArray(root?.input?.items)) return root.input.items

  return []
}

const normalizeResponsePage = (value: unknown, requestPageIndex: number) => {
  const responsePage = toNumber(value, requestPageIndex + 1)

  return responsePage <= 0 ? responsePage + 1 : responsePage
}

const mapUserRolePermission = (item: any): UserRolePermissionItem => {
  const displayOrder = getField(item, ['display_order', 'displayOrder'])

  return {
    command_id: String(getField(item, ['command_id', 'commandId']) ?? ''),
    parent_id: (() => {
      const parentId = getField(item, ['parent_id', 'parentId'])
      return parentId === undefined || parentId === null || parentId === '' ? null : String(parentId)
    })(),
    command_type: String(getField(item, ['command_type', 'commandType']) ?? ''),
    // Backend localizes `label` by request `lang`; render it directly (label -> command_name -> command_id).
    label: (() => {
      const label = getField(item, ['label', 'command_name', 'commandName'])
      return label === undefined || label === null || label === '' ? null : String(label)
    })(),
    invoke: toBoolean(getField(item, ['invoke', 'Invoke'])),
    approve: toBoolean(getField(item, ['approve', 'Approve'])),
    command_uri: (() => {
      const commandUri = getField(item, ['command_uri', 'commandUri'])
      return commandUri === undefined || commandUri === null || commandUri === '' ? null : String(commandUri)
    })(),
    icon: (() => {
      const icon = getField(item, ['icon'])
      return icon === undefined || icon === null || icon === '' ? null : String(icon)
    })(),
    display_order: displayOrder === undefined || displayOrder === null || displayOrder === '' ? null : toNumber(displayOrder, 0)
  }
}

const mapUserRoleItem = (item: any, rights: unknown = []): UserRoleItem => ({
  id: toNumber(getField(item, ['id']), 0),
  role_id: toNumber(getField(item, ['role_id', 'roleId']), 0),
  role_name: String(getField(item, ['role_name', 'roleName']) ?? ''),
  role_description: getField(item, ['role_description', 'roleDescription']) ?? null,
  user_type: getField(item, ['user_type', 'userType']) ?? null,
  contract_no: getField(item, ['contract_no', 'contractNo']) ?? null,
  user_created: getField(item, ['user_created', 'userCreated']) ?? null,
  date_created: getField(item, ['date_created', 'dateCreated']) ?? null,
  user_modified: getField(item, ['user_modified', 'userModified']) ?? null,
  date_modified: getField(item, ['date_modified', 'dateModified']) ?? null,
  service_id: getField(item, ['service_id', 'serviceId']) ?? null,
  role_type: getField(item, ['role_type', 'roleType']) ?? null,
  status: getField(item, ['status']) ?? null,
  is_show: getField(item, ['is_show', 'isShow']) ?? null,
  sort_order: getField(item, ['sort_order', 'sortOrder']) === undefined ? null : toNumber(getField(item, ['sort_order', 'sortOrder']), 0),
  rights: Array.isArray(rights) ? rights.map(mapUserRolePermission).filter(right => right.command_id) : []
})

const mapSearchResponse = (response: any, request: UserRoleSearchRequest): UserRoleSearchResponse => {
  const root = getResponseRoot(response)
  const totalCount = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const pageSize = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const totalPages = toNumber(getField(root, ['total_pages', 'totalPages']), pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0)

  return {
    items: pickItems(root).map(mapUserRoleItem),
    total_count: totalCount,
    total_pages: totalPages,
    has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage'])),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size: pageSize
  }
}

const mapDetailResponse = (response: any): UserRoleDetailResponse => {
  const root = getResponseRoot(response)
  const item = Array.isArray(root)
    ? root[0]
    : getField(root, ['role', 'user_role', 'userRole', 'item', 'data'])
      ?? pickItems(root)[0]
      ?? root
  const roleId = toNumber(getField(item, ['role_id', 'roleId']), 0)

  const rights = getField(item, ['rights']) ?? getField(root, ['rights'])

  return { role: roleId > 0 ? mapUserRoleItem(item, rights) : null }
}

export const userRoleService = {
  getDefaultSearchResponse: (filter?: Partial<UserRoleSearchRequest>): UserRoleSearchResponse => ({
    items: [],
    total_count: 0,
    total_pages: 0,
    has_previous_page: false,
    has_next_page: false,
    page_index: normalizeResponsePage(filter?.page_index, DEFAULT_PAGE_INDEX),
    page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE
  }),

  searchUserRoles: async ({ sessiontoken, language, filter }: SearchParams): Promise<UserRoleSearchResponse> => {
    if (!sessiontoken) {
      return userRoleService.getDefaultSearchResponse({
        page_index: Math.max(filter.page_index - 1, 0),
        page_size: filter.page_size
      })
    }

    const request: UserRoleSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim(),
      channel_code: 'BO'
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: USER_ROLE_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load user roles.')

    return mapSearchResponse(response, request)
  },

  getUserRoleById: async ({
    sessiontoken,
    language,
    roleId
  }: {
    sessiontoken?: string
    language?: Locale
    roleId: number
  }): Promise<UserRoleDetailResponse> => {
    if (!sessiontoken) return { role: null }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: USER_ROLE_DETAIL_WORKFLOW_ID,
      input: { role_id: roleId },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load user role detail.')

    return mapDetailResponse(response)
  },

  updateUserRoleProfile: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: UserRoleUpdateRequest
  }): Promise<void> => {
    if (!sessiontoken) throw new Error('Unable to update user role without an active session.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: USER_ROLE_UPDATE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to update user role.')
  },

  createUserRole: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: Omit<UserRoleCreateRequest, 'role_type'>
  }): Promise<UserRoleDetailResponse> => {
    if (!sessiontoken) throw new Error('Unable to create user role without an active session.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: USER_ROLE_CREATE_WORKFLOW_ID,
      input: {
        ...fields,
        role_type: 'USER'
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to create user role.')

    // Workflow tra ve ban ghi vai tro vua tao khi backend ho tro; neu khong co role_id thi role se la null.
    return mapDetailResponse(response)
  },

  deleteUserRole: async ({
    sessiontoken,
    language,
    roleId
  }: {
    sessiontoken?: string
    language?: Locale
    roleId: number
  }): Promise<void> => {
    if (!sessiontoken) throw new Error('Unable to delete user role without an active session.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: USER_ROLE_DELETE_WORKFLOW_ID,
      input: { role_id: roleId },
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete user role.')
  }

  // Viec tai menu (WF_BO_LOAD_MENU), tai operation theo menu (WF_BO_LOAD_OPERATION) va gan quyen
  // (WF_BO_UPDATE_RIGHT) dung chung 1 implementation voi tab Invoke-Approve o roles-profile — xem
  // src/services/roleOperationApi.ts (duoc dung boi src/services/useInvokeApprove.ts va
  // useRoleCreatePermissions.ts), khong duplicate lai o day.
}
