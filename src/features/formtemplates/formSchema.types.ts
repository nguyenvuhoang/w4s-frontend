/**
 * Form Builder schema types — data_schema / ui_schema / print_schema.
 * Contract chốt theo backend thực tế (không phải bản khảo sát ban đầu).
 */

export type LocalizedText = {
  vi: string
  en?: string
}

export type DataFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'time_range'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'apartment'
  | 'resident'
  | 'repeater'

export type FormFieldOption = {
  value: string
  label: LocalizedText
}

export type FormFieldValidation = {
  min?: number
  max?: number
  min_length?: number
  max_length?: number
  pattern?: string
  email?: boolean
}

/** Allowlist nhị phân — không cho nhập expression/JS tùy ý. */
export type DefaultBindingKey =
  | 'current_user.full_name'
  | 'current_user.phone'
  | 'current_user.identity_number'
  | 'current_resident.id'
  | 'current_apartment.id'
  | 'current_apartment.code'
  | 'current_project.id'
  | 'current_project.name'
  | 'current_datetime'

/** Allowlist cho data_source.source_key — không lưu URL tùy ý. */
export type DataSourceKey =
  | 'project_buildings'
  | 'project_floors'
  | 'project_apartments'
  | 'resident_lookup'
  | 'apartment_lookup'

export type FormDataSource = {
  source_key: DataSourceKey
}

export type DataField = {
  id: string
  name: string
  type: DataFieldType
  label: LocalizedText
  placeholder?: LocalizedText
  help_text?: LocalizedText
  required?: boolean
  read_only?: boolean
  hidden?: boolean
  default_value?: unknown
  default_binding?: DefaultBindingKey | null
  validation?: FormFieldValidation
  options?: FormFieldOption[]
  data_source?: FormDataSource
  /** Chỉ có ý nghĩa khi type === 'repeater'. */
  min_rows?: number
  max_rows?: number
  columns?: DataField[]
}

export type FormDataSchema = {
  schema_version: string
  fields: DataField[]
}

export type UiComponentType =
  | 'heading'
  | 'section'
  | 'field'
  | 'static_text'
  | 'divider'
  | 'spacer'
  | 'page_break'
  | 'repeater'
  | 'signature_block'
  | 'static_html'

export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export type UiComponentBase = {
  id: string
  type: UiComponentType
  align?: TextAlign
}

export type SectionSpacing = 'compact' | 'normal' | 'relaxed'

export type SectionComponent = UiComponentBase & {
  type: 'section'
  title: LocalizedText
  title_align?: TextAlign
  columns: 1 | 2 | 3 | 4
  show_border?: boolean
  show_background?: boolean
  collapsible?: boolean
  spacing?: SectionSpacing
  children: UiComponent[]
}

export type HeadingComponent = UiComponentBase & {
  type: 'heading'
  text: LocalizedText
  level?: 1 | 2 | 3
}

export type FieldComponent = UiComponentBase & {
  type: 'field'
  field_id: string
  column_span: 1 | 2 | 3 | 4
}

export type StaticTextComponent = UiComponentBase & {
  type: 'static_text'
  content: LocalizedText
}

/** Nội dung tĩnh cho phép định dạng cơ bản (đậm/nghiêng/danh sách/bảng...) — luôn sanitize trước khi render, không cho script/event handler. */
export type StaticHtmlComponent = UiComponentBase & {
  type: 'static_html'
  content: LocalizedText
}

export type DividerComponent = UiComponentBase & {
  type: 'divider'
}

export type SpacerComponent = UiComponentBase & {
  type: 'spacer'
  height?: number
}

export type PageBreakComponent = UiComponentBase & {
  type: 'page_break'
}

export type RepeaterComponent = UiComponentBase & {
  type: 'repeater'
  field_id: string
  column_span?: 1 | 2 | 3 | 4
}

export type SignerCode = 'APPLICANT' | 'MANAGEMENT' | 'SECURITY'

export type FormSigner = {
  code: SignerCode
  label: LocalizedText
  allow_e_signature?: boolean
}

export type SignatureBlockComponent = UiComponentBase & {
  type: 'signature_block'
  signers: FormSigner[]
}

export type UiComponent =
  | SectionComponent
  | HeadingComponent
  | FieldComponent
  | StaticTextComponent
  | StaticHtmlComponent
  | DividerComponent
  | SpacerComponent
  | PageBreakComponent
  | RepeaterComponent
  | SignatureBlockComponent

export type FormUiSchema = {
  schema_version: string
  components: UiComponent[]
}

export type PrintPageSize = 'A4'
export type PrintOrientation = 'portrait' | 'landscape'

export type FormPrintSchema = {
  schema_version: string
  page: {
    size: PrintPageSize
    orientation: PrintOrientation
    margin_top_mm: number
    margin_right_mm: number
    margin_bottom_mm: number
    margin_left_mm: number
  }
  header: {
    enabled: boolean
    show_project_logo: boolean
    show_project_name: boolean
    show_form_code: boolean
    show_version: boolean
  }
  footer: {
    enabled: boolean
    show_submission_code: boolean
    show_page_number: boolean
  }
  options: {
    avoid_section_page_break: boolean
    repeat_table_header: boolean
    show_empty_field_border: boolean
    show_qr_code: boolean
  }
}

export type FormTemplateVersionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

/** Item trong danh sách WF_BO_GET_FORM_TEMPLATE_VERSIONS — KHÔNG chứa 3 schema. */
export type FormTemplateVersionSummary = {
  id: number
  template_id: number
  version_no: number
  schema_version: string | null
  status: FormTemplateVersionStatus
  change_note: string | null
  published_by: string | null
  published_on_utc: string | null
  row_version: string | null
}

/** Chi tiết đầy đủ từ WF_BO_GET_FORM_TEMPLATE_VERSION. */
export type FormTemplateVersionDetail = FormTemplateVersionSummary & {
  data_schema: FormDataSchema
  ui_schema: FormUiSchema
  print_schema: FormPrintSchema
}

export const DEFAULT_BINDING_KEYS: DefaultBindingKey[] = [
  'current_user.full_name',
  'current_user.phone',
  'current_user.identity_number',
  'current_resident.id',
  'current_apartment.id',
  'current_apartment.code',
  'current_project.id',
  'current_project.name',
  'current_datetime'
]

export const DATA_SOURCE_KEYS: DataSourceKey[] = [
  'project_buildings',
  'project_floors',
  'project_apartments',
  'resident_lookup',
  'apartment_lookup'
]

export const emptyFormDataSchema = (): FormDataSchema => ({
  schema_version: '1.0',
  fields: []
})

export const emptyFormUiSchema = (): FormUiSchema => ({
  schema_version: '1.0',
  components: []
})

export const defaultFormPrintSchema = (): FormPrintSchema => ({
  schema_version: '1.0',
  page: {
    size: 'A4',
    orientation: 'portrait',
    margin_top_mm: 15,
    margin_right_mm: 15,
    margin_bottom_mm: 18,
    margin_left_mm: 15
  },
  header: {
    enabled: true,
    show_project_logo: true,
    show_project_name: true,
    show_form_code: true,
    show_version: true
  },
  footer: {
    enabled: true,
    show_submission_code: true,
    show_page_number: true
  },
  options: {
    avoid_section_page_break: true,
    repeat_table_header: true,
    show_empty_field_border: true,
    show_qr_code: true
  }
})
