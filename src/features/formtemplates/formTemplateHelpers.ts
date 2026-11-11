import type { ChipProps } from '@mui/material/Chip'

import type { LocalizedText } from './formSchema.types'
import type { FormSchemaField, FormSchemaParseResult, FormTemplateDictionary, FormTemplateSearchFilter, FormTemplateVersionStatus } from './types'

export const emptyFormTemplateFilter: FormTemplateSearchFilter = {
  page_size: 10,
  page_index: 0,
  search_text: '',
  project_id: null
}

export const formTemplateText = (dictionary: FormTemplateDictionary, key: string, fallback: string) => (
  (dictionary as any).formTemplateManagement?.[key] ?? fallback
)

export const commonText = (dictionary: FormTemplateDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
}

export const formatNumber = (value: number | null | undefined, locale: string) => {
  if (value === null || value === undefined) return '-'

  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value)
}

export const getFormTemplateStatusLabel = (dictionary: FormTemplateDictionary, status: string) => {
  if (status === 'A') return formTemplateText(dictionary, 'statusA', 'Hoạt động')
  if (status === 'I') return formTemplateText(dictionary, 'statusI', 'Ngưng hoạt động')

  return formTemplateText(dictionary, 'statusUnknown', 'Không xác định')
}

export const getFormTemplateStatusColor = (status: string): ChipProps['color'] => {
  if (status === 'A') return 'success'
  if (status === 'I') return 'default'

  return 'warning'
}

const normalizeSchemaFields = (parsed: unknown): FormSchemaField[] => {
  if (Array.isArray(parsed)) return parsed as FormSchemaField[]

  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>

    if (Array.isArray(record.fields)) return record.fields as FormSchemaField[]
    if (Array.isArray(record.items)) return record.items as FormSchemaField[]

    return Object.entries(record).map(([name, value]) => {
      if (value && typeof value === 'object') return { name, ...(value as Record<string, unknown>) }

      return { name }
    })
  }

  return []
}

export const parseFormSchema = (schemaJson: string | null | undefined): FormSchemaParseResult => {
  if (!schemaJson || !schemaJson.trim()) {
    return { status: 'empty', fields: [] }
  }

  try {
    const parsed = JSON.parse(schemaJson)

    return { status: 'ok', fields: normalizeSchemaFields(parsed) }
  } catch (error) {
    return { status: 'error', fields: [], error: error instanceof Error ? error.message : 'Invalid JSON' }
  }
}

export const getFormTemplateVersionStatusLabel = (dictionary: FormTemplateDictionary, status: FormTemplateVersionStatus | string) => {
  if (status === 'DRAFT') return formTemplateText(dictionary, 'versionStatusDraft', 'Bản nháp')
  if (status === 'PUBLISHED') return formTemplateText(dictionary, 'versionStatusPublished', 'Đã xuất bản')
  if (status === 'ARCHIVED') return formTemplateText(dictionary, 'versionStatusArchived', 'Đã lưu trữ')

  return formTemplateText(dictionary, 'statusUnknown', 'Không xác định')
}

export const getFormTemplateVersionStatusColor = (status: FormTemplateVersionStatus | string): ChipProps['color'] => {
  if (status === 'DRAFT') return 'warning'
  if (status === 'PUBLISHED') return 'success'
  if (status === 'ARCHIVED') return 'default'

  return 'default'
}

/** Field name: snake_case, chỉ a-z/0-9/_. */
export const isValidFieldName = (name: string) => /^[a-z][a-z0-9_]*$/.test(name)

/** Tạo LocalizedText rỗng để khởi tạo component/field mới trong builder. */
export const emptyLocalizedText = (vi = ''): LocalizedText => ({ vi, en: '' })

export const getSchemaSummary = (dictionary: FormTemplateDictionary, schemaJson: string | null | undefined) => {
  const result = parseFormSchema(schemaJson)

  if (result.status === 'empty') {
    return { label: formTemplateText(dictionary, 'schemaNotConfigured', 'Chưa cấu hình'), color: 'default' as ChipProps['color'] }
  }

  if (result.status === 'error') {
    return { label: formTemplateText(dictionary, 'schemaInvalid', 'Schema lỗi'), color: 'error' as ChipProps['color'] }
  }

  const fieldCountLabel = formTemplateText(dictionary, 'schemaFieldCount', '{count} trường').replace('{count}', String(result.fields.length))

  return { label: fieldCountLabel, color: 'success' as ChipProps['color'] }
}
