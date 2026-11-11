import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { buildingService } from '@/features/properties/building/buildingService'
import { floorService } from '@/features/properties/floor/floorService'
import { toOptionalText } from '@/features/properties/propertyFieldHelpers'

import type {
  ApartmentBuildingOption,
  ApartmentCreateRequest,
  ApartmentDetailBuilding,
  ApartmentDetailFloor,
  ApartmentDetailApartment,
  ApartmentDetailProject,
  ApartmentDetailResult,
  ApartmentFloorOption,
  ApartmentProjectOption,
  ApartmentSearchFilter,
  ApartmentSearchItem,
  ApartmentSearchRequest,
  ApartmentSearchResponse,
  ApartmentUpdateRequest
} from '../types'

export const APARTMENTS_SEARCH_WORKFLOW_ID = 'WF_BO_ADVANCED_SEARCH_APARTMENT'
export const APARTMENT_DETAIL_WORKFLOW_ID = 'WF_BO_GET_APARTMENT_DETAIL'
export const APARTMENT_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_APARTMENT'
export const APARTMENT_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_APARTMENT'
export const APARTMENT_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_APARTMENT'

// Tower / floor option lists: requested page by page until complete (same approach as useMenuTreeData),
// so a project with more towers/floors than one page never silently loses options.
const OPTIONS_PAGE_SIZE = 100
const OPTIONS_MAX_PAGES = 25

/** Loads pages 1..n (1-based filter page_index) until total_count / has_next_page say the list is complete. */
export const collectAllPages = async <T>(
  fetchPage: (pageIndex: number) => Promise<{ items: T[]; total_count: number; has_next_page: boolean }>
): Promise<T[]> => {
  const collected: T[] = []

  for (let pageIndex = 1; pageIndex <= OPTIONS_MAX_PAGES; pageIndex += 1) {
    const page = await fetchPage(pageIndex)

    collected.push(...page.items)
    if (page.items.length === 0 || (collected.length >= page.total_count && !page.has_next_page)) break
  }

  return collected
}

const emptyApartmentResponse: ApartmentSearchResponse = {
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

const mapApartment = (item: any): ApartmentSearchItem => ({
  id: toNumber(getField(item, ['id', 'apartment_id', 'apartmentId']), 0),
  apartment_code: String(getField(item, ['apartment_code', 'apartmentCode']) ?? ''),
  unit_number: String(getField(item, ['unit_number', 'unitNumber', 'apartment_no', 'apartmentNo']) ?? ''),
  project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
  building_id: toNumber(getField(item, ['building_id', 'buildingId']), 0),
  floor_id: toNumber(getField(item, ['floor_id', 'floorId']), 0),
  floor: String(getField(item, ['floor', 'floor_no', 'floorNo']) ?? ''),
  apartment_type: String(getField(item, ['apartment_type', 'apartmentType']) ?? ''),
  area: toNullableNumber(getField(item, ['area'])),
  water_meter_code: String(getField(item, ['water_meter_code', 'waterMeterCode']) ?? ''),
  payment_qr_code: String(getField(item, ['payment_qr_code', 'paymentQrCode']) ?? ''),
  room_count: toNullableNumber(getField(item, ['room_count', 'roomCount'])),
  apartment_status: toOptionalText(getField(item, ['apartment_status', 'apartmentStatus'])),
  status: String(getField(item, ['status']) ?? '').toUpperCase()
})

const mapApartmentDetailApartment = (item: any): ApartmentDetailApartment | null => {
  const id = toNumber(getField(item, ['id', 'apartment_id', 'apartmentId']), NaN)

  if (!Number.isFinite(id)) return null

  return {
    id,
    project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
    building_id: toNumber(getField(item, ['building_id', 'buildingId']), 0),
    floor_id: toNumber(getField(item, ['floor_id', 'floorId']), 0),
    apartment_code: String(getField(item, ['apartment_code', 'apartmentCode']) ?? ''),
    project_code: String(getField(item, ['project_code', 'projectCode']) ?? ''),
    building_code: String(getField(item, ['building_code', 'buildingCode']) ?? ''),
    floor_code: String(getField(item, ['floor_code', 'floorCode']) ?? ''),
    floor: String(getField(item, ['floor']) ?? ''),
    unit_number: String(getField(item, ['unit_number', 'unitNumber']) ?? ''),
    apartment_type: String(getField(item, ['apartment_type', 'apartmentType']) ?? ''),
    area: toNullableNumber(getField(item, ['area'])),
    water_meter_code: String(getField(item, ['water_meter_code', 'waterMeterCode']) ?? ''),
    water_meter_code2: String(getField(item, ['water_meter_code2', 'waterMeterCode2']) ?? ''),
    electric_meter_code: String(getField(item, ['electric_meter_code', 'electricMeterCode']) ?? ''),
    electricity_meter_code: String(getField(item, ['electricity_meter_code', 'electricityMeterCode']) ?? ''),
    room_count: toNullableNumber(getField(item, ['room_count', 'roomCount'])),
    handover_date: String(getField(item, ['handover_date', 'handoverDate']) ?? ''),
    description: String(getField(item, ['description']) ?? ''),
    payment_qr_code: getField(item, ['payment_qr_code', 'paymentQrCode']) ?? null,
    apartment_status: toOptionalText(getField(item, ['apartment_status', 'apartmentStatus'])),
    status: String(getField(item, ['status']) ?? '').toUpperCase()
  }
}

const mapApartmentDetailProject = (item: any): ApartmentDetailProject | null => {
  if (!item || typeof item !== 'object') return null

  return {
    id: toNumber(getField(item, ['id', 'project_id', 'projectId']), 0),
    project_code: String(getField(item, ['project_code', 'projectCode']) ?? ''),
    name: String(getField(item, ['name']) ?? ''),
    address: getField(item, ['address']) ?? null,
    description: getField(item, ['description']) ?? null,
    logo_url: getField(item, ['logo_url', 'logoUrl']) ?? null,
    status: String(getField(item, ['status']) ?? '').toUpperCase()
  }
}

const mapApartmentDetailBuilding = (item: any): ApartmentDetailBuilding | null => {
  if (!item || typeof item !== 'object') return null

  return {
    id: toNumber(getField(item, ['id', 'building_id', 'buildingId']), 0),
    project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
    project_code: String(getField(item, ['project_code', 'projectCode']) ?? ''),
    building_code: String(getField(item, ['building_code', 'buildingCode']) ?? ''),
    name: String(getField(item, ['name']) ?? ''),
    floor_count: toNullableNumber(getField(item, ['floor_count', 'floorCount'])),
    display_order: toNullableNumber(getField(item, ['display_order', 'displayOrder'])),
    status: String(getField(item, ['status']) ?? '').toUpperCase()
  }
}

const mapApartmentDetailFloor = (item: any): ApartmentDetailFloor | null => {
  if (!item || typeof item !== 'object') return null

  return {
    id: toNumber(getField(item, ['id', 'floor_id', 'floorId']), 0),
    project_id: toNumber(getField(item, ['project_id', 'projectId']), 0),
    building_id: toNumber(getField(item, ['building_id', 'buildingId']), 0),
    floor_code: String(getField(item, ['floor_code', 'floorCode']) ?? ''),
    name: String(getField(item, ['name']) ?? ''),
    display_order: toNullableNumber(getField(item, ['display_order', 'displayOrder'])),
    status: String(getField(item, ['status']) ?? '').toUpperCase()
  }
}

const mapApartmentSearchResponse = (
  response: any,
  request: ApartmentSearchRequest
): ApartmentSearchResponse => {
  const root = pickDataRoot(response?.payload ?? response)
  const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
  const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
  const total_pages = toNumber(
    getField(root, ['total_pages', 'totalPages']),
    page_size > 0 ? Math.ceil(total_count / page_size) : 0
  )

  return {
    items: pickItems(root).map(mapApartment),
    page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
    page_size,
    total_count,
    total_pages,
    has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
    has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage']))
  }
}

export const apartmentSearchService = {
  getDefaultApartmentResponse: (filter?: Partial<ApartmentSearchFilter>): ApartmentSearchResponse => ({
    ...emptyApartmentResponse,
    page_index: filter?.page_index ?? emptyApartmentResponse.page_index,
    page_size: filter?.page_size ?? emptyApartmentResponse.page_size
  }),

  simpleSearchProjects: async ({
    sessiontoken,
    language
  }: {
    sessiontoken?: string
    language?: Locale
  }): Promise<ApartmentProjectOption[]> => buildingService.simpleSearchProjects({ sessiontoken, language }),

  /** Every tower of the project (all pages of WF_BO_SIMPLE_SEARCH_BUILDINGS) for the tower filter / form select. */
  simpleSearchBuildings: async ({
    sessiontoken,
    language,
    project_id,
    page_size = OPTIONS_PAGE_SIZE
  }: {
    sessiontoken?: string
    language?: Locale
    project_id: number
    /** Page size of each request; all pages are loaded. */
    page_size?: number
  }): Promise<ApartmentBuildingOption[]> => {
    if (!sessiontoken || !project_id) return []

    const items = await collectAllPages(page_index => buildingService.simpleSearchBuildings({
      sessiontoken,
      language,
      filter: { page_size, page_index, search_text: '', project_id }
    }))

    return items.map(building => ({
      id: building.id,
      building_code: building.building_code,
      name: building.name,
      status: building.status
    }))
  },

  /** Every floor of the tower (all pages of WF_BO_SIMPLE_SEARCH_FLOORS) for the floor filter / form select. */
  simpleSearchFloors: async ({
    sessiontoken,
    language,
    project_id,
    building_id,
    page_size = OPTIONS_PAGE_SIZE
  }: {
    sessiontoken?: string
    language?: Locale
    project_id: number
    building_id: number
    /** Page size of each request; all pages are loaded. */
    page_size?: number
  }): Promise<ApartmentFloorOption[]> => {
    if (!sessiontoken || !project_id || !building_id) return []

    const items = await collectAllPages(page_index => floorService.simpleSearchFloors({
      sessiontoken,
      language,
      filter: { page_size, page_index, search_text: '', project_id, building_id }
    }))

    return items.map(floor => ({
      id: floor.id,
      floor_code: floor.floor_code,
      // Raw name only: floor_no may be a wrong default (floor_code "01" with floor_no 0), so it is not a label.
      name: floor.name,
      status: floor.status,
      floor_no: floor.floor_no
    }))
  },

  simpleSearchApartments: async ({
    sessiontoken,
    language,
    filter
  }: {
    sessiontoken?: string
    language?: Locale
    filter: ApartmentSearchFilter
  }): Promise<ApartmentSearchResponse> => {
    if (!sessiontoken || !filter.project_id) return apartmentSearchService.getDefaultApartmentResponse(filter)

    const request: ApartmentSearchRequest = {
      page_size: filter.page_size,
      page_index: Math.max(filter.page_index - 1, 0),
      search_text: filter.search_text.trim(),
      project_id: filter.project_id,
      building_id: filter.building_id,
      floor_id: filter.floor_id,
      status: filter.status === 'all' ? null : filter.status.toUpperCase(),
      qr_payment_status: filter.qr_payment_enabled === 'all' ? null : (filter.qr_payment_enabled === 'yes' ? 'Y' : 'N')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: APARTMENTS_SEARCH_WORKFLOW_ID,
      input: request,
      language
    })

    assertWorkflowSuccess(response, 'Unable to load apartments.', language)

    return mapApartmentSearchResponse(response, request)
  },

  getApartmentDetail: async ({
    sessiontoken,
    language,
    apartment_id
  }: {
    sessiontoken?: string
    language?: Locale
    apartment_id: number
  }): Promise<ApartmentDetailResult> => {
    if (!sessiontoken || !Number.isInteger(apartment_id) || apartment_id <= 0) {
      return { apartment: null, project: null, building: null, floor: null }
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: APARTMENT_DETAIL_WORKFLOW_ID,
      input: { apartment_id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to load apartment detail.', language)

    const root = pickDataRoot(response?.payload ?? response)

    return {
      apartment: mapApartmentDetailApartment(getField(root, ['apartment'])),
      project: mapApartmentDetailProject(getField(root, ['project'])),
      building: mapApartmentDetailBuilding(getField(root, ['building'])),
      floor: mapApartmentDetailFloor(getField(root, ['floor']))
    }
  },

  /**
   * WF_BO_CREATE_APARTMENT with the exact contract fields (explicit mapping, no spread). Returns the new
   * apartment id when the response carries one, otherwise null.
   */
  createApartment: async ({
    sessiontoken,
    language,
    request
  }: {
    sessiontoken?: string
    language?: Locale
    request: ApartmentCreateRequest
  }): Promise<number | null> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: APARTMENT_CREATE_WORKFLOW_ID,
      input: {
        project_id: request.project_id,
        building_id: request.building_id,
        floor_id: request.floor_id,
        apartment_code: request.apartment_code,
        unit_number: request.unit_number,
        floor: request.floor,
        water_meter_code: request.water_meter_code,
        water_meter_code2: request.water_meter_code2,
        electric_meter_code: request.electric_meter_code,
        electricity_meter_code: request.electricity_meter_code,
        apartment_type: request.apartment_type,
        apartment_status: request.apartment_status,
        area: request.area,
        room_count: request.room_count,
        handover_date: request.handover_date,
        description: request.description,
        status: request.status
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to create apartment.', language)

    const root = pickDataRoot(response?.payload ?? response)
    const created = getField(root, ['apartment']) ?? root
    const id = toNumber(getField(created, ['id', 'apartment_id', 'apartmentId']), 0)

    return id > 0 ? id : null
  },

  /** WF_BO_UPDATE_APARTMENT with the exact 17 contract fields (explicit mapping, no spread, no project_id). */
  updateApartment: async ({
    sessiontoken,
    language,
    request
  }: {
    sessiontoken?: string
    language?: Locale
    request: ApartmentUpdateRequest
  }): Promise<void> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: APARTMENT_UPDATE_WORKFLOW_ID,
      input: {
        id: request.id,
        building_id: request.building_id,
        floor_id: request.floor_id,
        apartment_code: request.apartment_code,
        unit_number: request.unit_number,
        floor: request.floor,
        water_meter_code: request.water_meter_code,
        water_meter_code2: request.water_meter_code2,
        electric_meter_code: request.electric_meter_code,
        electricity_meter_code: request.electricity_meter_code,
        apartment_type: request.apartment_type,
        apartment_status: request.apartment_status,
        area: request.area,
        room_count: request.room_count,
        handover_date: request.handover_date,
        description: request.description,
        status: request.status
      },
      language
    })

    assertWorkflowSuccess(response, 'Unable to update apartment.', language)
  },

  /** WF_BO_DELETE_APARTMENT: exactly { id } (the apartment id). Rejects on a workflow error. */
  deleteApartment: async ({
    sessiontoken,
    language,
    id
  }: {
    sessiontoken?: string
    language?: Locale
    id: number
  }): Promise<void> => {
    if (!sessiontoken) {
      throw new Error('Session is required.')
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: APARTMENT_DELETE_WORKFLOW_ID,
      input: { id },
      language
    })

    assertWorkflowSuccess(response, 'Unable to delete apartment.', language)
  }
}
