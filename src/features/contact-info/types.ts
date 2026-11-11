import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type ContactInfoDictionary = Awaited<ReturnType<typeof getDictionary>>

export type ContactInfoPageProps = {
  dictionary: ContactInfoDictionary
  session: Session | null
  locale: Locale
}

export type ContactInfoStatus = 'A' | 'I' | 'B' | 'DRAFT' | string

export type ContactInfoItem = {
  id: number | null
  project_id: number
  project_code?: string | null
  project_name?: string | null
  contact_type: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  working_hours: string | null
  note: string | null
  display_order: number | null
  status: ContactInfoStatus
}

export type ContactInfoFilterModel = {
  search_text: string
  project_id: number | null
  page_index: number
  page_size: number
}

export type ContactInfoSearchRequest = {
  search_text: string
  project_id: number
  page_index: number
  page_size: number
}

export type ContactInfoSearchResponse = {
  items: ContactInfoItem[]
  page_index: number
  page_size: number
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
}

export type ContactInfoProjectOption = {
  id: number
  code: string
  name: string
  status?: string | null
  address?: string | null
}

export type CreateContactInfoFormValues = {
  contact_type: string
  name: string
  phone: string
  email: string
  address: string
  working_hours: string
  note: string
  display_order: string
  status: string
}

export type CreateContactInfoRequest = {
  note: string | null
  project_id: number
  name: string
  display_order: number | null
  address: string | null
  phone: string
  email: string | null
  contact_type: string
  working_hours: string | null
}

export type UpdateContactInfoRequest = {
  id: number
  note: string | null
  phone: string
  name: string
  display_order: number | null
  address: string | null
  status: string
  email: string | null
  contact_type: string
  working_hours: string | null
}
