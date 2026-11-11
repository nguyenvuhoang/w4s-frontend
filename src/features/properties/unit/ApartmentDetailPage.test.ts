import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const { captured, auditProps, deniedActions, deleteDialogProps } = vi.hoisted(() => ({
  captured: [] as Array<{ name: string; props: Record<string, any> }>,
  auditProps: [] as Array<Record<string, any>>,
  deniedActions: new Set<string>(),
  deleteDialogProps: [] as Array<Record<string, any>>
}))

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')
  const Stub = ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => children ?? label ?? null
  const Captured = (name: string) => (props: Record<string, any>) => {
    captured.push({ name, props })

    return h(Fragment, null, props.label ?? null, props.children ?? null)
  }

  return {
    Alert: Stub, Box: Captured('Box'), Button: Stub, Chip: Stub, Dialog: Stub, DialogActions: Stub,
    DialogContent: Stub, DialogTitle: Stub, Divider: Stub, Drawer: Stub, Grid: Stub,
    MenuItem: Stub, Paper: Stub, Snackbar: Stub, Stack: Stub, Tab: Captured('Tab'), Tabs: Captured('Tabs'),
    TextField: Stub, Typography: Stub
  }
})

vi.mock('@/shared/components/entity-audit/EntityAuditHistory', () => ({
  default: (props: Record<string, any>) => {
    auditProps.push(props)

    return null
  }
}))
vi.mock('@mui/icons-material/HistoryOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/InfoOutlined', () => ({ default: () => null }))

vi.mock('@mui/material/styles', () => ({ alpha: () => '' }))
// CodeList IPS / APARTMENT_STATUS (captions as confirmed by the Backend; test data only).
vi.mock('@/shared/hooks/useCodeListCaptionMap', () => ({
  useCodeListCaptionMap: ({ code_group, code_name }: { code_group: string; code_name: string }) => ({
    items: [],
    captionMap: code_group === 'IPS' && code_name === 'APARTMENT_STATUS'
      ? new Map([['LEASED', 'Đang cho thuê'], ['VACANT', 'Căn hộ trống']])
      : new Map(),
    isLoading: false,
    error: null
  })
}))

vi.mock('@mui/icons-material/Apartment', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ArrowBack', () => ({ default: () => null }))
vi.mock('@mui/icons-material/DescriptionOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/EventOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/MeetingRoomOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Autorenew', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Business', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Category', () => ({ default: () => null }))
vi.mock('@mui/icons-material/CheckCircleOutline', () => ({ default: () => null }))
vi.mock('@mui/icons-material/DeleteOutline', () => ({ default: () => null }))
vi.mock('@mui/icons-material/EditOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ElectricBoltOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/FormatListNumberedOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/HomeWork', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Layers', () => ({ default: () => null }))
vi.mock('@mui/icons-material/LocationOnOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/People', () => ({ default: () => null }))
vi.mock('@mui/icons-material/QrCode2', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SellOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SquareFoot', () => ({ default: () => null }))
vi.mock('@mui/icons-material/WaterDropOutlined', () => ({ default: () => null }))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null })
}))

vi.mock('@shared/hooks/useRouter', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() })
}))

vi.mock('@/shared/permissions/PermissionGuard', () => ({
  PermissionGuard: ({ action, children }: { action: string; children: React.ReactNode }) => (deniedActions.has(action) ? null : children)
}))

vi.mock('@/shared/permissions/usePermission', () => ({
  usePermission: () => ({ hasPermission: () => true })
}))

vi.mock('@/shared/utils/SwalAlert', () => ({
  default: { confirm: vi.fn() }
}))

vi.mock('./services/apartmentSearchService', () => ({
  apartmentSearchService: { getApartmentDetail: vi.fn(), deleteApartment: vi.fn() }
}))

vi.mock('./ApartmentDeleteDialog', () => ({
  default: (props: Record<string, any>) => {
    deleteDialogProps.push(props)

    return null
  }
}))

vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))

let ApartmentDetailPage: typeof import('./ApartmentDetailPage').default

beforeAll(async () => {
  ({ default: ApartmentDetailPage } = await import('./ApartmentDetailPage'))
})

const initialDetail = (electric_meter_code: string | null) => ({
  apartment: {
    id: 4,
    project_id: 1,
    building_id: 2,
    floor_id: 3,
    apartment_code: 'A-01-01',
    project_code: 'PROJECT',
    building_code: 'A',
    floor_code: 'F01',
    floor: '1',
    unit_number: '01-01',
    apartment_type: 'APARTMENT',
    area: 72,
    water_meter_code: 'W1-AG-01-01',
    water_meter_code2: '',
    electric_meter_code: electric_meter_code ?? '',
    electricity_meter_code: '',
    room_count: 2,
    handover_date: '',
    description: '',
    payment_qr_code: null,
    apartment_status: null,
    status: 'A'
  },
  project: null,
  building: null,
  floor: null
})

const renderDetail = (electric_meter_code: string | null) => renderToStaticMarkup(
  createElement(ApartmentDetailPage, {
    dictionary: { propertyManagement: { electricityMeterCode: 'Mã đồng hồ điện', waterMeterCode: 'Mã đồng hồ nước' } } as any,
    locale: 'vi',
    apartmentId: 4,
    initialDetail: initialDetail(electric_meter_code)
  })
)

describe('ApartmentDetailPage apartment information', () => {
  it('renders both meter values when the workflow returns electric_meter_code', () => {
    const html = renderDetail('PE123456')

    expect(html).toContain('Mã đồng hồ nước')
    expect(html).toContain('W1-AG-01-01')
    expect(html).toContain('Mã đồng hồ điện')
    expect(html).toContain('PE123456')
    expect(html).toContain('A-01-01')
    expect(html).toContain('72 m²')
  })

  it('keeps the electric meter card visible when its value is empty', () => {
    const html = renderDetail(null)

    expect(html).toContain('Mã đồng hồ điện')
    expect(html).toContain('--')
    expect(html).toContain('W1-AG-01-01')
  })
})

describe('ApartmentDetailPage FE-01 cleanup', () => {
  const render = () => renderToStaticMarkup(
    createElement(ApartmentDetailPage, {
      dictionary: {
        propertyManagement: {
          floor: 'Tầng',
          qrPayment: 'Thanh toán QR',
          createQrPayment: 'Tạo QR thanh toán',
          paymentQrCode: 'Mã QR thanh toán',
          projectInfo: 'Thông tin dự án',
          buildingInfo: 'Thông tin tháp',
          floorInfo: 'Thông tin tầng',
          statusA: 'Đang hoạt động',
          statusD: 'Đã xoá'
        }
      } as any,
      locale: 'vi',
      apartmentId: 4,
      initialDetail: initialDetail('E1-AG-01-01')
    })
  )

  it('does not render any QR payment UI', () => {
    const html = render()

    expect(html).not.toContain('Thanh toán QR')
    expect(html).not.toContain('Tạo QR thanh toán')
    expect(html).not.toContain('Mã QR thanh toán')
  })

  it('does not render the redundant project / tower / floor sections', () => {
    const html = render()

    expect(html).not.toContain('Thông tin dự án')
    expect(html).not.toContain('Thông tin tháp')
    expect(html).not.toContain('Thông tin tầng')
  })

  it('shows the floor value without prepending "Tầng"', () => {
    const html = render()

    expect(html).not.toContain('Tầng 1')
  })

  it('shows the record status without offering Deleted', () => {
    const html = render()

    expect(html).toContain('Đang hoạt động')
    expect(html).not.toContain('Đã xoá')
  })

  it('"Chỉnh sửa" (MODIFY) opens the edit page instead of a drawer', () => {
    const source = readFileSync(new URL('./ApartmentDetailPage.tsx', import.meta.url), 'utf8')
    const modify = source.slice(source.indexOf('<PermissionGuard href="/properties/unit" action="MODIFY">'), source.indexOf('</PermissionGuard>', source.indexOf('action="MODIFY"')))

    expect(modify).toContain('onClick={() => router.push(`/${locale}/properties/unit/${apt.id}/edit`)}')
    expect(source).not.toMatch(/<Drawer|editOpen|openEdit|handleSave|updateApartment|buildEditForm/)
  })
})

describe('ApartmentDetailPage change history (Entity Audit)', () => {
  const dictionary = {
    propertyManagement: {
      apartmentInfo: 'Thông tin căn hộ',
      apartmentDetailTabHistory: 'Lịch sử thay đổi',
      apartmentCode: 'Mã căn hộ đầy đủ',
      apartmentNo: 'Số căn hộ',
      waterMeterCode: 'Mã đồng hồ nước',
      building: 'Tháp',
      floor: 'Tầng'
    }
  } as any
  const render = () => {
    captured.length = 0
    auditProps.length = 0

    return renderToStaticMarkup(createElement(ApartmentDetailPage, { dictionary, locale: 'vi', apartmentId: 4, initialDetail: initialDetail('E1') }))
  }

  it('has "Thông tin căn hộ" (default) and "Lịch sử thay đổi" tabs', () => {
    render()

    expect(captured.find(item => item.name === 'Tabs')?.props.value).toBe('info')
    expect(captured.filter(item => item.name === 'Tab').map(item => item.props.label)).toEqual(['Thông tin căn hộ', 'Lịch sử thay đổi'])

    const panels = captured.filter(item => item.name === 'Box' && item.props.role === 'tabpanel')

    expect(panels.map(panel => [panel.props.id, panel.props.hidden])).toEqual([
      ['detail-tabpanel-info', false],
      ['detail-tabpanel-history', true]
    ])
  })

  it('does not fetch the history before its tab is opened', () => {
    render()

    expect(auditProps).toHaveLength(0)
  })

  it('opening the tab renders the generic audit for entity "Apartment" with the apartment id (not code/project/building/floor)', () => {
    const source = readFileSync(new URL('./ApartmentDetailPage.tsx', import.meta.url), 'utf8')
    const audit = source.slice(source.indexOf('<EntityAuditHistory'), source.indexOf('/>', source.indexOf('<EntityAuditHistory')))

    expect(source).toContain("if (tab === 'history') setHistoryOpened(true)")
    expect(audit).toContain('entityName="Apartment"')
    expect(audit).toContain('entityId={apt.id}')
    expect(audit).toContain('active={historyOpened}')
    expect(audit).not.toMatch(/apartment_code|unit_number|project_id|building_id|floor_id/)
  })

  it('maps known Apartment audit fields to the screen labels, others fall back to the Backend name', () => {
    const source = readFileSync(new URL('./ApartmentDetailPage.tsx', import.meta.url), 'utf8')

    for (const field of ['ApartmentCode', 'UnitNumber', 'ApartmentType', 'Area', 'WaterMeterCode', 'ElectricityMeterCode', 'Status', 'BuildingId', 'FloorId']) {
      expect(source).toContain(`${field}: [`)
    }
    expect(source).toContain('fieldLabels={auditFieldLabels}')
  })
})

describe('ApartmentDetailPage delete (WF_BO_DELETE_APARTMENT)', () => {
  const render = () => {
    deleteDialogProps.length = 0

    return renderToStaticMarkup(createElement(ApartmentDetailPage, {
      dictionary: { propertyManagement: {}, common: { delete: 'Xóa' } } as any,
      locale: 'vi',
      apartmentId: 4,
      initialDetail: initialDetail('E1')
    }))
  }

  it('DELETE=true shows "Xóa"; DELETE=false hides it', () => {
    deniedActions.clear()
    expect(render()).toContain('Xóa')

    deniedActions.add('DELETE')
    expect(render()).not.toContain('Xóa')
    deniedActions.clear()
  })

  it('renders the confirmation closed with the apartment code, and does not call the workflow on render', async () => {
    render()
    const { apartmentSearchService } = await import('./services/apartmentSearchService')

    expect(deleteDialogProps.at(-1)).toMatchObject({ open: false, deleting: false, error: null, apartmentCode: 'A-01-01' })
    expect(apartmentSearchService.deleteApartment).not.toHaveBeenCalled()
  })
})

describe('apartment code display label ("Mã căn hộ đầy đủ" / "Full apartment code")', () => {
  const readJson = (locale: 'vi' | 'en') => JSON.parse(readFileSync(new URL(`../../../data/dictionaries/${locale}.json`, import.meta.url), 'utf8'))

  it('the shared propertyManagement keys show the full-code label (only display text changed, keys kept)', () => {
    const vi = readJson('vi').propertyManagement
    const en = readJson('en').propertyManagement

    expect(vi.apartmentCode).toBe('Mã căn hộ đầy đủ')
    expect(en.apartmentCode).toBe('Full apartment code')
    expect(vi.apartmentFullCode).toBe('Mã căn hộ đầy đủ')
    expect(en.apartmentFullCode).toBe('Full apartment code')
    expect(vi.apartmentSearchPlaceholder).toBe('Tìm mã căn hộ đầy đủ hoặc chủ hộ')
  })

  it('the short "Mã căn hộ" / "Unit Code" belongs only to unit_number; apartment_code texts say "đầy đủ" / "Full"; nothing is doubled', () => {
    // unit_number keys: "Mã căn hộ" (VI) / "Unit Code" (EN) since the Properties field alignment.
    const UNIT_NUMBER_KEYS = ['apartmentNo', 'apartmentNoRequired', 'importApartmentColUnitNumber']

    for (const [locale, shortLabel] of [['vi', /Mã căn hộ(?! đầy đủ)/], ['en', /(?<!Full |full )[Aa]partment [Cc]ode/]] as const) {
      const entries = Object.entries(readJson(locale).propertyManagement).filter((entry): entry is [string, string] => typeof entry[1] === 'string')

      expect(entries.filter(([key, value]) => !UNIT_NUMBER_KEYS.includes(key) && shortLabel.test(value)).map(([key]) => key)).toEqual([])
      expect(entries.filter(([, value]) => /đầy đủ đầy đủ|Full full/i.test(value))).toEqual([])
    }
    expect(readJson('vi').propertyManagement.apartmentNo).toBe('Mã căn hộ')
    expect(readJson('en').propertyManagement.apartmentNo).toBe('Unit Code')
  })

  it('detail shows "Mã căn hộ đầy đủ: <apartment_code>"; table / resident page / audit labels use the same key', () => {
    const html = renderToStaticMarkup(createElement(ApartmentDetailPage, {
      dictionary: { propertyManagement: { apartmentCode: 'Mã căn hộ đầy đủ' } } as any,
      locale: 'vi',
      apartmentId: 4,
      initialDetail: initialDetail('E1')
    }))

    expect(html).toContain('Mã căn hộ đầy đủ')
    expect(html).toContain('A-01-01')

    const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')

    expect(read('./ApartmentTable.tsx')).toContain("apartmentText(dictionary, 'apartmentCode', 'Full apartment code')")
    expect(read('./ApartmentResidentManagementPage.tsx')).toContain("text(dictionary, 'apartmentCode', 'Full apartment code')")
    expect(read('./ApartmentDetailPage.tsx')).toContain("ApartmentCode: ['apartmentCode', 'Full apartment code']")
  })
})

describe('ApartmentDetailPage "Thông tin căn hộ" — 14 fields', () => {
  const LABELS = [
    'Dự án', 'Tháp', 'Tầng', 'Căn', 'Mã căn hộ đầy đủ', 'Loại căn hộ', 'Mã đồng hồ nước', 'Mã đồng hồ điện', 'Trạng thái căn hộ',
    'Diện tích', 'Số lượng phòng', 'Ngày bàn giao', 'Mô tả', 'Trạng thái'
  ]
  const dictionary = {
    propertyManagement: {
      project: 'Dự án', building: 'Tháp', floor: 'Tầng', apartmentUnit: 'Căn', apartmentCode: 'Mã căn hộ đầy đủ',
      apartmentType: 'Loại căn hộ', waterMeterCode: 'Mã đồng hồ nước', electricityMeterCode: 'Mã đồng hồ điện', apartmentStatus: 'Trạng thái căn hộ',
      area: 'Diện tích', roomCount: 'Số lượng phòng', handoverDate: 'Ngày bàn giao', statusA: 'Đang hoạt động'
    },
    common: { description: 'Mô tả', status: 'Trạng thái' }
  } as any
  const base = initialDetail('E1')
  const fixture = (apartment: Record<string, unknown> = {}, rest: Record<string, unknown> = {}) => ({
    ...base,
    apartment: { ...base.apartment, floor: '1', unit_number: '1', apartment_code: 'A-1-1', ...apartment },
    project: { id: 1, project_code: 'TIT', name: 'TEST IT', address: null, description: 'PROJECT DESCRIPTION', logo_url: null, status: 'A' },
    building: { id: 2, project_id: 1, project_code: 'TIT', building_code: 'BA', name: 'A', floor_count: null, display_order: 0, status: 'A' },
    ...rest
  })
  const render = (detail: ReturnType<typeof fixture>) => {
    captured.length = 0

    return renderToStaticMarkup(createElement(ApartmentDetailPage, { dictionary, locale: 'vi', apartmentId: 4, initialDetail: detail as any }))
  }
  const source = readFileSync(new URL('./ApartmentDetailPage.tsx', import.meta.url), 'utf8')
  const items = source.slice(source.indexOf('const apartmentInfoItems'), source.indexOf('  return (', source.indexOf('const apartmentInfoItems')))
  // label + value of each card, in render order (Grid is a Stub: the label is followed by its value)
  const cards = (html: string) => LABELS.map(label => html.indexOf(label))

  it('renders the 14 labels in the required order, Project / Tower / Floor first', () => {
    const html = render(fixture())

    for (const label of LABELS) expect(html).toContain(label)
    expect([...items.matchAll(/key: '(\w+)'/g)].map(match => match[1])).toEqual([
      'project', 'building', 'floor', 'unit_number', 'apartment_code', 'apartment_type', 'water_meter_code', 'electric_meter_code',
      'apartment_status', 'area', 'room_count', 'handover_date', 'description', 'status'
    ])
    expect(cards(html).slice(0, 3)).toEqual([...cards(html).slice(0, 3)].sort((a, b) => a - b))
  })

  it('Dự án = TEST IT, Tháp = A, Tầng = 1, Căn = 1, Mã căn hộ đầy đủ = A-1-1 (names from the detail, not the header)', () => {
    const html = render(fixture())

    expect(html).toContain('Dự ánTEST IT')
    expect(html).toContain('ThápA')
    expect(html).toContain('Tầng1')
    expect(html).toContain('Căn1')
    expect(html).toContain('Mã căn hộ đầy đủA-1-1')
  })

  it('falls back to the project / tower code when the name is empty', () => {
    const detail = fixture()
    const html = render({ ...detail, project: { ...detail.project, name: '' }, building: { ...detail.building, name: '  ' } as any })

    expect(html).toContain('Dự ánTIT')
    expect(html).toContain('ThápBA')
  })

  it('apartment_status and status never map to each other', () => {
    const html = render(fixture({ apartment_status: 'VACANT', status: 'A' }))

    // caption from CodeList IPS / APARTMENT_STATUS, the record status keeps its own label
    expect(html).toContain('Trạng thái căn hộCăn hộ trống')
    expect(html).toContain('Đang hoạt động')
    expect(render(fixture({ apartment_status: 'LEASED' }))).toContain('Trạng thái căn hộĐang cho thuê')
    // a value without caption (legacy) is shown raw, never dropped
    expect(render(fixture({ apartment_status: 'LEGACY_STATUS' }))).toContain('Trạng thái căn hộLEGACY_STATUS')
    expect(items).toContain('value: formatPropertyText(getApartmentStatusCaption(apartmentStatusCodes.captionMap, apt.apartment_status))')
    expect(items).not.toMatch(/apartment_status[^\n]*apt\.status|apt\.status[^\n]*apartment_status/)
  })

  it('fields not returned by the Backend show "--" (apartment status, handover date, description, electric meter, room count)', () => {
    const html = render(fixture({ apartment_status: null, handover_date: '', description: '', electric_meter_code: '', room_count: null, area: null }))

    for (const label of ['Trạng thái căn hộ', 'Ngày bàn giao', 'Mô tả', 'Mã đồng hồ điện', 'Số lượng phòng', 'Diện tích']) expect(html).toContain(`${label}--`)
    // the project description is never used as the apartment description
    expect(html).not.toContain('PROJECT DESCRIPTION')
  })

  it('area = 0 and room_count = 0 still show 0', () => {
    const html = render(fixture({ area: 0, room_count: 0 }))

    expect(html).toContain('Diện tích0 m²')
    expect(html).toContain('Số lượng phòng0')
  })

  it('shows the apartment handover date (Vietnam day) and description', () => {
    const html = render(fixture({ handover_date: '2026-06-14T17:00:00Z', description: 'Căn góc' }))

    expect(html).toContain('Ngày bàn giao15/06/2026')
    expect(html).toContain('Mô tảCăn góc')
  })

  it('VI / EN labels; Create / Edit keep their own unit / meter labels', () => {
    const readJson = (locale: 'vi' | 'en') => JSON.parse(readFileSync(new URL(`../../../data/dictionaries/${locale}.json`, import.meta.url), 'utf8')).propertyManagement
    const keys = ['apartmentUnit', 'detailWaterMeterCode', 'detailElectricityMeterCode']

    expect(keys.map(key => readJson('vi')[key])).toEqual(['Căn', 'Mã nước', 'Mã điện'])
    expect(keys.map(key => readJson('en')[key])).toEqual(['Unit', 'Water meter', 'Electricity meter'])
    expect([readJson('vi').apartmentNo, readJson('vi').waterMeterCode, readJson('vi').electricityMeterCode]).toEqual(['Mã căn hộ', 'Mã đồng hồ nước', 'Mã đồng hồ điện'])
  })
})
