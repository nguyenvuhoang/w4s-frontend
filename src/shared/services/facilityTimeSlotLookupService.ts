import type { Locale } from '@/configs/i18n'
import { facilityService } from '@/features/facilities/services/facilityService'

export type FacilityTimeSlotLookupOption = {
  id: number
  facilityId: number
  name: string
  startTime: string | null
  endTime: string | null
  basePrice: number | null
  maxCapacity: number | null
  dayOfWeek: number | null
  status: string
  displayLabel: string
  raw: unknown
}

export type FacilityTimeSlotLookupFilter = {
  search_text: string
  page_index: number
  page_size: number
}

export type FacilityTimeSlotLookupResult = {
  items: FacilityTimeSlotLookupOption[]
  total_count: number
  page_index: number
  page_size: number
}

const formatTimeLabel = (value: string | null) => {
  if (!value) return ''

  const match = String(value).match(/^(\d{1,2}):(\d{2})/)

  if (!match) return String(value)

  return `${match[1].padStart(2, '0')}:${match[2]}`
}

const mapTimeSlotOption = (item: Awaited<ReturnType<typeof facilityService.simpleSearchFacilityTimeSlots>>['items'][number]): FacilityTimeSlotLookupOption | null => {
  const id = Number(item.id)

  if (!Number.isInteger(id) || id <= 0) return null

  const name = String(item.name ?? '').trim()
  const startTime = item.start_time ?? null
  const endTime = item.end_time ?? null
  const startLabel = formatTimeLabel(startTime)
  const endLabel = formatTimeLabel(endTime)
  const timeLabel = [startLabel, endLabel].filter(Boolean).join(' - ')
  const displayLabel = [name, timeLabel].filter(Boolean).join(' - ') || name || timeLabel || String(id)
  return {
    id,
    facilityId: Number(item.facility_id) || 0,
    name,
    startTime,
    endTime,
    basePrice: item.base_price ?? null,
    maxCapacity: item.max_capacity ?? null,
    dayOfWeek: item.day_of_week ?? null,
    status: String(item.status ?? ''),
    displayLabel,
    raw: item
  }
}

const uniqueOptions = (items: FacilityTimeSlotLookupOption[]) => {
  const seen = new Set<number>()

  return items.filter(item => {
    if (seen.has(item.id)) return false

    seen.add(item.id)

    return true
  })
}

export const facilityTimeSlotLookupService = {
  formatTimeLabel,
  searchFacilityTimeSlots: async ({
    sessiontoken,
    language,
    facilityId,
    filter,
    activeOnly = true
  }: {
    sessiontoken?: string
    language?: Locale | string
    facilityId: number
    filter: FacilityTimeSlotLookupFilter
    activeOnly?: boolean
  }): Promise<FacilityTimeSlotLookupResult> => {
    if (!sessiontoken || !Number.isInteger(facilityId) || facilityId <= 0) {
      return {
        items: [],
        total_count: 0,
        page_index: filter.page_index,
        page_size: filter.page_size
      }
    }

    const response = await facilityService.simpleSearchFacilityTimeSlots({
      sessiontoken,
      language: language as Locale,
      filter: {
        search_text: filter.search_text.trim(),
        page_index: filter.page_index,
        page_size: filter.page_size,
        facility_id: facilityId
      }
    })

    const mappedItems = uniqueOptions(
      response.items
        .map(mapTimeSlotOption)
        .filter((item): item is FacilityTimeSlotLookupOption => item !== null)
    )
    const items = activeOnly ? mappedItems.filter(item => item.status === 'A') : mappedItems

    return {
      items,
      total_count: response.total_count,
      page_index: response.page_index,
      page_size: response.page_size
    }
  }
}
