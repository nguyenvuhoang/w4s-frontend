'use client'

import { useRef, useState } from 'react'

import { useRouter } from '@shared/hooks/useRouter'
import SwalAlert from '@/shared/utils/SwalAlert'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  FEE_TEMPLATE_GROUP,
  NOTIFICATION_TEMPLATE_ALL_CHANNEL,
  feeTemplatesHref,
  stringifyFeeTemplateTranslations,
  type FeeTemplateLanguage
} from '../feeTemplate.constants'
import {
  FEE_TEMPLATE_CREATE_WORKFLOW_ID,
  FEE_TEMPLATE_UPDATE_WORKFLOW_ID,
  feeTemplateService,
  type FeeTemplateItem,
  type FeeTemplateSaveRequest
} from '../feeTemplate.service'
import { feeSettingsText } from '../feeSettingsModules'
import { combineFeeTemplateBodies } from '../feeTemplate.preview'

export type FeeTemplateFormValues = {
  template_code: string
  template_name: string
  channel: string
  subjects: Record<FeeTemplateLanguage, string>
  bodies: Record<FeeTemplateLanguage, string>
  is_default: boolean
}

export type FeeTemplateFormErrors = Partial<Record<'template_code' | 'template_name' | 'channel' | 'subject_vi' | 'body_vi', string>>

type Params = {
  dictionary: SystemSettingsDictionary
  locale: string
  sessiontoken?: string
  mode: 'create' | 'edit'
  /** Edit: the template. Create from "Clone": the source template (code cleared, default off). */
  template?: FeeTemplateItem | null
}

const CODE_MAX_LENGTH = 100

const toFormValues = (mode: 'create' | 'edit', template?: FeeTemplateItem | null): FeeTemplateFormValues => ({
  template_code: mode === 'edit' ? template?.template_code ?? '' : '',
  template_name: template?.template_name ?? '',
  channel: template?.channel === NOTIFICATION_TEMPLATE_ALL_CHANNEL ? '' : template?.channel ?? '',
  subjects: { ...(template?.subject_translations ?? { vi: '', en: '' }) },
  bodies: { ...(template?.body_translations ?? { vi: '', en: '' }) },
  // A clone never inherits "default": the user decides explicitly.
  is_default: mode === 'edit' ? Boolean(template?.is_default) : false
})

/**
 * Create (WF_BO_CREATE_NOTIFICATION_TEMPLATE) / update (WF_BO_UPDATE_NOTIFICATION_TEMPLATE) form.
 * Request = documented create sample; the Vietnamese text also fills `subject` / `body_html`
 * (default language) and both languages go to `*_translations` as a JSON string. Content is
 * saved exactly as typed, so existing variable tokens are never rewritten.
 */
export function useFeeTemplateForm({ dictionary, locale, sessiontoken, mode, template = null }: Params) {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const router = useRouter()
  const isEdit = mode === 'edit'
  const [values, setValues] = useState<FeeTemplateFormValues>(() => toFormValues(mode, template))
  const [errors, setErrors] = useState<FeeTemplateFormErrors>({})
  const [submitError, setSubmitError] = useState<WorkflowErrorDetail | null>(null)
  const [saving, setSaving] = useState(false)
  const submittingRef = useRef(false)

  const setField = <K extends keyof FeeTemplateFormValues>(key: K, value: FeeTemplateFormValues[K]) => {
    setValues(current => ({ ...current, [key]: value }))
  }

  const setLocalized = (field: 'subjects' | 'bodies', language: FeeTemplateLanguage, value: string) => {
    setValues(current => ({ ...current, [field]: { ...current[field], [language]: value } }))
  }

  // Explicit composition is persisted in both translations and body_html. No new API fields or
  // assumptions about backend language selection; reopening edits the actual saved HTML.
  const combineEmailLanguages = () => setValues(current => {
    if (current.channel !== 'EMAIL' || !current.bodies.vi.trim() || !current.bodies.en.trim()) return current

    const body = combineFeeTemplateBodies(current.bodies)

    return { ...current, bodies: { vi: body, en: body } }
  })

  const insertEmailStarter = () => setValues(current => {
    if (current.channel !== 'EMAIL' || current.bodies.vi.trim() || current.bodies.en.trim()) return current

    return {
      ...current,
      subjects: {
        vi: current.subjects.vi || text('email_starter_subject_vi', ''),
        en: current.subjects.en || text('email_starter_subject_en', '')
      },
      bodies: { vi: text('email_starter_body_vi', ''), en: text('email_starter_body_en', '') }
    }
  })

  const validate = () => {
    const next: FeeTemplateFormErrors = {}
    const code = values.template_code.trim()

    if (!code) next.template_code = text('template_code_required', 'Template code is required.')
    else if (code.length > CODE_MAX_LENGTH) next.template_code = text('template_code_too_long', 'Template code must be at most 100 characters.')
    else if (/\s/.test(code)) next.template_code = text('template_code_no_space', 'Template code must not contain spaces.')
    if (!values.template_name.trim()) next.template_name = text('template_name_required', 'Template name is required.')
    if (!values.channel || values.channel === NOTIFICATION_TEMPLATE_ALL_CHANNEL) next.channel = text('channel_required', 'Channel is required.')
    if (values.channel !== 'SMS' && !values.subjects.vi.trim()) next.subject_vi = text('subject_required', 'Vietnamese subject is required.')
    if (!values.bodies.vi.trim()) next.body_vi = text('body_required', 'Vietnamese content is required.')

    setErrors(next)

    return Object.keys(next).length === 0
  }

  const goBack = () => {
    router.push(isEdit && template?.id ? feeTemplatesHref(locale, `/${template.id}`) : feeTemplatesHref(locale))
  }

  const submit = async () => {
    if (submittingRef.current || !validate()) return

    let succeeded = false

    submittingRef.current = true
    setSaving(true)
    setSubmitError(null)

    // SMS has no subject: it is sent empty instead of keeping a subject typed for another channel.
    const subjects = values.channel === 'SMS' ? { vi: '', en: '' } : values.subjects
    const fields: FeeTemplateSaveRequest = {
      template_code: values.template_code.trim(),
      template_name: values.template_name.trim(),
      template_group: FEE_TEMPLATE_GROUP,
      channel: values.channel === NOTIFICATION_TEMPLATE_ALL_CHANNEL ? '' : values.channel,
      subject: subjects.vi,
      subject_translations: stringifyFeeTemplateTranslations(subjects),
      body_html: values.bodies.vi,
      body_translations: stringifyFeeTemplateTranslations(values.bodies),
      is_default: values.is_default
    }

    const showSuccessThenOpen = (message: string, href: string) => {
      SwalAlert('success', message, 'center', false, false, true, () => {
        router.push(href)
        router.refresh()
      })
    }

    try {
      if (isEdit) {
        if (!template?.id) return

        await feeTemplateService.update({ sessiontoken, language: locale as any, fields: { id: template.id, ...fields } })
        succeeded = true
        showSuccessThenOpen(text('template_update_success', 'Template updated.'), feeTemplatesHref(locale, `/${template.id}`))
      } else {
        const result = await feeTemplateService.create({ sessiontoken, language: locale as any, fields })

        succeeded = true
        showSuccessThenOpen(
          text('template_create_success', 'Template created.'),
          result.id ? feeTemplatesHref(locale, `/${result.id}`) : feeTemplatesHref(locale)
        )
      }
    } catch (saveError) {
      setSubmitError(normalizeWorkflowErrorDetail(saveError, {
        fallback: isEdit ? text('template_update_failed', 'Unable to update the template.') : text('template_create_failed', 'Unable to create the template.'),
        workflowId: isEdit ? FEE_TEMPLATE_UPDATE_WORKFLOW_ID : FEE_TEMPLATE_CREATE_WORKFLOW_ID
      }))
    } finally {
      if (!succeeded) {
        submittingRef.current = false
        setSaving(false)
      }
    }
  }

  return { values, errors, submitError, saving, isEdit, setField, setLocalized, combineEmailLanguages, insertEmailStarter, submit, goBack }
}
