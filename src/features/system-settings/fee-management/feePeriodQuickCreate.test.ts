import { beforeEach, describe, expect, it, vi } from 'vitest'

const runFODynamic = vi.fn()

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic: (...args: unknown[]) => runFODynamic(...args) } }))

import {
  buildFeePeriodGeneratePreviewInput,
  FEE_PERIOD_BATCH_SAVE_WORKFLOW_ID,
  FEE_PERIOD_CREATE_WORKFLOW_ID,
  FEE_PERIOD_GENERATE_YEAR_WORKFLOW_ID,
  feeService,
  mapFeePeriodGeneratePreviewResponse,
  type FeePeriodGeneratePreviewSetup
} from '@/features/fees/service'
import type { FeePeriodBatchSaveRequest, FeePeriodPreviewItem } from '@/features/fees/types'

import { requestFeePeriodPreview, submitFeePeriodDrafts } from './feePeriodQuickCreate.actions'
import {
  buildFeePeriodBatchSaveItems,
  createFeePeriodDrafts,
  FEE_PERIOD_DRAFT_INVALID_DATE,
  groupFeePeriodDrafts,
  isFeePeriodDraftsDirty,
  toDraftDateInput,
  toDraftDatePayload,
  updateFeePeriodDraft,
  validateFeePeriodDrafts
} from './feePeriodQuickCreate.draft'

const successResponse = (data: unknown) => ({ payload: { dataresponse: { code: 'success', success: true, execution_id: 'exec-1', data, errors: [] } } })

const period = (month: number, overrides: Partial<FeePeriodPreviewItem> = {}): FeePeriodPreviewItem => ({
  period_code: `PRJ1_PERIOD_2026_${String(month).padStart(2, '0')}`,
  period_name: `Thông báo phí T${String(month).padStart(2, '0')}/2026`,
  project_id: 1,
  project_code: 'PRJ1',
  project_name: 'Project 1',
  year: 2026,
  month,
  from_date: `2026-${String(month).padStart(2, '0')}-01T00:00:00Z`,
  to_date: `2026-${String(month).padStart(2, '0')}-28T23:59:59Z`,
  due_date: `2026-${String(month).padStart(2, '0')}-05T23:59:59Z`,
  status: 'OPEN',
  description: '',
  ...overrides
})

const setup = (overrides: Partial<FeePeriodGeneratePreviewSetup> = {}): FeePeriodGeneratePreviewSetup => ({
  applyAllProjects: false,
  projectId: 1,
  year: 2026,
  fromDayOfMonth: 1,
  dueDayOfMonth: 5,
  prefix: 'Thông báo phí',
  ...overrides
})

beforeEach(() => {
  runFODynamic.mockReset()
})

describe('generate preview request', () => {
  it('always sends preview_only: true with the single project id', async () => {
    runFODynamic.mockResolvedValue(successResponse({ periods: [period(1)] }))

    await feeService.generateFeePeriodPreview({ sessiontoken: 'token', language: 'vi', setup: setup() })

    expect(runFODynamic).toHaveBeenCalledTimes(1)
    expect(runFODynamic.mock.calls[0][0]).toMatchObject({
      workflowid: FEE_PERIOD_GENERATE_YEAR_WORKFLOW_ID,
      input: {
        project_id: 1,
        year: 2026,
        apply_all_projects: false,
        due_day_of_month: 5,
        from_day_of_month: 1,
        prefix: 'Thông báo phí',
        preview_only: true
      }
    })
  })

  it('omits project_id when applied to all projects', () => {
    const input = buildFeePeriodGeneratePreviewInput(setup({ applyAllProjects: true, projectId: 7 }))

    expect(input).not.toHaveProperty('project_id')
    expect(input).toMatchObject({ apply_all_projects: true, preview_only: true })
  })

  it('requires a project when not applied to all projects and does not call the workflow', async () => {
    const generate = vi.fn()
    const outcome = await requestFeePeriodPreview({ setup: setup({ projectId: null }), inFlight: { current: false }, generate })

    expect(outcome).toEqual({ status: 'invalid', errors: { projectId: 'project_required' } })
    expect(generate).not.toHaveBeenCalled()
  })

  it('does not require a project when applied to all projects', async () => {
    const generate = vi.fn().mockResolvedValue({ periods: [], executionId: null })
    const outcome = await requestFeePeriodPreview({ setup: setup({ applyAllProjects: true, projectId: null }), inFlight: { current: false }, generate })

    expect(outcome.status).toBe('ok')
  })

  it('reads the periods from data.periods and never calls Batch Save', async () => {
    runFODynamic.mockResolvedValue(successResponse({ periods: [period(1), period(2)] }))

    const result = await feeService.generateFeePeriodPreview({ sessiontoken: 'token', language: 'vi', setup: setup() })

    expect(result.periods.map(item => item.period_code)).toEqual(['PRJ1_PERIOD_2026_01', 'PRJ1_PERIOD_2026_02'])
    expect(runFODynamic.mock.calls.some(([request]) => request.workflowid === FEE_PERIOD_BATCH_SAVE_WORKFLOW_ID)).toBe(false)
  })

  it('maps no period when data.periods is missing instead of generating them on the client', () => {
    expect(mapFeePeriodGeneratePreviewResponse(successResponse({})).periods).toEqual([])
  })
})

describe('editable drafts', () => {
  it('editing one row leaves the other rows untouched', () => {
    const rows = createFeePeriodDrafts([period(1), period(2)])
    const next = updateFeePeriodDraft(rows, rows[0].key, 'period_name', 'Kỳ phí dịch vụ T01/2026')

    expect(next[0].period_name).toBe('Kỳ phí dịch vụ T01/2026')
    expect(next[1]).toBe(rows[1])
    expect(rows[0].period_name).toBe('Thông báo phí T01/2026')
    expect(isFeePeriodDraftsDirty(next)).toBe(true)
    expect(isFeePeriodDraftsDirty(rows)).toBe(false)
  })

  it('groups the periods by project', () => {
    const rows = createFeePeriodDrafts([
      period(1),
      period(1, { project_id: 2, project_code: 'PRJ2', project_name: 'Project 2', period_code: 'PRJ2_PERIOD_2026_01' }),
      period(2)
    ])
    const groups = groupFeePeriodDrafts(rows)

    expect(groups.map(group => [group.label, group.rows.length])).toEqual([['[PRJ1] Project 1', 2], ['[PRJ2] Project 2', 1]])
  })
})

describe('draft validation', () => {
  it('reports errors at the row and field', () => {
    let rows = createFeePeriodDrafts([period(1), period(2)])

    rows = updateFeePeriodDraft(rows, '0', 'period_name', '   ')
    rows = updateFeePeriodDraft(rows, '1', 'from_date', '2026-02-20')
    rows = updateFeePeriodDraft(rows, '1', 'to_date', '2026-02-10')
    rows = updateFeePeriodDraft(rows, '1', 'due_date', '2026-02-30')

    expect(validateFeePeriodDrafts(rows)).toEqual({
      '0': { period_name: 'quick_create_error_period_name_required' },
      '1': { from_date: 'quick_create_error_from_after_to', due_date: 'quick_create_error_due_date_invalid' }
    })
  })

  it('rejects a start date outside the period month and an incomplete keyboard entry', () => {
    let rows = createFeePeriodDrafts([period(1), period(2)])

    rows = updateFeePeriodDraft(rows, '0', 'from_date', '2026-02-01')
    rows = updateFeePeriodDraft(rows, '1', 'due_date', FEE_PERIOD_DRAFT_INVALID_DATE)

    expect(validateFeePeriodDrafts(rows)).toEqual({
      '0': { from_date: 'quick_create_error_from_date_out_of_period' },
      '1': { due_date: 'quick_create_error_due_date_invalid' }
    })
  })

  it('flags duplicate (project_id, year, month) and duplicate period_code', () => {
    const rows = createFeePeriodDrafts([period(1), period(1, { period_code: 'OTHER' }), period(3, { period_code: 'PRJ1_PERIOD_2026_04' }), period(4)])
    const errors = validateFeePeriodDrafts(rows)

    expect(Object.keys(errors)).toEqual(['0', '1', '2', '3'])
    expect(Object.values(errors).every(error => error.identity === 'quick_create_error_duplicate')).toBe(true)
  })

  it('does not call Batch Save when data is invalid or the list is empty', async () => {
    const save = vi.fn()
    const rows = updateFeePeriodDraft(createFeePeriodDrafts([period(1)]), '0', 'to_date', '')

    expect((await submitFeePeriodDrafts({ rows, inFlight: { current: false }, save })).status).toBe('invalid')
    expect((await submitFeePeriodDrafts({ rows: [], inFlight: { current: false }, save })).status).toBe('empty')
    expect(save).not.toHaveBeenCalled()
  })

  it('does not require the due date to be within the period', () => {
    const rows = updateFeePeriodDraft(createFeePeriodDrafts([period(1)]), '0', 'due_date', '2026-02-10')

    expect(validateFeePeriodDrafts(rows)).toEqual({})
  })
})

describe('batch save', () => {
  it('sends exactly the edited data without display-only fields', async () => {
    runFODynamic.mockResolvedValue(successResponse({ saved_count: 2 }))

    let rows = createFeePeriodDrafts([period(1), period(2)])

    rows = updateFeePeriodDraft(rows, '0', 'period_name', ' Kỳ phí dịch vụ T01/2026 ')
    rows = updateFeePeriodDraft(rows, '0', 'due_date', '2026-01-10')
    rows = updateFeePeriodDraft(rows, '1', 'description', 'Ghi chú')

    const outcome = await submitFeePeriodDrafts({
      rows,
      inFlight: { current: false },
      save: fields => feeService.batchSaveFeePeriods({ sessiontoken: 'token', language: 'vi', fields })
    })

    expect(outcome).toEqual({ status: 'saved', result: { savedCount: 2, executionId: 'exec-1' } })
    expect(runFODynamic).toHaveBeenCalledTimes(1)

    const request = runFODynamic.mock.calls[0][0]

    expect(request.workflowid).toBe(FEE_PERIOD_BATCH_SAVE_WORKFLOW_ID)
    expect(request.input).toEqual({
      periods: [
        {
          period_code: 'PRJ1_PERIOD_2026_01',
          period_name: 'Kỳ phí dịch vụ T01/2026',
          project_id: 1,
          year: 2026,
          month: 1,
          from_date: '2026-01-01T00:00:00Z',
          to_date: '2026-01-28T23:59:59Z',
          due_date: '2026-01-10T23:59:59Z',
          status: 'OPEN',
          description: ''
        },
        {
          period_code: 'PRJ1_PERIOD_2026_02',
          period_name: 'Thông báo phí T02/2026',
          project_id: 1,
          year: 2026,
          month: 2,
          from_date: '2026-02-01T00:00:00Z',
          to_date: '2026-02-28T23:59:59Z',
          due_date: '2026-02-05T23:59:59Z',
          status: 'OPEN',
          description: 'Ghi chú'
        }
      ]
    } satisfies FeePeriodBatchSaveRequest)
  })

  it('keeps every edit when Batch Save fails', async () => {
    const rows = updateFeePeriodDraft(createFeePeriodDrafts([period(1)]), '0', 'period_name', 'Đã sửa')
    const snapshot = structuredClone(rows)
    const onSaved = vi.fn()
    const outcome = await submitFeePeriodDrafts({
      rows,
      inFlight: { current: false },
      save: vi.fn().mockRejectedValue(new Error('failed')),
      onSaved
    })

    expect(outcome.status).toBe('failed')
    expect(rows).toEqual(snapshot)
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('surfaces a workflow error response as a failure', async () => {
    runFODynamic.mockResolvedValue({ payload: { dataresponse: { code: 'failed', success: false, execution_id: 'exec-err', errors: [{ info: 'Invalid period' }] } } })

    const outcome = await submitFeePeriodDrafts({
      rows: createFeePeriodDrafts([period(1)]),
      inFlight: { current: false },
      save: fields => feeService.batchSaveFeePeriods({ sessiontoken: 'token', language: 'vi', fields })
    })

    expect(outcome.status).toBe('failed')
  })

  it('blocks a double submit while saving', async () => {
    let resolveSave: (value: { savedCount: number; executionId: null }) => void = () => {}
    const save = vi.fn(() => new Promise<{ savedCount: number; executionId: null }>(resolve => { resolveSave = resolve }))
    const inFlight = { current: false }
    const rows = createFeePeriodDrafts([period(1)])
    const first = submitFeePeriodDrafts({ rows, inFlight, save })
    const second = await submitFeePeriodDrafts({ rows, inFlight, save })

    expect(second).toEqual({ status: 'busy' })
    resolveSave({ savedCount: 1, executionId: null })
    expect((await first).status).toBe('saved')
    expect(save).toHaveBeenCalledTimes(1)
    expect(inFlight.current).toBe(false)
  })

  it('refreshes the list only after a successful save', async () => {
    const onSaved = vi.fn()

    await submitFeePeriodDrafts({
      rows: createFeePeriodDrafts([period(1)]),
      inFlight: { current: false },
      save: vi.fn().mockResolvedValue({ savedCount: 1, executionId: null }),
      onSaved
    })

    expect(onSaved).toHaveBeenCalledWith({ savedCount: 1, executionId: null })
  })
})

describe('datetime handling', () => {
  it('keeps the UTC calendar date of backend timestamps', () => {
    expect(toDraftDateInput('2026-01-31T23:59:59Z')).toBe('2026-01-31')
    expect(toDraftDateInput('2026-01-01T00:00:00Z')).toBe('2026-01-01')
    expect(toDraftDateInput('2026-01-01T00:00:00')).toBe('2026-01-01')
    expect(toDraftDateInput('2026-01-01T06:00:00+07:00')).toBe('2025-12-31')
  })

  it('keeps an unchanged value and the backend time of day for a changed date', () => {
    expect(toDraftDatePayload('2026-01-31', '2026-01-31T23:59:59Z', 'to_date')).toBe('2026-01-31T23:59:59Z')
    expect(toDraftDatePayload('2026-01-30', '2026-01-31T23:59:59Z', 'to_date')).toBe('2026-01-30T23:59:59Z')
    expect(toDraftDatePayload('2026-03-01', null, 'from_date')).toBe('2026-03-01T00:00:00Z')
    expect(toDraftDatePayload('2026-03-01', null, 'due_date')).toBe('2026-03-01T23:59:59Z')
  })

  it('round-trips every month without shifting the day', () => {
    const rows = createFeePeriodDrafts(Array.from({ length: 12 }, (_, index) => period(index + 1)))

    expect(buildFeePeriodBatchSaveItems(rows).map(item => [item.from_date, item.to_date, item.due_date]))
      .toEqual(rows.map(row => [row.source.from_date, row.source.to_date, row.source.due_date]))
  })
})

describe('manual fee period creation (unchanged)', () => {
  it('still calls WF_BO_CREATE_FEE_PERIOD with the given fields', async () => {
    runFODynamic.mockResolvedValue(successResponse({ id: 10 }))

    const fields = { period_code: 'P1', project_id: 1, year: 2026, month: 1, due_date: '2026-01-05T00:00:00Z' }
    const result = await feeService.createFeePeriod({ sessiontoken: 'token', language: 'vi', fields: fields as any })

    expect(runFODynamic.mock.calls[0][0]).toMatchObject({ workflowid: FEE_PERIOD_CREATE_WORKFLOW_ID, input: fields })
    expect(result.id).toBe(10)
  })
})
