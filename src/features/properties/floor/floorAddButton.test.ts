import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { permission, captured, openCreate, searchState } = vi.hoisted(() => ({
  permission: { resolved: true, allowed: [] as string[], hrefs: [] as Array<string | undefined> },
  captured: [] as Array<{ name: string; props: Record<string, any> }>,
  openCreate: vi.fn(),
  searchState: { selectedBuilding: { id: 101, building_code: 'A1', name: 'A1', status: 'A' } as Record<string, unknown> | null }
}))

// The real PermissionGuard is used; only the menu-based permission lookup is controlled here.
vi.mock('@/shared/permissions/usePermission', () => ({
  usePermission: ({ href }: { href?: string } = {}) => {
    permission.hrefs.push(href)

    return { resolved: permission.resolved, can: (action: string) => permission.allowed.includes(action) }
  }
}))

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')

  const make = (name: string) => (props: Record<string, any>) => {
    captured.push({ name, props })

    return h(Fragment, null, props.label ?? null, props.children ?? null)
  }

  return {
    Alert: make('Alert'), Box: make('Box'), Button: make('Button'), Chip: make('Chip'), InputAdornment: make('InputAdornment'),
    MenuItem: make('MenuItem'), Paper: make('Paper'), Stack: make('Stack'), TextField: make('TextField'), Typography: make('Typography')
  }
})
vi.mock('@mui/material/styles', () => ({ alpha: () => '' }))
for (const icon of ['Add', 'Apartment', 'Business', 'Domain', 'Layers']) {
  vi.doMock(`@mui/icons-material/${icon}`, () => ({ default: () => null }))
}
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@/@core/components/jTable/pagination', () => ({ default: () => null }))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/shared/components/project-context/RequireWorkingProject', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/shared/services/projectLookupService', () => ({
  formatProjectLabel: (project: { code: string; name: string }) => `[${project.code}] ${project.name}`
}))
vi.mock('./FloorFilterBar', () => ({ default: () => null }))
vi.mock('./FloorTable', () => ({ default: () => null }))
vi.mock('./FloorFormDialog', () => ({ default: () => null }))
vi.mock('./hooks/useFloorForm', () => ({ useFloorForm: () => ({ openCreate }) }))

const buildingOptions = [
  { id: 101, building_code: 'A1', name: 'A1', status: 'A' },
  { id: 102, building_code: 'A2', name: 'A2', status: 'A' },
  { id: 103, building_code: 'B1', name: 'B1', status: 'A' },
  { id: 104, building_code: 'B2', name: 'B2', status: 'A' }
]

vi.mock('./hooks/useFloorSearch', () => ({
  useFloorSearch: () => ({
    selectedProject: { id: 5, code: 'AGR', name: 'AN GIA RIVERSIDE' },
    selectedBuilding: searchState.selectedBuilding,
    buildingOptions,
    buildingsLoading: false,
    buildingsError: null,
    draftFilter: {},
    filter: { page_index: 1, page_size: 10 },
    rows: [],
    totalCount: 1,
    loading: false,
    error: null,
    loadData: vi.fn()
  })
}))

let FloorManagementPage: typeof import('./FloorManagementPage').default

beforeAll(async () => {
  ({ default: FloorManagementPage } = await import('./FloorManagementPage'))
})

beforeEach(() => {
  captured.length = 0
  openCreate.mockReset()
  permission.resolved = true
  permission.allowed = []
  permission.hrefs = []
  searchState.selectedBuilding = buildingOptions[0]
})

const dictionary = {
  propertyManagement: { floorGroups: 'Nhóm theo tháp', buildings: 'tháp', addFloor: 'Thêm tầng', buildingContextSelector: 'Tháp đang quản lý' },
  common: {}
} as any

const render = () => renderToStaticMarkup(createElement(FloorManagementPage, {
  dictionary,
  session: null,
  locale: 'vi',
  initialFilter: {} as any,
  initialData: {} as any
}))

const addButton = () => captured.find(item => item.name === 'Button' && item.props.children === 'Thêm tầng')

describe('Floor list "Add floor" action', () => {
  it('ADD -> "Thêm tầng" in the header next to the managed tower selector', () => {
    permission.allowed = ['ADD']

    const html = render()

    expect(addButton()).toBeDefined()
    expect(html.indexOf('Tháp đang quản lý')).toBeLessThan(html.indexOf('Thêm tầng'))
    expect(permission.hrefs).toContain('/properties/floor')
  })

  it('no ADD, or permissions still loading -> no button', () => {
    permission.allowed = ['VIEW', 'MODIFY', 'DELETE']
    render()
    expect(addButton()).toBeUndefined()

    captured.length = 0
    permission.resolved = false
    permission.allowed = ['ADD']
    render()
    expect(addButton()).toBeUndefined()
  })

  it('does not depend on a tower being selected (the form lets the user pick one)', () => {
    permission.allowed = ['ADD']
    searchState.selectedBuilding = null

    render()

    expect(addButton()).toBeDefined()
  })

  it('click opens the create form with the managed tower id (not its code) preselected', () => {
    permission.allowed = ['ADD']
    render()

    addButton()!.props.onClick()

    expect(openCreate).toHaveBeenCalledWith(101, buildingOptions)
  })

  it('no longer shows the "{n} tháp" badge', () => {
    permission.allowed = ['ADD']

    const html = render()

    expect(html).toContain('Nhóm theo tháp')
    expect(html).not.toContain('4 tháp')
    expect(captured.some(item => item.name === 'Chip')).toBe(false)
  })

  it('uses the real Floor permission (nothing hard-coded) and reloads the list after a successful create', () => {
    const source = readFileSync(new URL('./FloorManagementPage.tsx', import.meta.url), 'utf8')

    expect(source).toContain('<PermissionGuard href="/properties/floor" action="ADD">')
    expect(source).not.toMatch(/isAdmin|isSuperAdmin|username|canAdd\s*=\s*true|create_floor\(|propertyAggregateService/)
    expect(source).toContain('await floors.loadData()')
  })
})
