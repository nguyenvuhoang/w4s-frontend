import type { ChipProps } from '@mui/material/Chip'

import type { ApplicationLogFilterModel, ApplicationLogItem, ApplicationLogSearchResponse, ApplicationLogSummary } from '../types'

export const emptyApplicationLogFilter: ApplicationLogFilterModel = {
  correlation_id: '',
  search_text: '',
  from_date: null,
  to_date: null,
  log_level: '',
  service_name: '',
  log_type: '',
  direction: '',
  action_name: '',
  page_index: 0,
  page_size: 10
}

export const applicationLogText = (locale: string, vi: string, en: string) => (locale === 'vi' ? vi : en)

export const toApplicationLogsPath = (locale: string) => `/${locale}/system-settings/application-logs`

export const formatApplicationLogDateTime = (value: string | number | null, locale: string) => {
  if (value === null || value === undefined || value === '') return '-'

  const date = typeof value === 'number' ? new Date(value) : new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  }).format(date)
}

export const formatApplicationLogDuration = (durationMs: number | null) => {
  if (durationMs === null || durationMs === undefined || !Number.isFinite(durationMs)) return '-'
  if (durationMs < 1000) return `${durationMs} ms`

  return `${(durationMs / 1000).toFixed(2)} s`
}

type LogLevelMeta = { label: string; color: ChipProps['color']; dotColor: string }

export const getApplicationLogLevelMeta = (level: string | null, locale: string): LogLevelMeta => {
  const normalized = String(level ?? '').trim().toLowerCase()

  if (normalized === 'error' || normalized === 'critical' || normalized === 'fatal') {
    return { label: applicationLogText(locale, 'Lỗi', 'Error'), color: 'error', dotColor: '#d32f2f' }
  }

  if (normalized === 'warning' || normalized === 'warn') {
    return { label: applicationLogText(locale, 'Cảnh báo', 'Warning'), color: 'warning', dotColor: '#ed6c02' }
  }

  if (normalized === 'information' || normalized === 'info') {
    return { label: applicationLogText(locale, 'Thông tin', 'Information'), color: 'info', dotColor: '#0288d1' }
  }

  if (normalized === 'debug' || normalized === 'trace') {
    return { label: level ?? '-', color: 'default', dotColor: '#9e9e9e' }
  }

  return { label: level || '-', color: 'default', dotColor: '#9e9e9e' }
}

export const isApplicationLogLevelError = (level: string | null) => {
  const normalized = String(level ?? '').trim().toLowerCase()

  return normalized === 'error' || normalized === 'critical' || normalized === 'fatal'
}

export type ApplicationLogDirectionMeta = { label: string; kind: 'in' | 'out' | 'none' }

export const getApplicationLogDirectionMeta = (direction: string | null, locale: string): ApplicationLogDirectionMeta => {
  const normalized = String(direction ?? '').trim().toLowerCase()

  if (normalized === 'in') return { label: applicationLogText(locale, 'Vào', 'In'), kind: 'in' }
  if (normalized === 'out') return { label: applicationLogText(locale, 'Ra', 'Out'), kind: 'out' }

  return { label: '-', kind: 'none' }
}

export const sortApplicationLogsByTimestampAsc = (items: ApplicationLogItem[]) => (
  [...items].sort((a, b) => {
    const timeA = a.log_timestamp ? new Date(a.log_timestamp).getTime() : 0
    const timeB = b.log_timestamp ? new Date(b.log_timestamp).getTime() : 0

    return timeA - timeB
  })
)

export const buildApplicationLogSummary = (response: ApplicationLogSearchResponse): ApplicationLogSummary => {
  const errorCount = response.items.filter(item => isApplicationLogLevelError(item.log_level)).length
  const serviceCount = new Set(
    response.items.map(item => (item.service_name || '').trim()).filter(Boolean)
  ).size
  const totalDurationMs = response.items.reduce((sum, item) => sum + (item.duration ?? 0), 0)

  return {
    totalCount: response.total_count,
    errorCount,
    serviceCount,
    totalDurationMs,
    hasError: errorCount > 0
  }
}

export const findFirstErrorLogId = (items: ApplicationLogItem[]): string | null => {
  const sorted = sortApplicationLogsByTimestampAsc(items)
  const firstError = sorted.find(item => isApplicationLogLevelError(item.log_level))

  return firstError?.id ?? null
}
