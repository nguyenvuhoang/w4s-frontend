import type { getDictionary } from '@/shared/utils/getDictionary'

import type { ResidentAppUsage, ResidentAppUsageFilter, ResidentFilterModel, ResidentListStatus } from '../../types'

export type ResidentDictionary = Awaited<ReturnType<typeof getDictionary>>

export const empty_resident_filter: ResidentFilterModel = {
    keyword: '',
    status: 'ALL',
    gender: 'ALL',
    role: '',
    app_usage: 'ALL',
    project_id: null,
    building_id: '',
    page_index: 0,
    page_size: 10
}

export const status_options: Array<ResidentFilterModel['status']> = ['ALL', 'A', 'L', 'I']
export const gender_options: Array<ResidentFilterModel['gender']> = ['ALL', 'M', 'F', 'O']

export const search_status_options: Array<ResidentFilterModel['status']> = ['ALL', 'A', 'I']
export const app_usage_options: Array<ResidentFilterModel['app_usage']> = ['ALL', 'USED', 'NOT_USED']

export const residentText = (dictionary: ResidentDictionary, key: string, fallback: string) => dictionary.resident?.[key] ?? fallback
export const commonText = (dictionary: ResidentDictionary, key: string, fallback: string) => dictionary.common?.[key] ?? fallback

export const parseResidentBuildingFilterValue = (value: string): ResidentFilterModel['building_id'] => (
    value === '' ? '' : Number(value)
)

export const toResidentBuildingPayloadValue = (value: ResidentFilterModel['building_id']) => value

export const getResidentBuildingSelectLabel = (
    dictionary: ResidentDictionary,
    buildingOptions: Array<{ id: number; building_code?: string | null; name?: string | null }>,
    value: ResidentFilterModel['building_id']
) => {
    if (value === '') return residentText(dictionary, 'filter_building_all_option', 'Tất cả tòa nhà')

    const building = buildingOptions.find(option => option.id === value)

    if (!building) return String(value)

    return building.building_code ? `[${building.building_code}] ${building.name}` : building.name || String(value)
}

export const normalizeResidentCode = (value: string) => value.toUpperCase().replace(/\s+/g, '_')

export const formatResidentDate = (value?: string | null) => {
    if (!value) return '-'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date)
}

export const formatResidentDateTime = (value?: string | null) => {
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

export const getResidentStatusColor = (status: ResidentListStatus) => {
    if (status === 'A') return 'success'
    if (status === 'L') return 'warning'

    return 'default'
}

export const getResidentStatusLabel = (dictionary: ResidentDictionary, status: ResidentFilterModel['status']) => {
    if (status === 'A') return residentText(dictionary, 'status_active', 'Đang hoạt động')
    if (status === 'I') return residentText(dictionary, 'status_inactive', 'Không hoạt động')
    if (status === 'L') return residentText(dictionary, 'status_locked', 'Tạm khóa')

    return commonText(dictionary, 'all', 'Tất cả')
}

export const getResidentGenderLabel = (dictionary: ResidentDictionary, gender: ResidentFilterModel['gender']) => {
    if (gender === 'M') return residentText(dictionary, 'gender_male', 'Nam')
    if (gender === 'F') return residentText(dictionary, 'gender_female', 'Nữ')
    if (gender === 'O') return residentText(dictionary, 'gender_other', 'Khác')

    return commonText(dictionary, 'all', 'Tất cả')
}

export const getResidentGenderDisplay = (dictionary: ResidentDictionary, gender?: string | null) => {
    if (gender === 'M') return residentText(dictionary, 'gender_male', 'Nam')
    if (gender === 'F') return residentText(dictionary, 'gender_female', 'Nữ')
    if (gender === 'O') return residentText(dictionary, 'gender_other', 'Khác')

    return '-'
}

export const normalizeResidentAppUsage = (value: unknown): ResidentAppUsage => {
    const normalizedValue = typeof value === 'string' ? value.trim().toUpperCase() : ''

    if (normalizedValue === 'USED' || normalizedValue === 'NOT_USED') return normalizedValue

    return 'UNKNOWN'
}

export const normalizeResidentAppUsageFilter = (value: unknown): ResidentAppUsageFilter => {
    const normalizedValue = typeof value === 'string' ? value.trim().toUpperCase() : ''

    if (normalizedValue === 'USED' || normalizedValue === 'NOT_USED') return normalizedValue

    return 'ALL'
}

export const getResidentAppUsageLabel = (dictionary: ResidentDictionary, value: unknown) => {
    const normalizedValue = typeof value === 'string' ? value.trim().toUpperCase() : ''

    if (normalizedValue === 'ALL') return commonText(dictionary, 'all', 'Tất cả')
    if (normalizeResidentAppUsage(value) === 'USED') return residentText(dictionary, 'filter_app_usage_used', 'Đã sử dụng')
    if (normalizeResidentAppUsage(value) === 'NOT_USED') return residentText(dictionary, 'filter_app_usage_not_used', 'Chưa sử dụng')

    return residentText(dictionary, 'filter_app_usage_unknown', 'Chưa xác định')
}

export const getResidentAppUsageColor = (value: unknown) => (
    normalizeResidentAppUsage(value) === 'USED' ? 'success' : 'default'
)

export const getResidentRoleFilterSelectLabel = (
    dictionary: ResidentDictionary,
    options: Array<{ value: string; label: string }>,
    value: string
) => {
    if (!value) return commonText(dictionary, 'all', 'Tất cả')

    return options.find(option => option.value === value)?.label ?? value
}

export const getResidentRoleLabel = (dictionary: ResidentDictionary, role?: string | null) => {
    if (role === 'OWNER') return residentText(dictionary, 'role_owner', 'Chủ hộ')
    if (role === 'TENANT') return residentText(dictionary, 'role_tenant', 'Người thuê')
    if (role === 'MEMBER') return residentText(dictionary, 'role_member', 'Thành viên')
    if (role === 'REPRESENTATIVE') return residentText(dictionary, 'role_representative', 'Người đại diện')
    if (role === 'FAMILYOWNER') return residentText(dictionary, 'role_representative', 'Gia đình chủ hộ')

    return role || '-'
}

const residentRoleLabels: Record<string, string> = {
    FAMILYOWNER: 'Người Thân Chủ Hộ',
    OFFLINEOWNER: 'Văn Phòng',
    TENANT: 'Khách Thuê',
    OWNER: 'Chủ Hộ'
}

export const getRoleLabel = (
    dictionary: ResidentDictionary,
    member: {
        role?: string | null
        role_caption?: string | null
    }
) => {
    const normalizedRole = member.role?.trim().toUpperCase()

    if (!normalizedRole) return '-'

    return (
        residentRoleLabels[normalizedRole] ??
        member.role_caption ??
        member.role ??
        '-'
    )
}

export const RESIDENT_RELATIONSHIP_CODE_GROUP = 'IPS'
export const RESIDENT_RELATIONSHIP_CODE_NAME = 'RELATIONSHIP_WITH_OWNER'

export const RESIDENT_ROLE_CODE_GROUP = 'IPS'
export const RESIDENT_ROLE_CODE_NAME = 'RESIDENT_ROLE'

export const getResidentRelationShipLabel = (
    relationship: string | null | undefined,
    captionMap: ReadonlyMap<string, string>
) => {
    const originalValue = relationship?.trim()

    if (!originalValue) return '-'

    return (
        captionMap.get(originalValue.toUpperCase()) ||
        originalValue
    )
}

export const getBooleanLabel = (dictionary: ResidentDictionary, value?: boolean) => (
    value === undefined ? '-' : value ? commonText(dictionary, 'yes', 'Có') : commonText(dictionary, 'no', 'Không')
)

export const getMobileAccountLabel = (dictionary: ResidentDictionary, value?: boolean | null) =>
    value ? residentText(dictionary, 'detail_has_mobile_account', 'Có tài khoản') : residentText(dictionary, 'detail_no_mobile_account', 'Chưa có tài khoản')
