import type { SelectChangeEvent } from '@mui/material/Select'

import type { StaffCreatePayload, StaffDictionary, StaffFilterModel, StaffGender, StaffLoginFilter, StaffModel, StaffStatus } from '../../types'
import { formatStaffFullName } from '../../utils/staffName'
import { normalizeStaffGender } from '../../utils/staffGender'

export const empty_staff_filter: StaffFilterModel = {
    search_text: '',
    channel_code: 'BO',
    project_code: '',
    department_code: '',
    status: 'ALL',
    is_login: 'ALL',
    page_index: 0,
    page_size: 10
}

export const empty_residents_tenants_filter: StaffFilterModel = {
    ...empty_staff_filter,
    channel_code: 'MB',
    page_size: 10
}

export const empty_staff_form: StaffCreatePayload = {
    full_name: '',
    login_name: '',
    user_name: '',
    email: '',
    phone: '',
    gender: '',
    birthday: '',
    address: '',
    description: '',
    department_code: '',
    project_code: [],
    password: '',
    assign_role_id: []
}

export const gender_options: StaffGender[] = [0, 1, 2]
export const status_options: StaffStatus[] = ['A', 'B', 'I', 'L']

// The Status filter dropdown is built at runtime from the USER_STATUS CodeList (see StaffFilterBar).
export const staff_login_filter_options: StaffLoginFilter[] = ['ALL', 'Y', 'N']

export type PageSizeChangeHandler = (event: SelectChangeEvent<number>, child?: React.ReactNode) => void

export const staffText = (dictionary: StaffDictionary, key: string, fallback: string, namespace: 'staffs' | 'residents_tenants' = 'staffs') => {
    const scoped_dictionary = dictionary as StaffDictionary & {
        residents_tenants?: Record<string, string>
    }

    return scoped_dictionary[namespace]?.[key] ?? scoped_dictionary.staffs?.[key] ?? fallback
}
export const commonText = (dictionary: StaffDictionary, key: string, fallback: string) => dictionary.common?.[key] ?? fallback

export const getStaffFullName = (row: Pick<StaffModel, 'first_name' | 'middle_name' | 'last_name'>) => (
    formatStaffFullName(row) || '-'
)

export const formatStaffDateTime = (value?: string | null) => {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

export const getBooleanLabel = (dictionary: StaffDictionary, value: boolean) => (
    value ? commonText(dictionary, 'yes', 'Yes') : commonText(dictionary, 'no', 'No')
)

export const getStaffStatusColor = (status: StaffStatus) => {
    if (status === 'A') return 'success'
    if (status === 'B' || status === 'L') return 'warning'
    if (status === 'D') return 'error'

    return 'default'
}

export const getStaffStatusLabel = (dictionary: StaffDictionary, status: StaffStatus, namespace: 'staffs' | 'residents_tenants' = 'staffs') => {
    if (status === 'A') return staffText(dictionary, 'status_active', 'Active', namespace)
    if (status === 'B') return staffText(dictionary, 'status_blocked', 'Blocked', namespace)
    if (status === 'I') return staffText(dictionary, 'status_inactive', 'Inactive', namespace)
    if (status === 'D') return staffText(dictionary, 'status_deleted', 'Deleted', namespace)
    if (status === 'L') return staffText(dictionary, 'status_locked', 'Locked', namespace)

    return status || '-'
}

export const getStaffLoginFilterLabel = (dictionary: StaffDictionary, value: StaffLoginFilter, namespace: 'staffs' | 'residents_tenants' = 'staffs') => {
    if (value === 'Y') return staffText(dictionary, 'login_filter_yes', 'Logged in', namespace)
    if (value === 'N') return staffText(dictionary, 'login_filter_no', 'Not logged in yet', namespace)

    return commonText(dictionary, 'all', 'All')
}

// `is_login` is a backend-provided boolean. Reuse the same localized wording as the filter
// instead of treating it as a generic yes/no value or inferring anything from last_login_time.
export const getStaffLoginLabel = (dictionary: StaffDictionary, is_login: boolean, namespace: 'staffs' | 'residents_tenants' = 'staffs') => (
    getStaffLoginFilterLabel(dictionary, is_login ? 'Y' : 'N', namespace)
)

export const getStaffGenderLabel = (dictionary: StaffDictionary, gender: StaffGender, namespace: 'staffs' | 'residents_tenants' = 'staffs') => {
    const normalized = normalizeStaffGender(gender)

    if (normalized === 0) return staffText(dictionary, 'gender_unknown', 'Not known', namespace)
    if (normalized === 1) return staffText(dictionary, 'gender_male', 'Male', namespace)
    if (normalized === 2) return staffText(dictionary, 'gender_female', 'Female', namespace)

    return staffText(dictionary, 'gender_unknown', 'Not known', namespace)
}
