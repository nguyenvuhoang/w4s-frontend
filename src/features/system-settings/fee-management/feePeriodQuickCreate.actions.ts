import type { FeePeriodGeneratePreviewSetup } from '@/features/fees/service'
import type {
  FeePeriodBatchSaveRequest,
  FeePeriodBatchSaveResult,
  FeePeriodGeneratePreviewResult
} from '@/features/fees/types'

import {
  buildFeePeriodBatchSaveItems,
  validateFeePeriodDrafts,
  type FeePeriodDraftErrors,
  type FeePeriodDraftRow
} from './feePeriodQuickCreate.draft'

export type FeePeriodSetupErrors = Partial<Record<'projectId' | 'fromDayOfMonth' | 'dueDayOfMonth', string>>

type InFlightRef = { current: boolean }

export const FEE_PERIOD_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1)

const isDayOfMonth = (value: number) => Number.isInteger(value) && value >= 1 && value <= 31

/** Values are i18n keys of fee_settings. A project is required only when not applied to all projects. */
export const validateFeePeriodSetup = (setup: FeePeriodGeneratePreviewSetup): FeePeriodSetupErrors => {
  const errors: FeePeriodSetupErrors = {}

  if (!setup.applyAllProjects && !setup.projectId) errors.projectId = 'project_required'
  if (!isDayOfMonth(setup.fromDayOfMonth)) errors.fromDayOfMonth = 'quick_create_error_day_invalid'
  if (!isDayOfMonth(setup.dueDayOfMonth)) errors.dueDayOfMonth = 'quick_create_error_day_invalid'

  return errors
}

export type FeePeriodPreviewOutcome =
  | { status: 'invalid'; errors: FeePeriodSetupErrors }
  | { status: 'busy' }
  | { status: 'ok'; result: FeePeriodGeneratePreviewResult }
  | { status: 'failed'; error: unknown }

/** Runs the preview workflow once at a time; never writes data. */
export const requestFeePeriodPreview = async ({
  setup,
  inFlight,
  generate
}: {
  setup: FeePeriodGeneratePreviewSetup
  inFlight: InFlightRef
  generate: (setup: FeePeriodGeneratePreviewSetup) => Promise<FeePeriodGeneratePreviewResult>
}): Promise<FeePeriodPreviewOutcome> => {
  if (inFlight.current) return { status: 'busy' }

  const errors = validateFeePeriodSetup(setup)

  if (Object.keys(errors).length > 0) return { status: 'invalid', errors }

  inFlight.current = true

  try {
    return { status: 'ok', result: await generate(setup) }
  } catch (error) {
    return { status: 'failed', error }
  } finally {
    inFlight.current = false
  }
}

export type FeePeriodSaveOutcome =
  | { status: 'empty' }
  | { status: 'invalid'; errors: FeePeriodDraftErrors }
  | { status: 'busy' }
  | { status: 'saved'; result: FeePeriodBatchSaveResult }
  | { status: 'failed'; error: unknown }

/** Validation only (used before asking the upsert confirmation). */
export const checkFeePeriodDrafts = (rows: FeePeriodDraftRow[]): FeePeriodSaveOutcome | null => {
  if (rows.length === 0) return { status: 'empty' }

  const errors = validateFeePeriodDrafts(rows)

  return Object.keys(errors).length > 0 ? { status: 'invalid', errors } : null
}

/**
 * Validates, then sends every edited row in one Batch Save call. A ref blocks double submits;
 * the rows are never mutated so a failed save keeps all the user's edits.
 */
export const submitFeePeriodDrafts = async ({
  rows,
  inFlight,
  save,
  onSaved
}: {
  rows: FeePeriodDraftRow[]
  inFlight: InFlightRef
  save: (fields: FeePeriodBatchSaveRequest) => Promise<FeePeriodBatchSaveResult>
  onSaved?: (result: FeePeriodBatchSaveResult) => void
}): Promise<FeePeriodSaveOutcome> => {
  if (inFlight.current) return { status: 'busy' }

  const invalid = checkFeePeriodDrafts(rows)

  if (invalid) return invalid

  inFlight.current = true

  try {
    const result = await save({ periods: buildFeePeriodBatchSaveItems(rows) })

    onSaved?.(result)

    return { status: 'saved', result }
  } catch (error) {
    return { status: 'failed', error }
  } finally {
    inFlight.current = false
  }
}
