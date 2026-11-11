import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { ProjectSelectorOption } from '@/shared/services/projectLookupService'
import type { Session } from 'next-auth'

export type BannerDictionary = Awaited<ReturnType<typeof getDictionary>>

export type BannerPageProps = {
  dictionary: BannerDictionary
  session: Session | null
  locale: Locale
}

export type BannerStatus = 'A' | 'I' | 'B' | 'DRAFT' | string

export type BannerItem = {
  id: number | string | null
  image_url: string
  title: string
  project_code: string
  project_name: string
  project_id: number | null
  banner_type: string
  action_type: string
  link_url: string | null
  effective_from: string | null
  effective_to: string | null
  display_order: number | null
  status: BannerStatus
}

export type BannerDetailRequest = {
  id: number
}

export type BannerDeleteRequest = {
  id: number
}

export type BannerDeleteResponse = {
  id: number | null
  status: string
}

export type BannerUpdateRequest = {
  id: number
  title: string
  image_url: string
  link_url: string | null
  banner_type: string
  valid_from: string
  valid_to: string
  display_order: number | null
  status: string
}

export type BannerUpdateResponse = {
  id: number | null
  status: string
}

export type BannerFilterModel = {
  page_size: number
  page_index: number
  search_text: string
  project_id: number
}

export type BannerSearchRequest = {
  page_size: number
  page_index: number
  search_text: string
  project_id: number
}

export type BannerSearchResponse = {
  items: BannerItem[]
  total_count: number
  total_pages: number
  page_index: number
  page_size: number
  has_previous_page: boolean
  has_next_page: boolean
}

export type BannerProjectOption = ProjectSelectorOption

export type BannerUpdateFormValues = {
  title: string
  image_url: string
  link_url: string
  banner_type: string
  valid_from: string
  valid_to: string
  display_order: string | number
  status: string
}

export type BannerCreateRequest = {
  project_id: number
  title: string
  image_url: string
  link_url: string | null
  banner_type: string
  valid_from: string
  valid_to: string
  display_order: number | null
}

export type BannerCreateResponse = {
  id: number | null
  status: string
}

export type BannerCreateFormValues = {
  project_id: string | number
  title: string
  image_url: string
  link_url: string
  banner_type: string
  valid_from: string
  valid_to: string
  display_order: string | number
}
