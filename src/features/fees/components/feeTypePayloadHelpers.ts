import type { CreateFeeTypeRequest, FeeTypeFormValues, UpdateFeeTypeRequest } from '../types'

type FeeTypeBackendErrorLabels = {
  name: string
  fee_type_code: string
  nameRequired: string
}

type BackendValidationError = Record<string, unknown>

const getText = (value: unknown) => typeof value === 'string' ? value.trim() : ''

const getBackendField = (error: BackendValidationError) => (
  getText(error.field)
  || getText(error.field_name)
  || getText(error.property)
  || getText(error.property_name)
  || getText(error.key)
  || getText(error.member)
)

const getBackendMessage = (error: BackendValidationError) => (
  getText(error.info)
  || getText(error.message)
  || getText(error.description)
  || getText(error.detail)
)

const normalizeField = (field: string) => field.toLowerCase().replace(/[_\-\s]/g, '')

const resolveFormField = (field: string): keyof Pick<FeeTypeFormValues, 'name' | 'fee_type_code'> | null => {
  const normalized = normalizeField(field)

  if (normalized === 'name' || normalized === 'feetypename') return 'name'
  if (normalized === 'feetypecode' || normalized === 'code') return 'fee_type_code'

  return null
}

const isRequiredMessage = (message: string) => /(?:bắt buộc|required)/i.test(message)

const inferFormFieldFromMessage = (message: string) => {
  if (/\b(?:fee[ _-]?type[ _-]?)?name\b/i.test(message)) return 'name' as const
  if (/\b(?:fee[ _-]?type[ _-]?)?code\b/i.test(message)) return 'fee_type_code' as const

  return null
}

const toDisplayMessage = (
  formField: keyof Pick<FeeTypeFormValues, 'name' | 'fee_type_code'>,
  message: string,
  labels: FeeTypeBackendErrorLabels
) => {
  if (formField === 'name' && isRequiredMessage(message)) return labels.nameRequired

  const fieldLabel = formField === 'name' ? labels.name : labels.fee_type_code

  return message.replace(
    formField === 'name' ? /\bfee[ _-]?type[ _-]?name\b|\bname\b/gi : /\bfee[ _-]?type[ _-]?code\b|\bcode\b/gi,
    fieldLabel
  )
}

const buildBasePayload = (values: FeeTypeFormValues) => ({
  name: values.name.trim(),
  group_type: values.group_type,
  document_code: values.document_code.trim(),
  name_translations: JSON.stringify({ vi: values.name.trim(), en: values.name_en.trim() }),
  description_translations: JSON.stringify({ vi: values.description.trim(), en: values.description_en.trim() }),
  default_amount: values.default_amount.trim() === '' ? '' : Number(values.default_amount),
  fee_type_code: values.fee_type_code.trim(),
  description: values.description.trim(),
  unit: values.unit.trim(),
  calculation_method: values.calculation_method
})

export const buildFeeTypeCreatePayload = (values: FeeTypeFormValues): CreateFeeTypeRequest => ({
  project_id: null,
  ...buildBasePayload(values)
})

export const buildFeeTypeUpdatePayload = (values: FeeTypeFormValues, id: number): UpdateFeeTypeRequest => ({
  ...buildBasePayload(values),
  status: values.status,
  id
})

export const mapFeeTypeBackendFieldErrors = (
  errors: unknown[],
  labels: FeeTypeBackendErrorLabels
): Partial<Record<keyof FeeTypeFormValues, string>> => {
  return errors.reduce<Partial<Record<keyof FeeTypeFormValues, string>>>((result, value) => {
    if (!value || typeof value !== 'object') return result

    const error = value as BackendValidationError
    const message = getBackendMessage(error)
    const formField = resolveFormField(getBackendField(error)) ?? inferFormFieldFromMessage(message)

    if (!formField || !message) return result

    const displayMessage = toDisplayMessage(formField, message, labels)
    const existing = result[formField]

    result[formField] = existing && !existing.split('\n').includes(displayMessage)
      ? `${existing}\n${displayMessage}`
      : existing ?? displayMessage

    return result
  }, {})
}

export const mapFeeTypeBackendErrorMessages = (
  errors: unknown[],
  labels: FeeTypeBackendErrorLabels
) => {
  const mappedMessages = errors.flatMap(value => {
    if (!value || typeof value !== 'object') return []

    const error = value as BackendValidationError
    const message = getBackendMessage(error)
    const formField = resolveFormField(getBackendField(error)) ?? inferFormFieldFromMessage(message)

    return message && formField ? [toDisplayMessage(formField, message, labels)] : message ? [message] : []
  })

  return Array.from(new Set(mappedMessages))
}
