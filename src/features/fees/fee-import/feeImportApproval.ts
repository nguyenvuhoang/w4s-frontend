import type { FeeImportItem } from './feeImportWorkflow.types'

/**
 * Batch-level approval state of a fee import, read ONLY from the batch `system_status`
 * returned by WF_BO_GET_FEE_IMPORT_BY_ID.
 *
 * `status` (A/I) is the record flag and is never used to decide the approval state.
 * Detail-row statuses are never used either.
 */
export type FeeImportApprovalState = 'accepted' | 'rejected' | 'pending' | 'unknown' | 'other'

// Values the previous rule already blocked from being accepted again.
const ACCEPTED = ['ACCEPTED', 'APPROVED', 'COMPLETED']

export const normalizeFeeImportSystemStatus = (input: string | null | undefined) => input?.trim().toUpperCase() || null

export const getFeeImportApprovalState = (item: Pick<FeeImportItem, 'system_status'>): FeeImportApprovalState => {
  const status = normalizeFeeImportSystemStatus(item.system_status)
  if (!status) return 'unknown'
  if (ACCEPTED.includes(status)) return 'accepted'
  if (status === 'REJECTED') return 'rejected'
  if (status === 'PENDING') return 'pending'
  return 'other'
}

export type FeeImportApprovePermission = { resolved: boolean; canApprove: boolean }

/**
 * Accept button: visible when the user may approve; enabled only for a batch whose system_status
 * allows approval (PENDING or another non-final value) and while no accept request has been sent.
 */
export const getFeeImportAcceptButton = (item: Pick<FeeImportItem, 'system_status'> | null | undefined, permission: FeeImportApprovePermission, submitted = false) => {
  const state = item ? getFeeImportApprovalState(item) : null
  const visible = Boolean(permission.resolved && permission.canApprove && state)
  const allowedState = state === 'pending' || state === 'other'
  return { state, visible, disabled: !visible || !allowedState || submitted }
}
