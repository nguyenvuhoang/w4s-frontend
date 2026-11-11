import type { Locale } from '@/configs/i18n'
import type { Session } from 'next-auth'

import type { getDictionary } from '@/shared/utils/getDictionary'
import type { ProjectSelectorOption } from '@/shared/services/projectLookupService'
import type {
  FormDataSchema,
  FormPrintSchema,
  FormTemplateVersionDetail,
  FormTemplateVersionStatus,
  FormTemplateVersionSummary,
  FormUiSchema
} from './formSchema.types'

export type FormTemplateDictionary = Awaited<ReturnType<typeof getDictionary>>

export type FormTemplatePageProps = {
  dictionary: FormTemplateDictionary
  session: Session | null
  locale: Locale
}

export type FormTemplateProjectOption = ProjectSelectorOption

export type FormTemplateSearchFilter = {
  page_size: number
  page_index: number
  search_text: string
  project_id: number | null
}

export type FormTemplateSearchRequest = {
  page_size: number
  page_index: number
  search_text: string
  project_id: number
}

export type FormTemplateItem = {
  id: number
  form_code: string
  project_id: number
  name: string
  description: string | null
  template_file_url: string | null
  schema_json: string | null
  display_order: number | null
  status: string
}

export type FormTemplateSearchResponse = {
  items: FormTemplateItem[]
  total_count: number
  total_pages: number
  has_previous_page: boolean
  has_next_page: boolean
  page_index: number
  page_size: number
}

export type FormTemplateDetailModel = FormTemplateItem

export type FormSchemaFieldOption = {
  label?: string
  value?: string
}

export type FormSchemaField = {
  name?: string
  type?: string
  label?: string
  placeholder?: string
  required?: boolean
  options?: Array<FormSchemaFieldOption | string>
  default_value?: unknown
}

export type FormSchemaParseResult = {
  status: 'empty' | 'error' | 'ok'
  fields: FormSchemaField[]
  error?: string
}

export type FormTemplateVersionsRequest = {
  template_id: number
}

export type FormTemplateVersionDetailRequest = {
  template_id: number
  version_no: number
}

export type FormTemplateSaveDraftRequest = {
  template_id: number
  version_id: number
  data_schema: FormDataSchema
  ui_schema: FormUiSchema
  print_schema: FormPrintSchema
  change_note: string
}

export type FormTemplatePublishRequest = {
  template_id: number
  version_id: number
}

export type FormTemplateCreateVersionRequest = {
  template_id: number
  /** null/undefined khi tạo version đầu tiên cho template chưa có version nào (khởi tạo từ FormTemplate.schema_json ở backend). */
  source_version_id?: number | null
  change_note: string
}

export type {
  FormDataSchema,
  FormPrintSchema,
  FormTemplateVersionDetail,
  FormTemplateVersionStatus,
  FormTemplateVersionSummary,
  FormUiSchema
}
