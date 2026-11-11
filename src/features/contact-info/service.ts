import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'

import type {
  ContactInfoItem,
  ContactInfoProjectOption,
  CreateContactInfoRequest,
  UpdateContactInfoRequest,
  ContactInfoSearchRequest,
  ContactInfoSearchResponse,
  ContactInfoFilterModel
} from './types'

export const PROJECT_CONTACTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECT_CONTACTS'
export const PROJECT_CONTACT_DETAIL_WORKFLOW_ID = 'WF_BO_GET_PROJECT_CONTACT_BY_ID'
export const PROJECT_CONTACT_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_PROJECT_CONTACT'
export const PROJECT_CONTACT_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_PROJECT_CONTACT'
export const PROJECT_CONTACT_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_PROJECT_CONTACT'
export const CONTACT_INFO_PROJECTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECTS'

const emptyContactInfoResponse: ContactInfoSearchResponse = {
  items: [],
  page_index: 0,
  page_size: 10,
  total_count: 0,
  total_pages: 0,
  has_previous_page: false,
  has_next_page: false
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined

  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key]
  }

  const normalizedMap = Object.keys(item).reduce<Record<string, any>>((acc, key) => {
    acc[normalizeKey(key)] = item[key]

    return acc
  }, {})

  for (const key of keys) {
    const value = normalizedMap[normalizeKey(key)]

    if (value !== undefined && value !== null) return value
  }

  return undefined
}

const pickDataResponse = (response: any) => response?.payload?.dataresponse ?? response?.dataresponse ?? response

const pickDataRoot = (payload: any) => {
  const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse ?? payload
  const data = dataresponse?.data ?? payload?.data ?? payload

  return data?.data ?? data?.input ?? data
}

const pickItems = (root: any): any[] => {
  if (Array.isArray(root)) return root
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(root?.data)) return root.data
  if (Array.isArray(root?.input?.items)) return root.input.items
  if (Array.isArray(root?.input?.data)) return root.input.data

  return []
}

const toNumber = (value: unknown, fallback: number) => {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : fallback
}

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

const toBoolean = (value: unknown, fallback = false) => {
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false

  return fallback
}

const toNullableString = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null

  return String(value)
}

const normalizeResponsePage = (value: unknown, requestPageIndex: number) => {
  const pageIndex = toNumber(value, requestPageIndex + 1)

  return pageIndex <= 0 ? pageIndex + 1 : pageIndex
}

const getExecutionId = (response: any) => {
  const dataresponse = pickDataResponse(response)

  return String(
    dataresponse?.execution_id
    ?? dataresponse?.executionId
    ?? response?.payload?.execution_id
    ?? response?.payload?.executionId
    ?? response?.execution_id
    ?? response?.executionId
    ?? ''
  ).trim()
}

const getWorkflowErrorMessage = (response: any, fallback: string, language?: Locale | string) => {
  const dataresponse = pickDataResponse(response)
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const message = String(
    (Array.isArray(errors) && errors.length > 0
      ? errors[0]?.info ?? errors[0]?.message ?? errors[0]?.description
      : undefined)
    ?? dataresponse?.message
    ?? dataresponse?.data?.message
    ?? response?.payload?.message
    ?? response?.message
    ?? fallback
  ).trim()
  const executionId = getExecutionId(response)
  const referenceLabel = language === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference'

  return executionId ? `${message} ${referenceLabel}: ${executionId}` : message
}

const getWorkflowMessage = (response: any, fallback = '') => {
  const dataresponse = pickDataResponse(response)
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []

  return String(
    (Array.isArray(errors) && errors.length > 0
      ? errors[0]?.info ?? errors[0]?.message ?? errors[0]?.description
      : undefined)
    ?? dataresponse?.message
    ?? data?.message
    ?? response?.payload?.message
    ?? response?.message
    ?? fallback
  ).trim()
}

const getWorkflowAlertPayload = (response: any, fallback = '') => ({
  message: getWorkflowMessage(response, fallback),
  execution_id: getExecutionId(response)
})

const isWorkflowFailure = (response: any) => {
  const dataresponse = pickDataResponse(response)
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []

  return response?.success === false
    || dataresponse?.success === false
    || data?.success === false
    || dataresponse?.code === 'failed'
    || data?.code === 'failed'
    || (Array.isArray(errors) && errors.length > 0)
}

const assertWorkflowSuccess = (response: any, fallback: string, language?: Locale | string) => {
  if (isWorkflowFailure(response)) {
    throw new Error(getWorkflowErrorMessage(response, fallback, language))
  }
}

const mapContactInfo = (item: any): ContactInfoItem => ({
  id: toNullableNumber(getField(item, ['id', 'project_contact_id', 'projectContactId'])),
  project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
  project_code: toNullableString(getField(item, ['project_code', 'projectCode', 'projectcode', 'code'])),
  project_name: toNullableString(getField(item, ['project_name', 'projectName', 'projectname', 'project', 'projectNameText'])),
  contact_type: String(getField(item, ['contact_type', 'contactType']) ?? ''),
  name: String(getField(item, ['name', 'contact_name', 'contactName']) ?? ''),
  phone: toNullableString(getField(item, ['phone', 'phone_number', 'phoneNumber'])),
  email: toNullableString(getField(item, ['email'])),
  address: toNullableString(getField(item, ['address'])),
  working_hours: toNullableString(getField(item, ['working_hours', 'workingHours'])),
  note: toNullableString(getField(item, ['note'])),
  display_order: toNullableNumber(getField(item, ['display_order', 'displayOrder'])),
  status: String(getField(item, ['status']) ?? '')
})

const mapProjectOption = (item: any): ContactInfoProjectOption | null => {
  const id = toNullableNumber(getField(item, ['id', 'project_id', 'projectId', 'projectid']))

  if (id === null) return null

  const code = String(getField(item, ['project_code', 'projectCode', 'projectcode', 'code']) ?? '').trim()
  const name = String(getField(item, ['project_name', 'projectName', 'projectname', 'name', 'caption']) ?? (code || id)).trim()

  return {
    id,
    code,
    name,
    status: String(getField(item, ['status']) ?? ''),
    address: String(getField(item, ['address']) ?? '')
  }
}

const mapProjectOptions = (response: any): ContactInfoProjectOption[] => {
  const root = pickDataRoot(response?.payload ?? response)
  const byId = new Map<number, ContactInfoProjectOption>()

  pickItems(root).forEach(item => {
    const option = mapProjectOption(item)

    if (option) byId.set(option.id, option)
  })

  return Array.from(byId.values())
}

const mapContactInfoSearchResponse = (
  response: any,
  request: ContactInfoSearchRequest
): ContactInfoSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapContactInfo),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    total_count,
    total_pages,
    has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage']))
  }
}

export const contactInfoService = {
  getDefaultContactInfoResponse: (filter?: Partial<ContactInfoFilterModel>): ContactInfoSearchResponse => ({
    ...emptyContactInfoResponse,
    page_index: filter?.page_index ?? emptyContactInfoResponse.page_index,
    page_size: filter?.page_size ?? emptyContactInfoResponse.page_size
  }),

  simpleSearchProjectContacts: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    filter: ContactInfoFilterModel
  }): Promise<ContactInfoSearchResponse> => {
    if (!sessiontoken || !filter.project_id) return contactInfoService.getDefaultContactInfoResponse(filter)

    const request: ContactInfoSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim(),
      project_id: filter.project_id
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_CONTACTS_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load project contacts.', language)

    return mapContactInfoSearchResponse(response, request)
  },

  simpleSearchProjects: async ({
    sessiontoken,
    language,
    search_text = '',
    page_size = 100
  }: {
    sessiontoken?: string
    language?: Locale
    search_text?: string
    page_size?: number
  }): Promise<ContactInfoProjectOption[]> => {
    if (!sessiontoken) return []

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: CONTACT_INFO_PROJECTS_SEARCH_WORKFLOW_ID,
      input: {
        search_text,
        page_index: 0,
        page_size
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load projects.', language)

    return mapProjectOptions(response)
  },

  getProjectContactById: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<ContactInfoItem | null> => {
    if (!sessiontoken || !Number.isInteger(id) || id <= 0) return null

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_CONTACT_DETAIL_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load project contact detail.', language)

    const root = pickDataRoot(response?.payload ?? response)

    return root && typeof root === 'object' ? mapContactInfo(root) : null
  },

  createProjectContact: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: CreateContactInfoRequest
  }) => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_CONTACT_CREATE_WORKFLOW_ID,
      input: fields,
      language
    })

    assertWorkflowSuccess(response, 'Unable to create project contact.', language)

    return pickDataRoot(response?.payload ?? response)
  },

  deleteProjectContact: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }) => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_CONTACT_DELETE_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete project contact.', language)

    return pickDataRoot(response?.payload ?? response)
  },

  updateProjectContact: async ({
    sessiontoken,
    language,
    fields
  }: {
    sessiontoken?: string
    language?: Locale
    fields: UpdateContactInfoRequest
  }) => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: PROJECT_CONTACT_UPDATE_WORKFLOW_ID,
      input: fields,
      language
    })

    if (isWorkflowFailure(response)) {
      throw getWorkflowAlertPayload(response, 'Unable to update project contact.')
    }

    return {
      data: pickDataRoot(response?.payload ?? response),
      ...getWorkflowAlertPayload(response)
    }
  }
}
