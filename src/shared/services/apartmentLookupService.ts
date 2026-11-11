import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { LIST_APARTMENTS_BY_PROJECT_WORKFLOW_ID } from '@/features/resident/services/residentWorkflowIds'

export type ApartmentLookupOption = {
  id: number
  code: string
  displayLabel: string
  buildingCode: string
  apartmentType: string
  apartmentTypeLabel: string
  electricMeterCode: string
  waterMeterCode: string
  hasOwner: boolean
  raw: unknown
}

export type ApartmentLookupFilter = {
  apartment_code: string
  apartment_type: string
  page_index: number
  page_size: number
}

export type ApartmentLookupResult = {
  items: ApartmentLookupOption[]
  total_count: number
  page_index: number
  page_size: number
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
  const dataresponse = payload?.dataresponse ?? payload?.payload?.dataresponse
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
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizePageSize = (value: unknown, fallback: number) => {
  const pageSize = toNumber(value, fallback)

  return [5, 10, 20, 50].includes(pageSize) ? pageSize : fallback
}

const toBoolean = (value: unknown) => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const getWorkflowErrorMessage = (response: any, fallback: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []

  if (Array.isArray(errors) && errors.length > 0) {
    return errors[0]?.info ?? errors[0]?.message ?? errors[0]?.description ?? fallback
  }

  return dataresponse?.message
    ?? dataresponse?.data?.message
    ?? response?.payload?.message
    ?? response?.message
    ?? fallback
}

const assertWorkflowSuccess = (response: any, fallback: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
  const failed = response?.success === false
    || dataresponse?.success === false
    || data?.success === false
    || dataresponse?.code === 'failed'
    || data?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    throw new Error(getWorkflowErrorMessage(response, fallback))
  }
}

const mapApartmentOption = (item: any): ApartmentLookupOption | null => {
  const id = toNumber(getField(item, ['id', 'apartment_id', 'apartmentId', 'unit_id', 'unitId', 'room_id', 'roomId']), 0)

  if (id <= 0) return null

  const code = String(getField(item, ['full_apartment_code', 'fullApartmentCode', 'apartment_code', 'apartmentCode', 'unit_code', 'unitCode', 'room_code', 'roomCode', 'code']) ?? '').trim()
  const buildingCode = String(getField(item, ['building_code', 'buildingCode']) ?? '').trim()
  const apartmentType = String(getField(item, ['apartment_type', 'apartmentType', 'unit_type', 'unitType', 'type']) ?? '').trim()
  const apartmentTypeLabel = String(getField(item, ['apartment_type_name', 'apartmentTypeName', 'unit_type_name', 'unitTypeName', 'type_name', 'typeName']) ?? apartmentType).trim()
  const electricMeterCode = String(getField(item, ['electric_meter_code', 'electricMeterCode', 'meter_code', 'meterCode']) ?? '').trim()
  const waterMeterCode = String(getField(item, ['water_meter_code', 'waterMeterCode']) ?? '').trim()
  const hasOwner = toBoolean(getField(item, ['has_owner', 'hasOwner']))
  const displayLabel = code || String(id)

  return {
    id,
    code,
    displayLabel,
    buildingCode,
    apartmentType,
    apartmentTypeLabel,
    electricMeterCode,
    waterMeterCode,
    hasOwner,
    raw: item
  }
}

const uniqueOptions = (items: ApartmentLookupOption[]) => {
  const seen = new Set<number>()

  return items.filter(item => {
    if (seen.has(item.id)) return false

    seen.add(item.id)

    return true
  })
}

export const apartmentLookupService = {
  searchApartments: async ({
    sessiontoken,
    language,
    projectId,
    filter
  }: {
    sessiontoken?: string
    language?: Locale | string
    projectId: number
    filter: ApartmentLookupFilter
  }): Promise<ApartmentLookupResult> => {
    if (!sessiontoken || !Number.isInteger(projectId) || projectId <= 0) {
      return {
        items: [],
        total_count: 0,
        page_index: filter.page_index,
        page_size: filter.page_size
      }
    }

    const request = {
      project_id: projectId,
      page_index: Math.max(filter.page_index, 0),
      page_size: normalizePageSize(filter.page_size, 10),
      search_text: filter.apartment_code.trim()
    }

    const response = await workflowService.runFODynamic({
      sessiontoken,
      workflowid: LIST_APARTMENTS_BY_PROJECT_WORKFLOW_ID,
      input: request,
      language: language as Locale
    })

    assertWorkflowSuccess(response, 'Unable to load apartments.')

    const root = pickDataRoot(response?.payload ?? response)
    const normalizedApartmentType = filter.apartment_type.trim().toLowerCase()
    const mappedItems = uniqueOptions(
      pickItems(root)
        .map(mapApartmentOption)
        .filter((item): item is ApartmentLookupOption => item !== null)
    )
    const items = mappedItems.filter(item => (
      !normalizedApartmentType
      || item.apartmentTypeLabel.toLowerCase().includes(normalizedApartmentType)
      || item.apartmentType.toLowerCase().includes(normalizedApartmentType)
    ))
    const hasClientOnlyFilter = Boolean(normalizedApartmentType)

    return {
      items,
      total_count: hasClientOnlyFilter ? items.length : toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems', 'total']), items.length),
      page_index: filter.page_index,
      page_size: request.page_size
    }
  }
}
