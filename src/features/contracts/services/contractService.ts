import type { Locale } from '@/configs/i18n'
import { workflowService } from '@/servers/system-service'
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

import type {
    ContractItem,
    ContractProjectOption,
    ContractsFilterModel,
    ContractsSearchRequest,
    ContractsSearchResponse,
    CreateContractRequest,
    DeleteContractRequest,
    UpdateContractRequest
} from '../types'
import { ContractWorkflowError } from '../types'

export const CONTRACTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_CONTRACTS'
export const CONTRACT_DETAIL_WORKFLOW_ID = 'WF_BO_GET_CONTRACT_BY_ID'
export const CONTRACT_ADVANCED_SEARCH_WORKFLOW_ID = 'WF_BO_ADVANCED_SEARCH_CONTRACT'
export const CONTRACT_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_CONTRACT'
export const CONTRACT_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_CONTRACT'
export const CONTRACT_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_CONTRACT'
export const CONTRACT_PROJECTS_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECTS'

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

const toNullableNumber = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
}

const toBoolean = (value: unknown) => (
    value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

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
        ?? error?.execute_id
        ?? dataresponse?.execution_id
        ?? dataresponse?.executionId
        ?? dataresponse?.execute_id
        ?? data?.execution_id
        ?? data?.executionId
        ?? data?.execute_id
        ?? response?.payload?.execution_id
        ?? response?.payload?.execute_id
        ?? response?.execution_id
        ?? response?.execute_id
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

        throw new ContractWorkflowError(message, error.next_action ?? dataresponse?.next_action, getExecutionId(response, error))
    }
}

const normalizeResponsePage = (value: unknown, request_page_index: number) => {
    const response_page = toNumber(value, request_page_index + 1)

    return response_page <= 0 ? response_page + 1 : response_page
}

export const mapContract = (item: any): ContractItem => ({
    id: toNumber(getField(item, ['id', 'contract_id'])),
    contract_number: String(getField(item, ['contract_number']) ?? ''),
    project_id: toNumber(getField(item, ['project_id'])),
    project_code: String(getField(item, ['project_code']) ?? ''),
    vendor_id: toNullableNumber(getField(item, ['vendor_id'])),
    vendor_code: String(getField(item, ['vendor_code']) ?? ''),
    title: String(getField(item, ['title']) ?? ''),
    description: getField(item, ['description']) ?? null,
    start_date: String(getField(item, ['start_date']) ?? ''),
    end_date: String(getField(item, ['end_date']) ?? ''),
    contract_value: toNullableNumber(getField(item, ['contract_value'])),
    attachment_url: getField(item, ['attachment_url']) ?? null,
    status: String(getField(item, ['status']) ?? '')
})

export const mapContractsSearchResponse = (
    response: any,
    request: ContractsSearchRequest
): ContractsSearchResponse => {
    const root = pickDataRoot(response)
    const total_count = toNumber(getField(root, ['total_count', 'total_items']))
    const page_size = toNumber(getField(root, ['page_size']), request.page_size)
    const total_pages = toNumber(
        getField(root, ['total_pages']),
        page_size > 0 ? Math.ceil(total_count / page_size) : 0
    )

    return {
        items: pickItems(root).map(mapContract),
        total_count,
        total_pages,
        has_previous_page: toBoolean(getField(root, ['has_previous_page'])),
        has_next_page: toBoolean(getField(root, ['has_next_page'])),
        page_index: normalizeResponsePage(getField(root, ['page_index']), request.page_index),
        page_size
    }
}

const mapContractDetailResponse = (response: any): ContractItem => {
    const root = pickDataRoot(response)
    const item = pickItems(root)[0] ?? (Array.isArray(root) ? root[0] : root?.item ?? root)

    return mapContract(item)
}

const mapProjectOptions = (response: any): ContractProjectOption[] => {
    const root = pickDataRoot(response)

    return pickItems(root).flatMap(item => {
        const id = toNumber(getField(item, ['id', 'project_id']))

        if (id <= 0) return []

        const code = String(getField(item, ['project_code', 'code']) ?? '').trim()
        const name = String(getField(item, ['project_name', 'name', 'caption']) ?? (code || id)).trim()

        return [{ id, code, name }]
    })
}

const runMutation = async ({
    sessiontoken,
    language,
    workflowid,
    fields,
    fallback
}: {
    sessiontoken?: string
    language?: Locale
    workflowid: string
    fields: CreateContractRequest | UpdateContractRequest | DeleteContractRequest
    fallback: string
}) => {
    if (!sessiontoken) throw new ContractWorkflowError('Session is required.', 'logout')

    const response = await workflowService.runFODynamic({
        sessiontoken,
        workflowid,
        input: fields,
        language
    })

    assertWorkflowSuccess(response, fallback)
}

export const contractService = {
    getDefaultResponse: (filter?: Partial<ContractsFilterModel>): ContractsSearchResponse => ({
        items: [],
        total_count: 0,
        total_pages: 0,
        has_previous_page: false,
        has_next_page: false,
        page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
        page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE
    }),

    simpleSearchContracts: async ({
        sessiontoken,
        language,
        filter
    }: {
        sessiontoken?: string
        language?: Locale
        filter: ContractsFilterModel
    }): Promise<ContractsSearchResponse> => {
        if (!sessiontoken || !filter.project_id) return contractService.getDefaultResponse(filter)

        const request: ContractsSearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            search_text: filter.search_text.trim(),
            project_id: Number(filter.project_id)
        }
        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: CONTRACTS_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load contracts.')

        return mapContractsSearchResponse(response, request)
    },

    getContractById: async ({
        sessiontoken,
        language,
        id
    }: {
        sessiontoken?: string
        language?: Locale
        id: number
    }): Promise<ContractItem> => {
        if (!sessiontoken) throw new ContractWorkflowError('Session is required.', 'logout')

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: CONTRACT_DETAIL_WORKFLOW_ID,
            input: { id },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load contract detail.')

        return mapContractDetailResponse(response)
    },

    simpleSearchProjects: async ({
        sessiontoken,
        language
    }: {
        sessiontoken?: string
        language?: Locale
    }): Promise<ContractProjectOption[]> => {
        if (!sessiontoken) return []

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: CONTRACT_PROJECTS_SEARCH_WORKFLOW_ID,
            input: {
                search_text: '',
                page_index: 0,
                page_size: 100
            },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load projects.')

        return mapProjectOptions(response)
    },

    // TODO(O24): Enable WF_BO_ADVANCED_SEARCH_CONTRACT only after its backend workflow is operational.

    createContract: (params: { sessiontoken?: string; language?: Locale; fields: CreateContractRequest }) => (
        runMutation({
            ...params,
            workflowid: CONTRACT_CREATE_WORKFLOW_ID,
            fallback: 'Unable to create contract.'
        })
    ),

    updateContract: (params: { sessiontoken?: string; language?: Locale; fields: UpdateContractRequest }) => (
        runMutation({
            ...params,
            workflowid: CONTRACT_UPDATE_WORKFLOW_ID,
            fallback: 'Unable to update contract.'
        })
    ),

    deleteContract: ({ sessiontoken, language, id }: { sessiontoken?: string; language?: Locale; id: number }) => (
        runMutation({
            sessiontoken,
            language,
            workflowid: CONTRACT_DELETE_WORKFLOW_ID,
            fields: { id },
            fallback: 'Unable to delete contract.'
        })
    )
}
