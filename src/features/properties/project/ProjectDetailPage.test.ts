import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const { captured } = vi.hoisted(() => ({ captured: [] as Array<{ name: string; props: Record<string, any> }> }))

// The shared Province lookup (Autocomplete + master workflow) is covered by projectProvinceForm.test.ts.
vi.mock('./province/ProvinceSelect', async () => {
  const { createElement: h } = await import('react')

  return { default: ({ label }: { label: string }) => h('span', { 'data-province-select': true }, label) }
})
vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')

  const Stub = ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => h(Fragment, null, label ?? null, children ?? null)
  const Captured = (name: string) => (props: Record<string, any>) => {
    captured.push({ name, props })

    return h(Fragment, null, props.label ?? null, props.children ?? null)
  }

  return {
    Accordion: Stub, AccordionDetails: Stub, AccordionSummary: Stub, FormControlLabel: Stub, Switch: Stub,
    Alert: Stub, Box: Captured('Box'), Button: Stub, Chip: Stub, CircularProgress: Stub, Dialog: Stub, DialogActions: Stub, DialogContent: Stub,
    DialogTitle: Stub, Divider: Stub, Grid: Stub, MenuItem: Stub, Paper: Stub, Popover: Stub, Skeleton: Stub,
    Stack: Stub, Tab: Captured('Tab'), Table: Stub, TableBody: Stub, TableCell: Stub, TableContainer: Stub, TableHead: Stub,
    TableRow: Stub, Tabs: Captured('Tabs'), TextField: Stub, Typography: Stub,
    Collapse: Stub, List: Stub, ListItemButton: Stub, Autocomplete: Stub, Avatar: Stub, IconButton: Stub, InputAdornment: Stub, Tooltip: Stub, ButtonBase: Stub
  }
})

vi.mock('@mui/material/styles', () => ({ alpha: () => '' }))

vi.mock('@mui/icons-material/AccessTimeOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Add', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Close', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ZoomIn', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Clear', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ContentCopy', () => ({ default: () => null }))
vi.mock('@mui/icons-material/OpenInNew', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Autorenew', () => ({ default: () => null }))
vi.mock('@mui/icons-material/DownloadOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/QrCode2', () => ({ default: () => null }))
vi.mock('@mui/icons-material/TaskAlt', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Apartment', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ArrowBack', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Business', () => ({ default: () => null }))
vi.mock('@mui/icons-material/CheckCircleOutline', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ContactPhoneOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/DeleteOutline', () => ({ default: () => null }))
vi.mock('@mui/icons-material/DescriptionOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Domain', () => ({ default: () => null }))
vi.mock('@mui/icons-material/EditOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/EmailOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/EventOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ExpandMore', () => ({ default: () => null }))
vi.mock('@mui/icons-material/GroupsOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/HistoryOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/InfoOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/AccountBalanceOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SavingsOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Layers', () => ({ default: () => null }))
vi.mock('@mui/icons-material/LocationOnOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/MarkEmailReadOutlined', () => ({ default: () => null }))
vi.mock('./notification-templates/ProjectNotificationTemplatesTab', () => ({ default: () => null }))
vi.mock('@mui/icons-material/People', () => ({ default: () => null }))
vi.mock('@mui/icons-material/PhoneOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ReportProblemOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SellOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ShieldOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/VisibilityOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Cancel', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SaveOutlined', () => ({ default: () => null }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic: vi.fn() } }))

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: null }) }))
vi.mock('@/shared/permissions/PermissionGuard', () => ({ PermissionGuard: ({ children }: { children: React.ReactNode }) => children }))
vi.mock('@/shared/permissions/usePermission', () => ({ usePermission: () => ({ canModify: true }) }))
vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => children }))
vi.mock('next/navigation', () => ({ useParams: () => ({ locale: 'vi' }) }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('../propertyAggregateService', () => ({ propertyAggregateService: {}, ProjectLogoUploadError: class extends Error {} }))

const { auditProps } = vi.hoisted(() => ({ auditProps: [] as Array<Record<string, unknown>> }))

vi.mock('@/shared/components/entity-audit/EntityAuditHistory', () => ({
  default: (props: Record<string, unknown>) => {
    auditProps.push(props)

    return null
  }
}))

let ProjectDetailPage: typeof import('./ProjectDetailPage').default
let ProjectEditPage: typeof import('./ProjectEditPage').default

beforeAll(async () => {
  ({ default: ProjectDetailPage } = await import('./ProjectDetailPage'))
  ;({ default: ProjectEditPage } = await import('./ProjectEditPage'))
})

const editDictionary = {
  projectManagement: {
    projectLogo: 'Logo dự án',
    logoChooseImage: 'Chọn ảnh',
    logoChangeImage: 'Thay đổi ảnh',
    logoUploadHint: 'Định dạng hỗ trợ: {formats}. Dung lượng tối đa: {maxSize} MB.',
    paymentConfiguration: 'Cấu hình thanh toán',
    projectType: 'Loại dự án',
    detailTabInfo: 'Thông tin dự án',
    detailTabHistory: 'Lịch sử thay đổi',
    statusProjectActive: 'Đang hoạt động',
    statusProjectInactive: 'Ngưng hoạt động',
    handoverDate: 'Ngày bàn giao'
  },
  common: { refresh: 'Làm mới', status: 'Trạng thái' }
} as any

const baseProject = {
  id: 1,
  project_code: 'PRJ',
  name: 'Project',
  address: null,
  description: null,
  logo_url: null,
  status: 'active',
  investor: null,
  province: null,
  handover_date: null
}

const render = (overrides: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(ProjectDetailPage, {
  dictionary: editDictionary,
  projectId: 1,
  initialProject: { ...baseProject, ...overrides } as any
}))

// Same dictionary / project as `render`, on the dedicated Edit page (`.../:id/edit`).
const renderEdit = (overrides: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(ProjectEditPage, {
  dictionary: editDictionary,
  locale: 'vi',
  projectId: 1,
  initialProject: { ...baseProject, ...overrides } as any,
  initialProvince: null,
  listHref: '/system-settings/projects',
  accessScope: 'admin'
}))

describe('ProjectDetailPage', () => {
  it('edit page reuses the shared logo upload with the real limits in its note', () => {
    const html = renderEdit()

    expect(html).toContain('Logo dự án')
    // No current logo on this project, so the button offers to choose one.
    expect(html).toContain('Chọn ảnh')
    expect(html).toContain('Định dạng hỗ trợ: JPG, JPEG, PNG, WEBP. Dung lượng tối đa: 5 MB.')
  })

  it('keeps FE-01 removals: no Refresh, Payment Configuration or Project Type', () => {
    const html = render()

    expect(html).not.toContain('Làm mới')
    expect(html).not.toContain('Cấu hình thanh toán')
    expect(html).not.toContain('Loại dự án')
  })

  it('shows the handover date as DD/MM/YYYY in the project information', () => {
    const html = render({ handover_date: '2026-03-05' })

    expect(html).toContain('Ngày bàn giao')
    expect(html).toContain('05/03/2026')
  })

  it('shows "--" when there is no handover date', () => {
    const html = render()

    expect(html).toContain('Ngày bàn giao')
    expect(html).toContain('--')
  })

  it('keeps Status in the edit page while Project Type stays hidden', () => {
    const html = renderEdit()

    // The project is active, so "Ngưng hoạt động" can only come from the edit page's status select.
    expect(html).toContain('Ngưng hoạt động')
    expect(html).not.toContain('Loại dự án')
  })

  it('shows two tabs, "Thông tin dự án" selected by default, with the header actions outside the tabs', () => {
    captured.length = 0

    const html = render()
    const tabs = captured.find(item => item.name === 'Tabs')!.props
    const labels = captured.filter(item => item.name === 'Tab').map(item => item.props.label)

    expect(tabs.value).toBe('info')
    expect(labels).toEqual(['Thông tin dự án', 'Lịch sử thay đổi'])
    // Back / Edit stay in the page header, rendered once, before the tab bar
    expect(html.indexOf('Back to list')).toBeGreaterThan(-1)
    expect(html.indexOf('Back to list')).toBeLessThan(html.indexOf('Thông tin dự án'))
    expect(html.indexOf('Edit')).toBeLessThan(html.indexOf('Thông tin dự án'))

    const panels = captured.filter(item => item.name === 'Box' && item.props.role === 'tabpanel')

    expect(panels.map(panel => [panel.props.id, panel.props.hidden])).toEqual([
      ['detail-tabpanel-info', false],
      ['detail-tabpanel-history', true]
    ])
  })

  it('does not load the change history before its tab is opened (lazy)', () => {
    auditProps.length = 0
    render()

    expect(auditProps).toHaveLength(0)
  })

  it('opening the tab loads the Project history of this project id, kept mounted afterwards', () => {
    const source = readFileSync(new URL('./ProjectDetailPage.tsx', import.meta.url), 'utf8')

    expect(source).toContain("if (tab === 'history') setHistoryOpened(true)")
    expect(source).toContain('{historyOpened && (')
    expect(source).toContain('<EntityAuditHistory active={historyOpened} entityName="Project" entityId={project.id} dictionary={dictionary} locale={locale} hiddenFields={PROJECT_AUDIT_HIDDEN_FIELDS} />')
    // Project Type is retired from the Project UI: hidden from the history through config, not in the generic renderer
    expect(source).toContain("const PROJECT_AUDIT_HIDDEN_FIELDS = ['ProjectType'] as const")
    // the history is not part of the information panel
    const infoPanel = source.slice(source.indexOf('id="detail-tabpanel-info"'), source.indexOf('id="detail-tabpanel-history"'))

    expect(infoPanel).not.toContain('EntityAuditHistory')
  })
})


describe('ProjectDetailPage aggregates and project info (real WF_BO_GET_PROJECT_DETAIL)', () => {
  const realProject = {
    id: 16, project_code: 'TEST IT', name: 'TEST IT', investor: null, province: 'Thành phố Hồ Chí Minh', address: 'thủ đức',
    description: 'test123', logo_url: null, handover_date: '2026-09-28T17:00:00Z', status: 'active',
    total_buildings: 3, total_floors: 5, total_apartments: 7, total_residents: 44, active_residents: 14, inactive_residents: 12
  }

  it('shows the six aggregates as returned, including residents', async () => {
    const { projectDetailMetrics } = await import('./ProjectDetailPage')
    const metrics = projectDetailMetrics({ projectManagement: {} } as any, realProject as any)

    expect(metrics.map(metric => [metric.key, metric.label, metric.value])).toEqual([
      ['total_buildings', 'Total towers', 3],
      ['total_floors', 'Total floors', 5],
      ['total_apartments', 'Total apartments', 7],
      ['total_residents', 'Total residents', 44],
      ['active_residents', 'Active residents', 14],
      ['inactive_residents', 'Inactive residents', 12]
    ])

    const html = render(realProject)

    for (const text of ['Total towers', 'Total residents', 'Active residents', 'Inactive residents', '44', '14', '12']) expect(html).toContain(text)
  })

  it('0 is shown as 0, only a missing aggregate is "--"', async () => {
    const { projectDetailMetrics } = await import('./ProjectDetailPage')
    const { formatProjectCount } = await import('./projectListHelpers')
    const shown = (project: Record<string, unknown>) => projectDetailMetrics({ projectManagement: {} } as any, project as any).map(metric => formatProjectCount(metric.value))
    const source = readFileSync(new URL('./ProjectDetailPage.tsx', import.meta.url), 'utf8')

    expect(shown({ ...realProject, total_buildings: 0, total_residents: 0, active_residents: 0, inactive_residents: 0 })).toEqual(['0', '5', '7', '0', '0', '0'])
    expect(shown({ ...realProject, total_floors: undefined, active_residents: undefined })).toEqual(['3', '--', '7', '44', '--', '12'])
    expect(source).toContain('{formatProjectCount(metric.value)}')
    expect(source).not.toMatch(/pickMetric|number_format\.format\(Number\(value\)\)/)
  })

  it('shows project code, province (raw name), address, investor ("--"), description and the Vietnam handover day; no project type', () => {
    const html = render(realProject)
    const source = readFileSync(new URL('./ProjectDetailPage.tsx', import.meta.url), 'utf8')

    for (const text of ['TEST IT', 'Thành phố Hồ Chí Minh', 'thủ đức', 'test123', '29/09/2026']) expect(html).toContain(text)
    expect(source).toContain('value={formatProjectValue(provinceLabel || project.province)}')
    expect(source).toContain('value={formatProjectValue(project.investor)}')
    expect(source).toContain('value={formatProjectValue(project.address)}')
    expect(source).toContain('value={formatProjectValue(project.description)}')
    expect(html).not.toContain('Loại dự án')
  })

  it('active residents are never derived from total residents', () => {
    const source = readFileSync(new URL('./ProjectDetailPage.tsx', import.meta.url), 'utf8')

    expect(source).toContain("{ key: 'active_residents', label: text(dictionary, 'activeResidents', 'Active residents'), value: project.active_residents,")
    expect(source).not.toMatch(/active_residents:\s*[^,\n]*total_residents/)
  })
})

describe('ProjectDetailPage tower list (WF_BO_GET_BUILDING_BY_PROJECT_ID)', () => {
  const building = (overrides: Record<string, unknown>) => ({
    building_id: 0, building_code: '', project_id: 2, name: '', floor_count: 0, display_order: null, status: 'active', ...overrides
  })
  const renderTowers = (buildings: Array<Record<string, unknown>>) => renderToStaticMarkup(createElement(ProjectDetailPage, {
    dictionary: editDictionary,
    projectId: 2,
    initialProject: { ...baseProject, id: 2 } as any,
    initialBuildings: buildings as any,
    initialBuildingSummary: { total_floors: 29, total_apartments: 226, total_residents: 255 }
  }))
  // Stubbed cells render back to back: name, code, floors, total units, active residents, status.
  const row = (...cells: Array<string | number>) => cells.join('')

  it('shows Total Units / Active residents of each building as returned', () => {
    const html = renderTowers([
      building({ building_id: 9, building_code: 'CA-T1', name: 'CA-T1', floor_count: 12, total_apartments: 82, active_residents: 93, display_order: 1 }),
      building({ building_id: 10, building_code: 'CA-T2', name: 'CA-T2', floor_count: 16, total_apartments: 142, active_residents: 143, display_order: 2 }),
      building({ building_id: 42, building_code: 'TEST', name: 'TEST', floor_count: 1, total_apartments: 2, active_residents: 7, display_order: 3, status: 'inactive' })
    ])

    expect(html).toContain(row('CA-T1', 'CA-T1', 12, 82, 93))
    expect(html).toContain(row('CA-T2', 'CA-T2', 16, 142, 143))
    expect(html).toContain(row('TEST', 'TEST', 1, 2, 7))
    // project-level totals are never shown in place of a building's counts
    expect(html).not.toMatch(/226|255/)
  })

  it('0 is shown as 0; only null / undefined is "--"', () => {
    const html = renderTowers([
      building({ building_id: 1, building_code: 'Z', name: 'ZERO', floor_count: 3, total_apartments: 0, active_residents: 0, display_order: 1 }),
      building({ building_id: 2, building_code: 'N', name: 'NULL', floor_count: 4, total_apartments: null, active_residents: null, display_order: 2 }),
      building({ building_id: 3, building_code: 'U', name: 'UNDEF', floor_count: 5, display_order: 3 })
    ])

    expect(html).toContain(row('ZERO', 'Z', 3, 0, 0))
    expect(html).toContain(row('NULL', 'N', 4, '--', '--'))
    expect(html).toContain(row('UNDEF', 'U', 5, '--', '--'))
  })

  it('reads the per-building fields, not recomputed from apartments / residents', () => {
    const source = readFileSync(new URL('./ProjectDetailPage.tsx', import.meta.url), 'utf8')

    expect(source).toContain('<TableCell>{formatProjectCount(building.total_apartments)}</TableCell>')
    expect(source).toContain('<TableCell>{formatProjectCount(building.active_residents)}</TableCell>')
  })
})

describe('ProjectDetailPage bank information tab (System Settings project detail)', () => {
  const bankDictionary = {
    projectManagement: {
      detailTabInfo: 'Thông tin dự án',
      detailTabHistory: 'Lịch sử thay đổi',
      bankInformation: 'Thông tin ngân hàng',
      notificationTemplatesTab: 'Mẫu thông báo',
      bankOperatingAccount: 'Tài khoản vận hành',
      bankDepositAccount: 'Tài khoản đặt cọc',
      bankAccountNumber: 'Số tài khoản',
      bankAccountsEmpty: 'Chưa có thông tin tài khoản ngân hàng.'
    },
    common: {}
  } as any
  const renderScope = (accessScope: 'admin' | 'business', bank: Record<string, unknown> = {}) => {
    captured.length = 0

    return renderToStaticMarkup(createElement(ProjectDetailPage, {
      dictionary: bankDictionary,
      projectId: 7,
      accessScope,
      initialProject: {
        id: 7, project_code: 'TEST IT', name: 'TEST IT PROJECT', address: null, description: null, logo_url: null, status: 'active',
        investor: null, province: null, handover_date: null, ...bank
      } as any
    }))
  }

  it('admin detail: 4 tabs in order, Project information by default, bank / templates panels hidden until selected', () => {
    renderScope('admin')

    expect(captured.find(item => item.name === 'Tabs')!.props.value).toBe('info')
    expect(captured.filter(item => item.name === 'Tab').map(item => item.props.label)).toEqual(['Thông tin dự án', 'Thông tin ngân hàng', 'Mẫu thông báo', 'Lịch sử thay đổi'])
    expect(captured.filter(item => item.name === 'Box' && item.props.role === 'tabpanel').map(item => [item.props.id, item.props.hidden])).toEqual([
      ['detail-tabpanel-info', false],
      ['detail-tabpanel-bank', true],
      ['detail-tabpanel-templates', true],
      ['detail-tabpanel-history', true]
    ])
  })

  it('bank tab: identity of the detail project (route id), Operating + Deposit accounts, empty state, no fake data', () => {
    const html = renderScope('admin')
    const source = readFileSync(new URL('./ProjectDetailPage.tsx', import.meta.url), 'utf8')

    for (const text of ['TEST IT PROJECT', 'TEST IT', 'Tài khoản vận hành', 'Tài khoản đặt cọc', 'Số tài khoản', 'Chưa có thông tin tài khoản ngân hàng.']) {
      expect(html).toContain(text)
    }
    expect(html).not.toMatch(/\d{6,}/)
    expect(source).toContain('project={{ id: project.id, name: project.name, code: project.project_code }}')
    expect(source).toContain('mode="manage"')
  })

  it('bank tab renders the accounts of WF_BO_GET_PROJECT_DETAIL when the response carries them', () => {
    const html = renderScope('admin', {
      operating_bank_account: { bank_name: 'Vietcombank', account_number: '001234567890', account_holder: 'BQL AN GIA RIVERSIDE', transfer_content: 'AGR [CanHo] Dong phi quan ly' },
      deposit_bank_account: { bank_name: 'Techcombank', account_number: '009876543210', account_holder: 'BQL AN GIA RIVERSIDE', transfer_content: 'AGR [CanHo] Dat coc tien ich' }
    })
    const source = readFileSync(new URL('./ProjectDetailPage.tsx', import.meta.url), 'utf8')

    for (const text of ['Vietcombank', '001234567890', 'Techcombank', '009876543210', 'AGR [CanHo] Dat coc tien ich']) expect(html).toContain(text)
    expect(html).not.toContain('Chưa có thông tin tài khoản ngân hàng.')
    expect(source).toContain('accounts={{ operating_bank_account: project.operating_bank_account, deposit_bank_account: project.deposit_bank_account }}')
  })

  it('bank tab: a stored qr_code_url is shown at the top right of its card (160px, contain), click opens a larger preview', () => {
    const qr = 'https://minio.ips.test/ips-documents/project-bank-qr/7/operating_bank_account/qr.png'

    renderScope('admin', {
      operating_bank_account: { bank_name: 'Vietcombank', account_number: '001234567890', account_holder: 'BQL', transfer_content: 'AGR', qr_code_url: qr },
      deposit_bank_account: { bank_name: 'Techcombank', account_number: '009876543210', account_holder: 'BQL', transfer_content: 'AGR', qr_code_url: null }
    })

    const images = captured.filter(item => item.name === 'Box' && item.props.component === 'img' && (item.props['data-bank-field'] || item.props['data-bank-qr-dialog-image']))

    // one card with QR (thumbnail + dialog image), the deposit card renders no QR box at all
    expect(images.map(item => item.props.src)).toEqual([qr, qr])
    expect(images[0].props.sx).toMatchObject({ width: 160, height: 160, objectFit: 'contain' })
    expect(images[0].props['data-bank-field']).toBe('qr_code_url')
    expect(images[1].props['data-bank-qr-dialog-image']).toBe(true)

    const source = readFileSync(new URL('./bank/ProjectBankAccountCard.tsx', import.meta.url), 'utf8')

    // text left / QR right from sm, stacked on mobile; the QR box is only rendered with a qr_code_url
    expect(source).toContain("direction={{ xs: 'column', sm: 'row' }}")
    expect(source).toContain("{qrUrl ? (")
    expect(source).toContain('onClick={() => setQrOpen(true)}')
  })

  it('bank tab: no qr_code_url -> no QR box', () => {
    renderScope('admin', {
      operating_bank_account: { bank_name: 'Vietcombank', account_number: '001234567890', account_holder: 'BQL', transfer_content: 'AGR', qr_code_url: '  ' },
      deposit_bank_account: null
    })

    expect(captured.filter(item => item.name === 'Box' && item.props.component === 'img' && item.props.src !== '/images/illustrations/building.jpg')).toEqual([])
  })

  it('an account object of empty strings still shows the empty state', () => {
    const empty = { bank_name: '', account_number: '', account_holder: '', transfer_content: '' }
    const html = renderScope('admin', { operating_bank_account: empty, deposit_bank_account: null })

    expect(html).toContain('Chưa có thông tin tài khoản ngân hàng.')
  })

  it('business detail keeps its 2 tabs (no bank tab outside System Settings)', () => {
    renderScope('business')

    expect(captured.filter(item => item.name === 'Tab').map(item => item.props.label)).toEqual(['Thông tin dự án', 'Lịch sử thay đổi'])
  })

  it('one shared bank component, never the working project context, no workflow / service / save', () => {
    const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
    const code = (file: string) => read(file).replace(/\/\*[\s\S]*?\*\/|\/\/.*$|\{\/\*[\s\S]*?\*\/\}/gm, '')

    expect(read('./ProjectDetailPage.tsx')).toContain("import ProjectBankInformationTab from './bank/ProjectBankInformationTab'")
    expect(read('./ProjectContextPage.tsx')).toContain("import ProjectBankInformationTab from './bank/ProjectBankInformationTab'")
    expect(read('./ProjectContextPage.tsx')).toContain('mode="view"')
    for (const file of ['./bank/ProjectBankInformationTab.tsx', './bank/ProjectBankAccountGroups.tsx', './bank/ProjectBankAccountCard.tsx']) {
      expect(code(file)).not.toMatch(/useWorkingProject|workflowid|runFODynamic|fetch\(|localStorage|WF_BO_|<Button[\s>]|onSave|submit/)
    }
    expect(() => readFileSync(new URL('./bank/projectBankService.ts', import.meta.url))).toThrow()
  })

  it('entity audit of the Project is unchanged (still lazy, entity "Project")', () => {
    const source = readFileSync(new URL('./ProjectDetailPage.tsx', import.meta.url), 'utf8')

    expect(source).toContain("if (tab === 'history') setHistoryOpened(true)")
    expect(source).toContain('<EntityAuditHistory active={historyOpened} entityName="Project" entityId={project.id}')
  })
})
