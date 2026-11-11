import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type SystemCodesDictionary = Awaited<ReturnType<typeof getDictionary>>

export type SystemCodeFilterModel = {
  search_text: string
  page_index: number
  page_size: number
}

export type SystemCodeSearchRequest = {
  search_text: string
  page_index: number
  page_size: number
}

export type SystemCodeItem = {
  id: number
  code_id: string
  code_name: string
  caption: string
  m_caption: string
  code_group: string
  code_index: number | null
  code_value: string
  ftag: string
  visible: boolean | null
  app: string
}

export type SystemCodeUpdateRequest = {
  id: number
  code_id: string
  code_name: string
  code_group: string
  caption: string
  m_caption: string
  code_index: number
  code_value: string
  ftag: string
  visible: boolean
  app: string
}

export type SystemCodeCreateRequest = Omit<SystemCodeUpdateRequest, 'id'> & {
  page_index: number
  page_size: number
}

export type SystemCodeDeleteRequest = {
  id: number
}

export type SystemCodeSearchResponse = {
  items: SystemCodeItem[]
  total_count: number
  total_pages: number
  page_index: number
  page_size: number
  has_previous_page: boolean
  has_next_page: boolean
}

export type SystemCodesPageProps = {
  dictionary: SystemCodesDictionary
  session: Session | null
  locale: Locale
}

export class SystemCodeApiError extends Error {
  executionId?: string
  nextAction?: string

  constructor(message: string, executionId?: string, nextAction?: string) {
    super(message)
    this.name = 'SystemCodeApiError'
    this.executionId = executionId
    this.nextAction = nextAction
  }
}
