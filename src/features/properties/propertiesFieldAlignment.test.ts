import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { runFODynamic } = vi.hoisted(() => ({ runFODynamic: vi.fn() }))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')
  const Stub = ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => h(Fragment, null, label ?? null, children ?? null)
  const Cell = ({ children }: { children?: React.ReactNode }) => h('td', null, children ?? null)

  return {
    Chip: Stub, CircularProgress: Stub, Paper: Stub, Skeleton: Stub, Stack: Stub, Table: Stub, TableBody: Stub, TableCell: Cell,
    TableContainer: Stub, TableHead: Stub, TableRow: Stub, Tooltip: Stub
  }
})
vi.mock('@/shared/components/table', () => ({ useSearchTableRowConfig: () => ({ getRowProps: () => ({}) }) }))
vi.mock('@/shared/utils/rowInteraction', () => ({ useRowInteraction: () => ({ getRowProps: () => ({}) }) }))

let buildingService: typeof import('./building/buildingService').buildingService
let floorService: typeof import('./floor/floorService').floorService
let apartmentSearchService: typeof import('./unit/services/apartmentSearchService').apartmentSearchService
let fields: typeof import('./propertyFieldHelpers')
let BuildingTable: typeof import('./building/BuildingTable').default
let FloorTable: typeof import('./floor/FloorTable').default
let ApartmentTable: typeof import('./unit/ApartmentTable').default

beforeAll(async () => {
  ;({ buildingService } = await import('./building/buildingService'))
  ;({ floorService } = await import('./floor/floorService'))
  ;({ apartmentSearchService } = await import('./unit/services/apartmentSearchService'))
  fields = await import('./propertyFieldHelpers')
  ;({ default: BuildingTable } = await import('./building/BuildingTable'))
  ;({ default: FloorTable } = await import('./floor/FloorTable'))
  ;({ default: ApartmentTable } = await import('./unit/ApartmentTable'))
})

beforeEach(() => {
  runFODynamic.mockReset()
  runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: {} })
})

const ok = (data: unknown) => ({ success: true, code: 'success', errors: [], data })
const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
const dictionary = { propertyManagement: {}, common: {} } as any

describe('shared field rules', () => {
  it('counts: missing -> "--", 0 -> "0"; text: empty -> "--"; resident input is a whole number >= 0, empty -> null', () => {
    expect(fields.formatPropertyCount(null, 'vi')).toBe('--')
    expect(fields.formatPropertyCount(undefined, 'vi')).toBe('--')
    expect(fields.formatPropertyCount(0, 'vi')).toBe('0')
    expect(fields.formatPropertyCount(1200, 'vi')).toBe('1.200')
    expect(fields.formatPropertyText('  ')).toBe('--')
    for (const valid of ['', '0', '200']) expect(fields.isValidResidentCountInput(valid)).toBe(true)
    for (const invalid of ['-1', '1.5', 'abc']) expect(fields.isValidResidentCountInput(invalid)).toBe(false)
    expect(fields.toResidentCountPayload('')).toBeNull()
    expect(fields.toResidentCountPayload('0')).toBe(0)
    expect(fields.toResidentCountInput(null)).toBe('')
    expect(fields.toResidentCountInput(0)).toBe('0')
  })
})

describe('Building (Tháp)', () => {
  it('search maps description / resident_count when returned (0 kept, missing = null)', async () => {
    runFODynamic.mockResolvedValue(ok({ items: [
      { id: 1, building_code: 'S1', name: 'Tòa S1', floor_count: 25, description: 'Mô tả tòa nhà', resident_count: 0, status: 'A' },
      { id: 2, building_code: 'S2', name: 'Tòa S2', floor_count: 10, status: 'A' }
    ], total_count: 2 }))

    const response = await buildingService.simpleSearchBuildings({ sessiontoken: 'token', filter: { page_size: 10, page_index: 1, search_text: '', project_id: 1 } })

    expect(response.items.map(item => [item.description, item.resident_count])).toEqual([['Mô tả tòa nhà', 0], [null, null]])
  })

  it('list shows Description and Resident count columns (0 stays 0, missing "--")', () => {
    const html = renderToStaticMarkup(createElement(BuildingTable, {
      dictionary,
      locale: 'vi',
      rows: [
        { id: 1, building_code: 'S1', project_id: 1, name: 'Tòa S1', floor_count: 25, description: 'Mô tả tòa nhà', resident_count: 0, status: 'A' },
        { id: 2, building_code: 'S2', project_id: 1, name: 'Tòa S2', floor_count: 10, description: null, resident_count: null, status: 'A' }
      ]
    }))

    for (const text of ['Description', 'Resident count', 'Mô tả tòa nhà', '<td>0</td>', '<td>--</td>']) expect(html).toContain(text)
  })

  it('edit form sends description / resident_count and the stored display_order; detail keeps resident_count and total_residents apart', () => {
    const hook = read('./building/hooks/useBuildingForm.ts')
    const detail = read('./building/BuildingDetailPage.tsx')

    expect(hook).toContain('display_order: displayOrder,')
    expect(hook).toContain('description: values.description.trim(),')
    expect(hook).toContain('resident_count: toResidentCountPayload(values.resident_count),')
    expect(hook).toContain('resident_count: toResidentCountInput(building.resident_count),')
    expect(detail).toContain('value={formatPropertyCount(building.resident_count, locale)}')
    expect(detail).toContain('value={formatPropertyText(building.description)}')
    // "Số cư dân" = resident_count, "Tổng cư dân" aggregate = total_residents; never one as a fallback for the other.
    expect(detail).toContain('value={numberFormat.format(projectBuildingSummary.total_residents)}')
    expect(detail.match(/'residentCount'/g)).toHaveLength(1)
    expect(detail.match(/'totalResidents'/g)).toHaveLength(1)
    expect(detail).not.toMatch(/resident_count\s*(\?\?|\|\|)\s*\S*total_residents|total_residents\s*(\?\?|\|\|)\s*\S*resident_count/)
  })
})

describe('Floor (Tầng)', () => {
  it('update sends the full contract (floor_no / display_order kept) with description / resident_count', async () => {
    await floorService.updateFloor({
      sessiontoken: 'token',
      payload: { id: 1, building_id: 1, floor_no: '01', floor_code: 'F01', name: '01', display_order: 1, description: 'Mô tả tầng', resident_count: 50, status: 'A' }
    })

    expect(runFODynamic.mock.calls[0][0]).toMatchObject({ workflowid: 'WF_BO_UPDATE_FLOOR' })
    expect(runFODynamic.mock.calls[0][0].input).toEqual({
      id: 1, building_id: 1, floor_no: '01', floor_code: 'F01', name: '01', display_order: 1, description: 'Mô tả tầng', resident_count: 50, status: 'A'
    })
  })

  it('search and detail map description / resident_count from the response only', async () => {
    runFODynamic.mockResolvedValue(ok({ items: [{ id: 3, floor_code: 'F01', name: '01', floor_no: '01', description: 'Tầng 1', resident_count: 0, status: 'A' }], total_count: 1 }))
    const search = await floorService.simpleSearchFloors({ sessiontoken: 'token', filter: { page_size: 10, page_index: 1, search_text: '', project_id: 1, building_id: 2 } })

    runFODynamic.mockResolvedValue(ok({ id: 3, floor_code: 'F01', description: 'Tầng 1', resident_count: 0 }))
    const detail = await floorService.getFloorById({ sessiontoken: 'token', id: 3 })

    expect(search.items[0]).toMatchObject({ description: 'Tầng 1', resident_count: 0 })
    expect(detail).toMatchObject({ description: 'Tầng 1', resident_count: 0 })
    expect(read('./floor/FloorDetailPage.tsx')).toContain('value={formatPropertyText(floor.description)}')
  })

  it('list shows Description and Resident count (0 stays 0)', () => {
    const html = renderToStaticMarkup(createElement(FloorTable, {
      dictionary,
      rows: [{ id: 3, floor_code: 'F01', building_id: 2, project_id: 1, floor_no: '01', name: '01', description: 'Tầng 1', resident_count: 0, status: 'A' }]
    }))

    for (const text of ['Description', 'Resident count', 'Tầng 1', '<td>0</td>']) expect(html).toContain(text)
  })
})

describe('Apartment (Căn hộ)', () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    id: 1, apartment_code: 'AG-A3-203', unit_number: '203', project_id: 1, building_id: 2, floor_id: 3, floor: '03', apartment_type: 'APARTMENT',
    area: 55, water_meter_code: 'W1', payment_qr_code: '', room_count: 0, apartment_status: null, status: 'A', ...overrides
  })
  const renderTable = (rows: unknown[]) => renderToStaticMarkup(createElement(ApartmentTable, {
    dictionary: { propertyManagement: { apartmentNo: 'Mã căn hộ', apartmentCode: 'Mã căn hộ đầy đủ', roomCount: 'Số lượng phòng', apartmentStatus: 'Trạng thái căn hộ', status: 'Trạng thái' } } as any,
    locale: 'vi',
    rows: rows as any,
    projectOptions: [],
    buildingOptions: []
  }))

  it('unit_number "203" is shown under "Mã căn hộ"; apartment_code "AG-A3-203" stays "Mã căn hộ đầy đủ"', () => {
    const html = renderTable([row()])

    for (const text of ['Mã căn hộ đầy đủ', 'Mã căn hộ', 'AG-A3-203', '203']) expect(html).toContain(text)
  })

  it('search and detail map room_count (0 kept) and apartment_status separately from status', async () => {
    runFODynamic.mockResolvedValue(ok({ items: [{ id: 1, apartment_code: 'AG-A3-203', unit_number: '203', room_count: 0, apartment_status: 'X_BUSINESS', status: 'a' }], total_count: 1 }))
    const search = await apartmentSearchService.simpleSearchApartments({
      sessiontoken: 'token',
      filter: { page_size: 10, page_index: 1, search_text: '', project_id: 1, building_id: null, floor_id: null, status: 'all', qr_payment_enabled: 'all' }
    })

    runFODynamic.mockResolvedValue(ok({ apartment: { id: 1, unit_number: '203', room_count: 0, apartment_status: 'X_BUSINESS', status: 'I' } }))
    const detail = await apartmentSearchService.getApartmentDetail({ sessiontoken: 'token', apartment_id: 1 })

    expect(search.items[0]).toMatchObject({ room_count: 0, apartment_status: 'X_BUSINESS', status: 'A' })
    expect(detail.apartment).toMatchObject({ room_count: 0, apartment_status: 'X_BUSINESS', status: 'I' })
  })

  it('list: room count 0 shows 0; apartment status column only when returned, next to the record status', () => {
    const without = renderTable([row()])
    const withStatus = renderTable([row({ apartment_status: 'X_BUSINESS' })])

    expect(without).toContain('Số lượng phòng')
    expect(without).toContain('<td>0</td>')
    expect(without).not.toContain('Trạng thái căn hộ')
    expect(withStatus).toContain('Trạng thái căn hộ')
    expect(withStatus).toContain('X_BUSINESS')
    expect(withStatus).toContain('Trạng thái')
  })

  it('no hard-coded business apartment status enum; update sends apartment_status as is, create never sends it', async () => {
    for (const file of ['./unit/ApartmentTable.tsx', './unit/ApartmentDetailPage.tsx', './unit/services/apartmentSearchService.ts', './unit/apartmentHelpers.ts']) {
      expect(read(file)).not.toMatch(/RENTED|VACANT|AVAILABLE|OCCUPIED|'occupied'|'vacant'/)
    }

    await apartmentSearchService.updateApartment({
      sessiontoken: 'token',
      request: {
        id: 1, building_id: 2, floor_id: 3, apartment_code: 'AG-A3-203', unit_number: '203', floor: '03', water_meter_code: '', water_meter_code2: '',
        electric_meter_code: '', electricity_meter_code: '', apartment_type: '', area: '', room_count: 2, handover_date: '', description: '', status: 'A',
        apartment_status: 'X_BUSINESS'
      } as any
    })

    // WF_BO_UPDATE_APARTMENT and WF_BO_CREATE_APARTMENT both carry apartment_status (CodeList code value)
    expect(runFODynamic.mock.calls[0][0].input.apartment_status).toBe('X_BUSINESS')
    expect(read('./unit/apartmentCreateHelpers.ts')).toContain('apartment_status: values.apartment_status')
  })

  it('detail shows room count and apartment status (always, "--" when not returned) separately from the record status', () => {
    const detail = read('./unit/ApartmentDetailPage.tsx')

    expect(detail).toContain('value: formatPropertyCount(apt.room_count, locale)')
    expect(detail).not.toContain('{apt.apartment_status?.trim() && (')
    expect(detail).toContain('value: formatPropertyText(getApartmentStatusCaption(apartmentStatusCodes.captionMap, apt.apartment_status))')
    expect(detail).toContain('label={getApartmentRecordStatusLabel(dictionary, apt.status)}')
  })
})
