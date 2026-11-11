'use client'

import { useRef, useState } from 'react'

import {
  FEE_PERIOD_CREATE_WORKFLOW_ID,
  FEE_PERIOD_UPDATE_WORKFLOW_ID,
  feeService
} from '@/features/fees/service'
import type { FeePeriodItem, FeePeriodSaveRequest } from '@/features/fees/types'
import { useRouter } from '@shared/hooks/useRouter'
import SwalAlert from '@/shared/utils/SwalAlert'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import {
  feePeriodsHref,
  toFeePeriodDueDateInput,
  toFeePeriodDueDatePayload
} from '../feePeriod.helpers'
import { feeSettingsText } from '../feeSettingsModules'

export type FeePeriodFormValues = {
  period_code: string
  project_id: number | null
  year: number | null
  month: number | null
  /** yyyy-MM-dd */
  due_date: string
  status: string
}

export type FeePeriodFormErrors = Partial<Record<keyof FeePeriodFormValues, string>>

type Params = {
  dictionary: SystemSettingsDictionary
  locale: string
  sessiontoken?: string
  mode: 'create' | 'edit'
  period?: FeePeriodItem | null
}

const PERIOD_CODE_MAX_LENGTH = 50

const toFormValues = (period?: FeePeriodItem | null): FeePeriodFormValues => ({
  period_code: period?.period_code ?? '',
  project_id: period?.project_id ?? null,
  year: period?.year ?? null,
  month: period?.month ?? null,
  due_date: toFeePeriodDueDateInput(period?.due_date),
  status: period?.status ?? ''
})

/**
 * Create (WF_BO_CREATE_FEE_PERIOD) / update (WF_BO_UPDATE_FEE_PERIOD) form state.
 * The request only carries the confirmed Create fields { period_code, project_id, year, month, due_date };
 * Update adds id and status. Fields that only appear in documentation examples (period_name,
 * from_date, to_date) are not sent. A ref blocks double submits; errors stay on the page.
 * On success a SwalAlert is shown and the detail page opens (refreshed) once it is closed; the form
 * stays locked meanwhile.
 */
export function useFeePeriodForm({ dictionary, locale, sessiontoken, mode, period = null }: Params) {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const router = useRouter()
  const isEdit = mode === 'edit'
  const [values, setValues] = useState<FeePeriodFormValues>(() => toFormValues(period))
  const [errors, setErrors] = useState<FeePeriodFormErrors>({})
  const [submitError, setSubmitError] = useState<WorkflowErrorDetail | null>(null)
  const [saving, setSaving] = useState(false)
  const submittingRef = useRef(false)

  const updateValue = <K extends keyof FeePeriodFormValues>(key: K, value: FeePeriodFormValues[K]) => {
    setValues(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }

  const validate = () => {
    const nextErrors: FeePeriodFormErrors = {}
    const code = values.period_code.trim()

    if (!code) nextErrors.period_code = text('period_code_required', 'Period code is required.')
    else if (code.length > PERIOD_CODE_MAX_LENGTH) nextErrors.period_code = text('period_code_too_long', 'Period code must be at most 50 characters.')
    if (!values.project_id) nextErrors.project_id = text('project_required', 'Project is required.')
    if (!values.year) nextErrors.year = text('year_required', 'Year is required.')
    if (!values.month || values.month < 1 || values.month > 12) nextErrors.month = text('month_required', 'Month is required.')
    if (!values.due_date) nextErrors.due_date = text('due_date_required', 'Due date is required.')
    if (isEdit && !values.status) nextErrors.status = text('status_required', 'Status is required.')

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const goBack = () => {
    router.push(isEdit && period?.id ? feePeriodsHref(locale, `/${period.id}`) : feePeriodsHref(locale))
  }

  const submit = async () => {
    if (submittingRef.current || !validate()) return

    let succeeded = false

    submittingRef.current = true
    setSaving(true)
    setSubmitError(null)

    const fields: FeePeriodSaveRequest = {
      period_code: values.period_code.trim(),
      project_id: values.project_id as number,
      year: values.year as number,
      month: values.month as number,
      due_date: toFeePeriodDueDatePayload(values.due_date)
    }

    const showSuccessThenOpen = (message: string, href: string) => {
      SwalAlert('success', message, 'center', false, false, true, () => {
        router.push(href)
        router.refresh()
      })
    }

    try {
      if (isEdit) {
        if (!period?.id) return

        await feeService.updateFeePeriod({
          sessiontoken,
          language: locale as any,
          fields: { id: period.id, ...fields, status: values.status }
        })
        succeeded = true
        showSuccessThenOpen(text('period_update_success', 'Fee period updated.'), feePeriodsHref(locale, `/${period.id}`))
      } else {
        const result = await feeService.createFeePeriod({ sessiontoken, language: locale as any, fields })

        succeeded = true
        showSuccessThenOpen(
          text('period_create_success', 'Fee period created.'),
          result.id ? feePeriodsHref(locale, `/${result.id}`) : feePeriodsHref(locale)
        )
      }
    } catch (saveError) {
      setSubmitError(normalizeWorkflowErrorDetail(saveError, {
        fallback: isEdit
          ? text('period_update_failed', 'Unable to update the fee period.')
          : text('period_create_failed', 'Unable to create the fee period.'),
        workflowId: isEdit ? FEE_PERIOD_UPDATE_WORKFLOW_ID : FEE_PERIOD_CREATE_WORKFLOW_ID
      }))
    } finally {
      // After a success the form stays locked until the page changes.
      if (!succeeded) {
        submittingRef.current = false
        setSaving(false)
      }
    }
  }

  return { values, errors, submitError, saving, isEdit, updateValue, submit, goBack }
}
