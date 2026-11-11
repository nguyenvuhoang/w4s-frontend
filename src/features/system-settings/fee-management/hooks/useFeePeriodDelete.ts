'use client'

import { useRef, useState } from 'react'

import { FEE_PERIOD_DELETE_WORKFLOW_ID, feeService } from '@/features/fees/service'
import type { FeePeriodItem } from '@/features/fees/types'
import SwalAlert from '@/shared/utils/SwalAlert'
import { normalizeWorkflowErrorDetail } from '@/shared/utils/workflowError'
import type { SystemSettingsDictionary } from '@/views/pages/system-settings/systemSettingsModules'

import { feeSettingsText } from '../feeSettingsModules'

type Params = {
  dictionary: SystemSettingsDictionary
  sessiontoken?: string
  language?: any
  onDeleted: () => void
}

/**
 * Delete a fee period (WF_BO_DELETE_FEE_PERIOD) from the detail page, after a SwalAlert confirmation
 * naming its period code.
 * Business rules (e.g. a period with invoices / debts) are enforced by the backend: its error is
 * shown as is, with the execution id as error reference. Nothing related is removed on the client.
 */
export function useFeePeriodDelete({ dictionary, sessiontoken, language, onDeleted }: Params) {
  const text = (key: string, fallback: string) => feeSettingsText(dictionary, key, fallback)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const busyRef = useRef(false)

  const runDelete = async (id: number) => {
    if (busyRef.current) return

    busyRef.current = true
    setDeletingId(id)

    try {
      await feeService.deleteFeePeriod({ sessiontoken, language, id })
      SwalAlert('success', text('period_delete_success', 'Fee period deleted.'), 'center')
      onDeleted()
    } catch (deleteError) {
      const detail = normalizeWorkflowErrorDetail(deleteError, {
        fallback: text('period_delete_failed', 'Unable to delete the fee period.'),
        workflowId: FEE_PERIOD_DELETE_WORKFLOW_ID
      })
      const reference = detail.executionId
        ? `\n${text('error_reference', 'Error reference')}: ${detail.executionId}`
        : ''

      SwalAlert('error', `${detail.message}${reference}`, 'center')
    } finally {
      busyRef.current = false
      setDeletingId(null)
    }
  }

  /** Asks for confirmation (shared SwalAlert); the workflow runs only when the user confirms. */
  const deletePeriod = (period: Pick<FeePeriodItem, 'id' | 'period_code'>) => {
    if (!period.id || busyRef.current) return

    const id = period.id

    SwalAlert(
      'warning',
      text('period_delete_confirm', 'Delete fee period {code}? This action cannot be undone.').replace('{code}', period.period_code || `#${id}`),
      'center',
      false,
      true,
      true,
      () => void runDelete(id),
      text('delete', 'Delete'),
      { title: text('period_delete_title', 'Delete fee period'), cancelButtonText: text('cancel', 'Cancel') }
    )
  }

  return { deletePeriod, deletingId }
}
