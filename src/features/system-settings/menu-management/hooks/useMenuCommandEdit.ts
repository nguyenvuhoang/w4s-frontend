'use client'

import { useState } from 'react'

import type { Locale } from '@/configs/i18n'
import SwalAlert from '@/shared/utils/SwalAlert'

import { menuManagementText } from '../components/menuCommandHelpers'
import { menuCommandService } from '../services/menuCommandService'
import type { MenuCommandItem, MenuCommandUpdateRequest, MenuManagementDictionary } from '../types'

export type MenuCommandEditForm = {
  command_name: string
  command_type: string
  parent_id: string
  display_order: string
  group_menu_icon: string
  command_uri: string
  group_menu_list_authorize_form: string
  workflow_id: string
  group_menu_visible: boolean
  languages: { vi: string; en: string; la: string }
}

export type MenuCommandFieldErrors = Partial<Record<'command_name' | 'command_type' | 'display_order', string>>

const toEditForm = (item: MenuCommandItem): MenuCommandEditForm => ({
  command_name: item.label ?? '',
  command_type: item.command_type ?? 'M',
  parent_id: item.parent_id ?? '',
  display_order: item.display_order !== null ? String(item.display_order) : '',
  group_menu_icon: item.icon ?? '',
  command_uri: item.href ?? '',
  group_menu_list_authorize_form: item.group_menu_list_authorize_form ?? '',
  workflow_id: item.workflow_id ?? '',
  group_menu_visible: item.group_menu_visible === '1',
  languages: {
    vi: item.command_name_language_parsed.vi ?? '',
    en: item.command_name_language_parsed.en ?? '',
    la: item.command_name_language_parsed.la ?? ''
  }
})

type Params = {
  dictionary: MenuManagementDictionary
  sessiontoken?: string
  language: Locale
  item: MenuCommandItem | null
}

export const useMenuCommandEdit = ({ dictionary, sessiontoken, language, item: initialItem }: Params) => {
  const [item, setItem] = useState(initialItem)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<MenuCommandEditForm | null>(initialItem ? toEditForm(initialItem) : null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<MenuCommandFieldErrors>({})

  const startEdit = () => {
    if (!item) return

    setForm(toEditForm(item))
    setFieldErrors({})
    setEditMode(true)
  }

  const cancelEdit = () => {
    setForm(item ? toEditForm(item) : null)
    setFieldErrors({})
    setEditMode(false)
  }

  const updateField = <K extends keyof MenuCommandEditForm>(key: K, value: MenuCommandEditForm[K]) => {
    setForm(current => (current ? { ...current, [key]: value } : current))
    if (key in fieldErrors) setFieldErrors(current => ({ ...current, [key]: undefined }))
  }

  const updateLanguageField = (lang: 'vi' | 'en' | 'la', value: string) => {
    setForm(current => (current ? { ...current, languages: { ...current.languages, [lang]: value } } : current))
  }

  const save = async () => {
    if (!item || !form || saving) return false

    const nextForm: MenuCommandEditForm = {
      ...form,
      command_name: form.command_name.trim(),
      parent_id: form.parent_id.trim(),
      group_menu_icon: form.group_menu_icon.trim(),
      command_uri: form.command_uri.trim(),
      group_menu_list_authorize_form: form.group_menu_list_authorize_form.trim(),
      workflow_id: form.workflow_id.trim()
    }
    const nextErrors: MenuCommandFieldErrors = {}

    if (!nextForm.command_name) {
      nextErrors.command_name = menuManagementText(dictionary, 'validation_command_name_required', 'Tên hệ thống là bắt buộc.')
    }

    if (!nextForm.command_type) {
      nextErrors.command_type = menuManagementText(dictionary, 'validation_command_type_required', 'Loại là bắt buộc.')
    }

    const displayOrderValue = Number(nextForm.display_order)

    if (nextForm.display_order === '' || !Number.isFinite(displayOrderValue)) {
      nextErrors.display_order = menuManagementText(dictionary, 'validation_display_order_invalid', 'Thứ tự phải là số hợp lệ.')
    }

    if (Object.keys(nextErrors).length > 0) {
      setForm(nextForm)
      setFieldErrors(nextErrors)

      return false
    }

    setSaving(true)

    // Backend field names diverge from the detail (GET) response on three fields —
    // label -> command_name, href -> command_uri, icon -> group_menu_icon — easy to mix up,
    // so the mapping is spelled out explicitly here instead of spreading the form as-is.
    const fields: MenuCommandUpdateRequest = {
      application_code: 'BO',
      command_id: item.command_id,
      parent_id: nextForm.parent_id,
      command_name: nextForm.command_name,
      command_name_language: JSON.stringify({
        vi: nextForm.languages.vi.trim(),
        en: nextForm.languages.en.trim(),
        la: nextForm.languages.la.trim()
      }),
      command_type: nextForm.command_type,
      command_uri: nextForm.command_uri,
      // The detail (GET) workflow never returns `enabled` — there is no signal to read an
      // existing value from, and it isn't an editable field in this form, so it's sent as
      // `true` (an active menu item) on every save, matching the sample MODIFY payload.
      enabled: true,
      // `is_visible` mirrors group_menu_visible's checked state so the two visibility flags
      // never disagree (e.g. group_menu_visible: "0" with is_visible: true).
      is_visible: nextForm.group_menu_visible,
      display_order: displayOrderValue,
      group_menu_icon: nextForm.group_menu_icon,
      group_menu_visible: nextForm.group_menu_visible ? '1' : '0',
      group_menu_list_authorize_form: nextForm.group_menu_list_authorize_form,
      workflow_id: nextForm.workflow_id || null
    }

    try {
      await menuCommandService.updateUserCommand({ sessiontoken, language, fields })

      const refreshed = await menuCommandService.getUserCommandById({ sessiontoken, language, commandId: item.command_id })

      if (refreshed.item) {
        setItem(refreshed.item)
        setForm(toEditForm(refreshed.item))
      } else {
        setForm(nextForm)
      }

      setEditMode(false)
      SwalAlert('success', menuManagementText(dictionary, 'update_success', 'Cập nhật Menu / Tính năng thành công'), 'center')

      return true
    } catch (caught) {
      setForm(nextForm)
      SwalAlert(
        'error',
        caught instanceof Error
          ? caught
          : menuManagementText(dictionary, 'update_failed', 'Không thể cập nhật Menu / Tính năng.'),
        'center'
      )

      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    item,
    editMode,
    form,
    saving,
    fieldErrors,
    startEdit,
    cancelEdit,
    updateField,
    updateLanguageField,
    save
  }
}
