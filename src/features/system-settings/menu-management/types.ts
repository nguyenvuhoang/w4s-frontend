import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type MenuManagementDictionary = Awaited<ReturnType<typeof getDictionary>>

export type MenuCommandFilterModel = {
  search_text: string
  page_index: number
  page_size: number
}

export type MenuCommandSearchRequest = {
  search_text: string
  page_index: number
  page_size: number
}

export type MenuCommandNameLanguage = Partial<Record<'vi' | 'en' | 'la', string>>

export type MenuCommandItem = {
  parent_id: string | null
  command_id: string
  label: string
  command_type: string | null
  href: string | null
  role_id: string | number | null
  role_name: string | null
  invoke: unknown
  approve: unknown
  icon: string | null
  group_menu_visible: string | null
  prefix: string | null
  group_menu_list_authorize_form: string | null
  command_name_language: string | null
  command_name_language_parsed: MenuCommandNameLanguage
  group_menu_id: string | null
  display_order: number | null
  is_agreement: unknown
  children: unknown[] | null
  action_code: string | null
  workflow_id: string | null
}

export type MenuCommandSearchResponse = {
  items: MenuCommandItem[]
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
  page_index: number
  page_size: number
}

export type MenuCommandDetailResponse = {
  item: MenuCommandItem | null
}

export type MenuCommandUpdateRequest = {
  application_code: 'BO'
  command_id: string
  parent_id: string
  command_name: string
  command_name_language: string
  command_type: string
  command_uri: string
  enabled: boolean
  is_visible: boolean
  display_order: number
  group_menu_icon: string
  group_menu_visible: string
  group_menu_list_authorize_form: string
  workflow_id: string | null
}

// WF_BO_CREATE_MENU expects the exact same field set as WF_BO_MODIFY_MENU.
export type MenuCommandCreateRequest = MenuCommandUpdateRequest

export type MenuCommandWorkflowErrorInfo = {
  message: string
  workflowStep?: string
  executionId?: string
  technicalDetails?: string
}

export type MenuManagementPageProps = {
  dictionary: MenuManagementDictionary
  session: Session | null
  locale: Locale
}
