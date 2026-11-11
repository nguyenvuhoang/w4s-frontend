import { existsSync, readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProjectDetailModel } from '../types'

const { boxes, tabsProps } = vi.hoisted(() => ({
  boxes: [] as Array<Record<string, any>>,
  tabsProps: [] as Array<Record<string, any>>
}))

const { state, routerPush } = vi.hoisted(() => ({
  state: {
    workingProject: null as { id: number; code: string; name: string } | null,
    detail: { project: null as ProjectDetailModel | null, loading: false, error: null as string | null },
    deniedActions: new Set<string>(),
    detailCalls: [] as Array<Record<string, unknown>>
  },
  routerPush: vi.fn()
}))

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')
  const Stub = ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => h(Fragment, null, label ?? null, children ?? null)

  const Box = (props: Record<string, any>) => {
    boxes.push(props)

    return h(Fragment, null, props.children ?? null)
  }
  const Tabs = (props: Record<string, any>) => {
    tabsProps.push(props)

    return h(Fragment, null, props.children ?? null)
  }

  return {
    Alert: Stub, Avatar: Stub, Box, Button: Stub, Chip: Stub, Divider: Stub, Grid: Stub, Paper: Stub,
    Skeleton: () => h('i', { 'data-skeleton': true }), Stack: Stub, Tab: Stub, Tabs, Typography: Stub
  }
})
vi.mock('@mui/material/styles', () => ({ alpha: () => '' }))
vi.mock('@mui/icons-material/AccountBalanceOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/InfoOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SavingsOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Close', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ZoomIn', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Apartment', () => ({ default: () => null }))
vi.mock('@mui/icons-material/EditOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/VisibilityOutlined', () => ({ default: () => null }))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: { token: 'token' } } }) }))
vi.mock('next/navigation', () => ({ useParams: () => ({ locale: 'vi' }) }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: routerPush }) }))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/features/properties/components/PropertiesActionBar', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/@core/stores/useWorkingProjectStore', () => ({ useWorkingProject: () => state.workingProject }))
// The shared project gate: children only with a selected working project, otherwise its "select a project" state.
vi.mock('@/shared/components/project-context/RequireWorkingProject', async () => {
  const { createElement: h, Fragment } = await import('react')

  return {
    default: ({ children }: { children: React.ReactNode }) => (state.workingProject ? h(Fragment, null, children) : h('div', null, 'SELECT_PROJECT_GATE'))
  }
})
vi.mock('@/shared/permissions/PermissionGuard', () => ({
  PermissionGuard: ({ action, children }: { action: string; children: React.ReactNode }) => (state.deniedActions.has(action) ? null : children)
}))
// Province display name lookup (master workflow) is covered by projectProvinceForm.test.ts.
vi.mock('./province/useProjectProvinceLabel', () => ({ useProjectProvinceLabel: (value: string | null) => value ?? '' }))
vi.mock('./hooks/useContextProjectDetail', () => ({
  useContextProjectDetail: (args: Record<string, unknown>) => {
    state.detailCalls.push(args)

    return { ...state.detail, reload: vi.fn() }
  }
}))

let ProjectContextPage: typeof import('./ProjectContextPage').default

beforeAll(async () => {
  ; ({ default: ProjectContextPage } = await import('./ProjectContextPage'))
})

beforeEach(() => {
  state.workingProject = { id: 1, code: 'AGR', name: 'AN GIA RIVERSIDE' }
  state.detail = {
    project: {
      id: 1, project_code: 'AGR', name: 'AN GIA RIVERSIDE', address: '89 Hoàng Quốc Việt', description: null, logo_url: null,
      status: 'active', province: 'VN-HCM', total_buildings: 4, total_floors: 28, total_apartments: 257
    },
    loading: false,
    error: null
  }
  state.deniedActions.clear()
  state.detailCalls.length = 0
  routerPush.mockReset()
})

const dictionary = {
  projectManagement: {
    contextView: 'Xem', contextModify: 'Chỉnh sửa', address: 'Địa chỉ', province: 'Tỉnh/Thành phố',
    totalBuildings: 'Tổng số tháp', totalFloors: 'Tổng số tầng', totalApartments: 'Tổng số căn hộ',
    addProject: 'Thêm dự án', searchPlaceholder: 'Tìm theo tên hoặc mã dự án', provinceAllOption: 'Tất cả Tỉnh/Thành phố'
  },
  common: { search: 'Tìm kiếm', status: 'Trạng thái', delete: 'Xóa', reset: 'Làm mới' }
} as any

const render = () => renderToStaticMarkup(createElement(ProjectContextPage, { dictionary }))
const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
const APP = '../../../app/[locale]/(dashboard)'

describe('business route /properties/project: only the working-project context', () => {
  it('renders only the context project (from the header context id) with View and Modify', () => {
    const html = render()

    expect(state.detailCalls.at(-1)).toMatchObject({ projectId: 1 })
    for (const text of ['AN GIA RIVERSIDE', 'AGR', '89 Hoàng Quốc Việt', 'Tổng số tháp', '4', '28', '257', 'Xem', 'Chỉnh sửa']) {
      expect(html).toContain(text)
    }
  })

  it('has no management controls: search, status / province filters, pagination, create, delete', () => {
    const html = render()
    const source = read('./ProjectContextPage.tsx')

    for (const text of ['Tìm kiếm', 'Tìm theo tên hoặc mã dự án', 'Trạng thái', 'Tất cả Tỉnh/Thành phố', 'Thêm dự án', 'Xóa', 'Làm mới']) {
      expect(html).not.toContain(text)
    }
    expect(source).not.toMatch(/ProvinceSelect|PaginationPage|ProjectViewToggle|simpleSearchProjects|action="ADD"|action="DELETE"|TextField/)
  })

  it('Modify needs the MODIFY right; View stays', () => {
    state.deniedActions.add('MODIFY')
    const html = render()

    expect(html).toContain('Xem')
    expect(html).not.toContain('Chỉnh sửa')
  })

  it('View / Modify go to the detail / edit route of the context project', () => {
    const source = read('./ProjectContextPage.tsx')

    expect(source).toContain('router.push(`/${locale}${PROJECT_CONTEXT_BASE_PATH}/${project.id}`)')
    expect(source).toContain('router.push(`/${locale}${PROJECT_CONTEXT_BASE_PATH}/${project.id}/edit`)')
    expect(source).toContain('<PermissionGuard href={PROJECT_BUSINESS_PERMISSION_PATH} action="MODIFY">')
  })

  it('without a selected project: the shared "select a project" gate, no project card, no fallback to a first project', () => {
    state.workingProject = null
    const html = render()
    const source = read('./ProjectContextPage.tsx')
    const hook = read('./hooks/useContextProjectDetail.ts')

    expect(html).toContain('SELECT_PROJECT_GATE')
    expect(html).not.toContain('AN GIA RIVERSIDE')
    expect(source).toContain('projectId: workingProject?.id ?? null')
    expect(source).not.toMatch(/useWorkingProjectList|projects\[0\]|\[0\]\?\.id/)
    expect(hook).toContain('if (!projectId) return')
    expect(hook).toContain('propertyAggregateService.get_project_detail({ sessiontoken, language, project_id: projectId })')
  })

  it('the business route renders the context page (same URL, no redirect)', () => {
    const route = read(`${APP}/properties/project/page.tsx`)

    expect(route).toContain('<ProjectContextPage dictionary={dictionary} />')
    expect(route).not.toMatch(/ProjectManagementPage|redirect\(/)
  })
})

describe('System Settings > Project Management (/system-settings/projects): admin boundary', () => {
  const SETTINGS_ROUTES = [
    ['projects/page.tsx', /<AuthorizedLayout requiredPath=\{PROJECT_MANAGEMENT_BASE_PATH\} params=/],
    ['projects/create/page.tsx', /<AuthorizedLayout requiredPath=\{PROJECT_MANAGEMENT_BASE_PATH\} requiredAction="ADD"/],
    ['projects/[id]/page.tsx', /renderProjectDetailRoute\(\{ locale, id, scope: 'admin' \}\)/],
    ['projects/[id]/edit/page.tsx', /renderProjectDetailRoute\(\{ locale, id, scope: 'admin', mode: 'edit' \}\)/]
  ] as const

  it('the existing System Settings guard (static super-admin route policy) covers the projects area', async () => {
    const { getStaticRouteAccessPolicy, hasStaticRouteAccess } = await import('@/configs/staticRouteAccess')

    expect(getStaticRouteAccessPolicy('/system-settings/projects')).toMatchObject({ superAdminOnly: true })
    expect(getStaticRouteAccessPolicy('/system-settings/application-logs')).toMatchObject({ superAdminOnly: true })
    for (const action of ['VIEW', 'ADD', 'MODIFY'] as const) {
      // ADMIN passes; NON-ADMIN is refused (AuthorizedLayout then renders the Forbidden page).
      expect(hasStaticRouteAccess({ route: '/system-settings/projects', action, isSuperAdmin: true })).toBe(true)
      expect(hasStaticRouteAccess({ route: '/system-settings/projects', action, isSuperAdmin: false })).toBe(false)
    }
  })

  it('every settings route (list, create, detail, edit) goes through that guard, so a direct URL cannot bypass it', () => {
    for (const [file, guard] of SETTINGS_ROUTES) {
      expect(read(`${APP}/system-settings/${file}`)).toMatch(guard)
    }

    const server = read('./projectDetailRoute.server.tsx')

    expect(server).toContain("const requiredPath = scope === 'admin' ? PROJECT_MANAGEMENT_BASE_PATH : PROJECT_BUSINESS_PERMISSION_PATH")
    expect(server).toContain('<AuthorizedLayout requiredPath={requiredPath} requiredAction="MODIFY" params={{ locale }}>')
    expect(server).toContain('<AuthorizedLayout requiredPath={requiredPath} requiredAction="VIEW" params={{ locale }}>')
    // AuthorizedLayout resolves static policies before the menu rights (the application-logs convention).
    expect(read('../../../shared/components/layout/AuthorizedLayout.tsx')).toMatch(/if \(staticPolicy\) \{\s*hasAccess = hasStaticRouteAccess\(/)
  })

  it('settings routes do not depend on the business Project rights', () => {
    for (const [file] of SETTINGS_ROUTES) {
      expect(read(`${APP}/system-settings/${file}`)).not.toMatch(/PROJECT_BUSINESS_PERMISSION_PATH|\/properties\/project'/)
    }
    expect(read('./ProjectManagementPage.tsx')).not.toMatch(/PermissionGuard|usePermission|PROJECT_BUSINESS_PERMISSION_PATH/)
  })

  it('keeps search, status + province filters, grid/list, pagination, create, hover summary and the search workflow', () => {
    const page = read('./ProjectManagementPage.tsx')

    for (const marker of [
      "placeholder={text(dictionary, 'searchPlaceholder'",
      'onChange={event => handleStatusChange(',
      '<ProvinceSelect',
      '<ProjectViewToggle',
      '<PaginationPage',
      'href={`/${params.locale}${basePath}/create`}',
      'router.push(`/${params.locale}${basePath}/${project.id}`)',
      '<ProjectDetailPanel dictionary={dictionary} project={hoverProject} locale={params.locale} />',
      'propertyAggregateService.simpleSearchProjects({'
    ]) {
      expect(page).toContain(marker)
    }
  })

  it('admin detail: Modify without the business MODIFY right; business detail: Modify obeys it', () => {
    const detail = read('./ProjectDetailPage.tsx')
    const server = read('./projectDetailRoute.server.tsx')

    expect(detail).toContain("{accessScope === 'admin' ? (")
    expect(detail).toContain('<PermissionGuard href={PROJECT_BUSINESS_PERMISSION_PATH} action="MODIFY">')
    // Edit is a dedicated route guarded server-side by MODIFY (no dialog any more)
    expect(detail).not.toContain('<Dialog')
    expect(detail).toContain('router.push(`/${locale}${listHref}/${projectId}/edit`)')
    expect(server).toContain('requiredAction="MODIFY"')
    expect(server).toContain('accessScope={scope}')
    expect(server).toContain("const listHref = scope === 'admin' ? PROJECT_MANAGEMENT_BASE_PATH : PROJECT_CONTEXT_BASE_PATH")
  })

  it('compatibility: business detail / edit deep links keep the business rights; old create link now uses the admin boundary', () => {
    expect(read(`${APP}/properties/project/[id]/page.tsx`)).toContain("renderProjectDetailRoute({ locale, id, scope: 'business' })")
    expect(read(`${APP}/properties/project/[id]/edit/page.tsx`)).toContain("renderProjectDetailRoute({ locale, id, scope: 'business', mode: 'edit' })")
    expect(read(`${APP}/properties/project/create/page.tsx`)).toContain('<AuthorizedLayout requiredPath={PROJECT_MANAGEMENT_BASE_PATH} requiredAction="ADD"')
    expect(read(`${APP}/properties/project/page.tsx`)).toContain('requiredPath="/properties/project"')
    expect(existsSync(new URL(`${APP}/properties/project/[id]/page.tsx`, import.meta.url))).toBe(true)
  })
})

describe('System Settings hub', () => {
  it('Users & Permissions: Staff, Project Management, Permission Profiles, Role Management, Fee Management — Security moved to System & Maintenance', () => {
    // Parsed from the hub config (its MUI icon imports cannot load in the node test environment).
    const source = readFileSync(new URL('../../../views/pages/system-settings/systemSettingsModules.ts', import.meta.url), 'utf8')
    const block = source.slice(source.indexOf('export const systemSettingsModules'))
    const systemSettingsModules = [...block.matchAll(/key: '([^']+)',[\s\S]*?href: '([^']+)',\s*status: '([^']+)',[\s\S]*?group: '([^']+)'/g)]
      .map(([, key, href, status, group]) => ({ key, href, status, group }))
    const inGroup = (group: string) => systemSettingsModules.filter(module => module.group === group).map(module => module.key)

    expect(inGroup('users-permissions')).toEqual(['staff-management', 'projects', 'roles-profile', 'user-roles', 'fee-management'])
    expect(inGroup('system-maintenance')).toContain('security')
    expect(systemSettingsModules.filter(module => module.key === 'security')).toHaveLength(1)
    expect(systemSettingsModules.find(module => module.key === 'security')).toMatchObject({ href: '/system-settings/security', status: 'coming-soon' })
    expect(systemSettingsModules.find(module => module.key === 'projects')).toMatchObject({ href: '/system-settings/projects', status: 'available' })
    expect(systemSettingsModules.find(module => module.key === 'fee-management')).toMatchObject({ href: '/system-settings/fee-management', status: 'available' })
  })

  it('Project Management card texts (VI / EN)', () => {
    const texts = (locale: string) => JSON.parse(readFileSync(new URL(`../../../data/dictionaries/${locale}.json`, import.meta.url), 'utf8')).system_settings_modules

    expect([texts('vi').module_projects_title, texts('vi').module_projects_description, texts('vi').module_projects_action])
      .toEqual(['Quản lý dự án và các danh mục', 'Quản lý danh mục dự án và thông tin cấu hình dự án trong hệ thống.', 'Quản lý'])
    expect([texts('en').module_projects_title, texts('en').module_projects_description, texts('en').module_projects_action])
      .toEqual(['Project Management', 'Manage project master data and project configuration information.', 'Manage'])
  })
})

describe('business project tabs: Project information / Bank information', () => {
  const bankDictionary = {
    ...dictionary,
    projectManagement: {
      ...dictionary.projectManagement,
      detailTabInfo: 'Thông tin dự án',
      bankInformation: 'Thông tin ngân hàng',
      bankInformationSubtitle: 'Quản lý tài khoản nhận tiền và nội dung chuyển khoản của dự án.',
      bankOperatingAccount: 'Tài khoản vận hành',
      bankDepositAccount: 'Tài khoản đặt cọc',
      bankAccountNumber: 'Số tài khoản',
      bankAccountHolder: 'Tên chủ tài khoản',
      bankName: 'Tên ngân hàng',
      bankTransferContent: 'Nội dung chuyển khoản',
      bankAccountsEmpty: 'Chưa có thông tin tài khoản ngân hàng.'
    }
  } as any
  const renderTabs = () => {
    boxes.length = 0
    tabsProps.length = 0

    return renderToStaticMarkup(createElement(ProjectContextPage, { dictionary: bankDictionary }))
  }
  const panels = () => boxes.filter(box => box.role === 'tabpanel').map(box => [box.id, box.hidden])

  it('opens on "Thông tin dự án" (unchanged project summary) with a "Thông tin ngân hàng" tab next to it', () => {
    const html = renderTabs()

    expect(tabsProps.at(-1)?.value).toBe('information')
    expect(html.indexOf('Thông tin dự án')).toBeLessThan(html.indexOf('Thông tin ngân hàng'))
    expect(panels()).toEqual([['detail-tabpanel-information', false], ['detail-tabpanel-bank', true]])
    for (const text of ['AN GIA RIVERSIDE', '89 Hoàng Quốc Việt', 'Xem', 'Chỉnh sửa', '257']) expect(html).toContain(text)
  })

  it('switching tabs only changes local state: the project detail is loaded once for the working project', () => {
    renderTabs()
    const source = read('./ProjectContextPage.tsx')

    expect(state.detailCalls.every(call => call.projectId === 1)).toBe(true)
    expect(source).toContain("const [activeTab, setActiveTab] = useState<ProjectBusinessTab>('information')")
    expect(source).toContain('onChange={setActiveTab}')
    // both panels stay mounted (hidden), so switching never reloads or re-selects the project
    expect(source).toContain("hidden={activeTab !== 'bank'}")
    expect(source).not.toMatch(/router\.(push|replace)\([^)]*tab=|setWorkingProject|useWorkingProjectStore\.setState/)
  })

  it('bank tab: working project identity, Operating + Deposit accounts, empty state and no fake values', () => {
    const html = renderTabs()

    for (const text of [
      'Thông tin ngân hàng', 'Quản lý tài khoản nhận tiền và nội dung chuyển khoản của dự án.', 'Tài khoản vận hành', 'Tài khoản đặt cọc',
      'Tên ngân hàng', 'Số tài khoản', 'Tên chủ tài khoản', 'Nội dung chuyển khoản', 'Chưa có thông tin tài khoản ngân hàng.'
    ]) {
      expect(html).toContain(text)
    }
    expect(html.split('AN GIA RIVERSIDE').length - 1).toBeGreaterThanOrEqual(2)
    expect(html).not.toMatch(/\d{6,}/)
  })

  it('bank tab shows the accounts of the working project detail (WF_BO_GET_PROJECT_DETAIL) when returned', () => {
    state.detail.project = {
      ...state.detail.project!,
      operating_bank_account: { bank_name: 'Vietcombank', account_number: '001234567890', account_holder: 'BQL AN GIA RIVERSIDE', transfer_content: 'AGR [CanHo] Dong phi quan ly' },
      deposit_bank_account: null
    }
    const html = renderTabs()

    for (const text of ['Vietcombank', '001234567890', 'BQL AN GIA RIVERSIDE', 'AGR [CanHo] Dong phi quan ly']) expect(html).toContain(text)
    expect(html).not.toContain('Chưa có thông tin tài khoản ngân hàng.')
    expect(read('./ProjectContextPage.tsx')).toContain(
      'accounts={{ operating_bank_account: detail.project?.operating_bank_account, deposit_bank_account: detail.project?.deposit_bank_account }}'
    )
  })

  it('view only: no workflow / API / storage of its own, no edit or save action, no cached Create data', () => {
    // executable code only (the comments explain what is deliberately NOT done)
    const code = (file: string) => read(file).replace(/\/\*[\s\S]*?\*\/|\/\/.*$|\{\/\*[\s\S]*?\*\/\}/gm, '')
    const tab = code('./bank/ProjectBankInformationTab.tsx')
    const groups = code('./bank/ProjectBankAccountGroups.tsx')
    const card = code('./bank/ProjectBankAccountCard.tsx')

    expect(tab).not.toContain('editing')
    for (const source of [tab, groups, card]) {
      // no action Button (the QR zoom ButtonBase only opens a larger preview)
      expect(source).not.toMatch(/workflowid|runFODynamic|fetch\(|localStorage|sessionStorage|WF_BO_|<Button[\s>]|onSave|submit|useWorkingProject/)
      // the legacy in-memory payment config mock (bank_account_no...) is not used as a datasource
      expect(source).not.toMatch(/propertyAggregateService|payment_configs|bank_account_no/)
    }
    expect(() => read('./bank/useProjectBankAccounts.ts')).toThrow()
  })

  it('cards stack on mobile / tablet and sit side by side from lg', () => {
    expect(read('./bank/ProjectBankAccountGroups.tsx')).toContain('<Grid key={group} size={{ xs: 12, lg: 6 }} data-bank-group={group}>')
  })

  it('VI / EN texts', () => {
    const texts = (locale: string) => JSON.parse(readFileSync(new URL(`../../../data/dictionaries/${locale}.json`, import.meta.url), 'utf8')).projectManagement
    const keys = ['detailTabInfo', 'bankInformation', 'bankOperatingAccount', 'bankDepositAccount', 'bankName', 'bankAccountNumber', 'bankAccountHolder', 'bankTransferContent', 'bankAccountsEmpty']

    expect(keys.map(key => texts('vi')[key])).toEqual([
      'Thông tin dự án', 'Thông tin ngân hàng', 'Tài khoản vận hành', 'Tài khoản đặt cọc', 'Tên ngân hàng', 'Số tài khoản', 'Tên chủ tài khoản',
      'Nội dung chuyển khoản', 'Chưa có thông tin tài khoản ngân hàng.'
    ])
    expect(keys.map(key => texts('en')[key])).toEqual([
      'Project information', 'Bank information', 'Operating account', 'Deposit account', 'Bank name', 'Account number', 'Account holder',
      'Transfer content', 'Bank account information is not available yet.'
    ])
  })
})
