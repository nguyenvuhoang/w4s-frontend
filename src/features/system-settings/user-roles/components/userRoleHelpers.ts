import type { UserRoleFilterModel, UserRolesDictionary } from '../types'

export const USER_ROLE_SEARCH_WORKFLOW_ID = 'WF_BO_SEARCH_USER_ROLE'
export const USER_ROLE_DETAIL_WORKFLOW_ID = 'WF_BO_GET_USER_ROLE_BY_ID'
export const USER_ROLE_UPDATE_WORKFLOW_ID = 'WF_BO_UPDATE_USER_ROLE_PROFILE'
export const USER_ROLE_CREATE_WORKFLOW_ID = 'WF_BO_CREATE_USER_ROLE'
export const USER_ROLE_DELETE_WORKFLOW_ID = 'WF_BO_DELETE_USER_ROLE'

export const USER_ROLE_SERVICE_OPTIONS = ['BO', 'MB']

export const USER_ROLE_TYPE_OPTIONS: { value: string; labelKey: string; fallback: string }[] = [
  { value: 'MB', labelKey: 'role_type_mb', fallback: 'Mobile Banking' },
  { value: 'USER', labelKey: 'role_type_user', fallback: 'Người dùng' },
  { value: 'EDIT_DELETE_RESIDENT', labelKey: 'role_type_edit_delete_resident', fallback: 'Chỉnh sửa / Xóa cư dân' },
  { value: 'KTTN', labelKey: 'role_type_kttn', fallback: 'Kế toán trưởng' },
  { value: 'HSO_KẾ TOÁN', labelKey: 'role_type_hso_ke_toan', fallback: 'HSO - Kế toán' },
  { value: 'BQL_HÀNH CHÍNH', labelKey: 'role_type_bql_hanh_chinh', fallback: 'BQL - Hành chính' },
  { value: 'TEST', labelKey: 'role_type_test', fallback: 'Kiểm thử' },
  { value: 'ADMIN', labelKey: 'role_type_admin', fallback: 'Quản trị viên' },
  { value: 'STANDARD', labelKey: 'role_type_standard', fallback: 'Người dùng tiêu chuẩn' },
  { value: 'BQL_TECHNICAL', labelKey: 'role_type_bql_technical', fallback: 'BQL - Kỹ thuật' },
  { value: 'BQL_SECRETARY', labelKey: 'role_type_bql_secretary', fallback: 'BQL - Thư ký' },
  { value: 'BQL_ACCOUNTANT', labelKey: 'role_type_bql_accountant', fallback: 'BQL - Kế toán' },
  { value: 'BQL_RECEPTIONIST', labelKey: 'role_type_bql_receptionist', fallback: 'BQL - Lễ tân' },
  { value: 'BQL_CHIEF_ENGINEER', labelKey: 'role_type_bql_chief_engineer', fallback: 'BQL - Kỹ sư trưởng' },
  { value: 'BQL_PM_APM', labelKey: 'role_type_bql_pm_apm', fallback: 'BQL - Trưởng / Phó Ban Quản lý' },
  { value: 'HSO_BUSINESS', labelKey: 'role_type_hso_business', fallback: 'HSO - Kinh doanh' },
  { value: 'HSO_OPERATION', labelKey: 'role_type_hso_operation', fallback: 'HSO - Vận hành' },
  { value: 'SALE_LEASE', labelKey: 'role_type_sale_lease', fallback: 'Kinh doanh / Cho thuê' },
  { value: 'SYSTEM_BUILDING_TECHNICIAN', labelKey: 'role_type_system_building_technician', fallback: 'Kỹ thuật viên tòa nhà' }
]

export const getUserRoleTypeLabel = (dictionary: UserRolesDictionary, value?: string | null) => {
  const option = USER_ROLE_TYPE_OPTIONS.find(item => item.value === value)

  if (option) return userRoleText(dictionary, option.labelKey, option.fallback)

  return displayValue(value)
}

export const emptyUserRoleFilter: UserRoleFilterModel = {
  search_text: '',
  channel_code: 'BO',
  page_index: 1,
  page_size: 10
}

export const userRoleText = (dictionary: UserRolesDictionary, key: string, fallback: string) => (
  dictionary.user_roles?.[key] ?? fallback
)

export const commonText = (dictionary: UserRolesDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const formatUserRoleDateTime = (value?: string | null) => {
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

export const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
}

type UserRoleApplicationMeta = {
  label: string
  icon: 'mobile' | 'backOffice'
}

export const getUserRoleApplicationMeta = (
  dictionary: UserRolesDictionary,
  value: unknown
): UserRoleApplicationMeta | null => {
  const code = String(value ?? '').trim().toUpperCase()

  if (code === 'MB') {
    return { label: userRoleText(dictionary, 'application_mobile', 'Mobile Application'), icon: 'mobile' }
  }

  if (code === 'BO') {
    return { label: userRoleText(dictionary, 'application_back_office', 'Back Office Management'), icon: 'backOffice' }
  }

  return null
}

export const getUserRoleApplicationDisplayName = (dictionary: UserRolesDictionary, value: unknown) => (
  getUserRoleApplicationMeta(dictionary, value)?.label ?? displayValue(value)
)

export const getUserRoleStatusColor = (status?: string | null) => {
  if (status === 'A') return 'success'
  if (status === 'B') return 'warning'
  if (status === 'I') return 'default'

  return 'default'
}

export const getUserRoleStatusLabel = (dictionary: UserRolesDictionary, status?: string | null) => {
  if (status === 'A') return userRoleText(dictionary, 'status_active', 'Active')
  if (status === 'I') return userRoleText(dictionary, 'status_inactive', 'Inactive')
  if (status === 'B') return userRoleText(dictionary, 'status_blocked', 'Blocked')
  if (status === 'DRAFT') return userRoleText(dictionary, 'status_draft', 'Draft')

  return displayValue(status)
}

export const getUserRoleShowLabel = (dictionary: UserRolesDictionary, value?: string | null) => (
  value === 'Y'
    ? userRoleText(dictionary, 'boolean_yes', 'Yes')
    : userRoleText(dictionary, 'boolean_no', 'No')
)

export const toUserRolesPath = (locale: string) => `/${locale}/system-settings/user-roles`

export const toUserRoleDetailPath = (locale: string, roleId: number) => (
  `/${locale}/system-settings/user-roles/${roleId}`
)

export const toUserRoleCreatePath = (locale: string) => `/${locale}/system-settings/user-roles/create`
