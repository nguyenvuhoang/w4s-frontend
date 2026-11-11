import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type ProvinceItem = {
  id: number; country_id: string; province_code: string; administrative_code: string; province_name: string
  m_province_name: string; short_name: string; administrative_type: string; region: string; postal_code: string
  phone_area_code: string; is_merged: boolean; merged_into_province_code: string | null; merged_date: string | null
  effective_status: string; status: string; sort_order: number | null; description: string
}

export type ProvinceFilterModel = {
  country_id: string; effective_status: string; administrative_type: string; region: string; search_text: string
  page_index: number; page_size: number; status: string
}

export type ProvinceSearchResponse = { items: ProvinceItem[]; total_count: number; total_pages: number; page_index: number; page_size: number; has_previous_page: boolean; has_next_page: boolean }

export type ProvinceFormModel = Omit<ProvinceItem, 'id' | 'is_merged' | 'sort_order' | 'merged_date'> & { merged_date: string | null; sort_order: string }
export type ProvincesDictionary = Awaited<ReturnType<typeof getDictionary>>
export type ProvincesPageProps = { dictionary: ProvincesDictionary; session: Session | null; locale: Locale }
