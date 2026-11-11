import type { Locale } from '@/configs/i18n'
import type { WorkflowInfo, WorkflowStepInfoList } from '@/shared/types/systemTypes'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type AuditLogsDictionary = Awaited<ReturnType<typeof getDictionary>>

export type AuditLogFilterModel = {
  workflowid: string
  execution_id: string
  status: '' | 2 | 3
  from_date: string | null
  to_date: string | null
  page_index: number
  page_size: number
}

export type AuditLogSearchRequest = {
  pageindex: number
  pagesize: number
  workflowid: string
  execution_id: string
  status: '' | 2 | 3
  from_date: string | null
  to_date: string | null
}

export type AuditLogItem = {
  execution_id: string
  workflow_id: string
  status: number | string | null
  error: string | null
  created_on: number | null
  finish_on: number | null
  is_success: boolean | null
  workflow_type: string | null
  reversed_execution_id: string | null
  reversed_by_execution_id: string | null
}

export type AuditLogSearchResponse = {
  items: AuditLogItem[]
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
  page_index: number
  page_size: number
  total_success?: number
  total_failed?: number
}

export type AuditLogsPageProps = {
  dictionary: AuditLogsDictionary
  session: Session | null
  locale: Locale
}

export type AuditLogDetailRequest = {
  execution_id: string
  pageindex: number
  pagesize: number
}

export type AuditLogDetailResponse = {
  workflow_info: WorkflowInfo | null
  workflow_step_info_list: WorkflowStepInfoList[]
}

export class AuditLogWorkflowError extends Error {
  next_action?: string

  constructor(message: string, next_action?: string) {
    super(message)
    this.name = 'AuditLogWorkflowError'
    this.next_action = next_action
  }
}
