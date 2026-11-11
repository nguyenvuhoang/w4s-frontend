import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

import type {
    CreateVendorRequest,
    CreateVendorResponse,
    VendorItem,
    VendorProjectOption,
    DeleteVendorRequest,
    UpdateVendorRequest,
    VendorsFilterModel,
    VendorsSearchRequest,
    VendorsSearchResponse
} from '../vendorTypes'
import { VendorWorkflowError } from '../vendorTypes'

export const VENDORS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_VENDORS'
export const VENDOR_DETAIL_WORKFLOW_ID = 'WF_BO_GET_VENDOR_BY_ID'
export const VENDOR_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_VENDOR'
export const VENDOR_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_VENDOR'
export const VENDOR_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_VENDOR'
export const VENDOR_PROJECTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECTS'

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-\s]/g, '')

const getField = (item: any, keys: string[]) => {
    if (!item || typeof item !== 'object') return undefined

    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) return item[key]
    }

    const normalized = Object.keys(item).reduce<Record<string, any>>((values, key) => {
        values[normalizeKey(key)] = item[key]

        return values
    }, {})

    for (const key of keys) {
        const value = normalized[normalizeKey(key)]

        if (value !== undefined && value !== null) return value
    }

    return undefined
}

const pickDataRoot = (response: any) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data ?? response

    return data?.data ?? data?.input ?? data
}

const pickItems = (root: any): any[] => {
    if (Array.isArray(root)) return root
    if (Array.isArray(root?.items)) return root.items
    if (Array.isArray(root?.data)) return root.data
    if (Array.isArray(root?.input?.items)) return root.input.items

    return []
}

const toNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : fallback
}

const toNullableString = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null

    return String(value)
}

const getWorkflowErrors = (response: any): any[] => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors

    return Array.isArray(errors) ? errors : []
}

const getExecutionId = (response: any, error?: any) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data

    return String(
        error?.execution_id
        ?? error?.executionId
        ?? dataresponse?.execution_id
        ?? dataresponse?.executionId
        ?? data?.execution_id
        ?? data?.executionId
        ?? response?.payload?.execution_id
        ?? response?.execution_id
        ?? ''
    ).trim() || undefined
}

const assertWorkflowSuccess = (response: any, fallback: string) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
    const errors = getWorkflowErrors(response)
    const failed = response?.success === false
        || dataresponse?.success === false
        || data?.success === false
        || dataresponse?.code === 'failed'
        || data?.code === 'failed'

    if (errors.length > 0 || failed) {
        const error = errors[0] ?? {}
        const message = error.info ?? error.message ?? error.description ?? dataresponse?.message ?? data?.message ?? fallback

        throw new VendorWorkflowError(message, error.next_action ?? dataresponse?.next_action, getExecutionId(response, error))
    }
}

export const mapVendor = (item: any): VendorItem => ({
    id: toNumber(getField(item, ['id', 'vendor_id'])),
    vendor_code: String(getField(item, ['vendor_code']) ?? ''),
    project_id: toNumber(getField(item, ['project_id'])),
    name: String(getField(item, ['name', 'vendor_name']) ?? ''),
    tax_code: toNullableString(getField(item, ['tax_code'])),
    contact_person: toNullableString(getField(item, ['contact_person'])),
    phone: toNullableString(getField(item, ['phone'])),
    email: toNullableString(getField(item, ['email'])),
    address: toNullableString(getField(item, ['address'])),
    status: String(getField(item, ['status']) ?? '')
})

export const mapVendorsSearchResponse = (
    response: any,
    request: VendorsSearchRequest
): VendorsSearchResponse => {
    const root = pickDataRoot(response)
    const total_count = toNumber(getField(root, ['total_count', 'total_items']))
    // Keep pagination aligned with the requested size. Some workflow responses
    // return their configured default page_size instead of the requested value.
    const page_size = request.page_size
    const total_pages = page_size > 0 ? Math.ceil(total_count / page_size) : 0

    return {
        items: pickItems(root).map(mapVendor),
        total_count,
        total_pages,
        has_previous_page: request.page_index > 0,
        has_next_page: request.page_index + 1 < total_pages,
        // The UI pagination is one-based, while the workflow request is zero-based.
        // Do not rely on the response page_index because its convention varies.
        page_index: request.page_index + 1,
        page_size
    }
}

const mapProjectOptions = (response: any): VendorProjectOption[] => {
    const root = pickDataRoot(response)

    return pickItems(root).flatMap(item => {
        const id = toNumber(getField(item, ['id', 'project_id']))

        if (id <= 0) return []

        const code = String(getField(item, ['project_code', 'code']) ?? '').trim()
        const name = String(getField(item, ['project_name', 'name', 'caption']) ?? (code || id)).trim()

        return [{ id, code, name }]
    })
}

const mapVendorDetailResponse = (response: any): VendorItem | null => {
    const root = pickDataRoot(response)
    const item = pickItems(root)[0] ?? (Array.isArray(root) ? root[0] : root?.item ?? root)

    if (!item || typeof item !== 'object') return null

    const vendor = mapVendor(item)

    return vendor.id > 0 ? vendor : null
}

const mapCreateVendorResponse = (response: any): CreateVendorResponse => {
    const root = pickDataRoot(response)

    return {
        id: toNumber(getField(root, ['id', 'vendor_id'])),
        status: String(getField(root, ['status']) ?? '')
    }
}

export const vendorService = {
    getDefaultResponse: (filter?: Partial<VendorsFilterModel>): VendorsSearchResponse => ({
        items: [],
        total_count: 0,
        total_pages: 0,
        has_previous_page: false,
        has_next_page: false,
        page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
        page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE
    }),

    simpleSearchVendors: async ({
        sessiontoken,
        language,
        filter
    }: {
        sessiontoken?: string
        language?: Locale
        filter: VendorsFilterModel
    }): Promise<VendorsSearchResponse> => {
        if (!sessiontoken) return vendorService.getDefaultResponse(filter)

        const request: VendorsSearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            search_text: filter.search_text.trim(),
            project_id: Number(filter.project_id)
        }
        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: VENDORS_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load vendors.')

        return mapVendorsSearchResponse(response, request)
    },

    getVendorById: async ({
        sessiontoken,
        language,
        id
    }: {
        sessiontoken?: string
        language?: Locale
        id: number
    }): Promise<VendorItem | null> => {
        if (!sessiontoken) throw new VendorWorkflowError('Session is required.', 'logout')

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: VENDOR_DETAIL_WORKFLOW_ID,
            input: { id },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load vendor detail.')

        return mapVendorDetailResponse(response)
    },

    createVendor: async ({
        sessiontoken,
        language,
        fields
    }: {
        sessiontoken?: string
        language?: Locale
        fields: CreateVendorRequest
    }): Promise<CreateVendorResponse> => {
        if (!sessiontoken) throw new VendorWorkflowError('Session is required.', 'logout')

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: VENDOR_CREATE_WORKFLOW_ID,
            input: fields,
            language
        })

        assertWorkflowSuccess(response, 'Unable to create vendor.')

        return mapCreateVendorResponse(response)
    },

    updateVendor: async ({
        sessiontoken,
        language,
        fields
    }: {
        sessiontoken?: string
        language?: Locale
        fields: UpdateVendorRequest
    }): Promise<void> => {
        if (!sessiontoken) throw new VendorWorkflowError('Session is required.', 'logout')

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: VENDOR_UPDATE_WORKFLOW_ID,
            input: fields,
            language
        })

        assertWorkflowSuccess(response, 'Unable to update vendor.')
    },

    deleteVendor: async ({
        sessiontoken,
        language,
        fields
    }: {
        sessiontoken?: string
        language?: Locale
        fields: DeleteVendorRequest
    }): Promise<void> => {
        if (!sessiontoken) throw new VendorWorkflowError('Session is required.', 'logout')

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: VENDOR_DELETE_WORKFLOW_ID,
            input: fields,
            language
        })

        assertWorkflowSuccess(response, 'Unable to delete vendor.')
    },

    simpleSearchProjects: async ({
        sessiontoken,
        language
    }: {
        sessiontoken?: string
        language?: Locale
    }): Promise<VendorProjectOption[]> => {
        if (!sessiontoken) return []

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: VENDOR_PROJECTS_SEARCH_WORKFLOW_ID,
            input: {
                search_text: '',
                page_index: 0,
                page_size: 100
            },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load projects.')

        return mapProjectOptions(response)
    }
}
