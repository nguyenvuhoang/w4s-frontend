import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { projectLookupService } from '@/shared/services/projectLookupService'
import { toOptionalText } from '@/features/properties/propertyFieldHelpers'

import type {
  BuildingCreatePayload,
  BuildingDetailModel,
  BuildingDetailWithSummaryModel,
  BuildingProjectOption,
  BuildingSearchFilter,
  BuildingSearchItem,
  BuildingSearchRequest,
  BuildingSearchResponse,
  BuildingsByProjectResponse,
  BuildingUpdatePayload
} from './types'

export const BUILDINGS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_BUILDINGS'
export const BUILDING_DETAIL_WORKFLOW_ID = 'WF_BO_GET_BUILDING_BY_ID'
export const BUILDINGS_BY_PROJECT_WORKFLOW_ID = 'WF_BO_GET_BUILDING_BY_PROJECT_ID'
export const BUILDING_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_BUILDING'
export const BUILDING_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_BUILDING'
export const BUILDING_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_BUILDING'

const emptyBuildingResponse: BuildingSearchResponse = {
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

const assertWorkflowSuccess = (response: any, fallback: string, language?: Locale | string) => {
  const dataresponse = pickDataResponse(response)
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

const mapBuilding = (item: any): BuildingSearchItem => ({
  id: toNumber(getField(item, ['id', 'building_id', 'buildingId']), 0),
  building_code: String(getField(item, ['building_code', 'buildingCode']) ?? ''),
  project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
  name: String(getField(item, ['name', 'building_name', 'buildingName']) ?? ''),
  floor_count: toNullableNumber(getField(item, ['floor_count', 'floorCount'])),
  description: toOptionalText(getField(item, ['description'])),
  resident_count: toNullableNumber(getField(item, ['resident_count', 'residentCount'])),
  status: String(getField(item, ['status']) ?? '')
})

const mapBuildingDetail = (item: any): BuildingDetailModel | null => {
  const id = toNumber(getField(item, ['id', 'building_id', 'buildingId']), NaN)

  if (!Number.isFinite(id)) return null

  return {
    id,
    building_code: String(getField(item, ['building_code', 'buildingCode']) ?? ''),
    project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
    name: String(getField(item, ['name', 'building_name', 'buildingName']) ?? ''),
    floor_count: toNullableNumber(getField(item, ['floor_count', 'floorCount'])),
    status: String(getField(item, ['status']) ?? ''),
    image_url: getField(item, ['image_url', 'imageUrl']) ?? null,
    display_order: toNullableNumber(getField(item, ['display_order', 'displayOrder'])),
    description: toOptionalText(getField(item, ['description'])),
    resident_count: toNullableNumber(getField(item, ['resident_count', 'residentCount']))
  }
}

/** Explicit WF_BO_SIMPLE_SEARCH_BUILDINGS input; `status` is always sent ("" = all). */
export const buildBuildingSearchRequest = (filter: BuildingSearchFilter & { project_id: number }): BuildingSearchRequest => ({
  page_size: filter.page_size,
  page_index: Math.max(filter.page_index - 1, 0),
  search_text: filter.search_text.trim(),
  project_id: filter.project_id,
  status: filter.status ?? ''
})

const mapBuildingSearchResponse = (
  response: any,
  request: BuildingSearchRequest
): BuildingSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapBuilding),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    total_count,
    total_pages,
    has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage']))
  }
}

export const buildingService = {
  getDefaultBuildingResponse: (filter?: Partial<BuildingSearchFilter>): BuildingSearchResponse => ({
    ...emptyBuildingResponse,
    page_index: filter?.page_index ?? emptyBuildingResponse.page_index,
    page_size: filter?.page_size ?? emptyBuildingResponse.page_size
  }),

  simpleSearchProjects: async ({
    sessiontoken,
    language
  }: {
    sessiontoken?: string
    language?: Locale
  }): Promise<BuildingProjectOption[]> => {
    const response = await projectLookupService.searchProjects({
      sessiontoken,
      language,
      filter: {
        search_text: '',
        page_index: 1,
        page_size: 100
      }
    })

    return response.items.map(project => {
      const raw = project.raw as Record<string, unknown>

      return {
        id: project.id,
        code: project.code,
        name: project.name || project.displayLabel,
        status: String(raw?.status ?? ''),
        address: String(raw?.address ?? '')
      }
    })
  },

  simpleSearchBuildings: async ({
    sessiontoken,
    language,
    scope,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    scope?: string
    filter: BuildingSearchFilter
  }): Promise<BuildingSearchResponse> => {
    if (!sessiontoken || !filter.project_id) return buildingService.getDefaultBuildingResponse(filter)

    const request = buildBuildingSearchRequest({ ...filter, project_id: filter.project_id })

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BUILDINGS_SEARCH_WORKFLOW_ID,
      input: request,
      language,
      scope
    })

    assertWorkflowSuccess(response, 'Unable to load buildings.', language)

    return mapBuildingSearchResponse(response, request)
  },

  getBuildingById: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<BuildingDetailWithSummaryModel> => {
    if (!sessiontoken) {
      return {
        building: null,
        summary: {
          total_floors: 0,
          total_apartments: 0,
          total_residents: 0
        }
      }
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BUILDING_DETAIL_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load building detail.', language)

    const root = pickDataRoot(response?.payload ?? response)
    // Older responses wrap the tower in `buildings`; the current one returns its fields flat next to the aggregates.
    const building_raw = getField(root, ['buildings']) ?? getField(root?.data, ['buildings']) ?? root
    const building = mapBuildingDetail(building_raw)
    const summary = {
      total_floors: toNullableNumber(getField(root, ['total_floors', 'totalFloors'])) ?? 0,
      total_apartments: toNullableNumber(getField(root, ['total_apartments', 'totalApartments'])) ?? 0,
      total_residents: toNullableNumber(getField(root, ['total_residents', 'totalResidents'])) ?? 0
    }

    return { building, summary }
  },

  // Contract: { project_id, building_code, name, floor_count, description, resident_count } — no display_order / status / id.
  // Returns the created tower id when the response carries one, otherwise null.
  createBuilding: async ({
    sessiontoken,
    language,
    payload
  }: {
    sessiontoken?: string
    language?: Locale
    payload: BuildingCreatePayload
  }): Promise<number | null> => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BUILDING_CREATE_WORKFLOW_ID,
      input: {
        project_id: payload.project_id,
        building_code: payload.building_code,
        name: payload.name,
        floor_count: payload.floor_count,
        description: payload.description,
        resident_count: payload.resident_count
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to create building.', language)

    const root = pickDataRoot(response?.payload ?? response)
    const created = getField(root, ['buildings', 'building']) ?? root
    const id = toNumber(getField(created, ['id', 'building_id', 'buildingId']), 0)

    return id > 0 ? id : null
  },

  // Backend contract: { id, building_code, name, floor_count, display_order, description, resident_count, status }.
  updateBuilding: async ({
    sessiontoken,
    language,
    payload
  }: {
    sessiontoken?: string
    language?: Locale
    payload: BuildingUpdatePayload
  }) => {
    if (!sessiontoken) throw new Error('Session is required.')

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BUILDING_UPDATE_WORKFLOW_ID,
      input: {
        id: payload.id,
        building_code: payload.building_code,
        name: payload.name,
        floor_count: payload.floor_count,
        display_order: payload.display_order,
        description: payload.description,
        resident_count: payload.resident_count,
        status: payload.status
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to update building.', language)

    return response
  },

  deleteBuilding: async ({
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
      workflowid: BUILDING_DELETE_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete building.', language)

    return response
  },

  getBuildingsByProjectId: async ({
    sessiontoken,
    language,
    project_id
  }: {
    sessiontoken?: string
    language?: Locale
    project_id: number
  }): Promise<BuildingsByProjectResponse> => {
    if (!sessiontoken || !project_id) {
      return {
        project_id: project_id || 0,
        buildings: [],
        total_floors: 0,
        total_apartments: 0,
        total_residents: 0
      }
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: BUILDINGS_BY_PROJECT_WORKFLOW_ID,
      input: { project_id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load building summary.', language)

    const root = pickDataRoot(response?.payload ?? response)
    const buildings_raw = Array.isArray(root)
      ? root
      : getField(root, ['buildings']) ?? getField(root?.data, ['buildings'])

    return {
      project_id: toNumber(getField(root, ['project_id', 'projectId']), project_id),
      buildings: Array.isArray(buildings_raw) ? buildings_raw.map(mapBuilding) : [],
      total_floors: toNullableNumber(getField(root, ['total_floors', 'totalFloors'])) ?? 0,
      total_apartments: toNullableNumber(getField(root, ['total_apartments', 'totalApartments'])) ?? 0,
      total_residents: toNullableNumber(getField(root, ['total_residents', 'totalResidents'])) ?? 0
    }
  }
}
