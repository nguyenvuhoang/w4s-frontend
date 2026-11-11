import { describe, expect, it } from 'vitest'

import { getFeeImportAcceptButton, getFeeImportApprovalState } from './feeImportApproval'
import { mapFeeImportDetail } from './feeImportWorkflow.mapper'

const canApprove = { resolved: true, canApprove: true }
const batch = (system_status: string | null | undefined) => ({ system_status: system_status ?? null })

describe('getFeeImportApprovalState', () => {
  it('normalizes system_status with trim + upper case', () => {
    expect(getFeeImportApprovalState(batch(' accepted '))).toBe('accepted')
    expect(getFeeImportApprovalState(batch('Rejected'))).toBe('rejected')
    expect(getFeeImportApprovalState(batch('pending'))).toBe('pending')
  })

  it.each([null, undefined, '', '   '])('treats missing system_status %s as unknown', value => {
    expect(getFeeImportApprovalState(batch(value))).toBe('unknown')
  })

  it('never derives the approval state from the record flag status A/I', () => {
    expect(getFeeImportApprovalState({ status: 'A', system_status: null } as never)).toBe('unknown')
    expect(getFeeImportApprovalState({ status: 'ACCEPTED', system_status: null } as never)).toBe('unknown')
  })
})

describe('getFeeImportAcceptButton', () => {
  it('ACCEPTED: visible but disabled', () => {
    expect(getFeeImportAcceptButton(batch('ACCEPTED'), canApprove)).toMatchObject({ state: 'accepted', visible: true, disabled: true })
  })

  it('REJECTED: visible but disabled', () => {
    expect(getFeeImportAcceptButton(batch('REJECTED'), canApprove)).toMatchObject({ state: 'rejected', visible: true, disabled: true })
  })

  it('PENDING: enabled when the user can approve', () => {
    expect(getFeeImportAcceptButton(batch('PENDING'), canApprove)).toMatchObject({ state: 'pending', visible: true, disabled: false })
  })

  it('missing system_status: visible but disabled, even when status = A', () => {
    const reloaded = mapFeeImportDetail({ data: { import: { id: 3, status: 'A' } } })

    expect(getFeeImportAcceptButton(reloaded, canApprove)).toMatchObject({ state: 'unknown', visible: true, disabled: true })
  })

  it('other values keep the existing rule: enabled unless already approved/completed', () => {
    expect(getFeeImportAcceptButton(batch('VALIDATED'), canApprove).disabled).toBe(false)
    expect(getFeeImportAcceptButton(batch('COMPLETED'), canApprove).disabled).toBe(true)
  })

  it('keeps the permission check: hidden without approve permission or before permissions resolve', () => {
    expect(getFeeImportAcceptButton(batch('PENDING'), { resolved: true, canApprove: false })).toMatchObject({ visible: false, disabled: true })
    expect(getFeeImportAcceptButton(batch('PENDING'), { resolved: false, canApprove: true })).toMatchObject({ visible: false, disabled: true })
  })

  it('stays disabled after an accept request was submitted in this session', () => {
    expect(getFeeImportAcceptButton(batch('PENDING'), canApprove, true).disabled).toBe(true)
  })

  it('renders nothing while the batch is not loaded', () => {
    expect(getFeeImportAcceptButton(null, canApprove)).toMatchObject({ state: null, visible: false, disabled: true })
  })

  it('reads system_status from the WF_BO_GET_FEE_IMPORT_BY_ID response after reload', () => {
    const reloaded = mapFeeImportDetail({ data: { import: { id: 3, status: 'A', system_status: 'accepted' } } })

    expect(getFeeImportAcceptButton(reloaded, canApprove)).toMatchObject({ state: 'accepted', disabled: true })
  })
})
