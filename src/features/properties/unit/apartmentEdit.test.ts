import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApartmentDetailApartment, ApartmentDetailResult, ApartmentEditFormValues } from './types'

const { runFODynamic } = vi.hoisted(() => ({ runFODynamic: vi.fn() }))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@/features/properties/building/buildingService', () => ({ buildingService: {} }))

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')
  const Stub = ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => h(Fragment, null, label ?? null, children ?? null)

  return { Alert: Stub, Button: Stub, Grid: Stub, IconButton: Stub, InputAdornment: Stub, MenuItem: Stub, Paper: Stub, Stack: Stub, TextField: Stub, Tooltip: Stub, Typography: Stub }
})
vi.mock('@mui/icons-material/RestartAlt', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ArrowBack', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Cancel', () => ({ default: () => null }))
vi.mock('@mui/icons-material/EditOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SaveOutlined', () => ({ default: () => null }))
vi.mock('@/@core/stores/useWorkingProjectStore', () => ({ useWorkingProject: () => null }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/shared/services/projectLookupService', () => ({
  formatProjectLabel: (project: { code: string; name: string }) => `[${project.code}] ${project.name}`
}))

let service: typeof import('./services/apartmentSearchService')
let helpers: typeof import('./apartmentEditHelpers')
let ApartmentEditPage: typeof import('./ApartmentEditPage').default

beforeAll(async () => {
  service = await import('./services/apartmentSearchService')
  helpers = await import('./apartmentEditHelpers')
  ;({ default: ApartmentEditPage } = await import('./ApartmentEditPage'))
})

beforeEach(() => {
  runFODynamic.mockReset()
  runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: {} })
})

const readSource = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')

const UPDATE_CONTRACT_FIELDS = [
  'apartment_code', 'apartment_status', 'apartment_type', 'area', 'building_id', 'description', 'electric_meter_code', 'electricity_meter_code',
  'floor', 'floor_id', 'handover_date', 'id', 'room_count', 'status', 'unit_number', 'water_meter_code', 'water_meter_code2'
]

const apartment = (overrides: Partial<ApartmentDetailApartment> = {}): ApartmentDetailApartment => ({
  id: 123,
  project_id: 1,
  building_id: 76,
  floor_id: 100,
  apartment_code: 'A1-01-55',
  project_code: 'AGR',
  building_code: 'A1',
  floor_code: 'A1-F01',
  floor: '01',
  unit_number: '55',
  apartment_type: 'APARTMENT',
  area: 55.5,
  water_meter_code: 'W-55',
  water_meter_code2: 'W2-OLD',
  electric_meter_code: 'E-OLD',
  electricity_meter_code: 'E-55',
  room_count: 3,
  handover_date: '2026-06-15T00:00:00Z',
  description: 'Căn góc',
  payment_qr_code: null,
  apartment_status: null,
  status: 'A',
  ...overrides
})

const editValues = (overrides: Partial<ApartmentEditFormValues> = {}) => ({ ...helpers.buildApartmentEditValues(apartment()), ...overrides })
const codeParts = { buildingCode: 'A1', floorNo: '01' }
const preserved = { water_meter_code2: 'W2-OLD', electric_meter_code: 'E-OLD' }

describe('load: WF_BO_GET_APARTMENT_DETAIL -> edit form', () => {
  it('detail maps every field the update needs, including the hidden contract fields', async () => {
    runFODynamic.mockResolvedValue({
      success: true,
      code: 'success',
      errors: [],
      data: {
        apartment: {
          id: 123, project_id: 1, building_id: 76, floor_id: 100, apartment_code: 'A1-01-55', unit_number: '55', floor: '01',
          water_meter_code: 'W-55', water_meter_code2: 'W2-OLD', electric_meter_code: 'E-OLD', electricity_meter_code: 'E-55',
          apartment_type: 'APARTMENT', area: '55.5', room_count: 3, handover_date: '2026-06-15T00:00:00Z', description: 'Căn góc', status: 'a'
        }
      }
    })

    const detail = await service.apartmentSearchService.getApartmentDetail({ sessiontoken: 'token', apartment_id: 123 })

    expect(runFODynamic.mock.calls[0][0]).toMatchObject({ workflowid: 'WF_BO_GET_APARTMENT_DETAIL', input: { apartment_id: 123 } })
    expect(detail.apartment).toMatchObject({
      water_meter_code2: 'W2-OLD', electric_meter_code: 'E-OLD', room_count: 3,
      handover_date: '2026-06-15T00:00:00Z', description: 'Căn góc', status: 'A'
    })
  })

  it('missing optional values stay empty (room count is not defaulted to 1)', async () => {
    runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: { apartment: { id: 5 } } })

    const detail = await service.apartmentSearchService.getApartmentDetail({ sessiontoken: 'token', apartment_id: 5 })

    expect(detail.apartment).toMatchObject({ water_meter_code2: '', electric_meter_code: '', room_count: null, handover_date: '', description: '' })
    expect(helpers.buildApartmentEditValues(detail.apartment!).room_count).toBe('')
  })

  it('pre-fills tower, floor, unit, type, area, room count, date, meters, description and status', () => {
    expect(helpers.buildApartmentEditValues(apartment())).toEqual({
      building_id: 76,
      floor_id: 100,
      unit_number: '55',
      apartment_type: 'APARTMENT',
      area: '55.5',
      room_count: '3',
      handover_date: '2026-06-15',
      water_meter_code: 'W-55',
      electricity_meter_code: 'E-55',
      description: 'Căn góc',
      status: 'A',
      apartment_status: ''
    })
    expect(helpers.toHandoverDateInput('')).toBe('')
    expect(helpers.toHandoverDateInput('not a date')).toBe('')
  })

  it('the route loads the detail by id on the server and requires MODIFY', () => {
    const route = readFileSync(new URL('../../../app/[locale]/(dashboard)/properties/unit/[id]/edit/page.tsx', import.meta.url), 'utf8')

    expect(route).toContain('requiredAction="MODIFY"')
    expect(route).toContain('apartmentSearchService.getApartmentDetail({')
    expect(route).toContain('apartment_id: apartmentId')
  })
})

describe('WF_BO_UPDATE_APARTMENT request', () => {
  it('builds exactly the 17 contract fields, without project_id', () => {
    const request = helpers.buildApartmentUpdateRequest(123, editValues({ water_meter_code: ' W-55 ', description: ' Căn góc ' }), codeParts, preserved)

    expect(Object.keys(request).sort()).toEqual(UPDATE_CONTRACT_FIELDS)
    expect(request).toEqual({
      id: 123,
      building_id: 76,
      floor_id: 100,
      apartment_code: 'A1-01-55',
      unit_number: '55',
      floor: '01',
      water_meter_code: 'W-55',
      water_meter_code2: 'W2-OLD',
      electric_meter_code: 'E-OLD',
      electricity_meter_code: 'E-55',
      apartment_type: 'APARTMENT',
      apartment_status: '',
      area: '55.5',
      room_count: 3,
      handover_date: '2026-06-15T00:00:00Z',
      description: 'Căn góc',
      status: 'A'
    })
  })

  it('preserves the selected apartment type CodeValue in the update payload, never its caption', () => {
    const request = helpers.buildApartmentUpdateRequest(123, editValues({ apartment_type: 'OFFICETEL' }), codeParts, preserved)

    expect(request.apartment_type).toBe('OFFICETEL')
    expect(request.apartment_type).not.toBe('Căn hộ văn phòng')
  })

  it('service sends only the 17 contract fields (no project_id / payment_qr_code / extras)', async () => {
    const request = { ...helpers.buildApartmentUpdateRequest(123, editValues(), codeParts, preserved), project_id: 1, payment_qr_code: 'QR' } as any

    await service.apartmentSearchService.updateApartment({ sessiontoken: 'token', request })
    const call = runFODynamic.mock.calls[0][0]

    expect(call.workflowid).toBe('WF_BO_UPDATE_APARTMENT')
    expect(Object.keys(call.input).sort()).toEqual(UPDATE_CONTRACT_FIELDS)
  })

  it('preserves water_meter_code2 / electric_meter_code from the detail when other fields change', () => {
    const request = helpers.buildApartmentUpdateRequest(123, editValues({ area: '60', water_meter_code: 'W-NEW' }), codeParts, preserved)

    expect(request.water_meter_code2).toBe('W2-OLD')
    expect(request.electric_meter_code).toBe('E-OLD')
    expect(readSource('./hooks/useApartmentEditForm.ts')).toContain('water_meter_code2: apartment.water_meter_code2,')
    expect(readSource('./hooks/useApartmentEditForm.ts')).toContain('electric_meter_code: apartment.electric_meter_code')
  })

  it('handover date: selected -> ISO UTC, empty -> ""; area stays a plain string', () => {
    expect(helpers.buildApartmentUpdateRequest(123, editValues({ handover_date: '2026-07-01' }), codeParts, preserved).handover_date).toBe('2026-07-01T00:00:00Z')
    expect(helpers.buildApartmentUpdateRequest(123, editValues({ handover_date: '' }), codeParts, preserved).handover_date).toBe('')
    expect(helpers.buildApartmentUpdateRequest(123, editValues({ area: '72.25' }), codeParts, preserved).area).toBe('72.25')
  })

  it('surfaces workflow errors with the error reference', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Apartment code exists' }], execution_id: 'EXEC-U' })

    await expect(service.apartmentSearchService.updateApartment({ sessiontoken: 'token', language: 'vi', request: helpers.buildApartmentUpdateRequest(123, editValues(), codeParts, preserved) }))
      .rejects.toThrow('Apartment code exists Mã tra cứu lỗi: EXEC-U')
  })
})

describe('full apartment code on edit (Tower – Floor – Unit)', () => {
  it('A1 + 01 + 55 -> A1-01-55; tower / floor / unit changes regenerate it (leading zeros kept)', async () => {
    const { getGeneratedApartmentCode } = await import('./apartmentCreateHelpers')

    expect(getGeneratedApartmentCode({ building_code: 'A1' }, { floor_no: '01', floor_code: 'A1-F01' }, '55')).toBe('A1-01-55')
    expect(getGeneratedApartmentCode({ building_code: 'AG' }, { floor_no: '02', floor_code: 'AG-F02' }, '55')).toBe('AG-02-55')
    expect(getGeneratedApartmentCode({ building_code: 'AG' }, { floor_no: '', floor_code: 'AG-F02' }, '055')).toBe('AG-02-055')
    expect(helpers.buildApartmentUpdateRequest(123, editValues({ unit_number: '07' }), { buildingCode: 'AG', floorNo: '02' }, preserved).apartment_code).toBe('AG-02-07')
  })

  it('edit init: a stored code different from the formula is custom (kept as is); the formula code stays auto', async () => {
    const { getInitialCustomApartmentCode } = await import('./apartmentCreateHelpers')

    expect(getInitialCustomApartmentCode({ apartment_code: 'A1-01-55', building_code: 'A1', floor: '01', unit_number: '55' })).toBeNull()
    expect(getInitialCustomApartmentCode({ apartment_code: 'BLOCK-A-001', building_code: 'A1', floor: '01', unit_number: '55' })).toBe('BLOCK-A-001')
    expect(getInitialCustomApartmentCode({ apartment_code: '', building_code: 'A1', floor: '01', unit_number: '55' })).toBeNull()
    expect(helpers.buildApartmentUpdateRequest(123, editValues({ unit_number: '07' }), { buildingCode: 'AG', floorNo: '02', apartmentCode: 'BLOCK-A-001' }, preserved).apartment_code).toBe('BLOCK-A-001')
  })

  it('validation: tower code, floor number, unit number and status are required', () => {
    const parts = { buildingCode: 'A1', floorNo: '01' }

    expect(helpers.validateApartmentEdit(1, editValues(), parts)).toEqual([])
    expect(helpers.validateApartmentEdit(1, editValues({ unit_number: ' ', status: '' }), parts)).toEqual(['unit_number', 'status'])
    expect(helpers.validateApartmentEdit(1, editValues(), { buildingCode: 'A1', floorNo: null })).toEqual(['floor_no'])
    expect(helpers.validateApartmentEdit(1, editValues(), { buildingCode: '', floorNo: '01' })).toEqual(['building_code'])
    expect(helpers.validateApartmentEdit(1, editValues({ area: '55 m²' }), parts)).toEqual(['area'])
  })

  it('the edit hook generates the code live and uses the shared cascading options of the apartment project', () => {
    const hook = readSource('./hooks/useApartmentEditForm.ts')

    expect(hook).toContain('const floorNo = resolveApartmentEditFloorNo(apartment, values.floor_id, selectedFloor)')
    expect(hook).toContain('const generatedApartmentCode = buildApartmentCode({ buildingCode, floorNo, unitNumber: values.unit_number })')
    expect(hook).toContain('useState<string | null>(() => getInitialCustomApartmentCode(apartment))')
    expect(hook).toContain('buildApartmentUpdateRequest(apartment.id, values, { buildingCode, floorNo, apartmentCode }, {')
    expect(hook).toContain('validateApartmentEdit(projectId, values, { buildingCode, floorNo })')
    expect(hook).toContain('useApartmentLocationOptions({ dictionary, sessiontoken, locale, projectId, initialBuildingId: apartment.building_id || null })')
    expect(hook).toContain('setValues(current => ({ ...current, building_id: buildingId, floor_id: null }))')
    expect(hook).not.toMatch(/project_id:|propertyAggregateService|_seed/)
  })
})

describe('edit page', () => {
  const dictionary = {
    propertyManagement: {
      editApartment: 'Sửa căn hộ',
      apartmentEditSubtitle: 'Cập nhật thông tin căn hộ.',
      apartmentEditBreadcrumb: 'Bất động sản / Căn hộ / Chi tiết căn hộ / Sửa căn hộ',
      apartmentCreateSectionLocation: 'Vị trí căn hộ',
      apartmentInfo: 'Thông tin căn hộ',
      apartmentCreateSectionTechnical: 'Thông tin kỹ thuật',
      apartmentCreateSectionHandover: 'Bàn giao & mô tả',
      project: 'Dự án',
      building: 'Tháp',
      floor: 'Tầng',
      apartmentNo: 'Số căn hộ',
      apartmentFullCode: 'Mã căn hộ đầy đủ',
      apartmentType: 'Loại căn hộ',
      areaWithUnit: 'Diện tích (m²)',
      roomCount: 'Số phòng',
      statusA: 'Đang hoạt động',
      statusI: 'Ngưng hoạt động',
      saveChanges: 'Lưu thay đổi',
      apartmentNotFound: 'Không tìm thấy căn hộ.',
      backToApartmentDetail: 'Quay lại chi tiết căn hộ'
    },
    common: { status: 'Trạng thái', cancel: 'Hủy', description: 'Mô tả' }
  } as any
  const detail = (overrides: Partial<ApartmentDetailApartment> = {}): ApartmentDetailResult => ({
    apartment: apartment(overrides),
    project: { id: 1, project_code: 'AGR', name: 'AN GIA RIVERSIDE', address: null, description: null, logo_url: null, status: 'A' },
    building: null,
    floor: null
  })
  const render = (props: Record<string, any> = {}) => renderToStaticMarkup(createElement(ApartmentEditPage, {
    dictionary, session: null, locale: 'vi', apartmentId: 123, initialDetail: detail(), ...props
  }))

  it('renders the sections in order: Project -> Tower -> Floor -> Unit, then full code, type, area (m²), room count, status', () => {
    const html = render()
    const order = ['Bất động sản / Căn hộ / Chi tiết căn hộ / Sửa căn hộ', 'Vị trí căn hộ', 'Dự án', 'Tháp', 'Tầng', 'Số căn hộ',
      'Thông tin căn hộ', 'Mã căn hộ đầy đủ', 'Loại căn hộ', 'Diện tích (m²)', 'Số phòng', 'Trạng thái',
      'Thông tin kỹ thuật', 'Bàn giao &amp; mô tả', 'Hủy', 'Lưu thay đổi'].map(text => html.indexOf(text))

    expect(order.every(index => index >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(html.split('Số căn hộ').length - 1).toBe(1)
  })

  it('status select offers A / I; another stored status is kept (shown, not replaced by A)', () => {
    expect(render()).toContain('Đang hoạt động')
    expect(render()).toContain('Ngưng hoạt động')
    expect(helpers.APARTMENT_EDIT_STATUS_OPTIONS).toEqual(['A', 'I'])
    expect(helpers.buildApartmentUpdateRequest(123, helpers.buildApartmentEditValues(apartment({ status: 'X' })), codeParts, preserved).status).toBe('X')
    expect(readSource('./components/ApartmentFormSections.tsx')).toContain('<MenuItem value={value} disabled>{getApartmentRecordStatusLabel(dictionary, value)}</MenuItem>')
    expect(readSource('./ApartmentEditPage.tsx')).toContain('<ApartmentRecordStatusSelect')
  })

  it('shows the load error instead of the form, with a way back to the detail', () => {
    const html = render({ initialDetail: { apartment: null, project: null, building: null, floor: null }, initialError: 'Không tìm thấy căn hộ.' })

    expect(html).toContain('Không tìm thấy căn hộ.')
    expect(html).toContain('Quay lại chi tiết căn hộ')
    expect(html).not.toContain('Vị trí căn hộ')
  })

  it('project is read-only context from the detail and never sent', () => {
    expect(render()).toContain('Dự án')
    expect(readSource('./ApartmentEditPage.tsx')).toContain('formatProjectLabel({ code: project.project_code, name: project.name })')
    expect(readSource('./components/ApartmentFormSections.tsx')).toMatch(/required\s+disabled\s+label=\{apartmentText\(dictionary, 'project', 'Project'\)\}/)
  })

  it('success goes to the detail; error stays on the edit page; cancel goes back to the detail', () => {
    const hook = readSource('./hooks/useApartmentEditForm.ts')
    const submit = hook.slice(hook.indexOf('const submit = async'), hook.indexOf('return {\n    values'))
    const tryBlock = submit.slice(submit.indexOf('try {'), submit.indexOf('} catch'))
    const catchBlock = submit.slice(submit.indexOf('} catch'), submit.indexOf('} finally'))

    expect(tryBlock).toContain('apartmentSearchService.updateApartment(')
    expect(tryBlock).toContain('router.push(`/${locale}/properties/unit/${apartment.id}`)')
    expect(catchBlock).toContain('setSubmitError(')
    expect(catchBlock).not.toContain('router.push')
    expect(hook).toContain('const backToDetail = () => router.push(`/${locale}/properties/unit/${apartment.id}`)')
    expect(submit.indexOf('if (invalid.length > 0) return')).toBeLessThan(submit.indexOf('updateApartment'))
    expect(readSource('./ApartmentEditPage.tsx')).toContain('onClick={form.backToDetail}')
  })
})

// Real WF_BO_GET_APARTMENT_DETAIL response (current Backend): no water_meter_code2 / electric_meter_code /
// electricity_meter_code / room_count / handover_date / description; floor.floor_no is 0 while apartment.floor is "01".
const REAL_DETAIL_RESPONSE = {
  success: true,
  code: 'success',
  errors: [],
  data: {
    apartment: {
      id: 8369, project_id: 1, building_id: 74, floor_id: 835, apartment_code: 'A1-01-55', project_code: 'AGR', building_code: 'A1',
      floor_code: '01', floor: '01', unit_number: '55', apartment_type: 'APARTMENT', area: null, water_meter_code: 'A1015501',
      payment_qr_code: null, status: 'A', created_by: 'Admin Supper', updated_by: 'Admin Supper'
    },
    building: { id: 74, project_id: 1, building_code: 'A1', project_code: 'AGR', name: 'A1', floor_count: null, display_order: 0, status: 'A' },
    project: { id: 1, project_code: 'AGR', name: 'AN GIA RIVERSIDE', address: '...', status: 'A' },
    floor: { id: 835, project_id: 1, building_id: 74, floor_code: '01', floor_no: 0, name: null, display_order: 0, status: 'A' }
  }
}

describe('real detail response (apartment.floor "01", floor.floor_no 0)', () => {
  const loadReal = async () => {
    runFODynamic.mockResolvedValue(REAL_DETAIL_RESPONSE)

    return service.apartmentSearchService.getApartmentDetail({ sessiontoken: 'token', apartment_id: 8369 })
  }
  // The floor as the Floor search returns it for this apartment (floor_no 0 -> "0").
  const currentFloorOption = { id: 835, floor_code: '01', name: '01', status: 'A', floor_no: '0' }

  it('maps the confirmed fields; missing ones are empty, never "undefined" / "null"', async () => {
    const detail = await loadReal()

    expect(detail.apartment).toMatchObject({
      id: 8369, project_id: 1, building_id: 74, floor_id: 835, apartment_code: 'A1-01-55', building_code: 'A1', floor: '01',
      unit_number: '55', apartment_type: 'APARTMENT', area: null, water_meter_code: 'A1015501', status: 'A',
      water_meter_code2: '', electric_meter_code: '', electricity_meter_code: '', room_count: null, handover_date: '', description: ''
    })
    expect(detail.project).toMatchObject({ id: 1, project_code: 'AGR', name: 'AN GIA RIVERSIDE' })
    expect(detail.building).toMatchObject({ id: 74, building_code: 'A1', name: 'A1' })
    expect(detail.floor).toMatchObject({ id: 835, floor_code: '01' })

    const values = helpers.buildApartmentEditValues(detail.apartment!)

    expect(values.area).toBe('')
    expect(values.room_count).toBe('')
    for (const value of Object.values(values)) expect(String(value)).not.toMatch(/^(undefined|null)$/)
  })

  it('initial code stays A1-01-55: the current floor keeps apartment.floor, not floor_no 0', async () => {
    const apt = (await loadReal()).apartment!
    const floorNo = helpers.resolveApartmentEditFloorNo(apt, apt.floor_id, currentFloorOption)
    const buildingCode = helpers.resolveApartmentEditBuildingCode(apt, apt.building_id, null)

    expect(floorNo).toBe('01')
    expect(buildingCode).toBe('A1')
    expect(helpers.resolveApartmentEditFloorNo(apt, apt.floor_id, null)).toBe('01')

    const request = helpers.buildApartmentUpdateRequest(apt.id, helpers.buildApartmentEditValues(apt), { buildingCode, floorNo: floorNo! }, apt)

    expect(request.floor).toBe('01')
    expect(request.floor).not.toBe('0')
    expect(request.apartment_code).toBe('A1-01-55')
    expect(request).toMatchObject({ id: 8369, building_id: 74, floor_id: 835, unit_number: '55', area: '', water_meter_code: 'A1015501', status: 'A' })
  })

  it('a newly selected floor uses its valid floor_no, else the number derived from floor_code (never a contradicting 0)', async () => {
    const apt = (await loadReal()).apartment!

    expect(helpers.resolveApartmentEditFloorNo(apt, 836, { floor_no: '0', floor_code: '02' })).toBe('02')
    expect(helpers.resolveApartmentEditFloorNo(apt, 837, { floor_no: '03', floor_code: 'A1-F03' })).toBe('03')
    expect(helpers.resolveApartmentEditBuildingCode(apt, 75, null)).toBe('')
    expect(helpers.resolveApartmentEditBuildingCode(apt, 75, { building_code: 'AG' })).toBe('AG')
  })

  it('shared rule: a zero floor_no only counts when the floor code does not say otherwise', async () => {
    const { resolveApartmentFloorNo } = await import('./apartmentCreateHelpers')

    expect(resolveApartmentFloorNo({ floor_no: '0', floor_code: '01' })).toBe('01')
    expect(resolveApartmentFloorNo({ floor_no: '0', floor_code: 'GROUND' })).toBe('0')
    expect(resolveApartmentFloorNo({ floor_no: '15', floor_code: 'VGP-S1-F15' })).toBe('15')
  })
})

describe('target detail response (Backend returns every Update field)', () => {
  it('populates electricity meter, room count, handover date, description and preserves the hidden meter codes', async () => {
    runFODynamic.mockResolvedValue({
      ...REAL_DETAIL_RESPONSE,
      data: {
        ...REAL_DETAIL_RESPONSE.data,
        apartment: {
          ...REAL_DETAIL_RESPONSE.data.apartment,
          area: 55.5,
          water_meter_code2: 'W2-8369',
          electric_meter_code: 'EM-8369',
          electricity_meter_code: 'E-8369',
          room_count: 2,
          handover_date: '2026-06-15T00:00:00Z',
          description: 'Căn góc'
        }
      }
    })

    const apt = (await service.apartmentSearchService.getApartmentDetail({ sessiontoken: 'token', apartment_id: 8369 })).apartment!
    const values = helpers.buildApartmentEditValues(apt)

    expect(values).toMatchObject({ electricity_meter_code: 'E-8369', room_count: '2', handover_date: '2026-06-15', description: 'Căn góc', area: '55.5' })

    const request = helpers.buildApartmentUpdateRequest(apt.id, { ...values, area: '60' }, { buildingCode: 'A1', floorNo: '01' }, apt)

    expect(request).toMatchObject({
      water_meter_code2: 'W2-8369',
      electric_meter_code: 'EM-8369',
      electricity_meter_code: 'E-8369',
      room_count: 2,
      handover_date: '2026-06-15T00:00:00Z',
      description: 'Căn góc',
      area: '60',
      floor: '01',
      apartment_code: 'A1-01-55'
    })
  })
})
