import { formTemplateText, isValidFieldName } from '../formTemplateHelpers'
import type { FormTemplateDictionary } from '../types'
import type { DataField, FormDataSchema, FormPrintSchema, FormUiSchema, UiComponent } from '../formSchema.types'

export type ValidationIssueCode =
  | 'FIELD_NAME_INVALID'
  | 'FIELD_NAME_DUPLICATE'
  | 'FIELD_ID_DUPLICATE'
  | 'COMPONENT_ID_DUPLICATE'
  | 'COMPONENT_FIELD_NOT_FOUND'
  | 'SELECT_OPTIONS_MISSING'
  | 'REPEATER_COLUMNS_MISSING'
  | 'REQUIRED_FIELD_LABEL_MISSING'
  | 'SECTION_COLUMNS_INVALID'
  | 'COLUMN_SPAN_INVALID'
  | 'SIGNATURE_NO_SIGNER'
  | 'PRINT_MARGIN_INVALID'

export type ValidationIssue = {
  code: ValidationIssueCode
  targetId?: string
  targetLabel?: string
}

const isValidColumnSpan = (value: unknown): value is 1 | 2 | 3 | 4 => value === 1 || value === 2 || value === 3 || value === 4

const walkUiComponents = (components: UiComponent[], visit: (component: UiComponent) => void) => {
  components.forEach(component => {
    visit(component)
    if (component.type === 'section') walkUiComponents(component.children, visit)
  })
}

const validateDataSchema = (dataSchema: FormDataSchema, issues: ValidationIssue[]) => {
  const seenNames = new Set<string>()
  const seenIds = new Set<string>()

  const visitField = (field: DataField) => {
    if (!isValidFieldName(field.name)) {
      issues.push({ code: 'FIELD_NAME_INVALID', targetId: field.id, targetLabel: field.name })
    } else if (seenNames.has(field.name)) {
      issues.push({ code: 'FIELD_NAME_DUPLICATE', targetId: field.id, targetLabel: field.name })
    } else {
      seenNames.add(field.name)
    }

    if (seenIds.has(field.id)) {
      issues.push({ code: 'FIELD_ID_DUPLICATE', targetId: field.id, targetLabel: field.name })
    } else {
      seenIds.add(field.id)
    }

    if (field.required && !field.label?.vi?.trim()) {
      issues.push({ code: 'REQUIRED_FIELD_LABEL_MISSING', targetId: field.id, targetLabel: field.name })
    }

    if ((field.type === 'select' || field.type === 'radio') && !(field.options?.length) && !field.data_source) {
      issues.push({ code: 'SELECT_OPTIONS_MISSING', targetId: field.id, targetLabel: field.name })
    }

    if (field.type === 'repeater' && !(field.columns?.length)) {
      issues.push({ code: 'REPEATER_COLUMNS_MISSING', targetId: field.id, targetLabel: field.name })
    }

    field.columns?.forEach(visitField)
  }

  dataSchema.fields.forEach(visitField)
}

const validateUiSchema = (uiSchema: FormUiSchema, dataSchema: FormDataSchema, issues: ValidationIssue[]) => {
  const fieldIds = new Set(dataSchema.fields.map(field => field.id))
  const seenComponentIds = new Set<string>()

  walkUiComponents(uiSchema.components, component => {
    if (seenComponentIds.has(component.id)) {
      issues.push({ code: 'COMPONENT_ID_DUPLICATE', targetId: component.id })
    } else {
      seenComponentIds.add(component.id)
    }

    if (component.type === 'section' && !isValidColumnSpan(component.columns)) {
      issues.push({ code: 'SECTION_COLUMNS_INVALID', targetId: component.id, targetLabel: component.title?.vi })
    }

    if ((component.type === 'field' || component.type === 'repeater') && !fieldIds.has(component.field_id)) {
      issues.push({ code: 'COMPONENT_FIELD_NOT_FOUND', targetId: component.id, targetLabel: component.field_id })
    }

    if (component.type === 'field' && !isValidColumnSpan(component.column_span)) {
      issues.push({ code: 'COLUMN_SPAN_INVALID', targetId: component.id })
    }

    if (component.type === 'signature_block' && !(component.signers?.length)) {
      issues.push({ code: 'SIGNATURE_NO_SIGNER', targetId: component.id })
    }
  })
}

const validatePrintSchema = (printSchema: FormPrintSchema, issues: ValidationIssue[]) => {
  const margins = [
    printSchema.page.margin_top_mm,
    printSchema.page.margin_right_mm,
    printSchema.page.margin_bottom_mm,
    printSchema.page.margin_left_mm
  ]

  if (margins.some(margin => !Number.isFinite(margin) || margin < 0 || margin > 50)) {
    issues.push({ code: 'PRINT_MARGIN_INVALID' })
  }
}

export const validateFormDefinition = (
  dataSchema: FormDataSchema,
  uiSchema: FormUiSchema,
  printSchema: FormPrintSchema
): ValidationIssue[] => {
  const issues: ValidationIssue[] = []

  validateDataSchema(dataSchema, issues)
  validateUiSchema(uiSchema, dataSchema, issues)
  validatePrintSchema(printSchema, issues)

  return issues
}

const ISSUE_FALLBACK_TEXT: Record<ValidationIssueCode, string> = {
  FIELD_NAME_INVALID: 'Tên field "{label}" không đúng định dạng snake_case.',
  FIELD_NAME_DUPLICATE: 'Tên field "{label}" bị trùng.',
  FIELD_ID_DUPLICATE: 'ID field bị trùng: {label}.',
  COMPONENT_ID_DUPLICATE: 'ID component bị trùng.',
  COMPONENT_FIELD_NOT_FOUND: 'Component đang tham chiếu field không tồn tại: {label}.',
  SELECT_OPTIONS_MISSING: 'Field "{label}" (select/radio) chưa có options hoặc data source.',
  REPEATER_COLUMNS_MISSING: 'Field lặp "{label}" chưa có cột nào.',
  REQUIRED_FIELD_LABEL_MISSING: 'Field bắt buộc "{label}" chưa có label.',
  SECTION_COLUMNS_INVALID: 'Section "{label}" có số cột không hợp lệ (phải từ 1-4).',
  COLUMN_SPAN_INVALID: 'Column span không hợp lệ (phải từ 1-4).',
  SIGNATURE_NO_SIGNER: 'Khối chữ ký chưa có người ký.',
  PRINT_MARGIN_INVALID: 'Lề bản in không hợp lệ (0-50mm).'
}

export const describeValidationIssue = (dictionary: FormTemplateDictionary, issue: ValidationIssue): string => {
  const template = formTemplateText(dictionary, `validation_${issue.code}`, ISSUE_FALLBACK_TEXT[issue.code])

  return template.replace('{label}', issue.targetLabel ?? issue.targetId ?? '')
}
