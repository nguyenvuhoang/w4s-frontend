import { useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'

import type { DataField, FormDataSchema } from '../formSchema.types'
import { buildDemoBindingContext, resolveDefaultValue } from './bindingContext'

const buildInitialValue = (field: DataField, bindingContext: ReturnType<typeof buildDemoBindingContext>): unknown => {
  if (field.type === 'repeater') return []
  if (field.type === 'checkbox') return Boolean(field.default_value ?? false)
  if (field.type === 'time_range') return field.default_value ?? { from: '', to: '' }

  return resolveDefaultValue(bindingContext, field.default_binding, field.default_value)
}

export const buildInitialFormValues = (dataSchema: FormDataSchema, locale: Locale | string, projectName?: string | null) => {
  const bindingContext = buildDemoBindingContext(locale, projectName)

  return Object.fromEntries(dataSchema.fields.map(field => [field.name, buildInitialValue(field, bindingContext)]))
}

/** State giá trị preview (không ghi submission thật) + validate required tối thiểu. */
export const useFormValues = (dataSchema: FormDataSchema, locale: Locale | string, projectName?: string | null) => {
  const initialValues = useMemo(() => buildInitialFormValues(dataSchema, locale, projectName), [dataSchema, locale, projectName])
  const [values, setValues] = useState<Record<string, unknown>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setFieldValue = (name: string, value: unknown) => {
    setValues(current => ({ ...current, [name]: value }))
    setErrors(current => (current[name] ? { ...current, [name]: '' } : current))
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
  }

  const validateRequired = (requiredMessage: string): boolean => {
    const nextErrors: Record<string, string> = {}

    dataSchema.fields.forEach(field => {
      if (!field.required || field.hidden) return

      const value = values[field.name]
      const isEmpty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)

      if (isEmpty) nextErrors[field.name] = requiredMessage
    })

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  return { values, errors, setFieldValue, reset, validateRequired }
}
