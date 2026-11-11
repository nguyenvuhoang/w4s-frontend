import { formatCurrencyAmount } from '@/shared/utils/formatCurrencyAmount'
import { formatDateShort } from '@/shared/utils/formatDateShort'

import type { AssetDictionary, AssetFilterModel, AssetFormValues, AssetItem, AssetStatus } from '../types'

export const defaultAssetProjectId = 1

export const emptyAssetFilter: AssetFilterModel = {
  search_text: '',
  project_id: defaultAssetProjectId,
  category: '',
  status: '',
  page_index: 0,
  page_size: 10
}

export const assetText = (dictionary: AssetDictionary, key: string, fallback: string) => (
  dictionary.assets?.[key] ?? fallback
)

export const commonText = (dictionary: AssetDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const assetCategoryOptions = ['PLUMBING', 'ELECTRICAL', 'HVAC', 'SECURITY', 'FURNITURE', 'OTHER'] as const

export const assetStatusOptions = ['A', 'I', 'B', 'DRAFT'] as const

export const getAssetStatusColor = (status: AssetStatus) => {
  if (status === 'A') return 'success'
  if (status === 'I') return 'default'
  if (status === 'B') return 'error'
  if (status === 'D') return 'error'
  if (status === 'DRAFT') return 'warning'

  return 'info'
}

export const getAssetStatusLabel = (dictionary: AssetDictionary, status: AssetStatus) => {
  if (status === 'A') return assetText(dictionary, 'status_active', 'Active')
  if (status === 'I') return assetText(dictionary, 'status_inactive', 'Inactive')
  if (status === 'B') return assetText(dictionary, 'status_blocked', 'Blocked')
  if (status === 'D') return assetText(dictionary, 'status_deleted', 'Deleted')
  if (status === 'DRAFT') return assetText(dictionary, 'status_draft', 'Draft')

  return status || '-'
}

export const getAssetCategoryLabel = (dictionary: AssetDictionary, category: string) => {
  if (category === 'PLUMBING') return assetText(dictionary, 'category_plumbing', 'Plumbing')
  if (category === 'ELECTRICAL') return assetText(dictionary, 'category_electrical', 'Electrical')
  if (category === 'HVAC') return assetText(dictionary, 'category_hvac', 'HVAC')
  if (category === 'SECURITY') return assetText(dictionary, 'category_security', 'Security')
  if (category === 'FURNITURE') return assetText(dictionary, 'category_furniture', 'Furniture')
  if (category === 'OTHER') return assetText(dictionary, 'category_other', 'Other')

  return category || '-'
}

export const formatAssetDate = (value?: string | null) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return formatDateShort(value)
}

export const formatAssetValue = (value: number | null | undefined, locale: string) => (
  formatCurrencyAmount({ value, locale })
)

export const formatAssetDateInput = (value?: string | null) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const toAssetIsoDate = (value: string) => (
  value ? `${value}T00:00:00Z` : ''
)

export const buildAssetFormValues = (asset: AssetItem): AssetFormValues => ({
  project_id: asset.project_id ? String(asset.project_id) : '',
  asset_code: asset.asset_code || '',
  name: asset.name || '',
  category: asset.category || '',
  location: asset.location || '',
  qr_code: asset.qr_code || '',
  description: asset.description || '',
  purchase_date: formatAssetDateInput(asset.purchase_date),
  purchase_value: asset.purchase_value === null || asset.purchase_value === undefined ? '' : String(asset.purchase_value),
  status: asset.status || 'A'
})

export const buildCreateAssetFormValues = (projectId: number = defaultAssetProjectId): AssetFormValues => ({
  project_id: projectId ? String(projectId) : '',
  asset_code: '',
  name: '',
  category: '',
  location: '',
  qr_code: '',
  description: '',
  purchase_date: '',
  purchase_value: '',
  status: 'A'
})
