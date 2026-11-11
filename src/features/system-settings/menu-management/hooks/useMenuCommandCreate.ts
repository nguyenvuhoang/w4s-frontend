'use client'

import { useEffect, useRef, useState } from 'react'

import { useRouter } from '@shared/hooks/useRouter'

import type { Locale } from '@/configs/i18n'
import { isVietnameseText, translateText } from '@/shared/services/translateService'
import { WorkflowError } from '@/shared/utils/workflowError'
import SwalAlert from '@/shared/utils/SwalAlert'

import {
  commonText,
  computeNextCommandId,
  computeNextDisplayOrder,
  isMenuCommandIdTaken,
  menuManagementText,
  toMenuCommandDetailPath
} from '../components/menuCommandHelpers'
import { menuCommandService } from '../services/menuCommandService'
import type { MenuCommandCreateRequest, MenuCommandItem, MenuManagementDictionary } from '../types'

// Auto-translate waits for the user to stop typing "Tên hệ thống" for this long before firing —
// keeps every keystroke from triggering a translate call. A blur on the field flushes it early.
const TRANSLATE_DEBOUNCE_MS = 700

type NameLanguageKey = 'vi' | 'en'

export type MenuCommandCreateForm = {
  command_id: string
  command_name: string
  command_type: string
  parent_id: string
  display_order: string
  group_menu_icon: string
  command_uri: string
  group_menu_visible: boolean
  enabled: boolean
  group_menu_list_authorize_form: string
  workflow_id: string
  languages: { vi: string; en: string }
}

export type MenuCommandCreateFieldErrors = Partial<
  Record<'command_id' | 'command_name' | 'command_type' | 'parent_id' | 'display_order', string>
>

const emptyCreateForm: MenuCommandCreateForm = {
  command_id: '',
  command_name: '',
  command_type: 'M',
  parent_id: '0',
  display_order: '1',
  group_menu_icon: '',
  command_uri: '',
  group_menu_visible: true,
  enabled: true,
  group_menu_list_authorize_form: '',
  workflow_id: '',
  languages: { vi: '', en: '' }
}

type Params = {
  dictionary: MenuManagementDictionary
  sessiontoken?: string
  locale: Locale
  /** Full BO menu/command tree — same fetch the parent-menu picker uses (see useMenuTreeData). */
  menuTreeItems: MenuCommandItem[]
  menuTreeLoading: boolean
  reloadMenuTree: () => Promise<MenuCommandItem[]>
}

export const useMenuCommandCreate = ({
  dictionary,
  sessiontoken,
  locale,
  menuTreeItems,
  menuTreeLoading,
  reloadMenuTree
}: Params) => {
  const router = useRouter()
  const [form, setForm] = useState<MenuCommandCreateForm>(emptyCreateForm)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<MenuCommandCreateFieldErrors>({})
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)

  // Mirrors languageTouched in a ref so the async translate flow can read the latest touched
  // state at apply-time (after an in-flight request resolves), not the stale value it closed
  // over when the request started.
  const languageTouchedRef = useRef<Record<NameLanguageKey, boolean>>({ vi: false, en: false })
  const translateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const translateSeqRef = useRef(0)

  const updateField = <K extends keyof MenuCommandCreateForm>(key: K, value: MenuCommandCreateForm[K]) => {
    setForm(current => ({ ...current, [key]: value }))
    if (key in fieldErrors) setFieldErrors(current => ({ ...current, [key]: undefined }))
  }

  const updateLanguageField = (lang: NameLanguageKey, value: string) => {
    languageTouchedRef.current = { ...languageTouchedRef.current, [lang]: true }
    setForm(current => ({ ...current, languages: { ...current.languages, [lang]: value } }))
  }

  // Detects vi vs en from the system name text (no explicit source-language field on this form),
  // copies it verbatim into that language, and translates it into the other one. Only touches
  // language fields the user hasn't hand-edited yet, so a manual override always sticks — even
  // across further command_name edits. Failures never clear what the user already typed; they
  // just surface translateError and leave the languages fields as-is.
  const runAutoTranslate = async (commandName: string) => {
    const trimmed = commandName.trim()

    if (!trimmed) return

    const seq = ++translateSeqRef.current

    setTranslating(true)
    setTranslateError(null)

    try {
      const sourceLang: NameLanguageKey = isVietnameseText(trimmed) ? 'vi' : 'en'
      const targetLang: NameLanguageKey = sourceLang === 'vi' ? 'en' : 'vi'
      const shouldTranslateTarget = !languageTouchedRef.current[targetLang]
      const translated = shouldTranslateTarget ? await translateText({ text: trimmed, targetLang }) : ''

      if (seq !== translateSeqRef.current) return

      setForm(current => ({
        ...current,
        languages: {
          ...current.languages,
          ...(languageTouchedRef.current[sourceLang] ? {} : { [sourceLang]: trimmed }),
          ...(shouldTranslateTarget && translated ? { [targetLang]: translated } : {})
        }
      }))
    } catch {
      if (seq !== translateSeqRef.current) return

      setTranslateError(
        menuManagementText(dictionary, 'translate_failed', 'Không thể dịch tự động, vui lòng nhập thủ công tên hiển thị.')
      )
    } finally {
      if (seq === translateSeqRef.current) setTranslating(false)
    }
  }

  useEffect(() => {
    if (translateTimerRef.current) clearTimeout(translateTimerRef.current)

    const commandName = form.command_name

    if (!commandName.trim()) return

    translateTimerRef.current = setTimeout(() => void runAutoTranslate(commandName), TRANSLATE_DEBOUNCE_MS)

    return () => {
      if (translateTimerRef.current) clearTimeout(translateTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.command_name])

  // Called on the "Tên hệ thống" field's onBlur so leaving the field doesn't wait out the
  // debounce window before translating.
  const flushTranslate = () => {
    if (translateTimerRef.current) clearTimeout(translateTimerRef.current)
    void runAutoTranslate(form.command_name)
  }

  // command_id and display_order are both scoped to "siblings under form.parent_id" — recomputed
  // from the same menu tree fetch every time the parent changes (or the tree data itself
  // reloads, e.g. after the pre-submit duplicate check below). command_id is generated-only and
  // read-only in the UI; display_order is only a starting suggestion the user can still edit by
  // hand afterwards, so switching parent again always overwrites it with the new parent's next
  // value regardless of any manual edit made under the previous parent.
  useEffect(() => {
    if (menuTreeLoading) return

    setForm(current => ({
      ...current,
      command_id: computeNextCommandId(menuTreeItems, current.parent_id),
      display_order: String(computeNextDisplayOrder(menuTreeItems, current.parent_id))
    }))
  }, [form.parent_id, menuTreeItems, menuTreeLoading])

  const save = async () => {
    if (saving) return false

    const nextForm: MenuCommandCreateForm = {
      ...form,
      command_id: form.command_id.trim(),
      command_name: form.command_name.trim(),
      parent_id: form.parent_id.trim(),
      group_menu_icon: form.group_menu_icon.trim(),
      command_uri: form.command_uri.trim(),
      group_menu_list_authorize_form: form.group_menu_list_authorize_form.trim(),
      workflow_id: form.workflow_id.trim()
    }
    const nextErrors: MenuCommandCreateFieldErrors = {}

    if (!nextForm.command_id) {
      nextErrors.command_id = menuManagementText(dictionary, 'validation_command_id_required', 'Mã Menu / Tính năng là bắt buộc.')
    }

    if (!nextForm.command_name) {
      nextErrors.command_name = menuManagementText(dictionary, 'validation_command_name_required', 'Tên hệ thống là bắt buộc.')
    }

    if (!nextForm.command_type) {
      nextErrors.command_type = menuManagementText(dictionary, 'validation_command_type_required', 'Loại là bắt buộc.')
    }

    if (!nextForm.parent_id) {
      nextErrors.parent_id = menuManagementText(dictionary, 'validation_parent_id_required', 'Menu cha là bắt buộc.')
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

    // Cheap check first against the already-fetched tree; only re-fetch (WF_BO_SIMPLE_SEARCH_
    // USER_COMMAND again) if that check actually finds a collision — e.g. someone else created a
    // sibling with the same generated code between this page's load and this submit. On a
    // collision the newly-fetched data both re-validates and re-suggests command_id/display_order
    // (via the effect above reacting to the refreshed menuTreeItems), and submit is aborted so the
    // user can review the corrected values before trying again.
    if (isMenuCommandIdTaken(menuTreeItems, nextForm.command_id)) {
      const freshItems = await reloadMenuTree()
      const regeneratedCommandId = computeNextCommandId(freshItems, nextForm.parent_id)
      const regeneratedDisplayOrder = computeNextDisplayOrder(freshItems, nextForm.parent_id)

      setForm(current => ({
        ...current,
        command_id: regeneratedCommandId,
        display_order: String(regeneratedDisplayOrder)
      }))
      setFieldErrors(current => ({
        ...current,
        command_id: menuManagementText(
          dictionary,
          'validation_command_id_duplicate',
          'Mã Menu / Tính năng đã tồn tại. Hệ thống đã đề xuất mã mới, vui lòng kiểm tra lại và bấm Tạo mới lần nữa.'
        )
      }))
      setSaving(false)

      return false
    }

    // Same three field-name renames as the Modify form: label -> command_name, href ->
    // command_uri, icon -> group_menu_icon (there is no "detail" source here, but the target
    // contract is identical to WF_BO_MODIFY_MENU, so the same explicit mapping applies).
    const fields: MenuCommandCreateRequest = {
      application_code: 'BO',
      command_id: nextForm.command_id,
      parent_id: nextForm.parent_id,
      command_name: nextForm.command_name,
      command_name_language: JSON.stringify({
        vi: nextForm.languages.vi.trim(),
        en: nextForm.languages.en.trim()
      }),
      command_type: nextForm.command_type,
      command_uri: nextForm.command_uri,
      enabled: nextForm.enabled,
      is_visible: nextForm.group_menu_visible,
      display_order: displayOrderValue,
      group_menu_icon: nextForm.group_menu_icon,
      group_menu_visible: nextForm.group_menu_visible ? '1' : '0',
      group_menu_list_authorize_form: nextForm.group_menu_list_authorize_form,
      workflow_id: nextForm.workflow_id || null
    }

    try {
      await menuCommandService.createUserCommand({ sessiontoken, language: locale, fields })

      SwalAlert('success', menuManagementText(dictionary, 'create_success', 'Tạo Menu / Tính năng thành công'), 'center')

      // Go straight to the new record's detail page — it re-fetches from WF_BO_GET_USER_COMMAND_BY_ID
      // itself, so this always shows what the backend actually saved, not just the submitted form.
      router.push(toMenuCommandDetailPath(locale, nextForm.command_id))

      return true
    } catch (caught) {
      setForm(nextForm)

      const message = caught instanceof Error
        ? caught.message
        : menuManagementText(dictionary, 'create_failed', 'Không thể tạo Menu / Tính năng.')
      const executionId = caught instanceof WorkflowError ? caught.executionId : undefined

      SwalAlert(
        'error',
        executionId
          ? `${message} — ${commonText(dictionary, 'errorReference', 'Error Reference')}: ${executionId}`
          : message,
        'center'
      )

      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    form,
    fieldErrors,
    saving,
    translating,
    translateError,
    updateField,
    updateLanguageField,
    flushTranslate,
    save
  }
}
