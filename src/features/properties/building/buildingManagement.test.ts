import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BuildingCreatePayload, BuildingSearchFilter, BuildingUpdatePayload } from './types'

const { runFODynamic, captured, permission, routerPush } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  routerPush: vi.fn(),
  captured: [] as Array<{ name: string; props: Record<string, any> }>,
  permission: { resolved: true, allowed: [] as string[], hrefs: [] as Array<string | undefined> }
}))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

// The real PermissionGuard is used; only the menu-based permission lookup is controlled here.
vi.mock('@/shared/permissions/usePermission', () => ({
  usePermission: ({ href }: { href?: string } = {}) => {
    permission.hrefs.push(href)

    return { resolved: permission.resolved, can: (action: string) => permission.allowed.includes(action) }
  }
}))

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')

  const make = (name: string, tag?: string) => (props: Record<string, any>) => {
    captured.push({ name, props })

    return tag
      ? h(tag, null, props.children ?? null)
      : h(Fragment, null, props.label ?? null, props.children ?? null)
  }

  return {
    Alert: make('Alert'), Box: make('Box'), Button: make('Button'), Chip: make('Chip'), Dialog: make('Dialog'),
    DialogActions: make('DialogActions'), DialogContent: make('DialogContent'), DialogTitle: make('DialogTitle'),
    Grid: make('Grid'), MenuItem: make('MenuItem', 'option'), Paper: make('Paper'), Skeleton: make('Skeleton'),
    Stack: make('Stack'), Table: make('Table'), TableBody: make('TableBody'), TableCell: make('TableCell', 'td'),
    TableContainer: make('TableContainer'), TableHead: make('TableHead'), TableRow: make('TableRow', 'tr'),
    TextField: make('TextField'), Tooltip: make('Tooltip'), Typography: make('Typography')
  }
})
vi.mock('@mui/material/styles', () => ({ alpha: () => '' }))
for (const icon of ['Add', 'Apartment', 'ArrowBack', 'Autorenew', 'Business', 'CheckCircleOutline', 'DeleteOutline', 'DescriptionOutlined', 'EditOutlined', 'Layers', 'People', 'SellOutlined']) {
  vi.doMock(`@mui/icons-material/${icon}`, () => ({ default: () => null }))
}
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { token: 'token' } } }) }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: routerPush }) }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@/@core/components/jTable/pagination', () => ({
  default: ({ totalResults }: { totalResults: number }) => `${totalResults} Kết quả`
}))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/shared/components/project-context/RequireWorkingProject', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/shared/services/projectLookupService', () => ({
  projectLookupService: {},
  formatProjectLabel: (project: { code: string; name: string }) => `[${project.code}] ${project.name}`
}))
const { auditProps } = vi.hoisted(() => ({ auditProps: [] as Array<Record<string, unknown>> }))

vi.mock('@/shared/components/entity-audit/EntityAuditHistory', () => ({
  default: (props: Record<string, unknown>) => {
    auditProps.push(props)

    return null
  }
}))
vi.mock('./BuildingFilterBar', () => ({ default: () => null }))
vi.mock('./BuildingTable', () => ({ default: () => null }))
vi.mock('./hooks/useBuildingSearch', () => ({
  useBuildingSearch: () => ({
    selectedProject: { id: 5, code: 'AGR', name: 'AN GIA RIVERSIDE' },
    totalCount: 3,
    draftFilter: {},
    filter: { page_index: 1, page_size: 10 },
    rows: [],
    loading: false,
    error: null,
    loadData: vi.fn()
  })
}))

let service: typeof import('./buildingService')
let helpers: typeof import('./buildingHelpers')
let BuildingManagementPage: typeof import('./BuildingManagementPage').default
let BuildingFormDialog: typeof import('./BuildingFormDialog').default
let BuildingDetailPage: typeof import('./BuildingDetailPage').default

beforeAll(async () => {
  service = await import('./buildingService')
  helpers = await import('./buildingHelpers')
  ;({ default: BuildingManagementPage } = await import('./BuildingManagementPage'))
  ;({ default: BuildingFormDialog } = await import('./BuildingFormDialog'))
  ;({ default: BuildingDetailPage } = await import('./BuildingDetailPage'))
})

beforeEach(() => {
  runFODynamic.mockReset()
  runFODynamic.mockResolvedValue({ success: true, code: 'success', data: {}, errors: [] })
  captured.length = 0
  routerPush.mockReset()
  permission.resolved = true
  permission.allowed = []
  permission.hrefs = []
})

const dictionary = {
  propertyManagement: {
    buildingListTitle: 'Danh sách tháp',
    buildings: 'tháp',
    addBuilding: 'Thêm tháp',
    editBuilding: 'Sửa tháp',
    buildingCode: 'Mã tháp',
    buildingName: 'Tên tháp',
    floorCount: 'Số tầng',
    displayOrder: 'Thứ tự hiển thị',
    viewingProject: 'Đang xem',
    buildingDetail: 'Chi tiết tháp',
    buildingBreadcrumb: 'Bất động sản / Tháp / Chi tiết tháp',
    backToTowerList: 'Quay lại danh sách tháp',
    backToProjectDetail: 'Quay lại chi tiết dự án',
    totalFloors: 'Tổng số tầng',
    totalUnits: 'Tổng số căn hộ',
    totalResidents: 'Tổng cư dân',
    statusA: 'Đang hoạt động',
    statusI: 'Ngưng hoạt động',
    buildingStatusAll: 'Tất cả',
    description: 'Mô tả',
    residentCount: 'Số cư dân'
  },
  common: { status: 'Trạng thái', edit: 'Sửa', delete: 'Xóa', description: 'Mô tả' }
} as any

const inputOf = (call = 0) => runFODynamic.mock.calls[call][0]

// The header "Thêm tháp" button (the list no longer renders a create dialog).
const addButton = () => captured.find(item => item.name === 'Button' && item.props.variant === 'contained' && item.props.children === 'Thêm tháp')

const renderList = () => renderToStaticMarkup(createElement(BuildingManagementPage, {
  dictionary,
  session: null,
  locale: 'vi',
  initialFilter: {} as any,
  initialData: {} as any
}))

describe('Tower list permissions', () => {
  it('ADD -> "Thêm tháp" in the list header (no tower count there)', () => {
    permission.allowed = ['ADD']

    const html = renderList()

    expect(html).toContain('Danh sách tháp')
    expect(addButton()).toBeDefined()
    expect(permission.hrefs).toContain('/properties/building')
  })

  it('header no longer shows "{n} tháp"; the total stays in the pagination ("n Kết quả")', () => {
    permission.allowed = ['ADD']

    const html = renderList()

    expect(html).not.toContain('3 tháp')
    expect(html).toContain('3 Kết quả')
  })

  it('no ADD (or permissions still loading) -> no button', () => {
    permission.allowed = ['VIEW', 'MODIFY', 'DELETE']
    renderList()
    expect(addButton()).toBeUndefined()

    captured.length = 0
    permission.resolved = false
    permission.allowed = ['ADD']
    renderList()
    expect(addButton()).toBeUndefined()
  })

  it('uses the real screen permission (nothing hard-coded)', () => {
    const source = readFileSync(new URL('./BuildingManagementPage.tsx', import.meta.url), 'utf8')

    expect(source).toContain('<PermissionGuard href="/properties/building" action="ADD">')
    expect(source).not.toMatch(/isAdmin|isSuperAdmin|username|canAdd\s*=\s*true|create_building\(|propertyAggregateService/)
  })

  it('"Thêm tháp" navigates to /properties/building/create and no create modal is rendered', () => {
    permission.allowed = ['ADD']
    renderList()

    expect(captured.some(item => item.name === 'Dialog')).toBe(false)

    addButton()!.props.onClick()

    expect(routerPush).toHaveBeenCalledWith('/vi/properties/building/create')

    const source = readFileSync(new URL('./BuildingManagementPage.tsx', import.meta.url), 'utf8')

    expect(source).not.toMatch(/BuildingFormDialog|useBuildingForm|openCreate/)
  })

  it('create route requires the ADD permission of the tower screen', () => {
    const route = readFileSync(new URL('../../../app/[locale]/(dashboard)/properties/building/create/page.tsx', import.meta.url), 'utf8')

    expect(route).toContain('<AuthorizedLayout requiredPath="/properties/building" requiredAction="ADD"')
    expect(route).toContain('BuildingCreatePage')
  })

  it('detail actions: Edit needs MODIFY, Delete needs DELETE', () => {
    const source = readFileSync(new URL('./BuildingDetailPage.tsx', import.meta.url), 'utf8')

    expect(source).toContain('<PermissionGuard href="/properties/building" action="MODIFY">')
    expect(source).toContain('<PermissionGuard href="/properties/building" action="DELETE">')
  })
})

describe('WF_BO_CREATE_BUILDING', () => {
  it('sends exactly { project_id, building_code, name, floor_count, description, resident_count }', async () => {
    await service.buildingService.createBuilding({
      sessiontoken: 'token',
      payload: {
        project_id: 5, building_code: 'S1', name: 'Tòa S1', floor_count: '25', description: 'Mô tả tòa nhà', resident_count: 200,
        display_order: 1, status: 'A', id: 9
      } as BuildingCreatePayload
    })

    expect(inputOf().workflowid).toBe('WF_BO_CREATE_BUILDING')
    expect(inputOf().input).toEqual({
      project_id: 5, building_code: 'S1', name: 'Tòa S1', floor_count: '25', description: 'Mô tả tòa nhà', resident_count: 200
    })
  })

  it('keeps an empty floor count as "" (string, like the Backend sample; never NaN)', async () => {
    await service.buildingService.createBuilding({
      sessiontoken: 'token',
      payload: { project_id: 5, building_code: 'S1', name: 'n', floor_count: '', description: '', resident_count: null }
    })

    expect(inputOf().input.floor_count).toBe('')
  })

  it('returns the created tower id when the response has one, otherwise null', async () => {
    const payload = { project_id: 5, building_code: 'S1', name: 'n', floor_count: '', description: '', resident_count: null }

    runFODynamic.mockResolvedValueOnce({ success: true, code: 'success', errors: [], data: { id: 12 } })
    await expect(service.buildingService.createBuilding({ sessiontoken: 'token', payload })).resolves.toBe(12)

    await expect(service.buildingService.createBuilding({ sessiontoken: 'token', payload })).resolves.toBeNull()
  })

  it('payload helper: working project id, trimmed text, resident_count 0 stays 0 and empty -> null', () => {
    const base = { building_code: ' S1 ', name: ' Tòa S1 ', floor_count: ' 25 ', resident_count: '0', description: ' Mô tả ' }

    expect(helpers.buildBuildingCreatePayload(5, base)).toEqual({
      project_id: 5, building_code: 'S1', name: 'Tòa S1', floor_count: '25', description: 'Mô tả', resident_count: 0
    })
    expect(helpers.buildBuildingCreatePayload(5, { ...base, resident_count: '' }).resident_count).toBeNull()
  })
})

describe('WF_BO_UPDATE_BUILDING', () => {
  it('sends exactly the new contract { id, building_code, name, floor_count, display_order, description, resident_count, status }', async () => {
    await service.buildingService.updateBuilding({
      sessiontoken: 'token',
      payload: {
        id: 1, building_code: 'S1', floor_count: '30', name: 'n', status: 'I', display_order: 2, description: 'Mô tả tòa nhà',
        resident_count: 200, project_id: 5
      } as unknown as BuildingUpdatePayload
    })

    expect(inputOf().workflowid).toBe('WF_BO_UPDATE_BUILDING')
    expect(inputOf().input).toEqual({
      id: 1, building_code: 'S1', name: 'n', floor_count: '30', display_order: 2, description: 'Mô tả tòa nhà', resident_count: 200, status: 'I'
    })
  })

  it('surfaces the workflow error with its execution reference', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Tower code exists' }], execution_id: 'EXEC-B' })

    await expect(service.buildingService.updateBuilding({ sessiontoken: 'token', language: 'vi', payload: { id: 1, building_code: 'S1', floor_count: '', name: 'n', display_order: null, description: '', resident_count: null, status: 'A' } }))
      .rejects.toThrow('Tower code exists Mã tra cứu lỗi: EXEC-B')
  })
})

describe('WF_BO_DELETE_BUILDING', () => {
  it('sends only { id }', async () => {
    await service.buildingService.deleteBuilding({ sessiontoken: 'token', id: 4 })

    expect(inputOf().workflowid).toBe('WF_BO_DELETE_BUILDING')
    expect(inputOf().input).toEqual({ id: 4 })
  })

  it('rejects the Backend business error (e.g. tower still has floors) so the record is kept', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Tower still has floors' }] })

    await expect(service.buildingService.deleteBuilding({ sessiontoken: 'token', id: 4 })).rejects.toThrow('Tower still has floors')
  })

  it('navigates away only after success; an error keeps the dialog and record', () => {
    const hook = readFileSync(new URL('./hooks/useBuildingDelete.ts', import.meta.url), 'utf8')
    const confirm = hook.slice(hook.indexOf('const confirm = async'), hook.indexOf('return { open'))
    const tryBlock = confirm.slice(confirm.indexOf('try {'), confirm.indexOf('} catch'))
    const catchBlock = confirm.slice(confirm.indexOf('} catch'), confirm.indexOf('} finally'))

    expect(tryBlock.indexOf('await buildingService.deleteBuilding')).toBeLessThan(tryBlock.indexOf('await onDeleted()'))
    expect(catchBlock).toContain('setError(')
    expect(catchBlock).not.toContain('onDeleted')
    expect(catchBlock).not.toContain('setTargetId(null)')
  })
})

describe('WF_BO_GET_BUILDING_BY_ID', () => {
  it('requests only { id } and keeps display_order / description / resident_count for the Update contract', async () => {
    runFODynamic.mockResolvedValue({
      success: true,
      code: 'success',
      errors: [],
      data: { buildings: { id: 4, building_code: 'S1', project_id: 5, name: 'n', floor_count: 25, display_order: 3, status: 'A', description: 'Mô tả', resident_count: 0 }, total_residents: 120 }
    })

    const response = await service.buildingService.getBuildingById({ sessiontoken: 'token', id: 4 })

    expect(inputOf().input).toEqual({ id: 4 })
    expect(response.building).toMatchObject({ display_order: 3, description: 'Mô tả', resident_count: 0 })
    expect(response.building?.floor_count).toBe(25)
    expect(response.summary.total_residents).toBe(120)
  })
})

describe('Tower status filter', () => {
  const filter: BuildingSearchFilter = { page_size: 20, page_index: 3, search_text: 'S1', project_id: 5, status: '' }

  it('offers "", A, I and defaults to ""', () => {
    expect(helpers.BUILDING_STATUS_FILTER_OPTIONS).toEqual(['', 'A', 'I'])
    expect(helpers.emptyBuildingFilter.status).toBe('')
  })

  it('changing status goes back to the first page and keeps project, search and page size', () => {
    const next = helpers.withBuildingStatus(filter, 'I')

    expect(next).toEqual({ ...filter, status: 'I', page_index: 1 })
    expect(service.buildBuildingSearchRequest({ ...next, project_id: 5 })).toEqual({
      page_size: 20, page_index: 0, search_text: 'S1', project_id: 5, status: 'I'
    })
  })

  it('always sends status (even "") and does not filter on the client', async () => {
    runFODynamic.mockResolvedValue({
      success: true,
      code: 'success',
      errors: [],
      data: { items: [{ id: 1, status: 'A' }, { id: 2, status: 'I' }], total_count: 2, page_index: 0, page_size: 20 }
    })

    const response = await service.buildingService.simpleSearchBuildings({ sessiontoken: 'token', filter: { page_size: 20, page_index: 1, search_text: '', project_id: 5 } })

    expect(inputOf().input.status).toBe('')
    expect(response.items.map(item => item.id)).toEqual([1, 2])
  })
})

const formProps = (overrides: Record<string, unknown> = {}) => ({
  dictionary,
  open: true,
  values: { building_code: 'S1', name: 'n', floor_count: '25', description: '', resident_count: '', status: 'A' },
  errors: {},
  submitError: null,
  saving: false,
  onChange: vi.fn(),
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  ...overrides
})

describe('Tower edit dialog', () => {
  it('edit only: "Sửa tháp" with Tower code / name / Floor count / Description / Resident count / Status', () => {
    const html = renderToStaticMarkup(createElement(BuildingFormDialog, formProps()))

    expect(html).toContain('Sửa tháp')
    expect(html).not.toContain('Thêm tháp')

    const labels = captured.filter(item => item.name === 'TextField').map(item => item.props.label)

    expect(labels).toEqual(['Mã tháp', 'Tên tháp', 'Số tầng', 'Mô tả', 'Số cư dân', 'Trạng thái'])
  })

  it('edit: Status Active/Inactive, no Display Order', () => {
    const html = renderToStaticMarkup(createElement(BuildingFormDialog, formProps()))

    expect(html).toContain('Đang hoạt động')
    expect(html).toContain('Ngưng hoạt động')
    expect(html).not.toContain('Thứ tự hiển thị')
  })

  it('keeps the submit error inside the dialog', () => {
    expect(renderToStaticMarkup(createElement(BuildingFormDialog, formProps({ submitError: 'Tower code exists' })))).toContain('Tower code exists')
  })

  it('floor count accepts empty or whole numbers only', () => {
    expect(helpers.isValidFloorCountInput('')).toBe(true)
    expect(helpers.isValidFloorCountInput('25')).toBe(true)
    expect(helpers.isValidFloorCountInput('2.5')).toBe(false)
    expect(helpers.isValidFloorCountInput('abc')).toBe(false)
  })
})

describe('Tower detail and list', () => {
  it('detail has no Display Order', () => {
    permission.allowed = ['MODIFY', 'DELETE']

    const html = renderToStaticMarkup(createElement(BuildingDetailPage, {
      dictionary,
      locale: 'vi',
      buildingId: 4,
      initialBuilding: { id: 4, building_code: 'S1', project_id: 5, name: 'Tháp S1', floor_count: 25, status: 'A', image_url: null, display_order: null, description: null, resident_count: null },
      initialProjectBuildingSummary: { total_floors: 25, total_apartments: 100, total_residents: 120 }
    }))

    expect(html).toContain('Tháp S1')
    expect(html).not.toContain('Thứ tự hiển thị')
    expect(html).toContain('Sửa')
    expect(html).toContain('Xóa')
  })

  it('list rows open the detail with a single click', () => {
    const table = readFileSync(new URL('./BuildingTable.tsx', import.meta.url), 'utf8')
    const page = readFileSync(new URL('./BuildingManagementPage.tsx', import.meta.url), 'utf8')

    expect(table).toContain("mode: 'single-click'")
    expect(table).toContain('{...getRowProps(row)}')
    expect(page).toContain('onOpenDetail={row => router.push(`/${locale}/properties/building/${row.id}`)}')
  })
})

describe('Tower detail navigation and terminology', () => {
  const renderDetail = () => renderToStaticMarkup(createElement(BuildingDetailPage, {
    dictionary,
    locale: 'vi',
    buildingId: 76,
    initialBuilding: { id: 76, building_code: 'S1', project_id: 5, name: 'Tháp S1', floor_count: 25, status: 'A', image_url: null, display_order: null, description: null, resident_count: null },
    initialProjectBuildingSummary: { total_floors: 25, total_apartments: 100, total_residents: 120 }
  }))

  it('shows "Chi tiết tháp", the tower breadcrumb and the floor statistics unchanged', () => {
    const html = renderDetail()

    expect(html).toContain('Chi tiết tháp')
    expect(html).toContain('Bất động sản / Tháp / Chi tiết tháp')
    expect(html).toContain('Tổng số tầng')
    expect(html).toContain('Số tầng')
    expect(html).not.toContain('Tổng số tháp')
  })

  it('back button reads "Quay lại danh sách tháp" and goes to the tower list, not the project detail', () => {
    const html = renderDetail()

    expect(html).toContain('Quay lại danh sách tháp')
    expect(html).not.toContain('Quay lại chi tiết dự án')

    const back = captured.find(item => item.name === 'Button' && item.props.children === 'Quay lại danh sách tháp')

    back!.props.onClick()
    expect(routerPush).toHaveBeenCalledWith('/vi/properties/building')
    expect(routerPush).not.toHaveBeenCalledWith(expect.stringContaining('/properties/project'))
  })

  it('keeps the working project context (no project reset, no hard-coded project in the route)', () => {
    const source = readFileSync(new URL('./BuildingDetailPage.tsx', import.meta.url), 'utf8')

    expect(source).toContain("const backToTowerList = () => router.push(`/${locale}/properties/building`)")
    expect(source).not.toContain('backToProjectDetail')
    expect(source).not.toMatch(/properties\/project\//)
    expect(source).not.toMatch(/setWorkingProject|clearWorkingProject|AGR/)
  })
})

describe('Tower status badge colors', () => {
  it('A resolves to success (green) and I to error (red, white text on a filled Chip)', () => {
    expect(helpers.getBuildingStatusColor('A')).toBe('success')
    expect(helpers.getBuildingStatusColor('I')).toBe('error')
    expect(helpers.getBuildingStatusLabel(dictionary, 'A')).toBe('Đang hoạt động')
    expect(helpers.getBuildingStatusLabel(dictionary, 'I')).toBe('Ngưng hoạt động')
  })

  it('detail renders the inactive status with the shared red semantics', () => {
    renderToStaticMarkup(createElement(BuildingDetailPage, {
      dictionary,
      locale: 'vi',
      buildingId: 4,
      initialBuilding: { id: 4, building_code: 'S1', project_id: 5, name: 'Tháp S1', floor_count: 25, status: 'I', image_url: null, display_order: null, description: null, resident_count: null }
    }))

    const chip = captured.find(item => item.name === 'Chip' && item.props.label === 'Ngưng hoạt động')

    expect(chip?.props.color).toBe('error')
  })

  it('list and detail use the same shared status helpers', () => {
    const table = readFileSync(new URL('./BuildingTable.tsx', import.meta.url), 'utf8')
    const detail = readFileSync(new URL('./BuildingDetailPage.tsx', import.meta.url), 'utf8')

    expect(table).toContain('color={getBuildingStatusColor(row.status)}')
    expect(detail).toContain('getBuildingStatusColor(building.status)')
  })
})

describe('Tower detail change history', () => {
  it('uses entity_name "Building" (not "Tower") and the id of the opened tower', () => {
    auditProps.length = 0

    renderToStaticMarkup(createElement(BuildingDetailPage, {
      dictionary,
      locale: 'vi',
      buildingId: 76,
      initialBuilding: { id: 76, building_code: 'S1', project_id: 5, name: 'Tháp S1', floor_count: 25, status: 'A', image_url: null, display_order: null, description: null, resident_count: null }
    }))

    expect(auditProps).toHaveLength(1)
    expect(auditProps[0]).toMatchObject({ entityName: 'Building', entityId: 76 })
    expect(auditProps[0].entityName).not.toBe('Tower')
    expect(auditProps[0].entityId).not.toBe(5)
  })
})

describe('Tower detail — WF_BO_GET_BUILDING_BY_ID field alignment', () => {
  // Response sample of WF_BO_GET_BUILDING_BY_ID (tower fields flat next to the aggregates).
  const sample = {
    id: 74, building_code: 'A1', project_id: 1, name: 'A1', floor_count: null, display_order: 0, status: 'A', image_url: '',
    description: null, resident_count: null, total_floors: 2, total_apartments: 2, total_residents: 0
  }

  const loadSample = async (overrides: Record<string, unknown> = {}) => {
    runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: { ...sample, ...overrides } })

    return service.buildingService.getBuildingById({ sessiontoken: 'token', id: 74 })
  }

  /** Value rendered right after the label of a detail info card (Typography text or status Chip label). */
  const valueOf = (label: string) => {
    const index = captured.findIndex(item => item.name === 'Typography' && item.props.children === label)
    const value = captured.slice(index + 1).find(item => item.name === 'Typography' || item.name === 'Chip')

    expect(index).toBeGreaterThanOrEqual(0)

    return value?.name === 'Chip' ? value.props.label : value?.props.children
  }

  const renderSample = async (overrides: Record<string, unknown> = {}) => {
    const response = await loadSample(overrides)

    captured.length = 0
    renderToStaticMarkup(createElement(BuildingDetailPage, {
      dictionary,
      locale: 'vi',
      buildingId: 74,
      initialBuilding: response.building,
      initialProjectBuildingSummary: response.summary
    }))
  }

  it('maps the flat response: status / resident_count / description and the aggregates, without mixing them', async () => {
    const response = await loadSample()

    expect(inputOf().input).toEqual({ id: 74 })
    expect(response.building).toMatchObject({
      id: 74, building_code: 'A1', name: 'A1', floor_count: null, display_order: 0, status: 'A', description: null, resident_count: null
    })
    expect(response.summary).toEqual({ total_floors: 2, total_apartments: 2, total_residents: 0 })
  })

  it('renders the sample: A1 / A1 / -- / -- / -- / Đang hoạt động and aggregates 2 / 2 / 0', async () => {
    await renderSample()

    expect(valueOf('Mã tháp')).toBe('A1')
    expect(valueOf('Tên tháp')).toBe('A1')
    expect(valueOf('Số tầng')).toBe('--')
    expect(valueOf('Số cư dân')).toBe('--')
    expect(valueOf('Mô tả')).toBe('--')
    expect(valueOf('Trạng thái')).toBe('Đang hoạt động')
    expect(valueOf('Tổng số tầng')).toBe('2')
    expect(valueOf('Tổng số căn hộ')).toBe('2')
    expect(valueOf('Tổng cư dân')).toBe('0')
  })

  it('resident_count 0 shows "0" (not "--"); total_residents is not used for "Số cư dân"', async () => {
    await renderSample({ resident_count: 0, total_residents: 35 })

    expect(valueOf('Số cư dân')).toBe('0')
    expect(valueOf('Tổng cư dân')).toBe('35')
  })

  it('resident_count 200 and a description are shown as returned; whitespace description -> "--"; I -> Ngưng hoạt động', async () => {
    await renderSample({ resident_count: 200, description: '  Mô tả tòa nhà  ', status: 'I' })

    expect(valueOf('Số cư dân')).toBe('200')
    expect(valueOf('Mô tả')).toBe('Mô tả tòa nhà')
    expect(valueOf('Trạng thái')).toBe('Ngưng hoạt động')

    await renderSample({ description: '   ' })
    expect(valueOf('Mô tả')).toBe('--')
  })

  it('still reads the older `buildings` wrapper', async () => {
    runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: { buildings: { ...sample, resident_count: 7 }, total_residents: 0 } })

    const response = await service.buildingService.getBuildingById({ sessiontoken: 'token', id: 74 })

    expect(response.building?.resident_count).toBe(7)
    expect(response.summary.total_residents).toBe(0)
  })
})
