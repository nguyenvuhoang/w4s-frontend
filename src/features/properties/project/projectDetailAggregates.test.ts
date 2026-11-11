import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { runFODynamic } = vi.hoisted(() => ({ runFODynamic: vi.fn() }))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

let propertyAggregateService: typeof import('../propertyAggregateService').propertyAggregateService

beforeAll(async () => {
  ({ propertyAggregateService } = await import('../propertyAggregateService'))
})

beforeEach(() => runFODynamic.mockReset())

// Real WF_BO_GET_PROJECT_DETAIL response: aggregates at the root, next to `project`.
const REAL_DETAIL = {
  project: {
    id: 16,
    project_code: 'TEST IT',
    name: 'TEST IT',
    project_type: null,
    investor: null,
    province: 'Thành phố Hồ Chí Minh',
    address: 'thủ đức',
    description: 'test123',
    logo_url: null,
    handover_date: '2026-09-28T17:00:00Z',
    status: 'A',
    created_by: null,
    updated_by: 'NGHĨA ĐẠI ĐOÀN'
  },
  total_buildings: 3,
  total_floors: 5,
  total_apartments: 7,
  total_residents: 44,
  active_residents: 14,
  inactive_residents: 12
}

const load = async (data: unknown) => {
  runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data })

  return propertyAggregateService.get_project_detail({ sessiontoken: 'token', language: 'vi', project_id: 16 })
}

describe('WF_BO_GET_PROJECT_DETAIL mapping', () => {
  it('maps the project info and the six root aggregates (3, 5, 7, 44, 14, 12)', async () => {
    const project = await load(REAL_DETAIL)

    expect(runFODynamic.mock.calls[0][0]).toMatchObject({ workflowid: 'WF_BO_GET_PROJECT_DETAIL', input: { project_id: 16 } })
    expect(project).toMatchObject({
      id: 16,
      project_code: 'TEST IT',
      province: 'Thành phố Hồ Chí Minh',
      address: 'thủ đức',
      description: 'test123',
      investor: null,
      handover_date: '2026-09-28T17:00:00Z',
      status: 'active',
      total_buildings: 3,
      total_floors: 5,
      total_apartments: 7,
      total_residents: 44,
      active_residents: 14,
      inactive_residents: 12
    })
    expect(project).not.toHaveProperty('project_type')
  })

  it('keeps an explicit 0 and leaves missing aggregates undefined (never a made-up value)', async () => {
    const zeros = await load({ ...REAL_DETAIL, total_residents: 0, active_residents: 0, inactive_residents: 0 })
    const missing = await load({ project: REAL_DETAIL.project })

    expect(zeros).toMatchObject({ total_residents: 0, active_residents: 0, inactive_residents: 0 })
    expect(missing).toMatchObject({ total_buildings: undefined, total_residents: undefined, active_residents: undefined, inactive_residents: undefined })
  })

  it('reads the aggregates from the response root, not from project.*, and never uses total residents as active residents', async () => {
    const project = await load({
      project: { ...REAL_DETAIL.project, total_buildings: 99, active_residents: 99 },
      total_buildings: 3,
      total_residents: 44
    })

    expect(project?.total_buildings).toBe(3)
    expect(project?.total_residents).toBe(44)
    expect(project?.active_residents).toBeUndefined()
  })
})

// Real WF_BO_GET_BUILDING_BY_PROJECT_ID response (project 2): per-building counts + project totals.
const REAL_BUILDINGS = {
  project_id: 2,
  buildings: [
    { id: 9, building_id: 9, building_code: 'CA-T1', project_id: 2, name: 'CA-T1', floor_count: 12, total_apartments: 82, active_residents: 93, display_order: 1, status: 'A', image_url: null },
    { id: 10, building_id: 10, building_code: 'CA-T2', project_id: 2, name: 'CA-T2', floor_count: 16, total_apartments: 142, active_residents: 143, display_order: 2, status: 'A', image_url: null },
    { id: 42, building_id: 42, building_code: 'TEST', project_id: 2, name: 'TEST', floor_count: 1, total_apartments: 2, active_residents: 7, display_order: 3, status: 'I', image_url: null }
  ],
  total_floors: 29,
  total_apartments: 226,
  total_residents: 255
}

const loadBuildings = async (data: unknown) => {
  runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data })

  return propertyAggregateService.get_buildings_by_project_id({ sessiontoken: 'token', language: 'en', project_id: 2 })
}

describe('WF_BO_GET_BUILDING_BY_PROJECT_ID mapping', () => {
  it('maps total_apartments / active_residents of each building as returned', async () => {
    const result = await loadBuildings(REAL_BUILDINGS)

    expect(runFODynamic.mock.calls[0][0]).toMatchObject({ workflowid: 'WF_BO_GET_BUILDING_BY_PROJECT_ID', input: { project_id: 2 } })
    expect(result.buildings.map(building => [building.name, building.floor_count, building.total_apartments, building.active_residents, building.status])).toEqual([
      ['CA-T1', 12, 82, 93, 'active'],
      ['CA-T2', 16, 142, 143, 'active'],
      ['TEST', 1, 2, 7, 'inactive']
    ])
  })

  it('keeps the project-level totals unchanged', async () => {
    const result = await loadBuildings(REAL_BUILDINGS)

    expect(result).toMatchObject({ total_floors: 29, total_apartments: 226, total_residents: 255 })
  })

  it('keeps an explicit 0; a null or missing count stays null (never the project total, never 0)', async () => {
    const [first, second, third] = REAL_BUILDINGS.buildings
    const { total_apartments: _omitUnits, active_residents: _omitResidents, ...withoutCounts } = third
    const result = await loadBuildings({
      ...REAL_BUILDINGS,
      buildings: [
        { ...first, total_apartments: 0, active_residents: 0 },
        { ...second, total_apartments: null, active_residents: null },
        withoutCounts
      ]
    })

    expect(result.buildings.map(building => [building.total_apartments, building.active_residents])).toEqual([
      [0, 0],
      [null, null],
      [null, null]
    ])
  })
})

// WF_BO_GET_PROJECT_DETAIL does not return the bank objects yet (real response above): mapped only when present.
describe('WF_BO_GET_PROJECT_DETAIL bank accounts', () => {
  const operating = { bank_name: 'Vietcombank', account_number: '001234567890', account_holder: 'BQL AN GIA RIVERSIDE', transfer_content: 'AGR [CanHo] Dong phi quan ly' }
  const deposit = { bank_name: 'Techcombank', account_number: '009876543210', account_holder: 'BQL AN GIA RIVERSIDE', transfer_content: 'AGR [CanHo] Dat coc tien ich' }

  it('real response (no bank objects): both accounts null, nothing made up', async () => {
    const project = await load(REAL_DETAIL)

    expect(project?.operating_bank_account).toBeNull()
    expect(project?.deposit_bank_account).toBeNull()
  })

  it('maps operating / deposit objects when the response carries them, account_number kept as a string', async () => {
    const project = await load({ ...REAL_DETAIL, project: { ...REAL_DETAIL.project, operating_bank_account: operating, deposit_bank_account: deposit } })

    expect(project?.operating_bank_account).toEqual(operating)
    expect(project?.deposit_bank_account).toEqual(deposit)
    expect(project?.operating_bank_account?.account_number).toBe('001234567890')
  })

  it('also reads them next to `project` at the response root; null objects stay null', async () => {
    const project = await load({ ...REAL_DETAIL, operating_bank_account: operating, deposit_bank_account: null })

    expect(project?.operating_bank_account).toEqual(operating)
    expect(project?.deposit_bank_account).toBeNull()
  })
})
