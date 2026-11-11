import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type PromotionDictionary = Awaited<ReturnType<typeof getDictionary>>

export type PromotionPageProps = {
  dictionary: PromotionDictionary
  session: Session | null
  locale: Locale
}

export type PromotionStatus = 'A' | 'I' | 'B' | 'DRAFT' | string

export type PromotionItem = {
  id: number | string | null
  promotion_code: string
  project_id: number | null
  building_id: number | null
  title: string
  summary: string
  content: string
  image_url: string
  partner_name: string
  voucher_code: string | null
  qr_code_url: string | null
  external_link: string | null
  valid_from: string | null
  valid_to: string | null
  terms: string
  display_order: number | null
  voucher_quantity: number | null
  is_web_view: boolean | null
  status: PromotionStatus
}

export type PromotionFilterModel = {
  page_size: number
  page_index: number
  search_text: string
  project_id: number
}

export type PromotionSearchRequest = {
  page_size: number
  page_index: number
  search_text: string
  project_id: number
}

export type PromotionSearchResponse = {
  items: PromotionItem[]
  total_count: number
  total_pages: number
  page_index: number
  page_size: number
  has_previous_page: boolean
  has_next_page: boolean
}

export type PromotionWorkflowError = {
  message: string
  executionId?: string
}

export type PromotionCreateRequest = {
  display_order: number
  project_id: number
  terms: string
  partner_name: string
  valid_from: string
  valid_to: string
  external_link: string
  image_url: string
  summary: string
  title: string
  promotion_code: string
  qr_code_url: string
  voucher_code: string
  content: string
}

export type PromotionCreateResponse = {
  id: number | string | null
}

/**
 * WF_BO_UPDATE_PROMOTION contract. It carries no project_id/promotion_code. The sample sends ""
 * for unset voucher_quantity/is_web_view, so empty stays "" instead of being coerced to null/0/false.
 */
export type PromotionUpdateRequest = {
  id: number
  title: string
  summary: string
  content: string
  display_order: number
  terms: string
  partner_name: string
  valid_from: string
  valid_to: string
  status: string
  external_link: string
  voucher_quantity: number | ''
  is_web_view: boolean | ''
  image_url: string
  qr_code_url: string
  voucher_code: string
}

export type PromotionDeleteRequest = {
  id: number
}

/** '' means "not set" and is sent back to the update workflow as "". */
export type PromotionWebViewValue = '' | 'true' | 'false'

/** Shared by create and edit. status/voucher_quantity/is_web_view are only submitted on update. */
export type PromotionCreateFormValues = Omit<PromotionCreateRequest, 'project_id' | 'display_order'> & {
  display_order: number | ''
  status: string
  voucher_quantity: string
  is_web_view: PromotionWebViewValue
}
