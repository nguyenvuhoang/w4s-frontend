import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApartmentSearchFilter } from './types'

const { runFODynamic, hookState } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  hookState: { slots: [] as unknown[], index: 0 }
}))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@/@core/stores/useWorkingProjectStore', () => ({ useWorkingProject: () => ({ id: 1, code: 'AGR', name: 'AN GIA RIVERSIDE' }) }))

// Minimal hook runner: state/ref slots survive between "renders"; effects are not run (handlers are called directly).
vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>()
  const slot = (init: () => unknown) => {
    const index = hookState.index++

    if (!(index in hookState.slots)) hookState.slots[index] = init()

    return index
  }

  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = slot(() => (typeof initial === 'function' ? (initial as () => unknown)() : initial))

      return [hookState.slots[index], (next: unknown) => {
        hookState.slots[index] = typeof next === 'function' ? (next as (value: unknown) => unknown)(hookState.slots[index]) : next
      }]
    },
    useRef: (initial: unknown) => hookState.slots[slot(() => ({ current: initial }))],
    useCallback: (fn: unknown) => fn,
    useEffect: () => undefined
  }
})

let service: typeof import('./services/apartmentSearchService')
let helpers: typeof import('./apartmentHelpers')
let useApartmentSearch: typeof import('./hooks/useApartmentSearch').useApartmentSearch

beforeAll(async () => {
  service = await import('./services/apartmentSearchService')
  helpers = await import('./apartmentHelpers')
  ;({ useApartmentSearch } = await import('./hooks/useApartmentSearch'))
})

const ok = (data: unknown) => ({ success: true, code: 'success', errors: [], data })
const page = (items: unknown[], total_count = items.length, has_next_page = false) => ok({ items, total_count, has_next_page })

const TOWERS = [{ id: 74, building_code: 'A1', name: 'A1', status: 'A' }, { id: 75, building_code: 'AG', name: 'Tháp AG', status: 'A' }]
const FLOORS: Record<number, unknown[]> = {
  74: [{ id: 835, floor_code: '01', floor_no: 0, name: null, status: 'A', building_id: 74 }],
  75: [{ id: 900, floor_code: 'AG-F02', floor_no: '02', name: 'Tầng 2', status: 'A', building_id: 75 }]
}

const byWorkflow = (workflowid: string) => runFODynamic.mock.calls.map(call => call[0]).filter(call => call.workflowid === workflowid)

beforeEach(() => {
  hookState.slots = []
  runFODynamic.mockReset()
  runFODynamic.mockImplementation(async ({ workflowid, input }) => {
    if (workflowid === 'WF_BO_SIMPLE_SEARCH_BUILDINGS') return page(TOWERS)
    if (workflowid === 'WF_BO_SIMPLE_SEARCH_FLOORS') return page(FLOORS[input.building_id] ?? [])
    if (workflowid === 'WF_BO_ADVANCED_SEARCH_APARTMENT') return ok({ items: [], total_count: 0, total_pages: 0, page_index: 1, page_size: input.page_size })

    throw new Error(`unexpected ${workflowid}`)
  })
})

describe('tower / floor option datasources', () => {
  it('towers come from WF_BO_SIMPLE_SEARCH_BUILDINGS of the project (value = id)', async () => {
    const options = await service.apartmentSearchService.simpleSearchBuildings({ sessiontoken: 'token', project_id: 1 })

    expect(byWorkflow('WF_BO_SIMPLE_SEARCH_BUILDINGS')[0].input).toMatchObject({ project_id: 1, page_index: 0, page_size: 100 })
    expect(options.map(option => option.id)).toEqual([74, 75])
  })

  it('loads every page instead of silently truncating (>100 towers)', async () => {
    const many = Array.from({ length: 150 }, (_, index) => ({ id: index + 1, building_code: `T${index + 1}`, name: `T${index + 1}`, status: 'A' }))

    runFODynamic.mockImplementation(async ({ input }) => page(many.slice(input.page_index * input.page_size, (input.page_index + 1) * input.page_size), 150, input.page_index === 0))

    const options = await service.apartmentSearchService.simpleSearchBuildings({ sessiontoken: 'token', project_id: 1 })

    expect(options).toHaveLength(150)
    expect(runFODynamic.mock.calls.map(call => call[0].input.page_index)).toEqual([0, 1])
  })

  it('floors come from WF_BO_SIMPLE_SEARCH_FLOORS of the selected tower only', async () => {
    const options = await service.apartmentSearchService.simpleSearchFloors({ sessiontoken: 'token', project_id: 1, building_id: 74 })

    expect(byWorkflow('WF_BO_SIMPLE_SEARCH_FLOORS')[0].input).toMatchObject({ project_id: 1, building_id: 74 })
    expect(options.map(option => option.id)).toEqual([835])
  })

  it('labels: tower "[code] name"; floor code "01" with floor_no 0 is shown as "01", never "0" / "Tầng 0"', async () => {
    const [floor] = await service.apartmentSearchService.simpleSearchFloors({ sessiontoken: 'token', project_id: 1, building_id: 74 })

    expect(helpers.formatApartmentFloorLabel(floor)).toBe('01')
    expect(helpers.formatApartmentFloorLabel({ name: 'Tầng 2', floor_code: 'AG-F02' })).toBe('Tầng 2')
    expect(helpers.formatApartmentBuildingLabel({ building_code: 'AG', name: 'Tháp AG' })).toBe('[AG] Tháp AG')
    expect(helpers.formatApartmentBuildingLabel({ building_code: 'A1', name: 'A1' })).toBe('A1')
  })
})

describe('cascading filter -> WF_BO_ADVANCED_SEARCH_APARTMENT', () => {
  const initialFilter: ApartmentSearchFilter = { ...({} as ApartmentSearchFilter), page_size: 20, page_index: 3, search_text: '', project_id: 1, building_id: null, floor_id: null, status: 'all', qr_payment_enabled: 'all' }
  // Named like a hook: it re-runs useApartmentSearch as React would on each render.
  const useSearch = () => {
    rewind()

    return useApartmentSearch({
      dictionary: { propertyManagement: {} } as any,
      sessiontoken: 'token',
      language: 'vi',
      initialFilter,
      initialData: { items: [], total_count: 0, total_pages: 0, page_index: 3, page_size: 20, has_previous_page: false, has_next_page: false }
    })
  }
  const flush = () => new Promise(resolve => setTimeout(resolve, 0))
  const lastApartmentRequest = () => byWorkflow('WF_BO_ADVANCED_SEARCH_APARTMENT').at(-1).input

  it('tower change: floors of that tower only, floor cleared, search from page 0 with the same page size', async () => {
    useSearch().handleBuildingChange(74)
    await flush()

    expect(byWorkflow('WF_BO_SIMPLE_SEARCH_FLOORS').map(call => call.input.building_id)).toEqual([74])
    expect(useSearch().floorOptions.map(option => option.id)).toEqual([835])
    expect(lastApartmentRequest()).toEqual({
      page_size: 20, page_index: 0, search_text: '', project_id: 1, building_id: 74, floor_id: null, status: null, qr_payment_status: null
    })
  })

  it('floor change sends floor_id (page 0); switching tower A -> B clears the old floor', async () => {
    useSearch().handleBuildingChange(74)
    await flush()
    useSearch().handleFloorChange(835)
    await flush()

    expect(lastApartmentRequest()).toMatchObject({ building_id: 74, floor_id: 835, page_index: 0, page_size: 20 })

    useSearch().handleBuildingChange(75)
    await flush()

    expect(lastApartmentRequest()).toMatchObject({ building_id: 75, floor_id: null, page_index: 0 })
    expect(useSearch().draftFilter.floor_id).toBeNull()
    expect(useSearch().floorOptions.map(option => option.id)).toEqual([900])
  })

  it('"Tất cả tháp" resets tower and floor (and the floor options)', async () => {
    useSearch().handleBuildingChange(74)
    await flush()
    useSearch().handleBuildingChange(null)
    await flush()

    expect(lastApartmentRequest()).toMatchObject({ building_id: null, floor_id: null, page_index: 0 })
    expect(useSearch().floorOptions).toEqual([])
    expect(byWorkflow('WF_BO_SIMPLE_SEARCH_FLOORS')).toHaveLength(1)
  })

  it('a slow floor response of the previous tower cannot overwrite the new tower floors', async () => {
    let releaseOld: () => void = () => undefined

    runFODynamic.mockImplementation(async ({ workflowid, input }) => {
      if (workflowid === 'WF_BO_SIMPLE_SEARCH_FLOORS' && input.building_id === 74) {
        await new Promise<void>(resolve => { releaseOld = resolve })

        return page(FLOORS[74])
      }
      if (workflowid === 'WF_BO_SIMPLE_SEARCH_FLOORS') return page(FLOORS[input.building_id] ?? [])

      return ok({ items: [], total_count: 0, total_pages: 0, page_index: 1, page_size: 20 })
    })

    useSearch().handleBuildingChange(74)
    useSearch().handleBuildingChange(75)
    await flush()
    releaseOld()
    await flush()

    expect(useSearch().floorOptions.map(option => option.id)).toEqual([900])
  })

  it('status / search reset to page 0 and keep the page size', async () => {
    useSearch().applyFilter('status', 'I')
    await flush()
    expect(lastApartmentRequest()).toMatchObject({ status: 'I', page_index: 0, page_size: 20 })

    useSearch().handleSearch()
    await flush()
    expect(lastApartmentRequest()).toMatchObject({ page_index: 0, page_size: 20 })
  })
})

describe('list screen wiring', () => {
  const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')

  it('tower/floor selects: ids as values, "" = all, Tháp/Tower labels, shared label helpers', () => {
    const page = read('./ApartmentManagementPage.tsx')

    expect(page).toContain("label={apartmentText(dictionary, 'building', 'Tower')}")
    expect(page).toContain('<MenuItem value="">{apartmentText(dictionary, \'allBuildings\', \'All towers\')}</MenuItem>')
    expect(page).toContain('<MenuItem key={building.id} value={building.id}>{formatApartmentBuildingLabel(building)}</MenuItem>')
    expect(page).toContain('<MenuItem key={floor.id} value={floor.id}>{formatApartmentFloorLabel(floor)}</MenuItem>')
    expect(page).not.toMatch(/'All buildings'|'Building'\)/)
  })

  it('apartments are filtered by the Backend only (no client-side filtering, no mock/seed)', () => {
    for (const source of [read('./hooks/useApartmentSearch.ts'), read('./ApartmentManagementPage.tsx')]) {
      expect(source).not.toMatch(/rows\.filter\(|items\.filter\(|apartments\.filter\(|apartments_seed|propertyAggregateService/)
    }
    expect(read('./services/apartmentSearchService.ts')).not.toMatch(/apartments_seed|propertyAggregateService/)
  })
})

// Each hook "render" reads its slots from the start again.
function rewind() {
  hookState.index = 0
}
