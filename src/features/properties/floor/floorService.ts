import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { buildingService } from '@/features/properties/building/buildingService'
import { toOptionalText } from '@/features/properties/propertyFieldHelpers'

import type {
  FloorBuildingOption,
  FloorCreatePayload,
  FloorDetailModel,
  FloorProjectOption,
  FloorSearchFilter,
  FloorSearchItem,
  FloorSearchRequest,
  FloorSearchResponse,
  FloorUpdatePayload
} from './types'

export const FLOORS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_FLOORS'
export const FLOOR_DETAIL_WORKFLOW_ID = 'WF_BO_GET_FLOOR_BY_ID'
export const FLOOR_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_FLOOR'
export const FLOOR_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_FLOOR'
export const FLOOR_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_FLOOR'

const emptyFloorResponse: FloorSearchResponse = {
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

const normalizeResponsePage = (value: unknown, requestPageIndex: number) => {
  const pageIndex = toNumber(value, requestPageIndex + 1)

  return pageIndex <= 0 ? pageIndex + 1 : pageIndex
}

const getExecutionId = (response: any) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse ?? response

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
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse ?? response
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

const assertWorkflowSuccess = (response: any, fallback: string, language?: Locale | string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse ?? response
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const failed = response?.success === false
    || dataresponse?.success === false
    || data?.success === false
    || dataresponse?.code === 'failed'
    || data?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    throw new Error(getWorkflowErrorMessage(response, fallback, language))
  }
}

const mapFloor = (item: any): FloorSearchItem => ({
  id: toNumber(getField(item, ['id', 'floor_id', 'floorId']), 0),
  floor_code: String(getField(item, ['floor_code', 'floorCode']) ?? ''),
  building_id: toNumber(getField(item, ['building_id', 'buildingId']), 0),
  project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
  floor_no: String(getField(item, ['floor_no', 'floorNo']) ?? ''),
  name: String(getField(item, ['name', 'floor_name', 'floorName']) ?? ''),
  description: toOptionalText(getField(item, ['description'])),
  resident_count: toNullableNumber(getField(item, ['resident_count', 'residentCount'])),
  status: String(getField(item, ['status']) ?? '')
})

// floor_no / display_order are kept (not rendered) because WF_BO_UPDATE_FLOOR still requires them.
const mapFloorDetail = (item: any): FloorDetailModel | null => {
  const id = toNumber(getField(item, ['id', 'floor_id', 'floorId']), NaN)

  if (!Number.isFinite(id)) return null

  return {
    id,
    floor_code: String(getField(item, ['floor_code', 'floorCode']) ?? ''),
    name: String(getField(item, ['name', 'floor_name', 'floorName']) ?? ''),
    building_id: toNumber(getField(item, ['building_id', 'buildingId']), 0),
    project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
    status: String(getField(item, ['status']) ?? ''),
    floor_no: String(getField(item, ['floor_no', 'floorNo']) ?? ''),
    display_order: toNullableNumber(getField(item, ['display_order', 'displayOrder'])),
    resident_count: toNullableNumber(getField(item, ['resident_count', 'residentCount', 'total_residents', 'totalResidents'])),
    description: toOptionalText(getField(item, ['description']))
  }
}

/** Explicit WF_BO_SIMPLE_SEARCH_FLOORS input. `status` is a planned filter field (sent even when ""). */
export const buildFloorSearchRequest = (filter: FloorSearchFilter & { project_id: number; building_id: number }): FloorSearchRequest => ({
  page_size: filter.page_size,
  page_index: Math.max(filter.page_index - 1, 0),
  search_text: filter.search_text.trim(),
  status: filter.status ?? '',
  project_id: filter.project_id,
  building_id: filter.building_id
})

const mapFloorSearchResponse = (
  response: any,
  request: FloorSearchRequest
): FloorSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapFloor),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    total_count,
    total_pages,
    has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage']))
  }
}

export const floorService = {
  getDefaultFloorResponse: (filter?: Partial<FloorSearchFilter>): FloorSearchResponse => ({
    ...emptyFloorResponse,
    page_index: filter?.page_index ?? emptyFloorResponse.page_index,
    page_size: filter?.page_size ?? emptyFloorResponse.page_size
  }),

  simpleSearchProjects: async ({
    sessiontoken,
    language
  }: {
    sessiontoken?: string
    language?: Locale
  }): Promise<FloorProjectOption[]> => buildingService.simpleSearchProjects({ sessiontoken, language }),

  simpleSearchBuildings: async ({
    sessiontoken,
    language,
    project_id
  }: {
    sessiontoken?: string
    language?: Locale
    project_id: number
  }): Promise<FloorBuildingOption[]> => {
    if (!sessiontoken || !project_id) return []

    const response = await buildingService.simpleSearchBuildings({
      sessiontoken,
      language,
      filter: {
        page_size: 100,
        page_index: 1,
        search_text: '',
        project_id
      }
    })

    return response.items.map(building => ({
      id: building.id,
      building_code: building.building_code,
      name: building.name,
      status: building.status
    }))
  },

  simpleSearchFloors: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    filter: FloorSearchFilter
  }): Promise<FloorSearchResponse> => {
    if (!sessiontoken || !filter.project_id || !filter.building_id) return floorService.getDefaultFloorResponse(filter)

    const request = buildFloorSearchRequest({ ...filter, project_id: filter.project_id, building_id: filter.building_id })

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FLOORS_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load floors.', language)

    return mapFloorSearchResponse(response, request)
  },

  getFloorById: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<FloorDetailModel | null> => {
    if (!sessiontoken) return null

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FLOOR_DETAIL_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load floor detail.', language)

    const root = pickDataRoot(response?.payload ?? response)

    return mapFloorDetail(root)
  },

  // Backend contract: { building_id, floor_no, floor_code, name, display_order, description, resident_count }.
  createFloor: async ({
    sessiontoken,
    language,
    payload
  }: {
    sessiontoken?: string
    language?: Locale
    payload: FloorCreatePayload
  }) => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FLOOR_CREATE_WORKFLOW_ID,
      input: {
        building_id: payload.building_id,
        floor_code: payload.floor_code,
        name: payload.name,
        floor_no: payload.floor_no,
        display_order: payload.display_order,
        description: payload.description,
        resident_count: payload.resident_count
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to create floor.', language)

    return response
  },

  // Backend contract: { id, building_id, floor_no, floor_code, name, display_order, description, resident_count, status }.
  updateFloor: async ({
    sessiontoken,
    language,
    payload
  }: {
    sessiontoken?: string
    language?: Locale
    payload: FloorUpdatePayload
  }) => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FLOOR_UPDATE_WORKFLOW_ID,
      input: {
        id: payload.id,
        building_id: payload.building_id,
        floor_code: payload.floor_code,
        name: payload.name,
        floor_no: payload.floor_no,
        display_order: payload.display_order,
        description: payload.description,
        resident_count: payload.resident_count,
        status: payload.status
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to update floor.', language)

    return response
  },

  deleteFloor: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }) => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: FLOOR_DELETE_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete floor.', language)

    return response
  }
}
