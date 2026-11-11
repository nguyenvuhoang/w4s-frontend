import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FloorCreatePayload, FloorSearchFilter, FloorUpdatePayload } from './types'

const { runFODynamic, captured } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  captured: [] as Array<{ name: string; props: Record<string, any> }>
}))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

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
    Grid: make('Grid'), Link: make('Link'), MenuItem: make('MenuItem', 'option'), Paper: make('Paper'),
    Stack: make('Stack'), TextField: make('TextField'), Tooltip: make('Tooltip'), Typography: make('Typography')
  }
})
vi.mock('@mui/material/styles', () => ({ alpha: () => '' }))
for (const icon of ['Apartment', 'ArrowBack', 'Autorenew', 'Business', 'CheckCircleOutline', 'DeleteOutline', 'DescriptionOutlined', 'EditOutlined', 'Layers', 'NorthEast', 'People', 'SellOutlined']) {
  vi.doMock(`@mui/icons-material/${icon}`, () => ({ default: () => null }))
}
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { token: 'token' } } }) }))
vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => children }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@shared/permissions/PermissionGuard', () => ({ PermissionGuard: ({ children }: { children: React.ReactNode }) => children }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/features/properties/building/buildingService', () => ({ buildingService: {} }))
const { auditProps } = vi.hoisted(() => ({ auditProps: [] as Array<Record<string, unknown>> }))

vi.mock('@/shared/components/entity-audit/EntityAuditHistory', () => ({
  default: (props: Record<string, unknown>) => {
    auditProps.push(props)

    return null
  }
}))

let floorService: typeof import('./floorService').floorService
let buildFloorSearchRequest: typeof import('./floorService').buildFloorSearchRequest
let helpers: typeof import('./floorHelpers')
let FloorFormDialog: typeof import('./FloorFormDialog').default
let FloorDetailPage: typeof import('./FloorDetailPage').default

beforeAll(async () => {
  ({ floorService, buildFloorSearchRequest } = await import('./floorService'))
  helpers = await import('./floorHelpers')
  ;({ default: FloorFormDialog } = await import('./FloorFormDialog'))
  ;({ default: FloorDetailPage } = await import('./FloorDetailPage'))
})

beforeEach(() => {
  runFODynamic.mockReset()
  runFODynamic.mockResolvedValue({ success: true, code: 'success', data: {}, errors: [] })
  captured.length = 0
})

const dictionary = {
  propertyManagement: {
    building: 'Tháp',
    floorCode: 'Mã tầng',
    floorName: 'Tên tầng',
    floorNo: 'Số tầng',
    displayOrder: 'Thứ tự hiển thị',
    addFloor: 'Thêm tầng',
    editFloor: 'Sửa tầng',
    statusA: 'Đang hoạt động',
    statusI: 'Ngưng hoạt động',
    floorStatusAll: 'Tất cả',
    residentCount: 'Số lượng cư dân',
    description: 'Mô tả'
  },
  common: { status: 'Trạng thái' }
} as any

const inputOf = (call = 0) => runFODynamic.mock.calls[call][0]

describe('WF_BO_CREATE_FLOOR', () => {
  it('sends exactly the Backend contract { building_id, floor_no, floor_code, name, display_order, description, resident_count }', async () => {
    await floorService.createFloor({
      sessiontoken: 'token',
      payload: {
        building_id: 1, floor_code: 'VGP-S1-F15', name: '15', floor_no: '15', display_order: 15, status: 'A', description: 'Mô tả tầng', resident_count: 50
      } as unknown as FloorCreatePayload
    })

    expect(inputOf().workflowid).toBe('WF_BO_CREATE_FLOOR')
    expect(inputOf().input).toEqual({
      building_id: 1, floor_code: 'VGP-S1-F15', name: '15', floor_no: '15', display_order: 15, description: 'Mô tả tầng', resident_count: 50
    })
  })
})

describe('floor_no / display_order derivation (confirmed rule)', () => {
  it('takes the trailing digits of the floor code as floor_no and parses them as display_order', () => {
    expect(helpers.deriveFloorContractFields('VGP-S1-F15')).toEqual({ floor_no: '15', display_order: 15 })
    expect(helpers.deriveFloorContractFields('VGP-S1-F01')).toEqual({ floor_no: '01', display_order: 1 })
    expect(helpers.deriveFloorContractFields('FLOOR-20')).toEqual({ floor_no: '20', display_order: 20 })
    expect(helpers.deriveFloorContractFields('  B2-F7  ')).toEqual({ floor_no: '7', display_order: 7 })
  })

  it('returns null (so nothing is sent) when the code does not end with digits — never floor_no ""', () => {
    expect(helpers.deriveFloorContractFields('VGP-S1-F')).toBeNull()
    expect(helpers.deriveFloorContractFields('ROOFTOP')).toBeNull()
    expect(helpers.deriveFloorContractFields('')).toBeNull()
  })

  it('edit keeps the Backend values while the code is unchanged', () => {
    const original = { floor_code: 'VGP-S1-F15', floor_no: '15A', display_order: 42 }

    expect(helpers.resolveFloorContractFields('VGP-S1-F15', original)).toEqual({ floor_no: '15A', display_order: 42 })
  })

  it('edit re-derives both values once the code changes (old values are not reused)', () => {
    const original = { floor_code: 'VGP-S1-F15', floor_no: '15', display_order: 15 }

    expect(helpers.resolveFloorContractFields('VGP-S1-F16', original)).toEqual({ floor_no: '16', display_order: 16 })
    expect(helpers.resolveFloorContractFields('VGP-S1-TOP', original)).toBeNull()
  })

  it('edit derives from the code when the Backend did not return the hidden values', () => {
    expect(helpers.resolveFloorContractFields('F03', { floor_code: 'F03', floor_no: '', display_order: null })).toEqual({ floor_no: '03', display_order: 3 })
  })

  it('the form blocks the submit with the i18n message when the code has no trailing number, and never defaults display_order to 1', () => {
    const hook = readFileSync(new URL('./hooks/useFloorForm.ts', import.meta.url), 'utf8')

    expect(hook).toContain("floorText(dictionary, 'floorCodeMustEndWithNumber'")
    expect(hook).toContain('if (!contractFields) return')
    expect(hook).not.toMatch(/display_order:\s*1\b|floor_no:\s*''/)
  })
})

describe('WF_BO_UPDATE_FLOOR', () => {
  it('sends exactly the Backend contract { id, building_id, floor_code, name, floor_no, display_order, status }', async () => {
    await floorService.updateFloor({
      sessiontoken: 'token',
      payload: { id: 1, building_id: 2, floor_code: 'F15', name: '15', status: 'I', floor_no: '15', display_order: 3, project_id: 9 } as unknown as FloorUpdatePayload
    })

    expect(inputOf().workflowid).toBe('WF_BO_UPDATE_FLOOR')
    expect(inputOf().input).toEqual({ id: 1, building_id: 2, floor_code: 'F15', name: '15', floor_no: '15', display_order: 3, status: 'I' })
  })

  it('surfaces the workflow error with its execution reference', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Floor code exists' }], execution_id: 'EXEC-F' })

    await expect(floorService.updateFloor({ sessiontoken: 'token', language: 'vi', payload: { id: 1, building_id: 2, floor_code: 'F1', name: 'n', floor_no: '1', display_order: 1, description: '', resident_count: null, status: 'A' } }))
      .rejects.toThrow('Floor code exists Mã tra cứu lỗi: EXEC-F')
  })
})

describe('WF_BO_DELETE_FLOOR', () => {
  it('sends only { id }', async () => {
    await floorService.deleteFloor({ sessiontoken: 'token', id: 7 })

    expect(inputOf().workflowid).toBe('WF_BO_DELETE_FLOOR')
    expect(inputOf().input).toEqual({ id: 7 })
  })

  it('rejects on a workflow business error (so the caller keeps the record)', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Floor has apartments' }] })

    await expect(floorService.deleteFloor({ sessiontoken: 'token', id: 7 })).rejects.toThrow('Floor has apartments')
  })

  it('only leaves/reloads after the Backend succeeded, and keeps the dialog + record on error', () => {
    const hook = readFileSync(new URL('./hooks/useFloorDelete.ts', import.meta.url), 'utf8')
    const confirm = hook.slice(hook.indexOf('const confirm = async'), hook.indexOf('return { open'))
    const tryBlock = confirm.slice(confirm.indexOf('try {'), confirm.indexOf('} catch'))
    const catchBlock = confirm.slice(confirm.indexOf('} catch'), confirm.indexOf('} finally'))

    expect(tryBlock.indexOf('await floorService.deleteFloor')).toBeLessThan(tryBlock.indexOf('await onDeleted()'))
    expect(catchBlock).toContain('setError(')
    expect(catchBlock).not.toContain('onDeleted')
    expect(catchBlock).not.toContain('setTargetId(null)')
  })
})

describe('WF_BO_GET_FLOOR_BY_ID', () => {
  it('requests only { id } and keeps floor_no / display_order in the model for the Update contract', async () => {
    runFODynamic.mockResolvedValue({
      success: true,
      code: 'success',
      errors: [],
      data: { id: 3, floor_code: 'F15', name: '15', building_id: 2, project_id: 1, status: 'A', floor_no: '15', display_order: 4 }
    })

    const floor = await floorService.getFloorById({ sessiontoken: 'token', id: 3 })

    expect(inputOf().input).toEqual({ id: 3 })
    expect(floor).toEqual({ id: 3, floor_code: 'F15', name: '15', building_id: 2, project_id: 1, status: 'A', floor_no: '15', display_order: 4, resident_count: null, description: null })
  })

  it('maps resident_count only from the Backend response', async () => {
    runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: { id: 3, resident_count: 12 } })

    expect((await floorService.getFloorById({ sessiontoken: 'token', id: 3 }))?.resident_count).toBe(12)
  })
})

describe('Floor status filter', () => {
  const filter: FloorSearchFilter = { page_size: 20, page_index: 4, search_text: 'tầng', status: '', project_id: 1, building_id: 2 }

  it('offers "", A, I', () => {
    expect(helpers.FLOOR_STATUS_FILTER_OPTIONS).toEqual(['', 'A', 'I'])
    expect(helpers.emptyFloorFilter.status).toBe('')
  })

  it('changing status goes back to the first page and keeps search text, page size and tower', () => {
    const next = helpers.withFloorStatus(filter, 'A')

    expect(next).toEqual({ ...filter, status: 'A', page_index: 1 })
    expect(buildFloorSearchRequest({ ...next, project_id: 1, building_id: 2 })).toEqual({
      page_size: 20, page_index: 0, search_text: 'tầng', status: 'A', project_id: 1, building_id: 2
    })
  })

  it('sends status to the workflow and does not filter on the client', async () => {
    runFODynamic.mockResolvedValue({
      success: true,
      code: 'success',
      errors: [],
      data: { items: [{ id: 1, status: 'A' }, { id: 2, status: 'I' }], total_count: 2, page_index: 0, page_size: 20 }
    })

    const response = await floorService.simpleSearchFloors({ sessiontoken: 'token', filter: { ...filter, status: 'I' } })

    expect(inputOf().input.status).toBe('I')
    expect(response.items.map(item => item.id)).toEqual([1, 2])
  })
})

const formProps = (overrides: Record<string, unknown> = {}) => ({
  dictionary,
  open: true,
  mode: 'create' as const,
  values: { building_id: 2, floor_code: '', name: '', description: '', status: '' },
  errors: {},
  submitError: null,
  buildingsError: null,
  saving: false,
  buildingOptions: [{ id: 2, building_code: 'S1', name: 'Tháp S1', status: 'A' }],
  onChange: vi.fn(),
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  ...overrides
})

describe('Floor create/edit dialog', () => {
  it('create: Tower, Floor code, Floor name only (no Floor No / Display Order / Status)', () => {
    const html = renderToStaticMarkup(createElement(FloorFormDialog, formProps()))

    expect(html).toContain('Tháp')
    expect(html).toContain('Mã tầng')
    expect(html).toContain('Tên tầng')
    expect(html).not.toContain('Số tầng')
    expect(html).not.toContain('Thứ tự hiển thị')
    expect(html).not.toContain('Trạng thái')
    expect(html).not.toContain('Mô tả')
    // The tower being managed is preselected.
    expect(captured.find(item => item.name === 'TextField')?.props.value).toBe(2)
  })

  it('edit: adds Status with Active/Inactive, still no Floor No / Display Order', () => {
    const html = renderToStaticMarkup(createElement(FloorFormDialog, formProps({ mode: 'edit', values: { building_id: 2, floor_code: 'F', name: 'n', description: '', status: 'A' } })))

    expect(html).toContain('Trạng thái')
    expect(html).not.toContain('Số lượng cư dân')
    expect(html).toContain('Đang hoạt động')
    expect(html).toContain('Ngưng hoạt động')
    expect(html).not.toContain('Số tầng')
    expect(html).not.toContain('Thứ tự hiển thị')
  })

  it('shows the submit error inside the dialog', () => {
    const html = renderToStaticMarkup(createElement(FloorFormDialog, formProps({ submitError: 'Floor code exists Mã tra cứu lỗi: X' })))

    expect(html).toContain('Floor code exists Mã tra cứu lỗi: X')
  })

  it('sends the hidden floor_no / display_order from the confirmed rule, and never adds a "Tầng" prefix', () => {
    const hook = readFileSync(new URL('./hooks/useFloorForm.ts', import.meta.url), 'utf8')

    expect(hook).toContain("const contractFields = resolveFloorContractFields(values.floor_code, mode === 'edit' ? original : null)")
    expect(hook.match(/floor_no: contractFields\.floor_no/g)).toHaveLength(2)
    expect(hook.match(/display_order: contractFields\.display_order/g)).toHaveLength(2)
    expect(hook).not.toMatch(/Tầng/)
    // description is sent on create and update; resident_count is no longer a form field
    expect(hook.match(/description: values\.description\.trim\(\)/g)).toHaveLength(2)
    expect(hook).not.toContain('values.resident_count')
    expect(hook).toContain('resident_count: original?.resident_count ?? null')
  })
})

describe('Floor detail', () => {
  const renderDetail = (resident_count: number | null) => renderToStaticMarkup(createElement(FloorDetailPage, {
    dictionary,
    locale: 'vi',
    floorId: 3,
    initialFloor: { id: 3, floor_code: 'F15', name: '15', building_id: 2, project_id: 1, status: 'A', floor_no: '15', display_order: 77, resident_count, description: null }
  }))

  it('shows valid fields and no Floor No / Display Order', () => {
    const html = renderDetail(null)

    expect(html).toContain('Mã tầng')
    expect(html).toContain('F15')
    expect(html).toContain('Tên tầng')
    expect(html).toContain('Tháp')
    expect(html).toContain('Trạng thái')
    expect(html).not.toContain('Số tầng')
    expect(html).not.toContain('Thứ tự hiển thị')
    // display_order is kept in the model but never rendered
    expect(html).not.toContain('77')
  })

  it('shows the Backend resident count, "--" when missing', () => {
    expect(renderDetail(null)).toContain('--')
    expect(renderDetail(12)).toContain('12')
  })

  it('never derives the resident count on the client', () => {
    const source = readFileSync(new URL('./FloorDetailPage.tsx', import.meta.url), 'utf8')

    expect(source).not.toContain('residents.length')
    expect(source).toContain('displayResidentCount(floor.resident_count, locale)')
  })
})

describe('Floor detail change history', () => {
  it('uses entity_name "Floor" and the id of the opened floor (not its tower id)', () => {
    auditProps.length = 0

    renderToStaticMarkup(createElement(FloorDetailPage, {
      dictionary,
      locale: 'vi',
      floorId: 3,
      initialFloor: { id: 3, floor_code: 'F15', name: '15', building_id: 2, project_id: 1, status: 'A', floor_no: '15', display_order: 15, resident_count: null, description: null }
    }))

    expect(auditProps).toHaveLength(1)
    expect(auditProps[0]).toMatchObject({ entityName: 'Floor', entityId: 3 })
  })
})

describe('Floor list keeps the tower context when coming back from the detail (after Edit/Delete)', () => {
  const towers = [{ id: 11 }, { id: 12 }]

  it('restores the tower of the URL when it belongs to the working project', () => {
    expect(helpers.resolvePreferredFloorBuildingId({ project_id: 5, building_id: 12 }, 5, towers)).toBe(12)
  })

  it('ignores a context of another project, an unknown tower or a missing id (never guesses a tower)', () => {
    expect(helpers.resolvePreferredFloorBuildingId({ project_id: 6, building_id: 12 }, 5, towers)).toBeNull()
    expect(helpers.resolvePreferredFloorBuildingId({ project_id: 5, building_id: 99 }, 5, towers)).toBeNull()
    expect(helpers.resolvePreferredFloorBuildingId({ project_id: 5, building_id: null }, 5, towers)).toBeNull()
    expect(helpers.resolvePreferredFloorBuildingId(undefined, 5, towers)).toBeNull()
  })

  it('the detail goes back with ?project_id=&building_id=, which the list route reads and the search hook restores', () => {
    const detail = readFileSync(new URL('./FloorDetailPage.tsx', import.meta.url), 'utf8')
    const route = readFileSync(new URL('./FloorPage.server.tsx', import.meta.url), 'utf8')
    const hook = readFileSync(new URL('./hooks/useFloorSearch.ts', import.meta.url), 'utf8')

    expect(detail).toContain('?project_id=${floor.project_id}&building_id=${floor.building_id}')
    expect(route).toContain('toContextId(query.building_id)')
    expect(route).toContain('preferredContext={preferredContext}')
    expect(hook).toContain('resolvePreferredFloorBuildingId(preferred, workingProject.id, options)')
  })
})
