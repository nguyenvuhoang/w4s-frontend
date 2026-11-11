import type { Locale } from '@/configs/i18n'
import type { WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type ReportDictionary = Awaited<ReturnType<typeof getDictionary>>

export type ReportPageProps = {
  dictionary: ReportDictionary
  session: Session | null
  locale: Locale
}

export type ReportWorkflowError = WorkflowErrorDetail

export type ReportItem = {
  id: number | null
  code: string
  name: string
  description: string | null
}

export type ReportFilterModel = {
  search_text: string
  page_index: number
  page_size: number
}

export type ReportSearchRequest = {
  search_text: string
  page_index: number
  page_size: number
}

export type ReportSearchResponse = {
  items: ReportItem[]
  page_index: number
  page_size: number
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
}
