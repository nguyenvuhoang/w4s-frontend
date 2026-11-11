import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type PartnerDictionary = Awaited<ReturnType<typeof getDictionary>>

export type PartnerPageProps = {
  dictionary: PartnerDictionary
  session: Session | null
  locale: Locale
}

export type PartnerStatus = 'ACTIVE' | 'INACTIVE' | string

export type PartnerItem = {
  id: number | string | null
  partner_code: string
  partner_name: string
  contact_name: string
  phone: string
  email: string
  address: string
  status: PartnerStatus
}

export type PartnerFilterModel = {
  page_size: number
  /** UI page, which is always one-based. */
  page_index: number
  search_text: string
}

export type PartnerSearchRequest = {
  page_size: number
  /** Workflow page, which is zero-based. */
  page_index: number
  search_text: string
}

export type PartnerDetailRequest = {
  id: number
}

export type PartnerUpdateRequest = {
  id: number
  partner_name: string
  contact_name: string
  phone: string
  email: string
  address: string
  status: 'ACTIVE' | 'INACTIVE'
}

export type PartnerDeleteRequest = {
  id: number
}

/** WF_BO_CREATE_PARTNER contract. Status is not part of create. */
export type PartnerCreateRequest = {
  partner_code: string
  partner_name: string
  contact_name: string
  phone: string
  email: string
  address: string
}

export type PartnerCreateFormValues = PartnerCreateRequest

export type PartnerFormValues = Omit<PartnerUpdateRequest, 'id'>

export type PartnerSearchResponse = {
  items: PartnerItem[]
  total_count: number
  total_pages: number
  /** UI page, which is always one-based. */
  page_index: number
  page_size: number
}

export type PartnerWorkflowError = {
  message: string
  executionId?: string
}
