import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'

// FE-01 (feedback 25/09) regression checks for the Tower / Floor / Apartment screens.

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')

  const Stub = ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => h(Fragment, null, label ?? null, children ?? null)
  const Cell = ({ children }: { children?: React.ReactNode }) => h('td', null, children ?? null)

  return {
    Alert: Stub, Box: Stub, Button: Stub, Chip: Stub, CircularProgress: Stub, Grid: Stub, InputAdornment: Stub,
    MenuItem: ({ children }: { children?: React.ReactNode }) => h('option', null, children ?? null),
    Paper: Stub, Skeleton: Stub, Stack: Stub, Table: Stub, TableBody: Stub, TableCell: Cell, TableContainer: Stub,
    TableHead: Stub, TableRow: Stub, TextField: Stub, Tooltip: Stub, Typography: Stub
  }
})

const { runFODynamic } = vi.hoisted(() => ({ runFODynamic: vi.fn() }))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@mui/icons-material/Apartment', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ArrowBack', () => ({ default: () => null }))
vi.mock('@mui/icons-material/PeopleAlt', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Refresh', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Search', () => ({ default: () => null }))

vi.mock('@/shared/components/table', () => ({
  useSearchTableRowConfig: () => ({ getRowProps: () => ({}) })
}))

vi.mock('next/navigation', () => ({ useParams: () => ({ locale: 'vi' }) }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/features/resident/components/resident-list/residentListHelpers', () => ({
  getResidentStatusColor: () => 'default',
  getResidentStatusLabel: (_: unknown, status: string) => `status:${status}`
}))

const residentData = vi.hoisted(() => ({
  apartment: {
    apartment_id: 4,
    apartment_code: 'A-01-01',
    project_id: 1,
    building_id: 2,
    floor_id: 3,
    floor: '1',
    unit_number: '01',
    area: 72,
    water_meter_code: 'W-01',
    payment_qr_code: null,
    apartment_type: 'APARTMENT',
    status: 'A'
  },
  residents: [
    {
      resident_id: 10, apartment_id: 4, project_id: 1, resident_code: 'R-10', user_code: 'U-10', full_name: 'Nguyen Van A',
      gender: 'M', date_of_birth: '1990-01-01', phone: '0900000001', email: 'a@example.com', avatar_url: null,
      identity_number: '079000000001', role: 'OWNER', is_representative: true, is_primary: true, is_location: true,
      relationship_with_owner: null, effective_from: null, effective_to: null, resident_status: 'A', resident_apartment_status: 'A'
    },
    {
      resident_id: 11, apartment_id: 4, project_id: 1, resident_code: 'R-11', user_code: null, full_name: 'Tran Thi B',
      gender: 'F', date_of_birth: null, phone: null, email: null, avatar_url: null,
      identity_number: null, role: 'MEMBER', is_representative: false, is_primary: false, is_location: true,
      relationship_with_owner: null, effective_from: null, effective_to: null, resident_status: 'A', resident_apartment_status: 'A'
    }
  ]
}))

vi.mock('./unit/hooks/useApartmentResidentManagement', () => ({
  useApartmentResidentManagement: () => ({ data: residentData, loading: false, error: null })
}))

const propertyManagement = {
  apartmentCode: 'Mã căn hộ đầy đủ',
  apartmentStatus: 'Trạng thái căn hộ',
  buildingCode: 'Mã tháp',
  buildingName: 'Tên tháp',
  displayOrder: 'Thứ tự hiển thị',
  floor: 'Tầng',
  floorCode: 'Mã tầng',
  floorName: 'Tên tầng',
  floorNo: 'Số tầng',
  qrPayment: 'Thanh toán QR',
  status: 'Trạng thái',
  statusA: 'Đang hoạt động',
  statusD: 'Đã xoá',
  statusI: 'Ngưng hoạt động',
  residentManagementTableGender: 'Giới tính',
  residentManagementTableDob: 'Ngày sinh',
  residentManagementTableIdentity: 'CCCD/CMND',
  residentManagementTableRole: 'Vai trò'
}
const dictionary = { propertyManagement, common: { search: 'Tìm kiếm', reset: 'Làm mới' } } as any

let BuildingTable: typeof import('./building/BuildingTable').default
let FloorTable: typeof import('./floor/FloorTable').default
let ApartmentTable: typeof import('./unit/ApartmentTable').default
let ApartmentFilterBar: typeof import('./unit/ApartmentFilterBar').default
let ApartmentResidentManagementPage: typeof import('./unit/ApartmentResidentManagementPage').default
let apartmentHelpers: typeof import('./unit/apartmentHelpers')

beforeAll(async () => {
  ({ default: BuildingTable } = await import('./building/BuildingTable'))
  ;({ default: FloorTable } = await import('./floor/FloorTable'))
  ;({ default: ApartmentTable } = await import('./unit/ApartmentTable'))
  ;({ default: ApartmentFilterBar } = await import('./unit/ApartmentFilterBar'))
  ;({ default: ApartmentResidentManagementPage } = await import('./unit/ApartmentResidentManagementPage'))
  apartmentHelpers = await import('./unit/apartmentHelpers')
})

describe('Tower list', () => {
  it('does not render the Display Order column', () => {
    const html = renderToStaticMarkup(createElement(BuildingTable, {
      dictionary,
      locale: 'vi',
      rows: [{ id: 1, building_code: 'T1', project_id: 1, name: 'Tháp 1', floor_count: 20, description: null, resident_count: null, status: 'A' }]
    }))

    expect(html).toContain('Mã tháp')
    expect(html).not.toContain('Thứ tự hiển thị')
    // 6 header cells + 6 body cells (code, name, floor count, description, resident count, status)
    expect(html.match(/<td>/g)).toHaveLength(12)
  })
})

describe('Floor list', () => {
  it('does not render the Display Order and Floor No columns', () => {
    const html = renderToStaticMarkup(createElement(FloorTable, {
      dictionary,
      rows: [{ id: 1, floor_code: 'F01', building_id: 1, project_id: 1, floor_no: '99', name: '1', description: null, resident_count: null, status: 'A' }]
    }))

    expect(html).toContain('Mã tầng')
    expect(html).toContain('Tên tầng')
    expect(html).not.toContain('Thứ tự hiển thị')
    expect(html).not.toContain('Số tầng')
    expect(html).not.toContain('99')
  })
})

describe('Apartment list', () => {
  const row = {
    id: 4, apartment_code: 'A-01-01', unit_number: '01', project_id: 1, building_id: 2, floor_id: 3, floor: '1',
    apartment_type: 'APARTMENT', area: 72, water_meter_code: 'W-01', payment_qr_code: 'QR-CODE-VALUE', room_count: null,
    apartment_status: null, status: 'A'
  }

  it('has no QR Payment column and shows the floor value as returned by the backend', () => {
    const html = renderToStaticMarkup(createElement(ApartmentTable, {
      dictionary,
      rows: [row],
      projectOptions: [],
      buildingOptions: []
    }))

    expect(html).not.toContain('Thanh toán QR')
    expect(html).toContain('<td>1</td>')
    expect(html).not.toContain('Tầng 1')
  })

  it('does not offer the Deleted status in the status options', () => {
    expect(apartmentHelpers.apartmentStatusOptions).toEqual(['all', 'A', 'I'])
  })

  it('renders the status filter as "Trạng thái" without the Deleted option or a QR filter', () => {
    const html = renderToStaticMarkup(createElement(ApartmentFilterBar, {
      dictionary,
      filter: apartmentHelpers.emptyApartmentFilter,
      onChange: vi.fn(),
      onSelectChange: vi.fn(),
      onSearch: vi.fn(),
      onReset: vi.fn()
    }))

    expect(html).toContain('Trạng thái')
    expect(html).not.toContain('Trạng thái căn hộ')
    expect(html).toContain('Đang hoạt động')
    expect(html).not.toContain('Đã xoá')
    expect(html).not.toContain('Thanh toán QR')
  })
})

describe('Apartment residents', () => {
  it('keeps only the agreed resident columns and derives no resident count or username from other fields', () => {
    const html = renderToStaticMarkup(createElement(ApartmentResidentManagementPage, {
      dictionary,
      sessiontoken: 'token',
      apartmentId: 4
    }))

    expect(html).toContain('A-01-01')
    expect(html).not.toContain('Số lượng cư dân')
    // no login_name in this fixture: the column shows "--", never user_code / resident code / email
    expect(html).not.toContain('U-10')
    expect(html).toContain('R-10')
    expect(html).toContain('0900000001')
    expect(html).toContain('a@example.com')
    expect(html).not.toContain('Giới tính')
    expect(html).not.toContain('Ngày sinh')
    expect(html).not.toContain('CCCD/CMND')
    expect(html).not.toContain('Vai trò')
    expect(html).not.toContain('079000000001')
    expect(html).not.toContain('W-01')
  })
})

describe('Apartment residents: "Tên đăng nhập" column (login_name of WF_BO_GET_LIST_RESIDENT_BY_APARTMENT_ID)', () => {
  const resident = (overrides: Record<string, unknown>) => ({
    resident_id: 92, apartment_id: 4, project_id: 1, resident_code: 'RS000000000092', login_name: 'luugiahan', user_code: 'U-92',
    full_name: 'Lưu Gia Hân', gender: 'F', date_of_birth: null, phone: '0912345678', email: 'han@example.com', avatar_url: null,
    identity_number: null, role: 'OWNER', is_representative: true, is_primary: true, is_location: true,
    relationship_with_owner: null, effective_from: null, effective_to: null, resident_status: 'A', resident_apartment_status: 'A',
    ...overrides
  })
  const columnDictionary = {
    propertyManagement: {
      ...propertyManagement,
      residentManagementTableResidentCode: 'Mã cư dân',
      residentManagementTableFullName: 'Họ tên',
      residentManagementTablePhone: 'Điện thoại',
      residentManagementTableEmail: 'Email',
      residentManagementTableResidentStatus: 'Trạng thái cư dân'
    },
    common: { loginname: 'Tên đăng nhập' }
  } as any
  const renderRows = (rows: Record<string, unknown>[]) => {
    const saved = residentData.residents

    residentData.residents = rows as any

    try {
      return renderToStaticMarkup(createElement(ApartmentResidentManagementPage, { dictionary: columnDictionary, sessiontoken: 'token', apartmentId: 4 }))
    } finally {
      residentData.residents = saved
    }
  }
  const cells = (html: string) => [...html.matchAll(/<td>(.*?)<\/td>/g)].map(match => match[1])

  it('headers: Mã cư dân, Tên đăng nhập, Họ tên, Điện thoại, Email, Trạng thái cư dân', () => {
    expect(cells(renderRows([resident({})])).slice(0, 6)).toEqual(['Mã cư dân', 'Tên đăng nhập', 'Họ tên', 'Điện thoại', 'Email', 'Trạng thái cư dân'])
  })

  it('row: RS000000000092 | luugiahan | Lưu Gia Hân | phone | email | status (apartment info unchanged)', () => {
    const html = renderRows([resident({})])

    expect(cells(html).slice(6)).toEqual(['RS000000000092', 'luugiahan', 'Lưu Gia Hân', '0912345678', 'han@example.com', 'status:A'])
    expect(html).toContain('A-01-01')
  })

  it('null / "" / blank / missing login_name show "--", never the resident code, user code or email', () => {
    for (const login_name of [null, '', '   ', undefined]) {
      const row = cells(renderRows([resident({ login_name })])).slice(6)

      expect(row[1]).toBe('--')
      expect(row[0]).toBe('RS000000000092')
    }
  })

  it('maps login_name from the workflow response only; the request stays { apartment_id }', async () => {
    const { apartmentResidentService } = await import('./unit/services/apartmentResidentService')

    runFODynamic.mockResolvedValue({
      success: true,
      data: {
        apartment: { apartment_id: 4, apartment_code: 'A-01-01' },
        residents: [
          resident({}),
          resident({ resident_id: 93, login_name: null }),
          { ...resident({ resident_id: 94 }), login_name: undefined }
        ]
      }
    })

    const result = await apartmentResidentService.getResidentsByApartmentId({ sessiontoken: 'token', language: 'vi', apartment_id: 4 })

    expect(runFODynamic.mock.calls[0][0]).toMatchObject({ workflowid: 'WF_BO_GET_LIST_RESIDENT_BY_APARTMENT_ID', input: { apartment_id: 4 } })
    expect(runFODynamic.mock.calls[0][0].input).toEqual({ apartment_id: 4 })
    expect(result.residents.map(item => item.login_name)).toEqual(['luugiahan', null, null])
    expect(result.residents[0]).toMatchObject({ resident_code: 'RS000000000092', full_name: 'Lưu Gia Hân', email: 'han@example.com' })
  })
})
