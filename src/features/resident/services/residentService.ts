import {
    CreateResidentProfileRequest,
    HierarchyOption,
    ApartmentLookupFields,
    ProjectSearchFields,
    ResidentApartmentItem,
    ResidentFilterModel,
    ResidentListResponse,
    ResidentModel,
    ResidentListStatus,
    ResidentProjectOption,
    ResidentSearchRequest,
    ResidentDetail,
    ResidentAccount,
    ResidentContext,
    ResidentContextGeneral,
    ResidentContextMember,
    ResidentHouseholdContext,
    ResidentImportValidationRow,
    ResidentImportValidationSummary,
    ResidentImportRequestItem,
    ResidentAddApartmentPayload,
    ResidentAddHouseholdMemberPayload,
    ResidentUpdateProfileRequest,
    ResidentDeleteRequest
} from '../types'
import type { Locale } from '@/configs/i18n'
import { env } from '@/env.mjs'
import { workflowService } from '@/servers/system-service'
import { createWorkflowError } from '@/shared/utils/workflowError'
import {
    normalizeResidentAppUsage,
    normalizeResidentAppUsageFilter,
    toResidentBuildingPayloadValue
} from '../components/resident-list/residentListHelpers'
import {
    CREATE_RESIDENT_PROFILE_WORKFLOW_ID,
    UPDATE_RESIDENT_PROFILE_WORKFLOW_ID,
    DELETE_RESIDENT_WORKFLOW_ID,
    GET_RESIDENT_BY_ID_WORKFLOW_ID,
    GET_RESIDENT_CONTEXT_WORKFLOW_ID,
    IMPORT_RESIDENTS_WORKFLOW_ID,
    LIST_APARTMENTS_BY_PROJECT_WORKFLOW_ID,
    SIMPLE_SEARCH_PROJECTS_WORKFLOW_ID,
    SIMPLE_SEARCH_RESIDENTS_WORKFLOW_ID
} from './residentWorkflowIds'

type CreateResidentProfileOptions = {
    sessiontoken?: string
    language?: string | Locale
}

type ResidentImportServiceOptions = {
    sessiontoken?: string
    language?: string | Locale
    project_code?: string | null
}

type ResidentImportTemplateResponse = {
    blob: Blob
    filename: string
}

type ResidentExportResponse = {
    blob: Blob
    filename: string
}

class ResidentExportError extends Error {
    executionId?: string

    constructor(message: string, executionId?: string) {
        super(message)
        this.name = 'ResidentExportError'
        this.executionId = executionId
    }
}

const RESIDENT_IMPORT_TEMPLATE_PATH = '/api/resident/import-template'
const RESIDENT_IMPORT_VALIDATE_PATH = '/api/resident/import-validate'
const RESIDENT_EXPORT_PATH = '/api/resident/export'


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

const getLocalizedField = (item: any, language: string | undefined, keys: string[]) => {
    const isVietnamese = language === 'vi'
    const localizedKeys = isVietnamese
        ? ['name_vi', 'nameVi', 'namevn', 'name_vn', 'label_vi', 'labelVi', 'caption_vi', 'captionVi', 'commandNameLanguage', 'command_name_language']
        : ['name_en', 'nameEn', 'nameen', 'label_en', 'labelEn', 'caption_en', 'captionEn', 'commandNameEnglish', 'command_name_english']

    return getField(item, [...localizedKeys, ...keys])
}

const pickArray = (value: any): any[] => {
    if (Array.isArray(value)) {
        const nestedItems = value.flatMap(item => {
            if (!item || typeof item !== 'object') return []

            return pickArray(item.input ?? item.data ?? item.payload)
        })

        return nestedItems.length > 0 ? nestedItems : value
    }

    if (!value || typeof value !== 'object') return []

    const directCandidates = [
        value.input?.items,
        value.input?.data,
        value.data?.items,
        value.data?.data,
        value.items,
        value.data,
        value.input
    ]

    for (const candidate of directCandidates) {
        if (Array.isArray(candidate)) return candidate
    }

    return []
}

const getResponseData = (response: any) => response?.payload?.dataresponse?.data

const findDeepValue = (value: any, keys: string[]): any => {
    if (!value || typeof value !== 'object') return undefined

    for (const key of keys) {
        const direct = getField(value, [key])

        if (direct !== undefined && direct !== null && direct !== '') return direct
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const result = findDeepValue(item, keys)

            if (result !== undefined && result !== null && result !== '') return result
        }

        return undefined
    }

    for (const item of Object.values(value)) {
        const result = findDeepValue(item, keys)

        if (result !== undefined && result !== null && result !== '') return result
    }

    return undefined
}

const toOptionalNumber = (value: any) => {
    const numberValue = Number(value)

    return Number.isFinite(numberValue) ? numberValue : undefined
}

const toNumber = (value: any, fallback: number) => {
    const numberValue = Number(value)

    return Number.isFinite(numberValue) ? numberValue : fallback
}

const toNullableNumber = (value: any) => {
    if (value === null || value === undefined || value === '') return null

    const numberValue = Number(value)

    return Number.isFinite(numberValue) ? numberValue : null
}

const toBoolean = (value: any) => (
    value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

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

// UI page (1-based) = page_index (0-based, as sent to the workflow) + 1.
// requestPageIndex is already 0-based (see get_residents), so the fallback and
// the backend-echoed value both need the same unconditional +1 conversion.
const normalizeResponsePage = (value: any, requestPageIndex: number) => {
    const pageIndex = toNumber(value, requestPageIndex)

    return pageIndex + 1
}

const getWorkflowErrorMessage = (response: any, fallback: string, language?: string | Locale) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []

    const message = (Array.isArray(errors) && errors.length > 0
        ? errors[0]?.info ?? errors[0]?.message ?? errors[0]?.description
        : undefined)
        ?? dataresponse?.message
        ?? dataresponse?.data?.message
        ?? response?.payload?.message
        ?? response?.message
        ?? fallback
    const executionId = getExecutionId(dataresponse) || getExecutionId(response?.payload) || getExecutionId(response)
    const referenceLabel = language === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference'

    return executionId ? `${message} ${referenceLabel}: ${executionId}` : message
}

const assertWorkflowSuccess = (response: any, fallback: string, language?: string | Locale) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
    const failed = response?.success === false
        || dataresponse?.success === false
        || data?.success === false
        || dataresponse?.code === 'failed'
        || data?.code === 'failed'

    if ((Array.isArray(errors) && errors.length > 0) || failed) {
        throw createWorkflowError(response, { fallback })
    }
}

const mapResidentApartmentItem = (item: any): ResidentApartmentItem => ({
    resident_apartment_id: toNullableNumber(getField(item, ['resident_apartment_id', 'residentApartmentId'])),
    apartment_id: toNumber(getField(item, ['apartment_id', 'apartmentId']), 0),
    apartment_code: String(getField(item, ['apartment_code', 'apartmentCode']) ?? ''),
    role: String(getField(item, ['role', 'resident_role', 'residentRole']) ?? '') as ResidentApartmentItem['role'],
    is_representative: toBoolean(getField(item, ['is_representative', 'isRepresentative'])),
    status: String(getField(item, ['status']) ?? '')
})

const mapResident = (item: any): ResidentModel => {
    const apartments_raw = getField(item, ['apartments', 'resident_apartments', 'residentApartments'])
    const apartments = Array.isArray(apartments_raw) ? apartments_raw.map(mapResidentApartmentItem) : []

    return {
        id: toNumber(getField(item, ['id', 'resident_id', 'residentId']), 0),
        resident_code: String(getField(item, ['resident_code', 'residentCode', 'code']) ?? ''),
        user_code: getField(item, ['user_code', 'userCode']) ? String(getField(item, ['user_code', 'userCode'])) : null,
        app_usage: normalizeResidentAppUsage(getField(item, ['app_usage', 'appUsage'])),
        full_name: String(getField(item, ['full_name', 'fullName', 'name']) ?? ''),
        gender: String(getField(item, ['gender']) ?? '') as ResidentModel['gender'],
        date_of_birth: getField(item, ['date_of_birth', 'dateOfBirth']) ? String(getField(item, ['date_of_birth', 'dateOfBirth'])) : null,
        phone: String(getField(item, ['phone', 'phone_number', 'phoneNumber']) ?? ''),
        email: String(getField(item, ['email']) ?? ''),
        avatar_url: getField(item, ['avatar_url', 'avatarUrl']) ? String(getField(item, ['avatar_url', 'avatarUrl'])) : null,
        identity_number: getField(item, ['identity_number', 'identityNumber', 'identity_no', 'identityNo']) ? String(getField(item, ['identity_number', 'identityNumber', 'identity_no', 'identityNo'])) : null,
        apartment_count: toNumber(getField(item, ['apartment_count', 'apartmentCount']), apartments.length),
        apartments,
        status: String(getField(item, ['status']) ?? '') as ResidentListStatus,
        created_on_utc: String(getField(item, ['created_on_utc', 'createdOnUtc']) ?? ''),
        updated_on_utc: String(getField(item, ['updated_on_utc', 'updatedOnUtc']) ?? '')
    }
}

const mapResidentProjectOption = (item: any): ResidentProjectOption | null => {
    const id = toNullableNumber(getField(item, ['id', 'project_id', 'projectId', 'projectid']))

    if (id === null) return null

    const project_code = String(getField(item, ['project_code', 'projectCode', 'projectcode', 'code']) ?? '').trim()
    const name = String(getField(item, ['name', 'project_name', 'projectName', 'projectname', 'caption']) ?? (project_code || id)).trim()

    return {
        id,
        project_code,
        name,
        address: String(getField(item, ['address']) ?? ''),
        description: String(getField(item, ['description']) ?? ''),
        logo_url: getField(item, ['logo_url', 'logoUrl']) ? String(getField(item, ['logo_url', 'logoUrl'])) : null,
        status: String(getField(item, ['status']) ?? '')
    }
}

const mapResidentProjects = (response: any): ResidentProjectOption[] => {
    const root = pickDataRoot(response?.payload ?? response)
    const byId = new Map<number, ResidentProjectOption>()

    pickItems(root).forEach(item => {
        const option = mapResidentProjectOption(item)

        if (option) byId.set(option.id, option)
    })

    return Array.from(byId.values())
}

const mapResidentsSearchResponse = (response: any, request: ResidentSearchRequest): ResidentListResponse => {
    const root = pickDataRoot(response?.payload ?? response)
    const total_items = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
    const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
    const total_pages = toNumber(
        getField(root, ['total_pages', 'totalPages']),
        page_size > 0 ? Math.ceil(total_items / page_size) : 0
    )

    return {
        items: pickItems(root).map(mapResident),
        page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
        page_size,
        total_items,
        total_pages
    }
}

const mapResidentAccount = (item: any): ResidentAccount | null => {
    if (!item || typeof item !== 'object') return null

    const str = (keys: string[]) => (getField(item, keys) !== undefined ? String(getField(item, keys)) : null)

    return {
        channel_id: str(['channel_id', 'channelId']),
        user_id: str(['user_id', 'userId']),
        user_name: str(['user_name', 'userName']),
        user_code: str(['user_code', 'userCode']),
        login_name: str(['login_name', 'loginName']),
        contract_number: str(['contract_number', 'contractNumber']),
        first_name: str(['first_name', 'firstName']),
        middle_name: str(['middle_name', 'middleName']),
        last_name: str(['last_name', 'lastName']),
        role_channel: str(['role_channel', 'roleChannel']),
        gender: toNullableNumber(getField(item, ['gender'])),
        address: str(['address']),
        email: str(['email']),
        birthday: str(['birthday']),
        phone: str(['phone']),
        status: str(['status']),
        last_login_time: str(['last_login_time', 'lastLoginTime']),
        is_login: toBoolean(getField(item, ['is_login', 'isLogin'])),
        expire_time: str(['expire_time', 'expireTime']),
        branch_id: str(['branch_id', 'branchId']),
        branch_code: str(['branch_code', 'branchCode']),
        department_code: str(['department_code', 'departmentCode']),
        user_level: toNullableNumber(getField(item, ['user_level', 'userLevel'])),
        user_type: str(['user_type', 'userType']),
        is_show: str(['is_show', 'isShow']),
        policy_id: toNullableNumber(getField(item, ['policy_id', 'policyId'])),
        uuid: str(['uuid']),
        failnumber: toNullableNumber(getField(item, ['failnumber'])),
        is_super_admin: toBoolean(getField(item, ['is_super_admin', 'isSuperAdmin'])),
        is_biometric_supported: toBoolean(getField(item, ['is_biometric_supported', 'isBiometricSupported'])),
        locked_until: str(['locked_until', 'lockedUntil']),
        notification_type: str(['notification_type', 'notificationType']),
        is_first_login: toBoolean(getField(item, ['is_first_login', 'isFirstLogin'])),
        currency_code: str(['currency_code', 'currencyCode']),
        id: toNullableNumber(getField(item, ['id'])),
        created_on_utc: str(['created_on_utc', 'createdOnUtc']),
        updated_on_utc: str(['updated_on_utc', 'updatedOnUtc'])
    }
}

const mapResidentDetail = (response: any): ResidentDetail | null => {
    const root = pickDataRoot(response?.payload ?? response)
    const detail = Array.isArray(root) ? root[0] : Array.isArray(root?.items) ? root.items[0] : root

    if (!detail || typeof detail !== 'object') return null

    return {
        id: toNumber(getField(detail, ['id', 'resident_id', 'residentId']), 0),
        resident_code: String(getField(detail, ['resident_code', 'residentCode', 'code']) ?? ''),
        user_code: getField(detail, ['user_code', 'userCode']) ? String(getField(detail, ['user_code', 'userCode'])) : null,
        full_name: String(getField(detail, ['full_name', 'fullName', 'name']) ?? ''),
        gender: getField(detail, ['gender']) ? String(getField(detail, ['gender'])) : null,
        date_of_birth: getField(detail, ['date_of_birth', 'dateOfBirth']) ? String(getField(detail, ['date_of_birth', 'dateOfBirth'])) : null,
        phone: getField(detail, ['phone', 'phone_number', 'phoneNumber']) ? String(getField(detail, ['phone', 'phone_number', 'phoneNumber'])) : null,
        email: getField(detail, ['email']) ? String(getField(detail, ['email'])) : null,
        avatar_url: getField(detail, ['avatar_url', 'avatarUrl']) ? String(getField(detail, ['avatar_url', 'avatarUrl'])) : null,
        identity_number: getField(detail, ['identity_number', 'identityNumber', 'identity_no', 'identityNo']) ? String(getField(detail, ['identity_number', 'identityNumber', 'identity_no', 'identityNo'])) : null,
        nationality: getField(detail, ['nationality']) ? String(getField(detail, ['nationality'])) : null,
        description: getField(detail, ['description']) ? String(getField(detail, ['description'])) : null,
        status: String(getField(detail, ['status']) ?? ''),
        account: mapResidentAccount(getField(detail, ['account']))
    }
}

const mapContextGeneral = (item: any): ResidentContextGeneral | null => {
    if (!item || typeof item !== 'object') return null

    return {
        resident_id: toNumber(getField(item, ['resident_id', 'residentId', 'id']), 0),
        resident_code: String(getField(item, ['resident_code', 'residentCode', 'code']) ?? ''),
        user_code: getField(item, ['user_code', 'userCode']) ? String(getField(item, ['user_code', 'userCode'])) : null,
        full_name: String(getField(item, ['full_name', 'fullName', 'name']) ?? ''),
        gender: getField(item, ['gender']) ? String(getField(item, ['gender'])) : null,
        date_of_birth: getField(item, ['date_of_birth', 'dateOfBirth']) ? String(getField(item, ['date_of_birth', 'dateOfBirth'])) : null,
        phone: getField(item, ['phone', 'phone_number', 'phoneNumber']) ? String(getField(item, ['phone', 'phone_number', 'phoneNumber'])) : null,
        email: getField(item, ['email']) ? String(getField(item, ['email'])) : null,
        avatar_url: getField(item, ['avatar_url', 'avatarUrl']) ? String(getField(item, ['avatar_url', 'avatarUrl'])) : null,
        identity_number: getField(item, ['identity_number', 'identityNumber', 'identity_no', 'identityNo']) ? String(getField(item, ['identity_number', 'identityNumber', 'identity_no', 'identityNo'])) : null,
        has_mobile_account: toBoolean(getField(item, ['has_mobile_account', 'hasMobileAccount']))
    }
}

const mapContextMember = (item: any): ResidentContextMember => ({
    resident_id: toNumber(getField(item, ['resident_id', 'residentId', 'id']), 0),
    resident_code: String(getField(item, ['resident_code', 'residentCode', 'code']) ?? ''),
    full_name: String(getField(item, ['full_name', 'fullName', 'name']) ?? ''),
    avatar_url: getField(item, ['avatar_url', 'avatarUrl']) ? String(getField(item, ['avatar_url', 'avatarUrl'])) : null,
    role: String(getField(item, ['role', 'resident_role', 'residentRole']) ?? ''),
    role_caption: getField(item, ['role_caption', 'roleCaption']) ? String(getField(item, ['role_caption', 'roleCaption'])) : null,
    is_representative: toBoolean(getField(item, ['is_representative', 'isRepresentative'])),
    is_location: toBoolean(getField(item, ['is_location', 'isLocation'])),
    relationship_with_owner: getField(item, ['relationship_with_owner', 'relationshipWithOwner']) ? String(getField(item, ['relationship_with_owner', 'relationshipWithOwner'])) : null,
    has_mobile_account: toBoolean(getField(item, ['has_mobile_account', 'hasMobileAccount'])),
    gender: getField(item, ['gender']) ? String(getField(item, ['gender'])) : null,
    date_of_birth: getField(item, ['date_of_birth', 'dateOfBirth']) ? String(getField(item, ['date_of_birth', 'dateOfBirth'])) : null,
    phone: getField(item, ['phone', 'phone_number', 'phoneNumber']) ? String(getField(item, ['phone', 'phone_number', 'phoneNumber'])) : null,
    email: getField(item, ['email']) ? String(getField(item, ['email'])) : null,
    identity_number: getField(item, ['identity_number', 'identityNumber', 'identity_no', 'identityNo']) ? String(getField(item, ['identity_number', 'identityNumber', 'identity_no', 'identityNo'])) : null,
    effective_from: getField(item, ['effective_from', 'effectiveFrom']) ? String(getField(item, ['effective_from', 'effectiveFrom'])) : null,
    effective_to: getField(item, ['effective_to', 'effectiveTo']) ? String(getField(item, ['effective_to', 'effectiveTo'])) : null
})

const mapHouseholdContext = (item: any): ResidentHouseholdContext => ({
    apartment_id: toNumber(getField(item, ['apartment_id', 'apartmentId']), 0),
    apartment_code: String(getField(item, ['apartment_code', 'apartmentCode']) ?? ''),
    project_code: String(getField(item, ['project_code', 'projectCode']) ?? ''),
    building_code: String(getField(item, ['building_code', 'buildingCode']) ?? ''),
    owner: item?.owner ? mapContextMember(item.owner) : null,
    members: Array.isArray(item?.members) ? item.members.map(mapContextMember) : []
})

const mapResidentContext = (response: any): ResidentContext => {
    const root = pickDataRoot(response?.payload ?? response)
    const households = Array.isArray(root?.households) ? root.households : []

    return {
        general: mapContextGeneral(root?.general),
        households: households.map(mapHouseholdContext)
    }
}

const getHierarchyRoot = (response: any) => {
    const data = getResponseData(response)

    return data?.data ?? data?.input?.data ?? data
}

const walkItems = (value: any): any[] => {
    if (Array.isArray(value)) return value.flatMap(walkItems)
    if (!value || typeof value !== 'object') return []

    const children = [
        value.projects,
        value.buildings,
        value.floors,
        value.apartments,
        value.units,
        value.items,
        value.data,
        value.input?.data
    ].flatMap(walkItems)

    return [value, ...children]
}

const getProjects = (response: any): any[] => {
    const root = getHierarchyRoot(response)

    if (Array.isArray(root?.projects)) return root.projects

    return pickArray(getResponseData(response))
}

const getApartments = (response: any, projectCode: string): any[] => {
    const root = getHierarchyRoot(response)
    const projects = getProjects(response)
    const selectedProject = projects.find((item: any) => String(getField(item, ['project_code', 'projectCode', 'projectcode', 'code']) ?? '') === projectCode)
    const source = selectedProject ?? root

    return walkItems(source).filter(item => {
        const apartmentCode = getField(item, ['apartment_code', 'apartmentCode', 'apartmentcode', 'unit_code', 'unitCode', 'unitcode', 'room_code', 'roomCode', 'roomcode'])

        return Boolean(apartmentCode)
    })
}

const uniqueOptions = <T extends HierarchyOption>(items: T[]) => {
    const seen = new Set<string>()

    return items.filter(item => {
        if (!item.value || seen.has(item.value)) return false
        seen.add(item.value)

        return true
    })
}

const parseContentDispositionFilename = (contentDisposition?: string | null) => {
    if (!contentDisposition) return undefined

    const utf8Match = contentDisposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)

    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ''))
        } catch {
            return utf8Match[1].trim().replace(/^["']|["']$/g, '')
        }
    }

    const asciiMatch = contentDisposition.match(/filename\s*=\s*("?)([^";]+)\1/i)

    if (asciiMatch?.[2]) return asciiMatch[2].trim()

    return undefined
}

const sanitizeDownloadErrorMessage = (message?: string) => {
    const normalized = (message ?? '').trim()

    if (!normalized) return ''
    if (normalized.startsWith('{') || normalized.startsWith('[') || normalized.startsWith('<')) return ''

    return normalized
}

const getDownloadErrorDetails = async (response: Response) => {
    const raw = await response.text().catch(() => '')
    let payload: any = null

    try {
        payload = raw ? JSON.parse(raw) : null
    } catch {
        // Download endpoints can return a non-JSON error body. Keep only a short safe message.
    }

    return {
        message: String(
            payload?.errors?.[0]?.info
            ?? payload?.errors?.[0]?.message
            ?? payload?.error?.info
            ?? payload?.error?.message
            ?? payload?.message
            ?? sanitizeDownloadErrorMessage(raw)
            ?? 'Unable to export resident list.'
        ).trim(),
        executionId: getExecutionId(payload)
    }
}

const getExecutionId = (value: any) => String(
    value?.execution_id
    ?? value?.executionId
    ?? value?.execute_id
    ?? (Array.isArray(value?.errors)
        ? value.errors.find((error: any) => error?.execution_id || error?.executionId || error?.execute_id)?.execution_id
        ?? value.errors.find((error: any) => error?.execution_id || error?.executionId || error?.execute_id)?.executionId
        ?? value.errors.find((error: any) => error?.execution_id || error?.executionId || error?.execute_id)?.execute_id
        : undefined)
    ?? value?.data?.execution_id
    ?? value?.data?.executionId
    ?? value?.data?.execute_id
    ?? ''
).trim()

const pickWorkflowDataResponse = (response: any) => response?.payload?.dataresponse ?? response?.dataresponse ?? response

const getWorkflowErrors = (response: any): any[] => {
    const dataresponse = pickWorkflowDataResponse(response)
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []

    return Array.isArray(errors) ? errors : errors ? [errors] : []
}

const getWorkflowErrorText = (response: any, fallback: string) => {
    const dataresponse = pickWorkflowDataResponse(response)
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
    const errors = getWorkflowErrors(response)
    const firstError = errors[0]

    return String(
        firstError?.info
        ?? firstError?.message
        ?? firstError?.description
        ?? dataresponse?.message
        ?? data?.message
        ?? response?.payload?.message
        ?? response?.message
        ?? fallback
    ).trim()
}

const getWorkflowExecutionIdValue = (response: any) => {
    const dataresponse = pickWorkflowDataResponse(response)
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
    const errors = getWorkflowErrors(response)

    return getExecutionId({ errors })
        || getExecutionId(dataresponse)
        || getExecutionId(data)
        || getExecutionId(response?.payload)
        || getExecutionId(response)
}

class ResidentImportWorkflowError extends Error {
    response: any
    data: any
    code?: string
    success?: boolean
    execution_id: string
    errors: any[]
    type_error?: string

    constructor(response: any, fallback: string) {
        const data = pickWorkflowDataResponse(response)
        const errors = getWorkflowErrors(response)

        super(getWorkflowErrorText(response, fallback))
        this.name = 'ResidentImportWorkflowError'
        this.response = response
        this.data = data
        this.code = data?.code ?? response?.code
        this.success = data?.success ?? response?.success
        this.execution_id = getWorkflowExecutionIdValue(response)
        this.errors = errors
        this.type_error = errors[0]?.type_error
    }
}

const assertResidentWorkflowSuccess = (response: any, fallback: string) => {
    const dataresponse = pickWorkflowDataResponse(response)
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
    const errors = getWorkflowErrors(response)
    const failed = response?.success === false
        || (typeof response?.status === 'number' && (response.status < 200 || response.status >= 300))
        || dataresponse?.success === false
        || data?.success === false
        || dataresponse?.code === 'failed'
        || data?.code === 'failed'
        || String(dataresponse?.result ?? data?.result ?? '').trim().toUpperCase() === 'ERROR'

    if (errors.length > 0 || failed) {
        throw new ResidentImportWorkflowError(response, fallback)
    }
}

const getFriendlyApiErrorMessage = (
    value: any,
    fallback: string,
    language?: string | Locale
) => {
    const message = String(
        value?.errors?.[0]?.info
        ?? value?.errors?.[0]?.message
        ?? value?.error_message
        ?? value?.errorMessage
        ?? value?.error_code
        ?? value?.errorCode
        ?? value?.description
        ?? value?.message
        ?? fallback
    ).trim()

    const executionId = getExecutionId(value)
    const referenceLabel =
        language === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference'

    return executionId
        ? `${message} ${referenceLabel}: ${executionId}`
        : message
}
const toStringOrNull = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null

    return String(value)
}

const mapResidentImportValidationRow = (item: any): ResidentImportValidationRow => ({
    row_number: toNumber(item?.row_number ?? item?.rowNumber, 0),
    status: String(item?.status ?? ''),
    full_name: toStringOrNull(item?.full_name ?? item?.fullName),
    phone_number: toStringOrNull(item?.phone_number ?? item?.phoneNumber),
    email: toStringOrNull(item?.email),
    identity_no: toStringOrNull(item?.identity_no ?? item?.identityNo),
    date_of_birth: toStringOrNull(item?.date_of_birth ?? item?.dateOfBirth),
    gender: toStringOrNull(item?.gender),
    apartment_code: toStringOrNull(item?.apartment_code ?? item?.apartmentCode),
    relationship_type: toStringOrNull(item?.relationship_type ?? item?.relationshipType),
    is_owner: toStringOrNull(item?.is_owner ?? item?.isOwner),
    move_in_date: toStringOrNull(item?.move_in_date ?? item?.moveInDate),
    note: toStringOrNull(item?.note),
    errors: Array.isArray(item?.errors)
        ? item.errors.map((error: any) => String(error?.info ?? error?.message ?? error ?? '').trim()).filter(Boolean)
        : []
})

const mapResidentImportValidationSummary = (response: any): ResidentImportValidationSummary => {
    const data = response?.data ?? response

    return {
        batch_id: toNumber(data?.batch_id ?? data?.batchId, 0),
        file_name: String(data?.file_name ?? data?.fileName ?? ''),
        total_rows: toNumber(data?.total_rows ?? data?.totalRows, 0),
        valid_rows: toNumber(data?.valid_rows ?? data?.validRows, 0),
        error_rows: toNumber(data?.error_rows ?? data?.errorRows, 0),
        rows: Array.isArray(data?.rows) ? data.rows.map(mapResidentImportValidationRow) : []
    }
}

export const residentHierarchyMapper = {
    hasBusinessError: (payload: any) => {
        const dataresponse = payload?.dataresponse
        const result = String(dataresponse?.result ?? payload?.result ?? '').trim().toUpperCase()
        const errors = dataresponse?.errors ?? dataresponse?.error ?? payload?.errors ?? payload?.error

        return result === 'ERROR'
            || (Array.isArray(errors) && errors.length > 0)
            || Boolean(errors && typeof errors === 'object' && !Array.isArray(errors))
    },

    getErrorMessage: (payload: any, fallback: string) => (
        payload?.dataresponse?.errors?.[0]?.info
        ?? payload?.dataresponse?.errors?.[0]?.message
        ?? payload?.dataresponse?.error?.[0]?.info
        ?? payload?.dataresponse?.error?.[0]?.message
        ?? payload?.dataresponse?.error?.info
        ?? payload?.dataresponse?.error?.message
        ?? payload?.errors?.[0]?.info
        ?? payload?.errors?.[0]?.message
        ?? payload?.error?.info
        ?? payload?.error?.message
        ?? payload?.dataresponse?.message
        ?? payload?.message
        ?? fallback
    ),

    getTotalCount: (response: any) => {
        const data = getResponseData(response)

        return Number(
            getField(data, ['total_count', 'totalCount', 'total_items', 'totalItems', 'total'])
            ?? getField(data?.input, ['total_count', 'totalCount', 'total_items', 'totalItems', 'total'])
            ?? 0
        )
    },

    getActivationCode: (response: any) => String(
        findDeepValue(response, ['activation_code', 'activationCode', 'activationcode'])
        ?? ''
    ).trim(),

    getProjectId: (project: any) => toOptionalNumber(findDeepValue(project, ['project_id', 'projectId', 'projectid', 'id'])),

    mapProjectOptions: (response: any): HierarchyOption[] => uniqueOptions(
        getProjects(response).map(item => {
            const value = String(getField(item, ['project_code', 'projectCode', 'projectcode', 'project_id', 'projectId', 'projectid', 'code']) ?? '').trim()
            const projectId = residentHierarchyMapper.getProjectId(item)

            return {
                value,
                label: String(getField(item, ['project_name', 'projectName', 'projectname', 'project_description', 'projectDescription', 'name', 'caption']) ?? value).trim(),
                projectId,
                raw: item
            }
        })
    ),

    mapApartmentOptions: (response: any, projectCode: string, language?: string): HierarchyOption[] => uniqueOptions(
        getApartments(response, projectCode).map(item => {
            const value = String(getField(item, ['apartment_code', 'apartmentCode', 'apartmentcode', 'unit_code', 'unitCode', 'unitcode', 'room_code', 'roomCode', 'roomcode', 'code']) ?? '').trim()
            const apartmentType = String(getField(item, ['apartment_type', 'apartmentType', 'apartmenttype', 'unit_type', 'unitType', 'type']) ?? '').trim()
            const apartmentTypeLabel = String(getLocalizedField(item, language, ['apartment_type_name', 'apartmentTypeName', 'unit_type_name', 'unitTypeName', 'type_name', 'typeName']) ?? apartmentType).trim()
            const electricMeterCode = String(getField(item, ['electric_meter_code', 'electricMeterCode', 'electricmetercode', 'meter_code', 'meterCode']) ?? '').trim()
            const hasOwner = toBoolean(getField(item, ['has_owner', 'hasOwner']))

            return {
                value,
                label: String(getField(item, ['apartment_name', 'apartmentName', 'apartmentname', 'unit_name', 'unitName', 'room_name', 'name', 'caption']) ?? value).trim(),
                apartmentType,
                apartmentTypeLabel,
                electricMeterCode,
                hasOwner,
                raw: item
            }
        })
    )
}

export const residentService = {
    getDefaultResidentResponse: (filter?: Partial<ResidentFilterModel>): ResidentListResponse => ({
        items: [],
        page_index: filter?.page_index ?? 0,
        page_size: filter?.page_size ?? 10,
        total_items: 0,
        total_pages: 0
    }),

    get_residents: async ({
        sessiontoken,
        language,
        filter
    }: {
        sessiontoken?: string
        language?: Locale
        filter: ResidentFilterModel
    }): Promise<ResidentListResponse> => {
        if (!sessiontoken || !filter.project_id) return residentService.getDefaultResidentResponse(filter)

        const app_usage = normalizeResidentAppUsageFilter(filter.app_usage)
        const request: ResidentSearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            search_text: filter.keyword.trim(),
            project_id: filter.project_id,
            role: filter.role || '',
            resident_status: filter.status && filter.status !== 'ALL' ? filter.status : '',
            building_id: toResidentBuildingPayloadValue(filter.building_id),
            has_user_code: app_usage === 'USED' ? true : app_usage === 'NOT_USED' ? false : null
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: SIMPLE_SEARCH_RESIDENTS_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load residents.', language)

        return mapResidentsSearchResponse(response, request)
    },

    exportResidentList: async ({
        sessiontoken,
        language,
        project_codes
    }: {
        sessiontoken?: string
        language?: Locale
        project_codes: string[]
    }): Promise<ResidentExportResponse> => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO',
            lang: String(language ?? 'vi')
        }

        if (sessiontoken) headers.uid = sessiontoken
        if (project_codes[0]) headers.scope = project_codes[0]

        const response = await fetch(RESIDENT_EXPORT_PATH, {
            method: 'POST',
            headers,
            body: JSON.stringify({ project_codes })
        })

        if (!response.ok) {
            const { message, executionId } = await getDownloadErrorDetails(response)

            throw new ResidentExportError(message || 'Unable to export resident list.', executionId)
        }

        return {
            blob: await response.blob(),
            filename: parseContentDispositionFilename(response.headers.get('content-disposition')) || 'DanhSachCuDan.xlsx'
        }
    },

    getExportErrorExecutionId: (error: unknown) => error instanceof ResidentExportError ? error.executionId : undefined,

    get_resident_by_id: async ({
        sessiontoken,
        language,
        id
    }: {
        sessiontoken?: string
        language?: Locale
        id: number
    }): Promise<ResidentDetail | null> => {
        if (!sessiontoken || !Number.isInteger(id) || id <= 0) return null

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: GET_RESIDENT_BY_ID_WORKFLOW_ID,
            input: { id },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load resident detail.', language)

        return mapResidentDetail(response)
    },

    get_resident_context: async ({
        sessiontoken,
        language,
        resident_id
    }: {
        sessiontoken?: string
        language?: Locale
        resident_id: number
    }): Promise<ResidentContext> => {
        if (!sessiontoken || !Number.isInteger(resident_id) || resident_id <= 0) return { general: null, households: [] }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: GET_RESIDENT_CONTEXT_WORKFLOW_ID,
            input: { resident_id },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load resident context.', language)

        return mapResidentContext(response)
    },

    loadProjects: (
        fields: ProjectSearchFields,
        options: CreateResidentProfileOptions = {}
    ) => workflowService.runFODynamic({
        sessiontoken: options.sessiontoken as string,
        workflowid: SIMPLE_SEARCH_PROJECTS_WORKFLOW_ID,
        input: fields,
        language: options.language as any
    }),

    simpleSearchProjects: async ({
        sessiontoken,
        language,
        search_text = '',
        page_size = 10
    }: {
        sessiontoken?: string
        language?: Locale
        search_text?: string
        page_size?: number
    }): Promise<ResidentProjectOption[]> => {
        if (!sessiontoken) return []

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: SIMPLE_SEARCH_PROJECTS_WORKFLOW_ID,
            input: {
                page_size,
                page_index: 0,
                search_text
            },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load projects.', language)

        return mapResidentProjects(response)
    },

    searchApartments: (
        fields: ApartmentLookupFields,
        options: CreateResidentProfileOptions = {}
    ) => workflowService.runFODynamic({
        sessiontoken: options.sessiontoken as string,
        workflowid: LIST_APARTMENTS_BY_PROJECT_WORKFLOW_ID,
        input: fields,
        language: options.language as any
    }),

    createResidentProfile: async (
        payload: CreateResidentProfileRequest,
        options: CreateResidentProfileOptions = {}
    ) => workflowService.runFODynamic({
        sessiontoken: options.sessiontoken as string,
        workflowid: CREATE_RESIDENT_PROFILE_WORKFLOW_ID,
        input: payload,
        language: options.language as any
    }),

    updateResidentProfile: async (
        payload: ResidentUpdateProfileRequest,
        options: CreateResidentProfileOptions = {}
    ): Promise<void> => {
        // Last line of defence: callers resolve user_code first and show a localized message; an
        // update without the account identifier must never reach the backend.
        if (!payload.user_code?.trim()) {
            throw new Error('Missing user_code for resident profile update.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken: options.sessiontoken as string,
            workflowid: UPDATE_RESIDENT_PROFILE_WORKFLOW_ID,
            input: payload,
            language: options.language as any
        })

        assertWorkflowSuccess(response, 'Unable to update resident profile.', options.language)
    },

    deleteResident: async (
        payload: ResidentDeleteRequest,
        options: CreateResidentProfileOptions = {}
    ): Promise<void> => {
        const response = await workflowService.runFODynamic({
            sessiontoken: options.sessiontoken as string,
            workflowid: DELETE_RESIDENT_WORKFLOW_ID,
            input: payload,
            language: options.language as any
        })

        assertWorkflowSuccess(response, 'Unable to delete resident.', options.language)
    },

    downloadResidentImportTemplate: async (options: ResidentImportServiceOptions = {}): Promise<ResidentImportTemplateResponse> => {
        const headers: Record<string, string> = {
            app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
        }

        if (options.sessiontoken) {
            headers.uid = options.sessiontoken
        }

        if (options.language) {
            headers.lang = String(options.language)
        }

        const response = await fetch(RESIDENT_IMPORT_TEMPLATE_PATH, {
            method: 'POST',
            headers
        })

        if (!response.ok) {
            const errorText = sanitizeDownloadErrorMessage(await response.text())

            throw new Error(errorText)
        }

        return {
            blob: await response.blob(),
            filename: parseContentDispositionFilename(response.headers.get('content-disposition')) || 'resident-import-template.xlsx'
        }
    },

    validateResidentImportFile: async (
        file: File,
        options: ResidentImportServiceOptions = {}
    ): Promise<ResidentImportValidationSummary> => {
        const formData = new FormData()

        formData.append('DuplicatePolicy', 'ERROR')
        formData.append('File', file)

        if (options.project_code) {
            formData.append('ProjectCode', options.project_code)
        }

        const headers: Record<string, string> = {
            app: env.NEXT_PUBLIC_APPLICATION_CODE ?? 'BO'
        }

        if (options.sessiontoken) {
            headers.uid = options.sessiontoken
        }

        if (options.language) {
            headers.lang = String(options.language)
        }

        if (options.project_code) {
            headers.scope = options.project_code
        }

        const response = await fetch(RESIDENT_IMPORT_VALIDATE_PATH, {
            method: 'POST',
            headers,
            body: formData
        })

        const payload = await response.json().catch(() => null)

        if (!response.ok || payload?.success === false) {
            throw new Error(
                getFriendlyApiErrorMessage(
                    payload,
                    'Unable to validate resident import file.',
                    options.language
                )
            )
        }

        return mapResidentImportValidationSummary(payload?.data ?? payload)
    },

    importResidents: async (residents: ResidentImportRequestItem[], options: ResidentImportServiceOptions = {}) => {
        const response = await workflowService.runFODynamic({
            sessiontoken: options.sessiontoken as string,
            workflowid: IMPORT_RESIDENTS_WORKFLOW_ID,
            input: { residents, project_code: options.project_code },
            language: options.language as any
        })

        assertResidentWorkflowSuccess(response, 'Unable to import residents.')

        return response
    },

    addResidentApartment: async (_payload: ResidentAddApartmentPayload, _options: CreateResidentProfileOptions = {}): Promise<never> => {
        // TODO: Wire up the real "add apartment to resident" workflow once the backend provides its workflow id.
        throw new Error('Add apartment for resident API is not implemented yet.')
    },

    addHouseholdMember: async (_payload: ResidentAddHouseholdMemberPayload, _options: CreateResidentProfileOptions = {}): Promise<never> => {
        // TODO: Wire up the real "add household member" workflow once the backend provides its workflow id.
        throw new Error('Add household member API is not implemented yet.')
    }
}
