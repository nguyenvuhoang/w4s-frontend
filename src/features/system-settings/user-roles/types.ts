import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type UserRolesDictionary = Awaited<ReturnType<typeof getDictionary>>

export type UserRoleFilterModel = {
  search_text: string
  channel_code: 'BO'
  page_index: number
  page_size: number
}

export type UserRoleSearchRequest = {
  page_size: number
  page_index: number
  search_text: string
  channel_code: 'BO'
}

export type UserRoleItem = {
  id: number
  role_id: number
  role_name: string
  role_description: string | null
  user_type: string | null
  contract_no: string | null
  user_created: string | null
  date_created: string | null
  user_modified: string | null
  date_modified: string | null
  service_id: number | string | null
  role_type: string | null
  status: string | null
  is_show: string | null
  sort_order: number | null
  rights: UserRolePermissionItem[]
}

export type UserRolePermissionItem = {
  command_id: string
  parent_id: string | null
  command_type: 'M' | 'C' | string
  /** Backend-localized display text for the active request `lang` (rendered directly). */
  label: string | null
  invoke: boolean
  approve: boolean
  command_uri: string | null
  icon: string | null
  display_order: number | null
}

export type UserRoleSearchResponse = {
  items: UserRoleItem[]
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
  page_index: number
  page_size: number
}

export type UserRoleDetailResponse = {
  role: UserRoleItem | null
}

export type UserRoleUpdateRequest = {
  role_id: number
  role_name: string
  role_description: string
  role_type: string
  service_id: string
  status: string
  is_show: 'Y' | 'N'
  sort_order: number
}

export type UserRoleCreateRequest = {
  role_name: string
  role_type: string
  service_id: string
  role_description: string
}

export type UserRoleRightItem = {
  RoleId: number
  CommandId: string
  CommandIdDetail: string
  Invoke: boolean
  Approve: boolean
  ChannelId: string
}

export type UserRoleWorkflowErrorInfo = {
  message: string
  workflowStep?: string
  executionId?: string
  technicalDetails?: string
}

export type UserRolesPageProps = {
  dictionary: UserRolesDictionary
  session: Session | null
  locale: Locale
}
