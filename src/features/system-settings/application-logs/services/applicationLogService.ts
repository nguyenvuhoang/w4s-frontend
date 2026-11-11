import type { Locale } from '@/configs/i18n'
const DEFAULT_PAGE_INDEX = 0
const DEFAULT_PAGE_SIZE = 10

import type { ApplicationLogFilterModel, ApplicationLogSearchRequest, ApplicationLogSearchResponse } from '../types'
import { ApplicationLogWorkflowError } from '../types'

const toRequestBody = (filter: ApplicationLogFilterModel): ApplicationLogSearchRequest => ({
  page_index: filter.page_index,
  page_size: filter.page_size,
  search_text: filter.search_text.trim(),
  from_date: filter.from_date,
  to_date: filter.to_date,
  log_level: filter.log_level,
  service_name: filter.service_name.trim(),
  correlation_id: filter.correlation_id.trim(),
  log_type: filter.log_type,
  direction: filter.direction,
  action_name: filter.action_name.trim()
})

export const applicationLogService = {
  getDefaultSearchResponse: (filter?: Partial<ApplicationLogFilterModel>): ApplicationLogSearchResponse => ({
    items: [],
    page_index: filter?.page_index ?? DEFAULT_PAGE_INDEX,
    page_size: filter?.page_size ?? DEFAULT_PAGE_SIZE,
    total_count: 0,
    total_pages: 0,
    total_success: 0,
    total_failed: 0
  }),

  async searchApplicationLogs({
    language,
    filter
  }: {
    language: Locale
    filter: ApplicationLogFilterModel
  }): Promise<ApplicationLogSearchResponse> {
    const response = await fetch(`/api/log/application-logs/advanced-search?lang=${language}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(toRequestBody(filter))
    })

    const json = await response.json().catch(() => ({}))

    if (!response.ok || json?.success === false) {
      throw new ApplicationLogWorkflowError(
        json?.message ?? 'Unable to load application logs.',
        json?.next_action
      )
    }

    return json.data as ApplicationLogSearchResponse
  }
}
