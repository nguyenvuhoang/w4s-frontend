import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type StaffDictionary = Awaited<ReturnType<typeof getDictionary>>

export type StaffPageProps = {
    dictionary: StaffDictionary
    session: Session | null
    locale: Locale
}

export type StaffStatus = 'A' | 'I' | 'L' | 'D' | string
// IPS gender enum: 0 = unspecified, 1 = male, 2 = female. Empty is only the UI's
// unselected state and must never be serialized as a workflow gender value.
export type StaffGender = 0 | 1 | 2 | ''

export type StaffModel = {
    id: number
    channel_id: string
    user_id: string
    user_name: string
    user_code: string
    login_name: string
    first_name: string
    middle_name: string | null
    last_name: string
    email: string
    phone: string
    status: StaffStatus
    last_login_time: string | null
    is_login: boolean
    branch_id: string
    branch_code: string
    department_code: string | null
    user_level: number
    is_super_admin: boolean
    avatar: string | null
}

export type UserChannelCode = 'BO' | 'MB'
export type StaffRoleServiceId = 'BO' | 'MB'

// Status filter options are loaded at runtime from the USER_STATUS CodeList (CTH group).
// 'ALL' is the sentinel for "no status filter" and is never sent in the search request.
export type StaffStatusFilter = 'ALL' | (string & {})
export type StaffLoginFilter = 'ALL' | 'Y' | 'N'

export type StaffFilterModel = {
    search_text: string
    channel_code: UserChannelCode
    project_code: string
    department_code: string
    status: StaffStatusFilter
    is_login: StaffLoginFilter
    page_index: number
    page_size: number
}

export type StaffSearchRequest = {
    search_text: string
    channel_code: UserChannelCode
    project_code?: string
    department_code?: string
    status: string | null
    is_login: boolean | null
    page_index: number
    page_size: number
}

export type StaffListResponse = {
    items: StaffModel[]
    page_index: number
    page_size: number
    total_count: number
    total_pages: number
}

export type StaffCreatePayload = {
    full_name: string
    login_name: string
    user_name: string
    email: string
    phone: string
    gender: StaffGender
    birthday: string
    address: string
    description: string
    department_code: string
    project_code: string[]
    password: string
    assign_role_id: number[]
}

export type StaffCreateWorkflowFields = {
    username: string
    firstname: string
    middlename: string
    lastname: string
    gender: number
    address: string
    email: string
    phone: string
    birthday: string
    description: string
    department_code: string
    project_code: string[]
    password: string
    assign_role_id: number[]
}

export type StaffRoleOption = {
    role_id: number
    role_name: string
    role_description: string | null
    service_id?: StaffRoleServiceId
}

export type StaffRoleSearchRequest = {
    search_text: string
    service_id: StaffRoleServiceId
    page_index: number
    page_size: number
}

export type StaffRoleSearchResponse = {
    items: StaffRoleOption[]
    page_index: number
    page_size: number
    total_count: number
    total_pages: number
}

export type StaffUpdatePayload = {
    id: number
    user_id: string
    user_code: string
    login_name: string
    full_name: string
    email: string
    phone: string
    gender: StaffGender
    birthday: string
    address: string
    description: string
    department_code: string
    status: StaffStatus
    user_level: number | ''
}

export type StaffUpdateWorkflowFields = {
    id: number
    userid: string
    username: string
    firstname: string
    middlename: string
    lastname: string
    gender: number
    address: string
    email: string
    phone: string
    /** Date-only birthday serialized as UTC midnight for WF_BO_UPDATE_USER. */
    date_of_birth?: string
    description: string
    department_code: string
    status: StaffStatus
}

export type StaffAvatarChangePayload = {
    userCode: string
    avatarUrl: string
}

export type StaffChangeUsernamePayload = {
    new_username: string
    password: string
}

export type StaffChangeUsernameWorkflowFields = {
    new_username: string
    password: string
}

export type CreateUserSuccessData = {
    userCode: string
    username: string
    fullname: string
    email: string
    phone: string
    password: string
    notificationType: string
    /** True only when the server returned at least one primary account field. */
    hasAccountInformation: boolean
    qrSrc?: string
}

export type CreateUserDataTemplateResponse = {
    user_code?: string | null
    user_name?: string | null
    fullname?: string | null
    email?: string | null
    phone?: string | null
    password?: string | null
}

export type CreateUserWorkflowResponseData = {
    user_code?: string | null
    data_template?: CreateUserDataTemplateResponse | null
    notification_type?: string | null
    mime_entities?: Array<{
        content_id?: string | null
        content_type?: string | null
        base64?: string | null
    }> | null
}

export type UserAccountDetail = {
    channel_id?: string
    user_id?: string
    user_name?: string
    user_code?: string
    login_name?: string
    first_name?: string
    middle_name?: string | null
    last_name?: string
    gender?: number | null
    address?: string | null
    email?: string | null
    birthday?: string | null
    date_of_birth?: string | null
    phone?: string | null
    status?: string | null
    user_created?: string | null
    user_modified?: string | null
    last_login_time?: string | null
    is_login?: boolean
    branch_id?: string | null
    branch_code?: string | null
    department_code?: string | null
    description?: string | null
    user_level?: number | null
    policy_id?: number | null
    uuid?: string | null
    failnumber?: number | null
    is_super_admin?: boolean
    is_biometric_supported?: boolean
    locked_until?: string | null
    notification_type?: string | null
    is_first_login?: boolean
    currency_code?: string | null
    id?: number
    created_on_utc?: string | null
    updated_on_utc?: string | null
    avatar?: string | null
}

export type UserAvatarDetail = {
    user_code?: string
    image_url?: string | null
    date_insert?: string | null
}

export type UserRoleDetail = {
    role_id?: number
    role_name?: string
    role_description?: string | null
    user_type?: string | null
    status?: string | null
    is_show?: string | null
    sort_order?: number | null
}

export type UserCommandPermission = {
    role_id?: number
    role_name?: string
    parent_id?: string
    command_id: string
    command_name?: string
    /** Backend-localized display text for the active request `lang` (rendered directly). */
    label?: string
    command_id_detail?: string
    invoke?: number
    approve?: number
    application_code?: string
    command_type?: string
    group_menu_icon?: string | null
    group_menu_visible?: string | null
    group_menu_id?: string | null
    group_menu_list_authorize_form?: string | null
    children?: UserCommandPermission[]
}

export type UserDetailResponse = {
    account: UserAccountDetail | null
    user_avatar?: UserAvatarDetail | null
    user_roles: UserRoleDetail[]
    commands: UserCommandPermission[]
}

export type CommandPermissionFilter = {
    search_text: string
    command_type: 'all' | 'M' | 'C'
    invoke: 'all' | 'allowed' | 'denied'
    approve: 'all' | 'allowed' | 'denied'
    visible: 'all' | 'visible' | 'hidden'
}

export type StaffOperationHeader = {
    cmdid: string
    caption: string
    /** Backend-localized operation name when present; render label -> caption. */
    label?: string
}

export type StaffOperationRow = {
    role_id: number
    role_name?: string
    parent_id?: string
    command_id: string
    command_name?: string
    command_id_detail?: string
    invoke?: number
    approve?: number
    application_code?: string
    command_type?: string
    group_menu_icon?: string | null
    group_menu_visible?: string | null
    group_menu_id?: string | null
    group_menu_list_authorize_form?: string | null
}

export type StaffOperationResponse = {
    operation_header: StaffOperationHeader[]
    operation_body: StaffOperationRow[]
}

export type StaffOperationRole = {
    role_id: number
    role_name: string
    commands: Record<string, StaffOperationRow>
}

export type UserProjectAssignmentItem = {
    id: number
    user_code: string
    project_code: string
    assignment_status: string
    project_name: string
    project_status: string
    project_address: string
}

export type UserProjectAssignmentsResponse = {
    items: UserProjectAssignmentItem[]
    page_index: number
    page_size: number
    total_count: number
    total_pages: number
}

export type ProjectPickerOption = {
    id: number
    project_code: string
    project_name: string
    status?: string
}

export type ProjectPickerSearchResponse = {
    items: ProjectPickerOption[]
    page_index: number
    page_size: number
    total_count: number
    total_pages: number
}

export type CreateUserProjectAssignmentResult = {
    skipped: boolean
}

export type BatchAssignUserProjectResultItem = {
    user_code: string
    full_name: string
    status: 'assigned' | 'skipped' | 'failed'
    error_message?: string
}

export type UserPrivateMenuRightItem = {
    right_level: 'MENU'
    command_id: string
    command_id_detail: string
    channel_id: string
    invoke: boolean
    approve: boolean
}

export type UserPrivateWorkflowRightItem = {
    right_level: 'WORKFLOW'
    resource_id: string
    channel_id: string
    invoke: boolean
    approve: boolean
}

export type UserPrivateRightItem = UserPrivateMenuRightItem | UserPrivateWorkflowRightItem
