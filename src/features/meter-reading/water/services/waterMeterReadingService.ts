import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

import type {
    SaveWaterMeterReadingRequest,
    WaterMeterPeriod,
    WaterMeterReading,
    WaterMeterSearchFilter,
    WaterMeterSearchItem,
    WaterMeterSearchResponse,
    WaterUsageItem,
    WaterUsageResponse
} from '../types'

export const WATER_PERIODS_WORKFLOW_ID = 'WF_BO_LIST_WATER_METER_PERIODS'
export const WATER_READINGS_WORKFLOW_ID = 'WF_BO_LIST_WATER_METER_READINGS'
export const WATER_USAGE_WORKFLOW_ID = 'WF_BO_GET_WATER_USAGE'
export const SAVE_WATER_READING_WORKFLOW_ID = 'WF_BO_SAVE_WATER_METER_READING'
export const LOCK_WATER_PERIOD_WORKFLOW_ID = 'WF_BO_LOCK_WATER_METER_PERIOD'
export const WATER_SIMPLE_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_WATER_METER_READINGS'

export class WaterMeterWorkflowError extends Error {
    code?: string

    constructor(message: string, code?: string) {
        super(message)
        this.code = code
    }
}

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
    if (!item || typeof item !== 'object') return undefined

    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) return item[key]
    }

    const fields = Object.keys(item).reduce<Record<string, any>>((acc, key) => {
        acc[normalizeKey(key)] = item[key]

        return acc
    }, {})

    for (const key of keys) {
        const value = fields[normalizeKey(key)]

        if (value !== undefined && value !== null) return value
    }

    return undefined
}

const pickData = (response: any) => {
    const payload = response?.payload ?? response
    const dataresponse = payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? payload?.data ?? payload

    return data?.data ?? data?.input ?? data
}

const pickArray = (data: any, key: string) => {
    if (Array.isArray(data?.[key])) return data[key]
    if (Array.isArray(data)) return data

    return []
}

const toNumber = (value: any, fallback = 0) => {
    const number_value = Number(value)

    return Number.isFinite(number_value) ? number_value : fallback
}

const toNullableNumber = (value: any) => {
    if (value === null || value === undefined || value === '') return null

    const number_value = Number(value)

    return Number.isFinite(number_value) ? number_value : null
}

const assertSuccess = (response: any, fallback: string) => {
    const payload = response?.payload ?? response
    const dataresponse = payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? payload?.data
    const error_sources = [dataresponse?.errors, data?.errors, payload?.errors, response?.errors]
    const errors = error_sources.find(source => Array.isArray(source) ? source.length > 0 : Boolean(source)) ?? []
    const first_error = Array.isArray(errors) ? errors[0] : errors
    const failed = payload?.success === false
        || dataresponse?.success === false
        || data?.success === false
        || payload?.code === 'failed'
        || dataresponse?.code === 'failed'
        || data?.code === 'failed'

    if (first_error || failed) {
        throw new WaterMeterWorkflowError(
            first_error?.info ?? first_error?.message ?? data?.message ?? dataresponse?.message ?? payload?.message ?? fallback,
            first_error?.code ?? first_error?.key ?? data?.code ?? dataresponse?.code ?? payload?.code
        )
    }
}

const mapPeriod = (item: any): WaterMeterPeriod => ({
    id: toNumber(getField(item, ['id', 'water_meter_period_id', 'waterMeterPeriodId'])),
    project_id: toNumber(getField(item, ['project_id', 'projectId'])),
    project_code: String(getField(item, ['project_code', 'projectCode']) ?? ''),
    year: toNumber(getField(item, ['year'])),
    month: toNumber(getField(item, ['month'])),
    fee_period_id: toNullableNumber(getField(item, ['fee_period_id', 'feePeriodId'])),
    status: String(getField(item, ['status']) ?? ''),
    locked_on_utc: getField(item, ['locked_on_utc', 'lockedOnUtc']) ?? null,
    locked_by_user_code: getField(item, ['locked_by_user_code', 'lockedByUserCode']) ?? null
})

const mapReading = (item: any): WaterMeterReading => ({
    id: toNumber(getField(item, ['id'])),
    water_meter_period_id: toNumber(getField(item, ['water_meter_period_id', 'waterMeterPeriodId'])),
    project_id: toNumber(getField(item, ['project_id', 'projectId'])),
    project_code: String(getField(item, ['project_code', 'projectCode']) ?? ''),
    apartment_id: toNumber(getField(item, ['apartment_id', 'apartmentId'])),
    apartment_code: String(getField(item, ['apartment_code', 'apartmentCode']) ?? ''),
    building_code: String(getField(item, ['building_code', 'buildingCode']) ?? ''),
    floor: String(getField(item, ['floor']) ?? ''),
    water_meter_code: String(getField(item, ['water_meter_code', 'waterMeterCode']) ?? ''),
    last_index: toNullableNumber(getField(item, ['last_index', 'lastIndex'])),
    new_index: toNullableNumber(getField(item, ['new_index', 'newIndex'])),
    consumption: toNullableNumber(getField(item, ['consumption'])),
    status: String(getField(item, ['status']) ?? ''),
    recorded_by_user_code: getField(item, ['recorded_by_user_code', 'recordedByUserCode']) ?? null,
    recorded_on_utc: getField(item, ['recorded_on_utc', 'recordedOnUtc']) ?? null
})

const toBoolean = (value: any) => (
    value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

const pickItems = (root: any): any[] => {
    if (Array.isArray(root)) return root
    if (Array.isArray(root?.items)) return root.items
    if (Array.isArray(root?.data)) return root.data

    return []
}

const normalizeResponsePage = (value: any, request_page_index: number) => {
    const page_index = toNumber(value, request_page_index + 1)

    return page_index <= 0 ? page_index + 1 : page_index
}

const mapSearchItem = (item: any): WaterMeterSearchItem => ({
    id: toNumber(getField(item, ['id'])),
    water_meter_period_id: toNumber(getField(item, ['water_meter_period_id', 'waterMeterPeriodId'])),
    project_id: toNumber(getField(item, ['project_id', 'projectId'])),
    project_code: String(getField(item, ['project_code', 'projectCode']) ?? ''),
    building_id: toNumber(getField(item, ['building_id', 'buildingId'])),
    building_code: String(getField(item, ['building_code', 'buildingCode']) ?? ''),
    apartment_id: toNumber(getField(item, ['apartment_id', 'apartmentId'])),
    apartment_code: String(getField(item, ['apartment_code', 'apartmentCode']) ?? ''),
    floor: String(getField(item, ['floor_name', 'floorName', 'floor_number', 'floorNumber', 'floor']) ?? ''),
    water_meter_code: String(getField(item, ['water_meter_code', 'waterMeterCode']) ?? ''),
    last_index: toNullableNumber(getField(item, ['last_index', 'lastIndex'])),
    new_index: toNullableNumber(getField(item, ['new_index', 'newIndex'])),
    consumption: toNullableNumber(getField(item, ['consumption'])),
    status: String(getField(item, ['status']) ?? ''),
    recorded_by_user_code: getField(item, ['recorded_by_user_code', 'recordedByUserCode']) ?? null,
    recorded_by_user_name: getField(item, ['recorded_by_user_name', 'recordedByUserName']) ?? null,
    recorded_on_utc: getField(item, ['recorded_on_utc', 'recordedOnUtc']) ?? null
})

const mapUsage = (item: any): WaterUsageItem => ({
    water_meter_period_id: toNumber(getField(item, ['water_meter_period_id', 'waterMeterPeriodId'])),
    year: toNumber(getField(item, ['year'])),
    month: toNumber(getField(item, ['month'])),
    consumption: toNullableNumber(getField(item, ['consumption'])),
    last_index: toNullableNumber(getField(item, ['last_index', 'lastIndex'])),
    new_index: toNullableNumber(getField(item, ['new_index', 'newIndex']))
})

const runWorkflow = async ({ sessiontoken, language, workflowid, fields }: {
    sessiontoken?: string
    language?: Locale
    workflowid: string
    fields: Record<string, unknown>
}) => {
    if (!sessiontoken) throw new WaterMeterWorkflowError('Session is required.')

    const response = await workflowService.runFODynamic({ sessiontoken, workflowid, input: fields, language })

    assertSuccess(response, 'Water meter workflow failed.')

    return response
}

export const waterMeterReadingService = {
    getDefaultSearchResponse: (filter?: Partial<WaterMeterSearchFilter>): WaterMeterSearchResponse => ({
        items: [],
        page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
        page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE,
        total_count: 0,
        total_pages: 0,
        has_previous_page: false,
        has_next_page: false
    }),

    listPeriods: async ({ sessiontoken, language, project_id }: { sessiontoken?: string; language?: Locale; project_id: number }) => {
        const response = await runWorkflow({ sessiontoken, language, workflowid: WATER_PERIODS_WORKFLOW_ID, fields: { project_id } })

        return pickArray(pickData(response), 'periods').map(mapPeriod)
    },

    listReadings: async ({ sessiontoken, language, apartment_id, water_meter_period_id }: { sessiontoken?: string; language?: Locale; apartment_id: number; water_meter_period_id: number }) => {
        const response = await runWorkflow({ sessiontoken, language, workflowid: WATER_READINGS_WORKFLOW_ID, fields: { apartment_id, water_meter_period_id } })

        return pickArray(pickData(response), 'readings').map(mapReading)
    },

    getUsage: async ({ sessiontoken, language, apartment_id, water_meter_period_id }: { sessiontoken?: string; language?: Locale; apartment_id: number; water_meter_period_id: number }): Promise<WaterUsageResponse> => {
        const response = await runWorkflow({ sessiontoken, language, workflowid: WATER_USAGE_WORKFLOW_ID, fields: { apartment_id, water_meter_period_id } })
        const data = pickData(response)

        return {
            apartment_id: toNumber(getField(data, ['apartment_id', 'apartmentId']), apartment_id),
            apartment_code: String(getField(data, ['apartment_code', 'apartmentCode']) ?? ''),
            usage: pickArray(data, 'usage').map(mapUsage)
        }
    },

    saveReading: async ({ sessiontoken, language, fields }: { sessiontoken?: string; language?: Locale; fields: SaveWaterMeterReadingRequest }) => {
        await runWorkflow({ sessiontoken, language, workflowid: SAVE_WATER_READING_WORKFLOW_ID, fields })
    },

    lockPeriod: async ({ sessiontoken, language, water_meter_period_id }: { sessiontoken?: string; language?: Locale; water_meter_period_id: number }) => {
        await runWorkflow({ sessiontoken, language, workflowid: LOCK_WATER_PERIOD_WORKFLOW_ID, fields: { water_meter_period_id } })
    },

    searchReadings: async ({ sessiontoken, language, filter }: { sessiontoken?: string; language?: Locale; filter: WaterMeterSearchFilter }): Promise<WaterMeterSearchResponse> => {
        if (!sessiontoken || !filter.project_id) {
            return waterMeterReadingService.getDefaultSearchResponse(filter)
        }

        const request = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            search_text: filter.search_text.trim(),
            project_id: filter.project_id,
            building_id: filter.building_id,
            apartment_id: filter.apartment_id,
            water_meter_period_id: filter.water_meter_period_id
        }

        const response = await runWorkflow({ sessiontoken, language, workflowid: WATER_SIMPLE_SEARCH_WORKFLOW_ID, fields: request })
        const root = pickData(response)
        const total_count = toNumber(getField(root, ['total_count', 'totalCount']), 0)
        const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
        const total_pages = toNumber(
            getField(root, ['total_pages', 'totalPages']),
            page_size > 0 ? Math.ceil(total_count / page_size) : 0
        )

        return {
            items: pickItems(root).map(mapSearchItem),
            page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
            page_size,
            total_count,
            total_pages,
            has_previous_page: toBoolean(getField(root, ['has_previous_page', 'hasPreviousPage'])),
            has_next_page: toBoolean(getField(root, ['has_next_page', 'hasNextPage']))
        }
    }
}