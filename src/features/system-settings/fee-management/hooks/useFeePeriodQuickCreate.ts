'use client'

import { useCallback, useRef, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import {
  FEE_PERIOD_BATCH_SAVE_WORKFLOW_ID,
  FEE_PERIOD_GENERATE_YEAR_WORKFLOW_ID,
  feeService,
  type FeePeriodGeneratePreviewSetup
} from '@/features/fees/service'
import SwalAlert from '@/shared/utils/SwalAlert'
import { normalizeWorkflowErrorDetail, type WorkflowErrorDetail } from '@/shared/utils/workflowError'

import {
  checkFeePeriodDrafts,
  requestFeePeriodPreview,
  submitFeePeriodDrafts,
  type FeePeriodSetupErrors
} from '../feePeriodQuickCreate.actions'
import {
  createFeePeriodDrafts,
  isFeePeriodDraftsDirty,
  updateFeePeriodDraft,
  type FeePeriodDraftErrors,
  type FeePeriodDraftField,
  type FeePeriodDraftRow
} from '../feePeriodQuickCreate.draft'

export type FeePeriodQuickCreateStep = 'setup' | 'preview'
export type FeePeriodQuickCreateConfirm = 'save' | 'discard-close' | 'discard-regenerate' | null

type Text = (key: string, fallback: string) => string

const createDefaultSetup = (prefix: string): FeePeriodGeneratePreviewSetup => ({
  applyAllProjects: false,
  projectId: null,
  year: new Date().getFullYear(),
  fromDayOfMonth: 1,
  dueDayOfMonth: 5,
  prefix
})

/**
 * Quick create of 12 fee periods: Setup → Preview (WF_BO_GENERATE_QUICK_YEAR_FEE_PERIODS, preview_only)
 * → edit → Batch Save (WF_BO_BATCH_SAVE_FEE_PERIODS, upsert). Any setup change drops the preview so
 * stale rows can never be saved; errors stay inside the dialog and the edits are kept on failure.
 */
export function useFeePeriodQuickCreate({
  sessiontoken,
  locale,
  text,
  onClose,
  onSaved
}: {
  sessiontoken?: string
  locale: string
  text: Text
  onClose: () => void
  onSaved: () => void
}) {
  const defaultPrefix = text('quick_create_prefix_default', 'Thông báo phí')
  const [step, setStep] = useState<FeePeriodQuickCreateStep>('setup')
  const [setup, setSetup] = useState<FeePeriodGeneratePreviewSetup>(() => createDefaultSetup(defaultPrefix))
  const [setupErrors, setSetupErrors] = useState<FeePeriodSetupErrors>({})
  const [drafts, setDrafts] = useState<FeePeriodDraftRow[] | null>(null)
  const [rowErrors, setRowErrors] = useState<FeePeriodDraftErrors>({})
  const [saveNotice, setSaveNotice] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewError, setPreviewError] = useState<WorkflowErrorDetail | null>(null)
  const [saveError, setSaveError] = useState<WorkflowErrorDetail | null>(null)
  const [confirm, setConfirm] = useState<FeePeriodQuickCreateConfirm>(null)
  const generatingRef = useRef(false)
  const savingRef = useRef(false)
  const language = locale as Locale
  const dirty = isFeePeriodDraftsDirty(drafts)

  const reset = () => {
    setStep('setup')
    setSetup(createDefaultSetup(defaultPrefix))
    setSetupErrors({})
    setDrafts(null)
    setRowErrors({})
    setSaveNotice('')
    setPreviewError(null)
    setSaveError(null)
    setConfirm(null)
  }

  /** Every setup change invalidates the preview: it must be generated again. */
  const updateSetup = <K extends keyof FeePeriodGeneratePreviewSetup>(key: K, value: FeePeriodGeneratePreviewSetup[K]) => {
    setSetup(current => ({ ...current, [key]: value }))
    setSetupErrors(current => ({ ...current, [key]: undefined }))
    setDrafts(null)
    setRowErrors({})
    setSaveError(null)
    setSaveNotice('')
  }

  const runPreview = async () => {
    setConfirm(null)
    setPreviewError(null)
    setGenerating(true)

    const outcome = await requestFeePeriodPreview({
      setup,
      inFlight: generatingRef,
      generate: value => feeService.generateFeePeriodPreview({ sessiontoken, language, setup: value })
    })

    setGenerating(false)

    if (outcome.status === 'invalid') setSetupErrors(outcome.errors)

    if (outcome.status === 'failed') {
      setPreviewError(normalizeWorkflowErrorDetail(outcome.error, {
        fallback: text('quick_create_preview_failed', 'Unable to generate the fee period preview.'),
        workflowId: FEE_PERIOD_GENERATE_YEAR_WORKFLOW_ID
      }))
    }

    if (outcome.status === 'ok') {
      setDrafts(createFeePeriodDrafts(outcome.result.periods))
      setRowErrors({})
      setSaveError(null)
      setSaveNotice('')
      setStep('preview')
    }
  }

  const requestPreview = () => {
    if (generatingRef.current) return
    if (dirty) setConfirm('discard-regenerate')
    else void runPreview()
  }

  /** Back to setup keeps the rows until a setup value changes. */
  const continueEditing = () => {
    if (drafts) setStep('preview')
  }

  const updateRow = useCallback((key: string, field: FeePeriodDraftField, value: string) => {
    setDrafts(current => (current ? updateFeePeriodDraft(current, key, field, value) : current))
    setRowErrors(current => {
      const rowError = current[key]

      if (!rowError) return current

      const nextRow = { ...rowError, [field]: undefined }

      if (field === 'to_date' && rowError.from_date === 'quick_create_error_from_after_to') nextRow.from_date = undefined

      return { ...current, [key]: nextRow }
    })
  }, [])

  const requestSave = () => {
    if (savingRef.current || !drafts) return

    const invalid = checkFeePeriodDrafts(drafts)

    setSaveError(null)

    if (invalid?.status === 'empty') {
      setSaveNotice(text('quick_create_error_empty', 'There is no fee period to save.'))

      return
    }

    if (invalid?.status === 'invalid') {
      setRowErrors(invalid.errors)
      setSaveNotice(text('quick_create_error_rows', '{count} fee period(s) have invalid data.').replace('{count}', String(Object.keys(invalid.errors).length)))

      return
    }

    setRowErrors({})
    setSaveNotice('')
    setConfirm('save')
  }

  const save = async () => {
    // A second click while saving must not reset the loading state of the request in flight.
    if (!drafts || savingRef.current) return

    setConfirm(null)
    setSaveError(null)
    setSaving(true)

    const outcome = await submitFeePeriodDrafts({
      rows: drafts,
      inFlight: savingRef,
      save: fields => feeService.batchSaveFeePeriods({ sessiontoken, language, fields })
    })

    setSaving(false)

    if (outcome.status === 'invalid') setRowErrors(outcome.errors)

    if (outcome.status === 'failed') {
      setSaveError(normalizeWorkflowErrorDetail(outcome.error, {
        fallback: text('quick_create_save_failed', 'Unable to save the fee periods.'),
        workflowId: FEE_PERIOD_BATCH_SAVE_WORKFLOW_ID
      }))
    }

    if (outcome.status === 'saved') {
      const count = outcome.result.savedCount ?? drafts.length

      reset()
      onClose()
      onSaved()
      SwalAlert('success', text('quick_create_save_success', '{count} fee period(s) saved.').replace('{count}', String(count)), 'center')
    }
  }

  const close = (force = false) => {
    if (generatingRef.current || savingRef.current) return

    if (!force && dirty) {
      setConfirm('discard-close')

      return
    }

    reset()
    onClose()
  }

  const confirmAction = () => {
    if (confirm === 'save') void save()
    if (confirm === 'discard-close') close(true)
    if (confirm === 'discard-regenerate') void runPreview()
  }

  return {
    step,
    setStep,
    setup,
    setupErrors,
    updateSetup,
    drafts,
    rowErrors,
    updateRow,
    saveNotice,
    generating,
    saving,
    previewError,
    saveError,
    confirm,
    setConfirm,
    dirty,
    requestPreview,
    continueEditing,
    requestSave,
    confirmAction,
    close
  }
}
