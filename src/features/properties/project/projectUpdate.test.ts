import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProjectUpdatePayload } from '../types'

const { runFODynamic } = vi.hoisted(() => ({ runFODynamic: vi.fn() }))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

let propertyAggregateService: typeof import('../propertyAggregateService').propertyAggregateService

beforeAll(async () => {
  ({ propertyAggregateService } = await import('../propertyAggregateService'))
})

beforeEach(() => {
  runFODynamic.mockReset()
  runFODynamic.mockResolvedValue({ success: true, code: 'success', data: {}, errors: [] })
})

const payload: ProjectUpdatePayload = {
  id: 1,
  description: 'Demo description',
  name: 'Demo name',
  logo_url: 'https://cdn.example.com/project/1/logo.png',
  address: '512 Nguyen Xien, Thu Duc, HCMC',
  status: 'active',
  investor: 'Vinhomes',
  project_code: 'PRJ99',
  province: 'Ho Chi Minh',
  handover_date: '2026-03-05'
}

const CONTRACT_FIELDS = ['address', 'description', 'handover_date', 'id', 'investor', 'logo_url', 'name', 'project_code', 'province', 'status']

describe('propertyAggregateService.update_project_detail', () => {
  it('calls WF_BO_UPDATE_PROJECT with exactly the planned contract fields', async () => {
    await propertyAggregateService.update_project_detail({ sessiontoken: 'token', language: 'vi', payload })

    const request = runFODynamic.mock.calls[0][0]

    expect(request.workflowid).toBe('WF_BO_UPDATE_PROJECT')
    expect(Object.keys(request.input).sort()).toEqual(CONTRACT_FIELDS)
    expect(request.input).toEqual({ ...payload, status: 'A' })
    expect(request.input).not.toHaveProperty('project_type')
  })

  it('sends no bank object when none is given (never an empty object)', async () => {
    await propertyAggregateService.update_project_detail({ sessiontoken: 'token', payload })

    expect(runFODynamic.mock.calls[0][0].input).not.toHaveProperty('operating_bank_account')
    expect(runFODynamic.mock.calls[0][0].input).not.toHaveProperty('deposit_bank_account')
  })

  it('sends the bank objects of the WF_BO_UPDATE_PROJECT contract with exactly their fields (account id inside)', async () => {
    const operating = { id: 3, bank_name: 'Vietcombank', account_number: '001234567890', account_holder: 'BQL', branch: 'Tan Binh', qr_code_url: null, transfer_content: 'AGR [CanHo]' }

    await propertyAggregateService.update_project_detail({
      sessiontoken: 'token',
      payload: { ...payload, operating_bank_account: { ...operating, extra: 'x' } as typeof operating }
    })

    const input = runFODynamic.mock.calls[0][0].input

    expect(input.id).toBe(payload.id)
    expect(input.operating_bank_account).toEqual(operating)
    expect(input).not.toHaveProperty('deposit_bank_account')
  })

  it('sends status mapped to the backend code (active -> A, inactive -> I)', async () => {
    await propertyAggregateService.update_project_detail({ sessiontoken: 'token', payload: { ...payload, status: 'inactive' } })

    expect(runFODynamic.mock.calls[0][0].input.status).toBe('I')
  })

  it('sends handover_date as a plain YYYY-MM-DD string, or null when cleared', async () => {
    await propertyAggregateService.update_project_detail({ sessiontoken: 'token', payload })
    await propertyAggregateService.update_project_detail({ sessiontoken: 'token', payload: { ...payload, handover_date: null } })

    expect(runFODynamic.mock.calls[0][0].input.handover_date).toBe('2026-03-05')
    expect(runFODynamic.mock.calls[1][0].input.handover_date).toBeNull()
  })

  it('never forwards fields outside the contract (project_type included)', async () => {
    await propertyAggregateService.update_project_detail({
      sessiontoken: 'token',
      payload: {
        ...payload,
        project_type: 'apartment',
        project_id: 1,
        created_at: 'x',
        updated_at: 'y',
        resident_count: 3,
        building_count: 2
      } as ProjectUpdatePayload
    })

    expect(Object.keys(runFODynamic.mock.calls[0][0].input).sort()).toEqual(CONTRACT_FIELDS)
  })

  it('propagates the backend error with its execution reference', async () => {
    runFODynamic.mockResolvedValue({
      success: false,
      code: 'failed',
      data: null,
      errors: [{ info: 'Project not found', execution_id: 'EXEC-UPD' }],
      execution_id: 'EXEC-UPD'
    })

    await expect(propertyAggregateService.update_project_detail({ sessiontoken: 'token', language: 'vi', payload }))
      .rejects.toThrow('Project not found Mã tra cứu lỗi: EXEC-UPD')
  })
})

// The Edit page state lives in useProjectEditForm (no DOM test runner in this repo), so the save flow is
// pinned at source level, following the convention of useResidentDetailActions.test.ts.
describe('useProjectEditForm submit', () => {
  const source = readFileSync(new URL('./hooks/useProjectEditForm.ts', import.meta.url), 'utf8')
  const submit = source.slice(source.indexOf('const submit = async'), source.indexOf('const retryPaymentConfig'))
  const payloadBuilder = source.slice(source.indexOf('export const buildProjectUpdatePayload'), source.indexOf('export const useProjectEditForm'))

  it('no longer preserves or requires project_type', () => {
    expect(source).not.toContain('project_type')
    expect(source).not.toContain('projectTypeMissingForUpdate')
  })

  it('submits right after form validation (no project_type block)', () => {
    const beforeSaving = submit.slice(0, submit.indexOf('setSaving(true)'))

    // the form is validated (only when something changed) before any workflow call
    expect(beforeSaving).toContain('if (!projectDirty) {')
    expect(beforeSaving).toContain('if (!validate()) return')
  })

  it('sends status, handover_date and the province_code from the edit form', () => {
    expect(payloadBuilder).toContain('status: values.status')
    expect(payloadBuilder).toContain('handover_date: toHandoverDatePayload(values.handover_date)')
    expect(payloadBuilder).toContain('province: values.province.trim()')
  })

  it('preserves the current logo_url when no new image is chosen, uploads the new one otherwise', () => {
    // The saved logo starts as project.logo_url and follows a successful save (partial save keeps it).
    expect(source).toContain("useState(project.logo_url ?? '')")
    expect(submit).toContain('let logo_url = savedLogoUrl')
    expect(submit).toContain('if (logo.file) {')
    expect(submit).toContain('projectId: project.id')
    expect(submit).toContain('buildProjectUpdatePayload(project, values, logo_url, bankPayload)')
  })

  it('keeps workflow errors on the edit page and goes back to the detail only after success', () => {
    const finish = source.slice(source.indexOf('const finishWithSuccess'), source.indexOf('const submit = async'))

    expect(submit).toContain('setSubmitError(err instanceof ProjectLogoUploadError')
    expect(submit).toContain('err instanceof Error ? err.message')
    // navigation lives in finishWithSuccess, called only after WF_BO_UPDATE_PROJECT succeeded
    expect(finish).toContain('router.push(`/${locale}${detailHref}`)')
    expect(submit).not.toContain('router.push(')
    expect(submit.indexOf('finishWithSuccess(')).toBeGreaterThan(submit.indexOf('await propertyAggregateService.update_project_detail'))
    expect(submit.slice(submit.indexOf('} catch (err) {'))).not.toContain('finishWithSuccess(')
  })
})
