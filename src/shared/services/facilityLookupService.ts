import type { Locale } from '@/configs/i18n'
import { facilityService } from '@/features/facilities/services/facilityService'

export type FacilityLookupOption = {
  id: number
  code: string
  name: string
  description: string
  displayLabel: string
  projectId: number
  requireDeposit: boolean
  depositAmount: number | null
  termsUrl: string | null
  advanceBookingDays: number | null
  maxSlotsPerDay: number | null
  status: string
  raw: unknown
}

export type FacilityLookupFilter = {
  search_text: string
  page_index: number
  page_size: number
}

export type FacilityLookupResult = {
  items: FacilityLookupOption[]
  total_count: number
  page_index: number
  page_size: number
}

const mapFacilityOption = (item: Awaited<ReturnType<typeof facilityService.simpleSearchFacilities>>['items'][number]): FacilityLookupOption | null => {
  const id = Number(item.id)

  if (!Number.isInteger(id) || id <= 0) return null

  const code = String(item.facility_code ?? '').trim()
  const name = String(item.name ?? '').trim()
  const description = String(item.description ?? '').trim()
  const displayLabel = [code, name].filter(Boolean).join(' - ') || code || name || String(id)

  return {
    id,
    code,
    name,
    description,
    displayLabel,
    projectId: Number(item.project_id) || 0,
    requireDeposit: Boolean(item.require_deposit),
    depositAmount: item.deposit_amount ?? null,
    termsUrl: item.terms_url ?? null,
    advanceBookingDays: item.advance_booking_days ?? null,
    maxSlotsPerDay: item.max_slots_per_day ?? null,
    status: String(item.status ?? ''),
    raw: item
  }
}

const uniqueOptions = (items: FacilityLookupOption[]) => {
  const seen = new Set<number>()

  return items.filter(item => {
    if (seen.has(item.id)) return false

    seen.add(item.id)

    return true
  })
}

export const facilityLookupService = {
  searchFacilities: async ({
    sessiontoken,
    language,
    projectId,
    filter,
    activeOnly = false
  }: {
    sessiontoken?: string
    language?: Locale | string
    projectId: number
    filter: FacilityLookupFilter
    activeOnly?: boolean
  }): Promise<FacilityLookupResult> => {
    if (!sessiontoken || !Number.isInteger(projectId) || projectId <= 0) {
      return {
        items: [],
        total_count: 0,
        page_index: filter.page_index,
        page_size: filter.page_size
      }
    }

    const response = await facilityService.simpleSearchFacilities({
      sessiontoken,
      language: language as Locale,
      filter: {
        search_text: filter.search_text.trim(),
        page_index: filter.page_index,
        page_size: filter.page_size,
        project_id: projectId
      }
    })

    const mappedItems = uniqueOptions(
      response.items
        .map(mapFacilityOption)
        .filter((item): item is FacilityLookupOption => item !== null)
    )
    const items = activeOnly
      ? mappedItems.filter(item => item.status === 'A')
      : mappedItems

    return {
      items,
      total_count: response.total_count,
      page_index: response.page_index,
      page_size: response.page_size
    }
  }
}
