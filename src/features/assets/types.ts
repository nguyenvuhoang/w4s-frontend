import type { Locale } from '@/configs/i18n'
import type { getDictionary } from '@/shared/utils/getDictionary'
import type { Session } from 'next-auth'

export type AssetDictionary = Awaited<ReturnType<typeof getDictionary>>

export type AssetPageProps = {
  dictionary: AssetDictionary
  session: Session | null
  locale: Locale
}

export type AssetStatus = 'A' | 'I' | 'B' | 'D' | 'DRAFT' | string

export type AssetItem = {
  id: number | null
  asset_code: string
  project_id: number
  project_code: string
  name: string
  category: string
  location: string | null
  qr_code: string | null
  description: string | null
  purchase_date: string | null
  purchase_value: number | null
  status: AssetStatus
}

export type AssetFilterModel = {
  search_text: string
  project_id: number
  category: string
  status: string
  page_index: number
  page_size: number
}

export type AssetSearchRequest = {
  search_text: string
  project_id: number
  category?: string
  status?: string
  page_index: number
  page_size: number
}

export type AssetDetailRequest = {
  id: number
}

export type UpdateAssetRequest = {
  id: number
  location: string
  category: string
  description: string
  name: string
  asset_code: string
  status: string
  purchase_value: string | number
  purchase_date: string
  qr_code: string
}

export type UpdateAssetResponse = {
  id: number | null
  status: string
}

export type CreateAssetRequest = {
  description: string
  location: string
  project_id: number
  name: string
  asset_code: string
  purchase_value: string | number
  purchase_date: string
  qr_code: string
  category: string
}

export type CreateAssetResponse = {
  id: number | null
  status: string
}

export type DeleteAssetRequest = {
  id: number
}

export type DeleteAssetResponse = {
  id: number | null
  status: string
}

export type AssetFormValues = {
  project_id: string
  asset_code: string
  name: string
  category: string
  location: string
  qr_code: string
  description: string
  purchase_date: string
  purchase_value: string
  status: string
}

export type AssetSearchResponse = {
  items: AssetItem[]
  page_index: number
  page_size: number
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
}

export class AssetWorkflowError extends Error {
  execution_id?: string

  constructor(message: string, execution_id?: string) {
    super(message)

    this.name = 'AssetWorkflowError'
    this.execution_id = execution_id
  }
}

export type AssetProjectOption = {
  id: number
  code: string
  name: string
}
