'use client'

import { useState } from 'react'

import type { Locale } from '@/configs/i18n'

import { systemCodeText } from '../components/systemCodeHelpers'
import { systemCodeService } from '../services/systemCodeService'
import type { SystemCodeItem, SystemCodeUpdateRequest, SystemCodesDictionary } from '../types'
import { SystemCodeApiError } from '../types'

export type SystemCodeEditForm = Omit<SystemCodeUpdateRequest, 'm_caption' | 'code_index'> & {
  code_index: string
  m_caption: Record<string, string>
}

export type SystemCodeFieldErrors = Partial<Record<'code_id' | 'code_name' | 'code_group' | 'caption' | 'code_index' | 'code_value' | 'app', string>>

const parseMultilingualCaption = (value: string) => {
  try {
    const parsed = JSON.parse(value || '{}')

    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce<Record<string, string>>((result, [key, item]) => {
        if (typeof item === 'string') result[key] = item

        return result
      }, {})
    }
  } catch {
    // A legacy invalid value should not prevent the user from correcting this record.
  }

  return {}
}

export const toSystemCodeEditForm = (item: SystemCodeItem): SystemCodeEditForm => ({
  id: item.id,
  code_id: item.code_id,
  code_name: item.code_name,
  code_group: item.code_group,
  caption: item.caption,
  m_caption: parseMultilingualCaption(item.m_caption),
  code_index: item.code_index === null ? '' : String(item.code_index),
  code_value: item.code_value,
  ftag: item.ftag,
  visible: item.visible !== false,
  app: item.app || 'IPS'
})

export const useSystemCodeUpdate = ({ dictionary, language, item }: {
  dictionary: SystemCodesDictionary
  language: Locale
  item: SystemCodeItem | null
}) => {
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<SystemCodeFieldErrors>({})

  const validate = (form: SystemCodeEditForm) => {
    const errors: SystemCodeFieldErrors = {}
    const requiredMessage = systemCodeText(dictionary, 'validation_required', 'This field is required.')

    if (!form.code_id.trim()) errors.code_id = requiredMessage
    if (!form.code_name.trim()) errors.code_name = requiredMessage
    if (!form.code_group.trim()) errors.code_group = requiredMessage
    if (!form.caption.trim()) errors.caption = requiredMessage
    if (!form.code_value.trim()) errors.code_value = requiredMessage
    if (!form.app.trim()) errors.app = requiredMessage
    if (form.code_index.trim() === '' || !Number.isFinite(Number(form.code_index))) {
      errors.code_index = systemCodeText(dictionary, 'validation_code_index', 'Order must be a valid number.')
    }

    return errors
  }

  const save = async (form: SystemCodeEditForm) => {
    if (!item || saving) return false

    const normalizedForm = {
      ...form,
      code_id: form.code_id.trim(),
      code_name: form.code_name.trim(),
      code_group: form.code_group.trim(),
      caption: form.caption.trim(),
      code_value: form.code_value.trim(),
      ftag: form.ftag.trim(),
      app: form.app.trim()
    }
    const errors = validate(normalizedForm)

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return false

    const fields: SystemCodeUpdateRequest = {
      id: normalizedForm.id,
      code_id: normalizedForm.code_id,
      code_name: normalizedForm.code_name,
      code_group: normalizedForm.code_group,
      caption: normalizedForm.caption,
      m_caption: JSON.stringify(normalizedForm.m_caption ?? {}),
      code_index: Number(normalizedForm.code_index),
      code_value: normalizedForm.code_value,
      ftag: normalizedForm.ftag,
      visible: Boolean(normalizedForm.visible),
      app: normalizedForm.app
    }

    setSaving(true)

    try {
      await systemCodeService.updateSystemCode({ language, fields })

      return true
    } catch (error) {
      if (error instanceof SystemCodeApiError && error.nextAction === 'logout') {
        window.location.assign(`/${language}/logout`)
      }

      throw error
    } finally {
      setSaving(false)
    }
  }

  return { saving, fieldErrors, setFieldErrors, save }
}
