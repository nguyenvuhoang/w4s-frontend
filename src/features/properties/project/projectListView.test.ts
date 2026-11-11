import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProjectModel } from '../types'

// No jsdom in this repo: MUI is stubbed so each rendered element's props are recorded, and a "click"
// is simulated by calling the recorded handler, exactly as React would on a real click.
const { captured } = vi.hoisted(() => ({ captured: [] as Array<{ name: string; props: Record<string, any> }> }))

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')

  const make = (name: string, tag?: string) => (props: Record<string, any>) => {
    captured.push({ name, props })

    return tag
      ? h(tag, { 'data-mui': name }, props.label ?? null, props.children ?? null)
      : h(Fragment, null, props.label ?? null, props.children ?? null)
  }

  return {
    Box: make('Box'), Card: make('Card', 'section'), CardActionArea: make('CardActionArea', 'div'), CardContent: make('CardContent'),
    Chip: make('Chip'), Grid: make('Grid'), Paper: make('Paper'), Stack: make('Stack'), Table: make('Table', 'table'),
    TableBody: make('TableBody', 'tbody'), TableCell: make('TableCell', 'td'), TableContainer: make('TableContainer'),
    TableHead: make('TableHead', 'thead'), TableRow: make('TableRow', 'tr'), ToggleButton: make('ToggleButton', 'button'),
    ToggleButtonGroup: make('ToggleButtonGroup'), Tooltip: make('Tooltip'), Typography: make('Typography'),
    useTheme: () => ({ transitions: { create: () => '' } })
  }
})
vi.mock('@mui/icons-material/Domain', () => ({ default: () => null }))
vi.mock('@mui/icons-material/GridView', () => ({ default: () => null }))
vi.mock('@mui/icons-material/LocationOn', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ViewList', () => ({ default: () => null }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn() }) }))

let ProjectCollectionView: typeof import('./ProjectCollectionView').default
let ProjectViewToggle: typeof import('./ProjectViewToggle').default
let helpers: typeof import('./projectListHelpers')

beforeAll(async () => {
  // shouldTriggerRowNavigation inspects the click target (Element) and text selection (window.getSelection()).
  ;(globalThis as any).window ??= { getSelection: () => null }
  ;(globalThis as any).Element ??= class {}
  ;({ default: ProjectCollectionView } = await import('./ProjectCollectionView'))
  ;({ default: ProjectViewToggle } = await import('./ProjectViewToggle'))
  helpers = await import('./projectListHelpers')
})

beforeEach(() => {
  captured.length = 0
})

const dictionary = {
  projectManagement: {
    gridView: 'Dạng lưới',
    listView: 'Dạng danh sách',
    projectCode: 'Mã dự án',
    projectName: 'Tên dự án',
    address: 'Địa chỉ',
    statusProjectActive: 'Đang hoạt động',
    statusProjectInactive: 'Ngưng hoạt động',
    viewDetail: 'Xem chi tiết',
    paymentConfiguration: 'Cấu hình thanh toán',
    manageBuildings: 'Quản lý tháp'
  },
  common: { status: 'Trạng thái', edit: 'Chỉnh sửa', delete: 'Xóa' }
} as any

const project = (id: number, name: string, status: ProjectModel['status']): ProjectModel => ({
  id,
  project_code: `PRJ${id}`,
  name,
  project_name: name,
  image_url: '',
  logo_url: null,
  investor: '',
  management_company: '',
  address: `${id} Nguyen Xien`,
  province: '',
  total_buildings: 0,
  total_floors: 0,
  total_units: 0,
  active_residents: 0,
  payment_config_status: 'pending',
  qr_payment_enabled: false,
  voucher_enabled: false,
  status,
  last_modified: '',
  description: null
})

const projects = [project(1, 'Sunrise', 'active'), project(2, 'Moonlight', 'inactive')]

const renderCollection = (viewMode: 'grid' | 'list', onOpenProject = vi.fn()) => renderToStaticMarkup(createElement(ProjectCollectionView, {
  dictionary,
  viewMode,
  projects,
  onOpenProject,
  onHoverStart: vi.fn(),
  onHoverEnd: vi.fn()
}))

const propsOf = (name: string) => captured.filter(item => item.name === name).map(item => item.props)
const fakeClick = { target: null, currentTarget: {} } as any

describe('Project list view mode', () => {
  it('defaults to grid', () => {
    expect(helpers.DEFAULT_PROJECT_VIEW_MODE).toBe('grid')

    const html = renderCollection(helpers.DEFAULT_PROJECT_VIEW_MODE)

    expect(html).toContain('data-mui="Card"')
    expect(html).not.toContain('<table')
  })

  it('switches grid -> list -> grid through the toggle and renders the matching view', () => {
    let mode: 'grid' | 'list' = 'grid'
    const setMode = (next: 'grid' | 'list') => { mode = next }

    renderToStaticMarkup(createElement(ProjectViewToggle, { dictionary, value: mode, onChange: setMode }))
    propsOf('ToggleButtonGroup')[0].onChange({}, 'list')
    expect(mode).toBe('list')

    const listHtml = renderCollection(mode)

    expect(listHtml).toContain('<table')
    expect(listHtml).not.toContain('data-mui="Card"')

    captured.length = 0
    renderToStaticMarkup(createElement(ProjectViewToggle, { dictionary, value: mode, onChange: setMode }))
    propsOf('ToggleButtonGroup')[0].onChange({}, 'grid')
    expect(mode).toBe('grid')
    expect(renderCollection(mode)).toContain('data-mui="Card"')
  })

  it('keeps the current view when the already-selected button is clicked again', () => {
    const onChange = vi.fn()

    renderToStaticMarkup(createElement(ProjectViewToggle, { dictionary, value: 'grid', onChange }))
    propsOf('ToggleButtonGroup')[0].onChange({}, null)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows the current mode and localized labels on the toggle', () => {
    renderToStaticMarkup(createElement(ProjectViewToggle, { dictionary, value: 'list', onChange: vi.fn() }))

    expect(propsOf('ToggleButtonGroup')[0].value).toBe('list')
    expect(propsOf('ToggleButton').map(props => props['aria-label'])).toEqual(['Dạng lưới', 'Dạng danh sách'])
  })

  it('renders the same dataset in both views', () => {
    const gridHtml = renderCollection('grid')
    const listHtml = renderCollection('list')

    for (const html of [gridHtml, listHtml]) {
      expect(html).toContain('Sunrise')
      expect(html).toContain('Moonlight')
      expect(html).toContain('PRJ1')
      expect(html).toContain('PRJ2')
      expect(html).toContain('1 Nguyen Xien')
    }
  })
})

describe('Project navigation', () => {
  it('opens the project detail with a single click on a grid card (no double-click)', () => {
    const onOpenProject = vi.fn()

    renderCollection('grid', onOpenProject)

    const cards = propsOf('CardActionArea')

    expect(cards).toHaveLength(2)
    expect(cards[1].onDoubleClick).toBeUndefined()
    cards[1].onClick(fakeClick)
    expect(onOpenProject).toHaveBeenCalledWith(projects[1])
  })

  it('opens the project detail with a single click on a list row (no double-click)', () => {
    const onOpenProject = vi.fn()

    renderCollection('list', onOpenProject)

    // First TableRow is the header row.
    const rows = propsOf('TableRow').slice(1)

    expect(rows).toHaveLength(2)
    expect(rows[0].onDoubleClick).toBeUndefined()
    expect(rows[0].sx.cursor).toBe('pointer')
    rows[0].onClick(fakeClick)
    expect(onOpenProject).toHaveBeenCalledWith(projects[0])
  })

  it('opens the detail from a focused list row with Enter', () => {
    const onOpenProject = vi.fn()

    renderCollection('list', onOpenProject)
    propsOf('TableRow')[2].onKeyDown({ key: 'Enter' })

    expect(onOpenProject).toHaveBeenCalledWith(projects[1])
  })

  it('page uses one shared detail handler for grid and list', () => {
    const source = readFileSync(new URL('./ProjectManagementPage.tsx', import.meta.url), 'utf8')

    expect(source).toContain('onOpenProject={openProjectDetail}')
    expect(source.match(/\$\{basePath\}\/\$\{project\.id\}/g)).toHaveLength(1)
    expect(source).not.toContain('onDoubleClick')
  })
})

describe('Project list columns and actions', () => {
  it('list shows only columns backed by the search response and no actions column', () => {
    const html = renderCollection('list')

    expect(html).toContain('Mã dự án')
    expect(html).toContain('Tên dự án')
    expect(html).toContain('Địa chỉ')
    expect(html).toContain('Trạng thái')
    expect(html).toContain('Đang hoạt động')
    expect(html.match(/<td data-mui="TableCell">/g)).toHaveLength(4 + 2 * 4)
  })

  it('no FE-01 action menu comes back in either view', () => {
    for (const html of [renderCollection('grid'), renderCollection('list')]) {
      expect(html).not.toContain('Xem chi tiết')
      expect(html).not.toContain('Chỉnh sửa')
      expect(html).not.toContain('Cấu hình thanh toán')
      expect(html).not.toContain('Quản lý tháp')
      expect(html).not.toContain('Xóa')
    }

    const source = readFileSync(new URL('./ProjectManagementPage.tsx', import.meta.url), 'utf8')

    expect(source).not.toContain('ActionMenu')
  })
})

describe('Project list paging and search', () => {
  it('keeps page-size options 5/10/20/50 for both views', () => {
    const source = readFileSync(new URL('./ProjectManagementPage.tsx', import.meta.url), 'utf8')

    expect(helpers.PROJECT_PAGE_SIZE_OPTIONS).toEqual([5, 10, 20, 50])
    expect(source).toContain('pageSizeOptions={PROJECT_PAGE_SIZE_OPTIONS}')
  })

  it('changing the view only updates the view mode (no reload, filter or paging change)', () => {
    const source = readFileSync(new URL('./ProjectManagementPage.tsx', import.meta.url), 'utf8')

    expect(source).toContain('<ProjectViewToggle dictionary={dictionary} value={viewMode} onChange={setViewMode} />')
    expect(source.match(/setViewMode/g)).toHaveLength(2)
  })
})
