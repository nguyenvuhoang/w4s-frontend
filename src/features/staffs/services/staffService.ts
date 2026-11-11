import dayjs from 'dayjs'

import type { Locale } from '@/configs/i18n'
import { WORKFLOWCODE } from '@/data/WorkflowCode'
import { workflowService } from '@/servers/system-service'

import type { BatchAssignUserProjectResultItem, CreateUserProjectAssignmentResult, CreateUserSuccessData, CreateUserWorkflowResponseData, ProjectPickerOption, ProjectPickerSearchResponse, StaffAvatarChangePayload, StaffChangeUsernamePayload, StaffChangeUsernameWorkflowFields, StaffCreatePayload, StaffCreateWorkflowFields, StaffFilterModel, StaffGender, StaffListResponse, StaffModel, StaffOperationHeader, StaffOperationResponse, StaffOperationRow, StaffRoleOption, StaffRoleSearchRequest, StaffRoleSearchResponse, StaffRoleServiceId, StaffSearchRequest, StaffUpdatePayload, StaffUpdateWorkflowFields, UserAccountDetail, UserCommandPermission, UserDetailResponse, UserPrivateRightItem, UserProjectAssignmentItem, UserProjectAssignmentsResponse } from '../types'
import { formatStaffFullName } from '../utils/staffName'
import { normalizeStaffGender } from '../utils/staffGender'
import { toStaffDateInputValue } from '../utils/staffDate'

export const STAFF_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_USER'
export const STAFF_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_USER'
export const STAFF_DETAIL_WORKFLOW_ID = 'WF_BO_GET_USER'
export const STAFF_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_USER'
export const STAFF_CHANGE_AVATAR_WORKFLOW_ID = 'WF_BO_CHANGE_AVATAR'
export const STAFF_RESET_PASSWORD_WORKFLOW_ID = 'WF_BO_USER_RESET_PASSWORD'
export const STAFF_CHANGE_USERNAME_WORKFLOW_ID = 'WF_BO_CHANGE_USERNAME'
export const STAFF_OPERATION_WORKFLOW_ID = WORKFLOWCODE.WF_BO_LOAD_OPERATION
export const STAFF_PROJECT_ASSIGNMENTS_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_USER_PROJECT_ASSIGNMENTS'
export const STAFF_PROJECT_PICKER_SEARCH_WORKFLOW_ID = 'WF_BO_SIMPLE_SEARCH_PROJECTS'
export const STAFF_CREATE_PROJECT_ASSIGNMENT_WORKFLOW_ID = 'WF_BO_CREATE_USER_PROJECT_ASSIGNMENT'
export const STAFF_UPDATE_PRIVATE_RIGHTS_WORKFLOW_ID = 'WF_BO_UPDATE_USER_PRIVATE_RIGHTS'
export const STAFF_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_USER'
export const STAFF_ROLE_SEARCH_WORKFLOW_ID = 'WF_BO_SEARCH_USER_ROLE'

const STAFF_EXPORT_PATH = '/api/users/export'

export type StaffExportResponse = {
    blob: Blob
    filename: string
}

export class StaffExportError extends Error {
    executionId?: string

    constructor(message: string, executionId?: string) {
        super(message)
        this.name = 'StaffExportError'
        this.executionId = executionId
    }
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

    return asciiMatch?.[2]?.trim()
}

const getStaffExportErrorDetails = async (response: Response) => {
    const payload = await response.json().catch(() => null)

    return {
        message: String(payload?.message ?? 'Unable to export staff list.'),
        executionId: payload?.execution_id ? String(payload.execution_id) : undefined
    }
}

const empty_staff_response: StaffListResponse = {
    items: [],
    page_index: 0,
    page_size: 10,
    total_count: 0,
    total_pages: 0
}

const getField = (item: any, keys: string[]) => {
    if (!item || typeof item !== 'object') return undefined

    for (const key of keys) {
        if (item[key] !== undefined && item[key] !== null) return item[key]
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

const toNumber = (value: any, fallback: number) => {
    const number_value = Number(value)

    return Number.isFinite(number_value) ? number_value : fallback
}

// request_page_index is already 0-based (see search_users), so the fallback and
// the backend-echoed value both need the same unconditional +1 conversion.
const normalizeResponsePage = (value: any, request_page_index: number) => {
    const page_index = toNumber(value, request_page_index)

    return page_index + 1
}

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

const getWorkflowExecutionId = (response: any) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
    const first_error = Array.isArray(errors) ? errors[0] : null

    return first_error?.execution_id
        ?? dataresponse?.execution_id
        ?? data?.execution_id
        ?? response?.payload?.execution_id
        ?? response?.execution_id
        ?? ''
}

const formatWorkflowErrorMessage = (response: any, fallback: string, language?: Locale) => {
    const message = getWorkflowErrorMessage(response, fallback)
    const execution_id = getWorkflowExecutionId(response)

    if (!execution_id) return message

    const reference_label = language === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference'

    return `${message} ${reference_label}: ${execution_id}`
}

const assertWorkflowSuccess = (response: any, fallback: string, language?: Locale) => {
    const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
    const data = dataresponse?.data ?? response?.payload?.data ?? response?.data
    const errors = dataresponse?.errors ?? response?.payload?.errors ?? response?.errors ?? []
    const failed = response?.success === false || dataresponse?.success === false || data?.success === false || dataresponse?.code === 'failed' || data?.code === 'failed'

    if ((Array.isArray(errors) && errors.length > 0) || failed) {
        throw new Error(formatWorkflowErrorMessage(response, fallback, language))
    }
}

// Customer requirement: the whole "Họ tên" value goes into firstname — never split it.
// middlename/lastname stay in the WF_BO_CREATE_USER/WF_BO_UPDATE_USER contract but are sent empty.
const toWorkflowNameFields = (full_name: string) => ({
    firstname: full_name.trim(),
    middlename: '',
    lastname: ''
})

const toWorkflowGender = (gender: StaffGender): 0 | 1 | 2 => {
    const normalized = normalizeStaffGender(gender)

    // The existing request shape is numeric. Do not invent null/omission semantics
    // until the workflow contract confirms them, and never default to a sex.
    if (normalized === '') throw new Error('Please select a gender.')

    return normalized
}

export const buildStaffCreateWorkflowFields = (payload: StaffCreatePayload): StaffCreateWorkflowFields => {
    const username = payload.login_name.trim()

    return {
        username,
        ...toWorkflowNameFields(payload.full_name),
        gender: toWorkflowGender(payload.gender),
        address: payload.address.trim(),
        email: payload.email.trim(),
        // Phone must stay empty when the user leaves it blank — it must never silently fall
        // back to the username, otherwise a phone number appears on a user that never entered one.
        phone: payload.phone.trim(),
        birthday: payload.birthday ? `${payload.birthday}T00:00:00` : '',
        description: payload.description.trim(),
        department_code: payload.department_code.trim(),
        // Every selected project goes to WF_BO_CREATE_USER in this one call — no follow-up
        // per-project assignment workflow. Always an array, even when nothing is selected.
        project_code: payload.project_code.map(code => code.trim()).filter(Boolean),
        password: payload.password,
        assign_role_id: payload.assign_role_id
    }
}

const mapStaffRoleOption = (item: any): StaffRoleOption => ({
    role_id: toNumber(getField(item, ['role_id', 'roleId']), 0),
    role_name: String(getField(item, ['role_name', 'roleName']) ?? ''),
    role_description: getField(item, ['role_description', 'roleDescription']) ?? null,
    service_id: getField(item, ['service_id', 'serviceId']) as StaffRoleOption['service_id']
})

export const mapStaffRoleSearchResponse = (response: any, request: StaffRoleSearchRequest): StaffRoleSearchResponse => {
    const root = pickDataRoot(response?.payload ?? response)
    const total_count = toNumber(getField(root, ['total_count', 'totalCount']), 0)
    const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
    const total_pages = toNumber(getField(root, ['total_pages', 'totalPages']), page_size > 0 ? Math.ceil(total_count / page_size) : 0)

    return {
        items: pickItems(root).map(mapStaffRoleOption).filter(item => item.role_id > 0),
        page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
        page_size,
        total_count,
        total_pages
    }
}

export const buildStaffUpdateWorkflowFields = (payload: StaffUpdatePayload): StaffUpdateWorkflowFields => {
    const fields: StaffUpdateWorkflowFields = {
        id: Number(payload.id),
        userid: payload.user_id,
        username: payload.login_name.trim(),
        ...toWorkflowNameFields(payload.full_name),
        gender: toWorkflowGender(payload.gender),
        address: payload.address.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        description: payload.description.trim(),
        department_code: payload.department_code.trim(),
        status: payload.status || 'A'
    }

    // A birthday is a business calendar date, not an instant. Build the backend's required UTC
    // midnight string directly from the date-only form value so the selected day cannot shift
    // when the browser's timezone is ahead of or behind UTC. Do not send an empty string: the
    // confirmed update contract only documents a date value, not clearing with null.
    const birthday = toStaffDateInputValue(payload.birthday)

    if (birthday) fields.date_of_birth = `${birthday}T00:00:00Z`

    return fields
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
)

const textValue = (value: unknown) => (
    typeof value === 'string' || typeof value === 'number' ? String(value) : ''
)

// The workflow transport can add a payload/dataresponse envelope, while the actual
// WF_BO_CREATE_USER result is { success, data: { data_template, ... } }. Only unwrap
// known transport envelopes and return a candidate when it really owns data_template.
const pickCreateUserData = (response: unknown): CreateUserWorkflowResponseData | null => {
    const root = isRecord(response) ? response : null
    const payload = isRecord(root?.payload) ? root.payload : null
    const dataresponse = isRecord(payload?.dataresponse)
        ? payload.dataresponse
        : isRecord(root?.dataresponse)
            ? root.dataresponse
            : null
    const roots = [dataresponse?.data, payload, root?.data, root]

    for (const candidateRoot of roots) {
        if (!isRecord(candidateRoot)) continue

        const candidates = [candidateRoot, candidateRoot.data, isRecord(candidateRoot.input) ? candidateRoot.input.data : null]

        for (const candidate of candidates) {
            if (isRecord(candidate) && Object.prototype.hasOwnProperty.call(candidate, 'data_template')) {
                return candidate as CreateUserWorkflowResponseData
            }
        }
    }

    return null
}

export function mapCreateUserSuccess(response: any): CreateUserSuccessData {
    const data = pickCreateUserData(response)
    const template: CreateUserWorkflowResponseData['data_template'] = isRecord(data?.data_template)
        ? data.data_template as CreateUserWorkflowResponseData['data_template']
        : null
    const mime_entities = Array.isArray(data?.mime_entities) ? data.mime_entities : []
    const qrEntity = mime_entities.find((item: any) => item?.content_id === 'qr' && item?.content_type === 'image/png')
    const username = textValue(template?.user_name)
    const fullname = textValue(template?.fullname)
    const email = textValue(template?.email)

    return {
        userCode: textValue(template?.user_code) || textValue(data?.user_code),
        username,
        fullname,
        email,
        phone: textValue(template?.phone),
        // Preserve exactly what the backend returns, including a deliberately masked "***".
        password: textValue(template?.password),
        notificationType: textValue(data?.notification_type),
        hasAccountInformation: Boolean(username || fullname || email),
        qrSrc: qrEntity?.base64 ? `data:${qrEntity.content_type};base64,${qrEntity.base64}` : undefined
    }
}

export const buildStaffChangeAvatarWorkflowFields = (payload: StaffAvatarChangePayload) => ({
    user_code: payload.userCode,
    avatar_url: payload.avatarUrl
})

// WF_BO_CHANGE_USERNAME contract is exactly { new_username, password } — the backend resolves the
// target account itself. The password is sent as entered (no client-side hashing in the contract).
export const buildStaffChangeUsernameWorkflowFields = (payload: StaffChangeUsernamePayload): StaffChangeUsernameWorkflowFields => ({
    new_username: payload.new_username.trim(),
    password: payload.password
})

// The success response shape is not documented: prefer the username the backend returns, and fall
// back to the submitted value only when the response does not echo one.
export const mapChangeUsernameResponse = (response: any, submitted_username: string) => {
    const root = pickDataRoot(response?.payload ?? response)
    const value = getField(root, ['new_username', 'newUsername', 'login_name', 'loginName', 'user_name', 'userName', 'username'])

    return typeof value === 'string' && value.trim() ? value.trim() : submitted_username
}

const getAvatarContentType = (file: File) => {
    if (file.type) return file.type

    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
    if (extension === 'webp') return 'image/webp'

    return 'image/png'
}

export const mapBoolChip = (value: any) => value === true || value === 1 || value === '1' || value === 'T' || value === 'Y'

export const getDetailFullName = (account: any) => (
    formatStaffFullName(account)
)

export const getStaffAvatarUrl = (detail?: Pick<UserDetailResponse, 'account' | 'user_avatar'> | null) => (
    detail?.user_avatar?.image_url || detail?.account?.avatar || ''
)

export const buildStaffUpdatePayloadFromAccount = (account?: UserAccountDetail | null): StaffUpdatePayload => ({
    id: Number(account?.id || 0),
    user_id: account?.user_id || '',
    user_code: account?.user_code || account?.user_id || '',
    login_name: account?.login_name || account?.user_name || '',
    full_name: getDetailFullName(account) || account?.login_name || '',
    email: account?.email || '',
    phone: account?.phone || '',
    gender: normalizeStaffGender(account?.gender),
    birthday: toStaffDateInputValue(account?.birthday ?? account?.date_of_birth),
    address: account?.address || '',
    description: account?.description || '',
    department_code: account?.department_code || '',
    status: account?.status || 'A',
    user_level: account?.user_level ?? 0
})

export function buildCommandTree(commands: UserCommandPermission[]) {
    const map = new Map<string, UserCommandPermission>()
    const roots: UserCommandPermission[] = []

    commands.forEach(command => {
        if (!command.command_id) return
        map.set(command.command_id, {
            ...command,
            children: []
        })
    })

    map.forEach(command => {
        const parent = command.parent_id ? map.get(command.parent_id) : null

        if (parent) parent.children = [...(parent.children ?? []), command]
        else roots.push(command)
    })

    return roots
}

const mapCommand = (item: any): UserCommandPermission => ({
    role_id: toNumber(getField(item, ['role_id', 'roleId']), 0),
    role_name: String(getField(item, ['role_name', 'roleName']) ?? ''),
    parent_id: String(getField(item, ['parent_id', 'parentId']) ?? ''),
    command_id: String(getField(item, ['command_id', 'commandId']) ?? ''),
    command_name: String(getField(item, ['command_name', 'commandName']) ?? ''),
    // Backend already localizes the response by request `lang`; `label` is the display text for
    // the current locale, rendered directly (label -> command_name -> command_id).
    label: (() => {
        const label = getField(item, ['label'])

        return label === undefined || label === null || label === '' ? undefined : String(label)
    })(),
    command_id_detail: String(getField(item, ['command_id_detail', 'commandIdDetail']) ?? ''),
    invoke: getField(item, ['invoke']) === undefined ? undefined : toNumber(getField(item, ['invoke']), 0),
    approve: getField(item, ['approve']) === undefined ? undefined : toNumber(getField(item, ['approve']), 0),
    application_code: String(getField(item, ['application_code', 'applicationCode']) ?? ''),
    command_type: String(getField(item, ['command_type', 'commandType']) ?? ''),
    group_menu_icon: getField(item, ['group_menu_icon', 'groupMenuIcon']) ?? null,
    group_menu_visible: getField(item, ['group_menu_visible', 'groupMenuVisible']) ?? null,
    group_menu_id: getField(item, ['group_menu_id', 'groupMenuId']) ?? null,
    group_menu_list_authorize_form: getField(item, ['group_menu_list_authorize_form', 'groupMenuListAuthorizeForm']) ?? null
})

const mapOperationHeader = (item: any): StaffOperationHeader => ({
    cmdid: String(getField(item, ['cmdid', 'cmdId', 'command_id', 'commandId']) ?? ''),
    caption: String(getField(item, ['caption', 'command_name', 'commandName']) ?? ''),
    // Backend localizes by request `lang`; keep `label` when the workflow provides it (render label -> caption).
    label: (() => {
        const label = getField(item, ['label'])

        return label === undefined || label === null || label === '' ? undefined : String(label)
    })()
})

const mapOperationRow = (item: any): StaffOperationRow => ({
    role_id: toNumber(getField(item, ['role_id', 'roleId']), 0),
    role_name: String(getField(item, ['role_name', 'roleName']) ?? ''),
    parent_id: String(getField(item, ['parent_id', 'parentId']) ?? ''),
    command_id: String(getField(item, ['command_id', 'commandId']) ?? ''),
    command_name: String(getField(item, ['command_name', 'commandName']) ?? ''),
    command_id_detail: String(getField(item, ['command_id_detail', 'commandIdDetail']) ?? ''),
    invoke: toNumber(getField(item, ['invoke']), 0),
    approve: toNumber(getField(item, ['approve']), 0),
    application_code: String(getField(item, ['application_code', 'applicationCode']) ?? ''),
    command_type: String(getField(item, ['command_type', 'commandType']) ?? ''),
    group_menu_icon: getField(item, ['group_menu_icon', 'groupMenuIcon']) ?? null,
    group_menu_visible: getField(item, ['group_menu_visible', 'groupMenuVisible']) ?? null,
    group_menu_id: getField(item, ['group_menu_id', 'groupMenuId']) ?? null,
    group_menu_list_authorize_form: getField(item, ['group_menu_list_authorize_form', 'groupMenuListAuthorizeForm']) ?? null
})

export const mapStaffOperationResponse = (response: any): StaffOperationResponse => {
    const root = pickDataRoot(response?.payload ?? response)

    return {
        operation_header: Array.isArray(root?.operation_header) ? root.operation_header.map(mapOperationHeader) : [],
        operation_body: Array.isArray(root?.operation_body) ? root.operation_body.map(mapOperationRow) : []
    }
}

const mapProjectAssignment = (item: any): UserProjectAssignmentItem => ({
    id: toNumber(getField(item, ['id']), 0),
    user_code: String(getField(item, ['user_code', 'userCode']) ?? ''),
    project_code: String(getField(item, ['project_code', 'projectCode']) ?? ''),
    assignment_status: String(getField(item, ['assignment_status', 'assignmentStatus']) ?? ''),
    project_name: String(getField(item, ['project_name', 'projectName']) ?? ''),
    project_status: String(getField(item, ['project_status', 'projectStatus']) ?? ''),
    project_address: String(getField(item, ['project_address', 'projectAddress']) ?? '')
})

export const mapUserProjectAssignmentsResponse = (response: any, request: { page_index: number; page_size: number }): UserProjectAssignmentsResponse => {
    const root = pickDataRoot(response?.payload ?? response)
    const total_count = toNumber(getField(root, ['total_count', 'totalCount']), 0)
    const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
    const total_pages = toNumber(getField(root, ['total_pages', 'totalPages']), page_size > 0 ? Math.ceil(total_count / page_size) : 0)

    return {
        items: pickItems(root).map(mapProjectAssignment),
        page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
        page_size,
        total_count,
        total_pages
    }
}

const mapProjectPickerOption = (item: any): ProjectPickerOption | null => {
    const code = String(getField(item, ['project_code', 'projectCode', 'projectcode', 'code']) ?? '').trim()

    if (!code) return null

    return {
        id: toNumber(getField(item, ['id', 'project_id', 'projectId']), 0),
        project_code: code,
        project_name: String(getField(item, ['project_name', 'projectName', 'name', 'caption']) ?? code).trim(),
        status: getField(item, ['status']) !== undefined ? String(getField(item, ['status'])) : undefined
    }
}

export const mapProjectPickerSearchResponse = (response: any, request: { page_index: number; page_size: number }): ProjectPickerSearchResponse => {
    const root = pickDataRoot(response?.payload ?? response)
    const total_count = toNumber(getField(root, ['total_count', 'totalCount']), 0)
    const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
    const total_pages = toNumber(getField(root, ['total_pages', 'totalPages']), page_size > 0 ? Math.ceil(total_count / page_size) : 0)

    return {
        items: pickItems(root).map(mapProjectPickerOption).filter((item): item is ProjectPickerOption => item !== null),
        page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
        page_size,
        total_count,
        total_pages
    }
}

const pickCreateProjectAssignmentData = (response: any) => {
    const dataresponse_data = response?.payload?.dataresponse?.data

    return dataresponse_data?.data
        ?? dataresponse_data?.input?.data
        ?? dataresponse_data
        ?? response?.payload?.data
        ?? response?.data
        ?? {}
}

export const mapStaffDetailResponse = (response: any): UserDetailResponse => {
    const root = pickDataRoot(response?.payload ?? response)
    const data = root?.account || root?.user_roles || root?.commands ? root : root?.data ?? {}
    const gender = normalizeStaffGender(data?.account?.gender)

    return {
        account: data?.account ? {
            ...data.account,
            // Detail responses have used both `birthday` and `date_of_birth`. Normalize either
            // one into the form/display field without parsing it as a timestamp.
            birthday: data.account.birthday ?? data.account.date_of_birth ?? null,
            gender: gender === '' ? null : gender
        } : null,
        user_avatar: data?.user_avatar ?? null,
        user_roles: Array.isArray(data?.user_roles) ? data.user_roles : [],
        commands: Array.isArray(data?.commands) ? data.commands.map(mapCommand).filter((item: UserCommandPermission) => item.command_id) : []
    }
}

const mapStaff = (item: any): StaffModel => ({
    id: toNumber(getField(item, ['id']), 0),
    channel_id: String(getField(item, ['channel_id', 'channelId']) ?? ''),
    user_id: String(getField(item, ['user_id', 'userId']) ?? ''),
    user_name: String(getField(item, ['user_name', 'userName']) ?? ''),
    user_code: String(getField(item, ['user_code', 'userCode']) ?? ''),
    login_name: String(getField(item, ['login_name', 'loginName']) ?? ''),
    first_name: String(getField(item, ['first_name', 'firstName']) ?? ''),
    middle_name: getField(item, ['middle_name', 'middleName']) ?? null,
    last_name: String(getField(item, ['last_name', 'lastName']) ?? ''),
    email: String(getField(item, ['email']) ?? ''),
    phone: String(getField(item, ['phone']) ?? ''),
    status: String(getField(item, ['status']) ?? ''),
    last_login_time: getField(item, ['last_login_time', 'lastLoginTime']) ?? null,
    // getField can hand back a raw backend string like "false"/"0" — plain Boolean() treats any
    // non-empty string as true, which showed never-logged-in users as "Có". mapBoolChip parses
    // the actual truthy encodings (true/1/'1'/'T'/'Y') instead of JS string-truthiness.
    is_login: mapBoolChip(getField(item, ['is_login', 'isLogin'])),
    branch_id: String(getField(item, ['branch_id', 'branchId']) ?? ''),
    branch_code: String(getField(item, ['branch_code', 'branchCode']) ?? ''),
    department_code: getField(item, ['department_code', 'departmentCode']) ?? null,
    user_level: toNumber(getField(item, ['user_level', 'userLevel']), 0),
    is_super_admin: Boolean(getField(item, ['is_super_admin', 'isSuperAdmin'])),
    avatar: getField(item, ['avatar']) ?? null
})

export const mapStaffSearchResponse = (response: any, request: StaffSearchRequest): StaffListResponse => {
    const root = pickDataRoot(response?.payload ?? response)
    const total_count = toNumber(getField(root, ['total_count', 'totalCount', 'total_items', 'totalItems']), 0)
    const page_size = toNumber(getField(root, ['page_size', 'pageSize']), request.page_size)
    const total_pages = toNumber(getField(root, ['total_pages', 'totalPages']), page_size > 0 ? Math.ceil(total_count / page_size) : 0)

    return {
        items: pickItems(root).map(mapStaff),
        page_index: normalizeResponsePage(getField(root, ['page_index', 'pageIndex']), request.page_index),
        page_size,
        total_count,
        total_pages
    }
}

export const staffService = {
    get_default_response: (filter?: Partial<StaffFilterModel>): StaffListResponse => ({
        ...empty_staff_response,
        page_index: filter?.page_index ?? empty_staff_response.page_index,
        page_size: filter?.page_size ?? empty_staff_response.page_size
    }),

    search_users: async ({
        sessiontoken,
        language,
        filter
    }: {
        sessiontoken?: string
        language?: Locale
        filter: StaffFilterModel
    }): Promise<StaffListResponse> => {
        if (!sessiontoken) return staffService.get_default_response(filter)

        const request: StaffSearchRequest = {
            page_size: filter.page_size,
            page_index: Math.max(filter.page_index - 1, 0),
            search_text: filter.search_text.trim(),
            channel_code: filter.channel_code,
            // 'ALL' means no status filter.
            status: filter.status && filter.status !== 'ALL' ? filter.status : null,
            is_login: filter.is_login === 'ALL' ? null : filter.is_login === 'Y'
        }

        // Staff Search is intentionally global within the BO channel. A project is a screen
        // filter only, not a consequence of the currently selected Project Context.
        if (filter.project_code.trim()) request.project_code = filter.project_code.trim()

        // Department is another optional screen filter — omit the field entirely when "All"
        // is selected so WF_BO_SIMPLE_SEARCH_USER does not narrow the result set.
        if (filter.department_code.trim()) request.department_code = filter.department_code.trim()

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load staffs.', language)

        return mapStaffSearchResponse(response, request)
    },

    // The backend fully owns what gets exported — this never sends search_text/status/is_login/
    // channel_code or any other search-screen state. Only session/locale headers go out.
    export_staff_list: async ({
        sessiontoken,
        language
    }: {
        sessiontoken?: string
        language?: Locale
    }): Promise<StaffExportResponse> => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            app: 'BO',
            lang: String(language ?? 'vi')
        }

        if (sessiontoken) headers.uid = sessiontoken

        const response = await fetch(STAFF_EXPORT_PATH, {
            method: 'POST',
            headers,
            body: JSON.stringify({})
        })

        if (!response.ok) {
            const { message, executionId } = await getStaffExportErrorDetails(response)

            throw new StaffExportError(message, executionId)
        }

        return {
            blob: await response.blob(),
            filename: parseContentDispositionFilename(response.headers.get('content-disposition')) || `Staff_List_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
        }
    },

    getExportErrorExecutionId: (error: unknown) => (error instanceof StaffExportError ? error.executionId : undefined),

    create_staff: async ({
        sessiontoken,
        language,
        payload
    }: {
        sessiontoken?: string
        language?: Locale
        payload: StaffCreatePayload
    }) => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_CREATE_WORKFLOW_ID,
            input: buildStaffCreateWorkflowFields(payload),
            language
        })

        assertWorkflowSuccess(response, 'Create user failed.', language)

        return mapCreateUserSuccess(response)
    },

    get_staff_detail: async ({
        sessiontoken,
        language,
        usercode
    }: {
        sessiontoken?: string
        language?: Locale
        usercode: string
    }): Promise<UserDetailResponse> => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_DETAIL_WORKFLOW_ID,
            input: { usercode },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load user detail.', language)

        return mapStaffDetailResponse(response)
    },

    update_staff: async ({
        sessiontoken,
        language,
        payload
    }: {
        sessiontoken?: string
        language?: Locale
        payload: StaffUpdatePayload
    }) => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_UPDATE_WORKFLOW_ID,
            input: buildStaffUpdateWorkflowFields(payload),
            language
        })

        assertWorkflowSuccess(response, 'Update user failed.', language)

        return response
    },

    upload_staff_avatar: async ({
        userCode,
        file
    }: {
        userCode: string
        file: File
    }): Promise<string> => {
        if (!userCode) {
            throw new Error('User code is required to upload avatar.')
        }

        const content_type = getAvatarContentType(file)

        const presignResponse = await fetch('/api/users/avatar/presign-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_code: userCode,
                file_name: file.name,
                content_type,
                file_size: file.size
            })
        })

        const presignJson = await presignResponse.json().catch(() => ({}))

        if (!presignResponse.ok || !presignJson?.success) {
            throw new Error(presignJson?.message || 'Unable to get avatar upload URL.')
        }

        const upload_url = presignJson.data?.upload_url
        const avatar_url = presignJson.data?.avatar_url

        if (!upload_url || !avatar_url) {
            throw new Error('Unable to get avatar upload URL.')
        }

        const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            headers: { 'Content-Type': content_type },
            body: file
        })

        if (!uploadResponse.ok) {
            throw new Error(`Upload avatar failed (${uploadResponse.status}).`)
        }

        return avatar_url
    },

    change_staff_avatar: async ({
        sessiontoken,
        language,
        payload
    }: {
        sessiontoken?: string
        language?: Locale
        payload: StaffAvatarChangePayload
    }) => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_CHANGE_AVATAR_WORKFLOW_ID,
            input: buildStaffChangeAvatarWorkflowFields(payload),
            language
        })

        assertWorkflowSuccess(response, 'Change avatar failed.', language)

        return response
    },

    assign_staff_admin: async ({
        sessiontoken,
        userCode
    }: {
        sessiontoken?: string
        userCode: string
    }) => {
        const normalized_user_code = userCode.trim()

        if (!normalized_user_code) {
            throw new Error('User code is required.')
        }

        const response = await fetch('/api/users/supperadmin/assign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(sessiontoken ? { uid: sessiontoken } : {})
            },
            body: JSON.stringify({ user_code: normalized_user_code })
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok || payload?.success === false) {
            throw new Error(payload?.message || 'Unable to assign user to admin.')
        }

        return payload
    },

    // Admin-entered password change for another user. Reuses WF_BO_USER_RESET_PASSWORD (the same
    // workflow behind "Reset Password") but passes an explicit `password` instead of letting the
    // backend auto-generate one — confirmed with the backend team that the workflow accepts it.
    set_staff_password: async ({
        sessiontoken,
        language,
        usercode,
        password
    }: {
        sessiontoken?: string
        language?: Locale
        usercode: string
        password: string
    }): Promise<void> => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        if (!usercode) {
            throw new Error('User code is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_RESET_PASSWORD_WORKFLOW_ID,
            input: { usercode, password },
            language
        })

        assertWorkflowSuccess(response, 'Change password failed.', language)
    },

    change_username: async ({
        sessiontoken,
        language,
        payload
    }: {
        sessiontoken?: string
        language?: Locale
        payload: StaffChangeUsernamePayload
    }): Promise<string> => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        const input = buildStaffChangeUsernameWorkflowFields(payload)

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_CHANGE_USERNAME_WORKFLOW_ID,
            input,
            language
        })

        assertWorkflowSuccess(response, 'Change username failed.', language)

        return mapChangeUsernameResponse(response, input.new_username)
    },

    get_operation: async ({
        sessiontoken,
        language,
        command_id
    }: {
        sessiontoken?: string
        language?: Locale
        command_id: string
    }): Promise<StaffOperationResponse> => {
        const empty_operation: StaffOperationResponse = { operation_header: [], operation_body: [] }

        if (!sessiontoken || !command_id) return empty_operation

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_OPERATION_WORKFLOW_ID,
            input: { command_id },
            language
        })

        assertWorkflowSuccess(response, 'Unable to load operation permissions.', language)

        return mapStaffOperationResponse(response)
    },

    search_user_project_assignments: async ({
        sessiontoken,
        language,
        usercode,
        page_index = 0,
        page_size = 100
    }: {
        sessiontoken?: string
        language?: Locale
        usercode: string
        page_index?: number
        page_size?: number
    }): Promise<UserProjectAssignmentsResponse> => {
        const empty_response: UserProjectAssignmentsResponse = { items: [], page_index, page_size, total_count: 0, total_pages: 0 }

        if (!sessiontoken || !usercode) return empty_response

        const request = { search_text: usercode, page_index, page_size }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_PROJECT_ASSIGNMENTS_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load project assignments.', language)

        return mapUserProjectAssignmentsResponse(response, request)
    },

    // The assignment workflow is paginated. Detail/reopen state must represent every assignment,
    // otherwise projects beyond the first response page disappear from the dialog selection.
    search_all_user_project_assignments: async ({
        sessiontoken,
        language,
        usercode
    }: {
        sessiontoken?: string
        language?: Locale
        usercode: string
    }): Promise<UserProjectAssignmentItem[]> => {
        if (!sessiontoken || !usercode) return []

        const page_size = 100
        let page_index = 0
        let total_count = Infinity
        const assignments: UserProjectAssignmentItem[] = []

        while (assignments.length < total_count) {
            const result = await staffService.search_user_project_assignments({ sessiontoken, language, usercode, page_index, page_size })

            if (result.items.length === 0) break

            assignments.push(...result.items)
            total_count = result.total_count
            page_index += 1
        }

        return assignments
    },

    search_projects_for_assignment: async ({
        sessiontoken,
        language,
        search_text,
        page_index,
        page_size
    }: {
        sessiontoken?: string
        language?: Locale
        search_text: string
        page_index: number
        page_size: number
    }): Promise<ProjectPickerSearchResponse> => {
        const empty_response: ProjectPickerSearchResponse = { items: [], page_index: 0, page_size, total_count: 0, total_pages: 0 }

        if (!sessiontoken) return empty_response

        // Project assignment picker must only ever offer Active projects — filtered server-side, not in the client.
        const request = { search_text: search_text.trim(), page_index, page_size, status: 'A' }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_PROJECT_PICKER_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load projects.', language)

        return mapProjectPickerSearchResponse(response, request)
    },

    create_user_project_assignment: async ({
        sessiontoken,
        language,
        user_code,
        project_code,
        user_channel_id = 'BO'
    }: {
        sessiontoken?: string
        language?: Locale
        user_code: string
        project_code: string
        user_channel_id?: string
    }): Promise<CreateUserProjectAssignmentResult> => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        if (!user_code || !project_code) {
            throw new Error('Project code is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_CREATE_PROJECT_ASSIGNMENT_WORKFLOW_ID,
            input: { user_code, project_code, user_channel_id },
            language
        })

        assertWorkflowSuccess(response, 'Unable to create project assignment.', language)

        const data = pickCreateProjectAssignmentData(response)
        const skipped = data?.skipped === true || data?.skipped === 'true' || data?.skipped === 1

        return { skipped }
    },

    // No batch workflow exists yet for "assign many users to one project" — this loops the
    // existing single-assignment workflow sequentially and reports a per-user outcome so the
    // UI can show partial success instead of failing the whole batch on one bad row.
    batch_assign_users_to_project: async ({
        sessiontoken,
        language,
        users,
        project_code,
        user_channel_id = 'BO'
    }: {
        sessiontoken?: string
        language?: Locale
        users: Array<{ user_code: string; full_name: string }>
        project_code: string
        user_channel_id?: string
    }): Promise<BatchAssignUserProjectResultItem[]> => {
        const results: BatchAssignUserProjectResultItem[] = []

        for (const user of users) {
            try {
                const result = await staffService.create_user_project_assignment({
                    sessiontoken,
                    language,
                    user_code: user.user_code,
                    project_code,
                    user_channel_id
                })

                results.push({
                    user_code: user.user_code,
                    full_name: user.full_name,
                    status: result.skipped ? 'skipped' : 'assigned'
                })
            } catch (err) {
                results.push({
                    user_code: user.user_code,
                    full_name: user.full_name,
                    status: 'failed',
                    error_message: err instanceof Error ? err.message : 'Unable to create project assignment.'
                })
            }
        }

        return results
    },

    // The picker workflow is paginated; "select all" must cover the entire assignable list
    // regardless of the current search filter or page, so this loops the search with an empty
    // search_text until every project has been fetched.
    search_all_projects_for_assignment: async ({
        sessiontoken,
        language
    }: {
        sessiontoken?: string
        language?: Locale
    }): Promise<ProjectPickerOption[]> => {
        if (!sessiontoken) return []

        const page_size = 200
        let page_index = 0
        let all_items: ProjectPickerOption[] = []
        let total_count = Infinity

        while (all_items.length < total_count) {
            const result = await staffService.search_projects_for_assignment({
                sessiontoken,
                language,
                search_text: '',
                page_index,
                page_size
            })

            if (result.items.length === 0) break

            all_items = all_items.concat(result.items)
            total_count = result.total_count
            page_index += 1
        }

        return all_items
    },

    // Assigns one user to many projects in a single workflow call — project_code is sent as a
    // List<string> so the backend creates every assignment in one shot instead of one request per project.
    create_user_project_assignments: async ({
        sessiontoken,
        language,
        user_code,
        project_code,
        user_channel_id = 'BO'
    }: {
        sessiontoken?: string
        language?: Locale
        user_code: string
        project_code: string[]
        user_channel_id?: string
    }): Promise<void> => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        if (!user_code || project_code.length === 0) {
            throw new Error('Project code is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_CREATE_PROJECT_ASSIGNMENT_WORKFLOW_ID,
            input: { user_code, project_code, user_channel_id },
            language
        })

        assertWorkflowSuccess(response, 'Unable to create project assignment.', language)
    },

    delete_staff: async ({
        sessiontoken,
        language,
        user_id
    }: {
        sessiontoken?: string
        language?: Locale
        user_id: string
    }): Promise<void> => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        if (!user_id) {
            throw new Error('User id is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_DELETE_WORKFLOW_ID,
            input: { user_id },
            language
        })

        assertWorkflowSuccess(response, 'Delete user failed.', language)

        const payload = response?.payload as any
        const dataresponse = payload?.dataresponse ?? payload
        const success = payload?.success === true || dataresponse?.success === true
        const deleted = pickDataRoot(payload ?? response) === true

        if (!success || !deleted) {
            throw new Error(formatWorkflowErrorMessage(response, 'Delete user failed.', language))
        }
    },

    // Powers the Role picker on the staff Create page. Roles are explicitly scoped to the
    // requested service so BO and MB roles are never mixed in one selection list.
    search_roles_for_assignment: async ({
        sessiontoken,
        language,
        search_text,
        page_index,
        page_size,
        service_id = 'BO'
    }: {
        sessiontoken?: string
        language?: Locale
        search_text: string
        page_index: number
        page_size: number
        service_id?: StaffRoleServiceId
    }): Promise<StaffRoleSearchResponse> => {
        const empty_response: StaffRoleSearchResponse = { items: [], page_index: 1, page_size, total_count: 0, total_pages: 0 }

        if (!sessiontoken) return empty_response

        const request: StaffRoleSearchRequest = {
            search_text: search_text.trim(),
            service_id,
            page_index: Math.max(page_index - 1, 0),
            page_size
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_ROLE_SEARCH_WORKFLOW_ID,
            input: request,
            language
        })

        assertWorkflowSuccess(response, 'Unable to load roles.', language)

        return mapStaffRoleSearchResponse(response, request)
    },

    // The role workflow is paginated. The create form needs the complete service-specific
    // dataset so neither its first page nor an arbitrary page size becomes the role limit.
    search_all_roles_for_assignment: async ({
        sessiontoken,
        language,
        service_id = 'BO'
    }: {
        sessiontoken?: string
        language?: Locale
        service_id?: StaffRoleServiceId
    }): Promise<StaffRoleOption[]> => {
        if (!sessiontoken) return []

        const page_size = 100
        let page_index = 1
        let total_count = Infinity
        const roles: StaffRoleOption[] = []

        while (roles.length < total_count) {
            const result = await staffService.search_roles_for_assignment({ sessiontoken, language, search_text: '', page_index, page_size, service_id })

            if (result.items.length === 0) break

            roles.push(...result.items)
            total_count = result.total_count
            page_index += 1
        }

        return roles.filter(role => !role.service_id || role.service_id === service_id)
    },

    update_user_private_rights: async ({
        sessiontoken,
        language,
        target_user_code,
        list_user_right
    }: {
        sessiontoken?: string
        language?: Locale
        target_user_code: string
        list_user_right: UserPrivateRightItem[]
    }) => {
        if (!sessiontoken) {
            throw new Error('Session is required.')
        }

        if (!target_user_code) {
            throw new Error('User code is required.')
        }

        const response = await workflowService.runFODynamic({
            sessiontoken,
            workflowid: STAFF_UPDATE_PRIVATE_RIGHTS_WORKFLOW_ID,
            input: { target_user_code, list_user_right },
            language
        })

        assertWorkflowSuccess(response, 'Unable to add private rights.', language)

        return response
    }
}
