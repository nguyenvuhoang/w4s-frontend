import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError, normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'

export const SIMPLE_SEARCH_COUNTRY_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_COUNTRY'

type UnknownRecord = Record<string, unknown>

export type CountryLookupOption = {
    country_id: string
    country_code: string
    country_name: string
    m_country_name: string
    status: string
}

export type CountryLookupRequest = {
    search_text: string
    page_index: number
    page_size: number
    status: 'A'
    exclude_deleted: true
}

export type CountryLookupResult = {
    items: CountryLookupOption[]
    total_count: number
    total_pages: number
    page_index: number
    page_size: number
}

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null && !Array.isArray(value)
const field = (value: unknown, key: string): unknown => isRecord(value) ? value[key] : undefined
const numberValue = (value: unknown, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback

const responseRoot = (response: unknown): unknown => {
    const payload = field(response, 'payload')
    const dataResponse = field(payload, 'dataresponse') ?? field(response, 'dataresponse')
    const data = field(dataResponse, 'data') ?? field(payload, 'data') ?? field(response, 'data')

    return field(data, 'data') ?? data ?? response
}

const hasWorkflowFailure = (response: unknown) => {
    const payload = field(response, 'payload')
    const dataResponse = field(payload, 'dataresponse') ?? field(response, 'dataresponse')
    const data = field(dataResponse, 'data') ?? field(payload, 'data') ?? field(response, 'data')

    return field(response, 'success') === false
        || field(dataResponse, 'success') === false
        || field(data, 'success') === false
        || field(dataResponse, 'code') === 'failed'
        || field(data, 'code') === 'failed'
}

const mapCountry = (value: unknown): CountryLookupOption => ({
    country_id: String(field(value, 'country_id') ?? '').trim(),
    country_code: String(field(value, 'country_code') ?? '').trim(),
    country_name: String(field(value, 'country_name') ?? '').trim(),
    m_country_name: String(field(value, 'm_country_name') ?? '').trim(),
    status: String(field(value, 'status') ?? '').trim()
})

export const countryLookupLabel = (country: CountryLookupOption, locale: Locale | string): string => {
    try {
        const localizedNames: unknown = country.m_country_name ? JSON.parse(country.m_country_name) : null
        const name = isRecord(localizedNames) ? localizedNames[locale] : undefined

        if (typeof name === 'string' && name.trim()) return name.trim()
    } catch {
        // A malformed localized payload must not prevent country selection.
    }

    return country.country_name || country.country_code || country.country_id
}

export const mapCountrySearchResponse = (response: unknown, request: CountryLookupRequest): CountryLookupResult => {
    const root = responseRoot(response)
    const items = field(root, 'items')
    const totalCount = numberValue(field(root, 'total_count'), Array.isArray(items) ? items.length : 0)

    return {
        items: Array.isArray(items) ? items.map(mapCountry).filter(country => Boolean(country.country_id)) : [],
        total_count: totalCount,
        total_pages: numberValue(field(root, 'total_pages'), Math.ceil(totalCount / request.page_size)),
        page_index: Math.max(numberValue(field(root, 'page_index'), request.page_index), 0),
        page_size: numberValue(field(root, 'page_size'), request.page_size)
    }
}

export const countryLookupService = {
    searchCountries: async ({ sessiontoken, language, searchText, pageIndex = 0, pageSize = 20 }: {
        sessiontoken?: string
        language?: Locale | string
        searchText: string
        pageIndex?: number
        pageSize?: number
    }): Promise<CountryLookupResult> => {
        const request: CountryLookupRequest = {
            search_text: searchText.trim(),
            page_index: Math.max(pageIndex, 0),
            page_size: 20,
            status: 'A',
            exclude_deleted: true
        }

        if (!sessiontoken) return mapCountrySearchResponse({}, request)

        const response: unknown = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: SIMPLE_SEARCH_COUNTRY_WORKFLOW_ID,
            input: request,
            language: language as Locale
        })
        const error = normalizeWorkflowErrorDetail(response, { fallback: 'Unable to load countries.' })

        if (error.errors?.length || hasWorkflowFailure(response)) {
            throw createWorkflowError(response, { fallback: 'Unable to load countries.', workflowId: SIMPLE_SEARCH_COUNTRY_WORKFLOW_ID })
        }

        return mapCountrySearchResponse(response, request)
    }
}
