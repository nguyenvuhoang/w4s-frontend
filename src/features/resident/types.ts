import { Locale } from '@/configs/i18n'
import type { ApartmentLookupOption } from '@/shared/services/apartmentLookupService'
import { PageContentProps } from '@/shared/types'
import type { EntityAuditItem } from '@/shared/types/entityAudit'
import { getDictionary } from '@/shared/utils/getDictionary'
import { Session } from 'next-auth'

export type ResidentPageProps = PageContentProps & {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session: Session | null
    locale: Locale
}

export type ContractType = 'OWNER' | 'TENANT' | 'TRANSFER' | 'OTHER'
export type UnitStatus = 'HANDED_OVER' | 'NOT_HANDED_OVER' | 'OCCUPIED' | 'VACANT' | ''
export type ResidentRole = string
export type ResidentRelationshipCode =
    | 'OWNER'
    | 'SPOUSE'
    | 'CHILD'
    | 'PARENT'
    | 'SIBLING'
    | 'RELATIVE'
    | 'TENANT'
    | 'AUTHORIZED_REPRESENTATIVE'
    | 'OCCUPANT'
    | 'OTHER'
    | ''
export type Gender = 'M' | 'F' | 'O' | ''

export type ResidentListStatus = 'A' | 'I' | 'L'

export type ResidentSearchRole = string

export type ResidentApartmentItem = {
    resident_apartment_id: number | null
    apartment_id: number
    apartment_code: string
    role: ResidentRole
    is_representative: boolean
    status: ResidentListStatus | string
}

export type ResidentModel = {
    id: number
    resident_code: string
    user_code: string | null
    app_usage: ResidentAppUsage
    full_name: string
    gender: Gender
    date_of_birth: string | null
    phone: string
    email: string
    avatar_url: string | null
    identity_number: string | null
    apartment_count: number
    apartments: ResidentApartmentItem[]
    status: ResidentListStatus
    created_on_utc: string
    updated_on_utc: string
}

export type ResidentAppUsage = 'USED' | 'NOT_USED' | 'UNKNOWN'
export type ResidentAppUsageFilter = 'ALL' | Exclude<ResidentAppUsage, 'UNKNOWN'>

export type ResidentFilterModel = {
    keyword: string
    status: ResidentListStatus | 'ALL'
    gender: Gender | 'ALL'
    role: ResidentSearchRole
    app_usage: ResidentAppUsageFilter
    project_id: number | null
    building_id: number | ''
    page_index: number
    page_size: number
}

export type ResidentListResponse = {
    items: ResidentModel[]
    page_index: number
    page_size: number
    total_items: number
    total_pages: number
}

export type ResidentPayload = Omit<ResidentModel, 'id' | 'app_usage' | 'created_on_utc' | 'updated_on_utc' | 'apartment_count' | 'apartments'> & {
    nationality: string
    nationality_country_id: string
    description: string
}

export type ResidentUpdateOwnerPayload = Omit<ResidentPayload, 'nationality_country_id'>

export type ResidentUpdateProfileRequest = {
    id: number
    resident_code: string
    user_code: string
    owner: ResidentUpdateOwnerPayload
    nationality: string
    description: string
    app_account?: Pick<ResidentAppAccountPayload, 'username'>
}

export type ResidentDeleteRequest = {
    id: number
}

export type ResidentProjectOption = {
    id: number
    project_code: string
    name: string
    address: string
    description: string
    logo_url: string | null
    status: string
}

export type ResidentSearchRequest = {
    page_size: number
    page_index: number
    search_text: string
    project_id: number
    role: string
    resident_status: string
    building_id: number | ''
    has_user_code: boolean | null
}

export type ResidentAccount = {
    channel_id: string | null
    user_id: string | null
    user_name: string | null
    user_code: string | null
    login_name: string | null
    contract_number: string | null
    first_name: string | null
    middle_name: string | null
    last_name: string | null
    role_channel: string | null
    gender: number | null
    address: string | null
    email: string | null
    birthday: string | null
    phone: string | null
    status: string | null
    last_login_time: string | null
    is_login: boolean
    expire_time: string | null
    branch_id: string | null
    branch_code: string | null
    department_code: string | null
    user_level: number | null
    user_type: string | null
    is_show: string | null
    policy_id: number | null
    uuid: string | null
    failnumber: number | null
    is_super_admin: boolean
    is_biometric_supported: boolean
    locked_until: string | null
    notification_type: string | null
    is_first_login: boolean
    currency_code: string | null
    id: number | null
    created_on_utc: string | null
    updated_on_utc: string | null
}

export type ResidentDetail = {
    id: number
    resident_code: string
    user_code: string | null
    full_name: string
    gender: string | null
    date_of_birth: string | null
    phone: string | null
    email: string | null
    avatar_url: string | null
    identity_number: string | null
    nationality: string | null
    description: string | null
    status: string
    account: ResidentAccount | null
}

export type ResidentAuditItem = EntityAuditItem

export type ResidentContextGeneral = {
    resident_id: number
    resident_code: string
    user_code: string | null
    full_name: string
    gender: string | null
    date_of_birth: string | null
    phone: string | null
    email: string | null
    avatar_url: string | null
    identity_number: string | null
    has_mobile_account: boolean
}

export type ResidentContextMember = {
    resident_id: number
    resident_code: string
    full_name: string
    avatar_url: string | null
    role: string
    role_caption: string | null
    is_representative: boolean
    is_location: boolean
    relationship_with_owner: string | null
    has_mobile_account: boolean
    gender: string | null
    date_of_birth: string | null
    phone: string | null
    email: string | null
    identity_number: string | null
    effective_from: string | null
    effective_to: string | null
}

export type ResidentHouseholdContext = {
    apartment_id: number
    apartment_code: string
    project_code: string
    building_code: string
    owner: ResidentContextMember | null
    members: ResidentContextMember[]
}

export type ResidentContext = {
    general: ResidentContextGeneral | null
    households: ResidentHouseholdContext[]
}

export type ResidentProfileFormValues = {
    fullName: string
    phoneNumber: string
    email: string
    nationality: string
    nationalityCountryId: string
    description: string
    gender: Gender
    dateOfBirth: string
    identityNo: string
    apartmentProjectCode: string
    apartmentProjectId: string
    apartmentProjectLabel: string
    apartmentCode: string
    apartmentType: string
    apartmentTypeLabel: string
    electricMeterCode: string
    waterMeterCode: string
    residentRole: ResidentRole
    residentRoleLabel: string
    apartmentRelationship: string
    apartmentRelationshipLabel: string
    moveInDate: string
    username: string
    password: string
}

export type ResidentApartmentFormValue = {
    id: string
    projectCode: string
    apartmentCode: string
    apartmentType: string
    apartmentTypeLabel?: string
    electricMeterCode: string
    waterMeterCode: string
    hasOwner: boolean
    residentRole: ResidentRole
    residentRoleLabel?: string
    apartmentRelationship: string
    apartmentRelationshipLabel?: string
    moveInDate: string
    selectedApartment: ApartmentLookupOption | null
}

export type ResidentOwnerPayload = {
    full_name: string
    phone_number: string
    email: string
    nationality: string
    description: string
    gender: Gender
    date_of_birth: string
    identity_no: string
}

export type ResidentApartmentPayload = {
    project_code: string
    apartment_code: string
    apartment_type: string
    electric_meter_code: string
    water_meter_code: string
    resident_role: ResidentRole
    apartment_relationship: string
    move_in_date: string
}

export type ResidentAppAccountPayload = {
    username: string
    password: string
}

export type CreatedResidentActivation = {
    activation_code: string
    username: string
    password: string
}

export type ProjectSearchFields = {
    search_text: string
    page_index?: number
    page_size?: number
}

export type ApartmentLookupFields = {
    project_id: number
    page_index: number
    page_size: number
}

export type HierarchyOption<TRaw = any> = {
    label: string
    value: string
    projectId?: number
    status?: string
    apartmentType?: string
    apartmentTypeLabel?: string
    electricMeterCode?: string
    hasOwner?: boolean
    raw: TRaw
}

export type ApartmentSearchFilter = {
    apartment_code: string
    apartment_type: string
}

export type ProjectSearchFilter = {
    search_text: string
}

export type CreateResidentProfileRequest = {
    owner: ResidentOwnerPayload
    apartments: ResidentApartmentPayload[]
    app_account: ResidentAppAccountPayload
    policy_id: number
    nationality: string
    description: string
}

export type ResidentImportValidationRow = {
    row_number: number
    status: 'VALID' | 'INVALID' | string
    full_name: string | null
    phone_number: string | null
    email: string | null
    identity_no: string | null
    date_of_birth: string | null
    gender: string | null
    apartment_code: string | null
    relationship_type: string | null
    is_owner: string | null
    move_in_date: string | null
    note: string | null
    errors: string[]
}

export type ResidentAddApartmentPayload = {
    resident_id: number
    project_id: number
    apartment_id: number
    role: ResidentRole
    status: ResidentListStatus
}

export type ResidentAddMemberContext = {
    apartment_id: number
    apartment_code: string
    project_code: string
    building_code: string
}

export type ResidentAddHouseholdMemberPayload = {
    apartment_id: number
    full_name: string
    phone: string
    email: string
    gender: Gender
    date_of_birth: string
    identity_number: string
    role: ResidentRole
    relationship_with_owner: ResidentRelationshipCode
}

export type ResidentImportValidationSummary = {
    batch_id: number
    file_name: string
    total_rows: number
    valid_rows: number
    error_rows: number
    rows: ResidentImportValidationRow[]
}

export type ResidentImportRequestItem = {
    full_name: string | undefined
    gender: string | null
    date_of_birth: string | null
    phone: string | null
    email: string | null
    identity_number: string | null
    apartment_code: string | undefined
    role: 'OWNER' | 'RESIDENT' | 'OWNER' | 'TENANT' | 'FAMILY' | 'AUTH_REP' | 'FAMILYOWNER' | 'FamilyTenant' | 'OFFLINEOWNER' | 'RENTER'
    relationship_with_owner: string | null
    is_location: boolean
    is_representative: boolean
    effective_from: string | null
    effective_to: string | null
}

export const DEFAULT_RESIDENT_PROFILE_FORM_VALUES: ResidentProfileFormValues = {
    fullName: '',
    phoneNumber: '',
    email: '',
    nationality: '',
    nationalityCountryId: '',
    description: '',
    gender: '',
    dateOfBirth: '',
    identityNo: '',
    apartmentProjectCode: '',
    apartmentProjectId: '',
    apartmentProjectLabel: '',
    apartmentCode: '',
    apartmentType: '',
    apartmentTypeLabel: '',
    electricMeterCode: '',
    waterMeterCode: '',
    residentRole: '',
    residentRoleLabel: '',
    apartmentRelationship: '',
    apartmentRelationshipLabel: '',
    moveInDate: '',
    username: '',
    password: ''
}
