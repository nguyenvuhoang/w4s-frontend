import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type ApplicationLogsDictionary = Awaited<ReturnType<typeof getDictionary>>

export type ApplicationLogFilterModel = {
  correlation_id: string
  search_text: string
  from_date: string | null
  to_date: string | null
  log_level: string
  service_name: string
  log_type: string
  direction: string
  action_name: string
  page_index: number
  page_size: number
}

export type ApplicationLogSearchRequest = {
  page_index: number
  page_size: number
  search_text: string
  from_date: string | null
  to_date: string | null
  log_level: string
  service_name: string
  correlation_id: string
  log_type: string
  direction: string
  action_name: string
}

export type ApplicationLogItem = {
  id: string
  correlation_id: string | null
  execution_id: string | null
  log_timestamp: string | number | null
  log_level: string | null
  log_type: string | null
  service_name: string | null
  direction: string | null
  flow: string | null
  action_name: string | null
  duration: number | null
  message: string | null
  headers: unknown
  request: unknown
  response: unknown
  exception_details: unknown
  properties: unknown
}

export type ApplicationLogSearchResponse = {
  items: ApplicationLogItem[]
  page_index: number
  page_size: number
  total_count: number
  total_pages: number
  total_success?: number
  total_failed?: number
}

export type ApplicationLogsPageProps = {
  dictionary: ApplicationLogsDictionary
  session: Session | null
  locale: Locale
}

export type ApplicationLogSummary = {
  totalCount: number
  errorCount: number
  serviceCount: number
  totalDurationMs: number
  hasError: boolean
}

export class ApplicationLogWorkflowError extends Error {
  next_action?: string

  constructor(message: string, next_action?: string) {
    super(message)
    this.name = 'ApplicationLogWorkflowError'
    this.next_action = next_action
  }
}
