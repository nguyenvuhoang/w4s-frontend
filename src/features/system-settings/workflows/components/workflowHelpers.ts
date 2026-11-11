import type { ChipProps } from '@mui/material'

import type { WorkflowFilterModel, WorkflowsDictionary } from '../types'

export const emptyWorkflowFilter: WorkflowFilterModel = {
  search_text: '',
  page_index: 0,
  page_size: 10,
  channel_id: ''
}

export type WorkflowChannelTab = {
  value: string
  labelKey: string
  fallback: string
}

export const workflowChannelTabs: WorkflowChannelTab[] = [
  { value: '', labelKey: 'tab_channel_all', fallback: 'All' },
  { value: 'BO', labelKey: 'tab_channel_bo', fallback: 'Back Office (BO)' },
  { value: 'MB', labelKey: 'tab_channel_mb', fallback: 'Mobile (MB)' }
]

export const workflowText = (dictionary: WorkflowsDictionary, key: string, fallback: string) => (
  dictionary.workflows?.[key] ?? fallback
)

export const commonText = (dictionary: WorkflowsDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const formatWorkflowNumber = (value: number | null, locale: string) => {
  if (value === null || value === undefined) return '-'

  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value)
}

export const getWorkflowStatusMeta = (
  status: string | null,
  dictionary: WorkflowsDictionary
): { label: string; color: ChipProps['color']; variant: ChipProps['variant'] } => {
  const normalized = (status ?? '').trim().toUpperCase()

  if (normalized === 'A') {
    return { label: workflowText(dictionary, 'status_active', 'Active'), color: 'success', variant: 'tonal' }
  }

  if (normalized === 'I') {
    return { label: workflowText(dictionary, 'status_inactive', 'Inactive'), color: 'default', variant: 'outlined' }
  }

  if (normalized === 'B') {
    return { label: workflowText(dictionary, 'status_blocked', 'Blocked'), color: 'error', variant: 'tonal' }
  }

  if (normalized === 'DRAFT') {
    return { label: workflowText(dictionary, 'status_draft', 'Draft'), color: 'warning', variant: 'tonal' }
  }

  if (!normalized) {
    return { label: '-', color: 'default', variant: 'outlined' }
  }

  return { label: normalized, color: 'default', variant: 'outlined' }
}

export const getBooleanLabel = (value: boolean | null, dictionary: WorkflowsDictionary) => {
  if (value === null || value === undefined) return '-'

  return value
    ? workflowText(dictionary, 'boolean_yes', 'Yes')
    : workflowText(dictionary, 'boolean_no', 'No')
}

export const normalizeImportStatus = (status: boolean | string | null | undefined): string | null => {
  if (typeof status === 'boolean') return status ? 'A' : 'I'
  if (typeof status === 'string' && status.trim()) return status.trim()

  return null
}
