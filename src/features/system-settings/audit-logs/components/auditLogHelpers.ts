import type { ChipProps } from '@mui/material/Chip'

import type { AuditLogFilterModel, AuditLogsDictionary } from '../types'

export const emptyAuditLogFilter: AuditLogFilterModel = {
  workflowid: '',
  execution_id: '',
  status: '',
  from_date: null,
  to_date: null,
  page_index: 0,
  page_size: 10
}

export const auditLogText = (locale: string, vi: string, en: string) => (locale === 'vi' ? vi : en)

export const auditLogDictText = (dictionary: AuditLogsDictionary, key: string, fallback: string) => (
  dictionary.audit_logs?.[key] ?? fallback
)

export const toAuditLogListPath = (locale: string) => `/${locale}/system-settings/audit-logs`

export const toAuditLogDetailPath = (locale: string, executionId: string) => (
  `${toAuditLogListPath(locale)}/${encodeURIComponent(executionId)}`
)

export const formatAuditLogDateTime = (value: number | null, locale: string) => {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

export const formatAuditLogDuration = (created_on: number | null, finish_on: number | null) => {
  if (!created_on || !finish_on) return '-'

  const duration = finish_on - created_on

  if (!Number.isFinite(duration) || duration < 0) return '-'
  if (duration < 1000) return `${duration} ms`

  return `${(duration / 1000).toFixed(2)} s`
}

export const getAuditLogStatusMeta = (
  status: number | string | null,
  locale: string
): { label: string; color: ChipProps['color']; variant?: ChipProps['variant'] } => {
  const normalized = String(status ?? '').trim()

  if (normalized === '2') {
    return {
      label: auditLogText(locale, 'Thành công', 'Completed'),
      color: 'success'
    }
  }

  if (normalized === '3') {
    return {
      label: auditLogText(locale, 'Thất bại', 'Failed'),
      color: 'error'
    }
  }

  return {
    label: normalized || '-',
    color: normalized ? 'warning' : 'default',
    variant: 'outlined'
  }
}

export const formatAuditLogBoolean = (value: unknown, locale: string) => {
  if (value === null || value === undefined || value === '') return '-'

  const isTrue = value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
  const isFalse = value === false || value === 0 || value === '0' || value === 'false' || value === 'F' || value === 'N'

  if (isTrue) return auditLogText(locale, 'Có', 'Yes')
  if (isFalse) return auditLogText(locale, 'Không', 'No')

  return String(value)
}
