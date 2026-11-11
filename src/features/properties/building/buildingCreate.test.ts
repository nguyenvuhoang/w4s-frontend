/* eslint-disable react-hooks/rules-of-hooks -- the Create hook is driven directly with a fake useState (no DOM test renderer in this project) */
import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { runFODynamic, routerPush, captured, hookState, workingProject } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  routerPush: vi.fn(),
  captured: [] as Array<{ name: string; props: Record<string, any> }>,
  // Minimal useState so the Create hook can be driven without a DOM (slots kept between "renders").
  hookState: { slots: [] as unknown[], cursor: 0 },
  workingProject: { current: { id: 5, code: 'TEST IT', name: 'TEST IT' } as { id: number; code: string; name: string } | null }
}))

vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>()

  const useState = (initial: unknown) => {
    const index = hookState.cursor++

    if (!(index in hookState.slots)) hookState.slots[index] = typeof initial === 'function' ? (initial as () => unknown)() : initial

    const set = (next: unknown) => {
      hookState.slots[index] = typeof next === 'function' ? (next as (value: unknown) => unknown)(hookState.slots[index]) : next
    }

    return [hookState.slots[index], set]
  }

  return { ...actual, default: { ...actual, useState }, useState }
})

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@/@core/stores/useWorkingProjectStore', () => ({ useWorkingProject: () => workingProject.current }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: routerPush }) }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@/shared/services/projectLookupService', () => ({
  projectLookupService: {},
  formatProjectLabel: (project: { code: string; name: string }) => `[${project.code}] ${project.name}`
}))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@/shared/components/project-context/RequireWorkingProject', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))
vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')

  const make = (name: string) => (props: Record<string, any>) => {
    captured.push({ name, props })

    return h(Fragment, null, props.label ?? null, props.children ?? null)
  }

  return {
    Alert: make('Alert'), Button: make('Button'), Grid: make('Grid'), Paper: make('Paper'),
    Stack: make('Stack'), TextField: make('TextField'), Typography: make('Typography')
  }
})
for (const icon of ['AddBusinessOutlined', 'Cancel', 'SaveOutlined']) {
  vi.doMock(`@mui/icons-material/${icon}`, () => ({ default: () => null }))
}

let useBuildingCreateForm: typeof import('./hooks/useBuildingCreateForm').useBuildingCreateForm
let BuildingCreatePage: typeof import('./BuildingCreatePage').default

beforeAll(async () => {
  ;({ useBuildingCreateForm } = await import('./hooks/useBuildingCreateForm'))
  ;({ default: BuildingCreatePage } = await import('./BuildingCreatePage'))
})

beforeEach(() => {
  runFODynamic.mockReset()
  runFODynamic.mockResolvedValue({ success: true, code: 'success', data: {}, errors: [] })
  routerPush.mockReset()
  captured.length = 0
  hookState.slots = []
  hookState.cursor = 0
  workingProject.current = { id: 5, code: 'TEST IT', name: 'TEST IT' }
})

const dictionary = {
  propertyManagement: {
    addBuilding: 'Thêm tháp',
    buildingCreateSubtitle: 'Thêm tháp mới vào dự án đang thao tác.',
    buildingCreateBreadcrumb: 'Bất động sản / Tháp / Thêm tháp',
    buildingInfo: 'Thông tin tháp',
    project: 'Dự án',
    buildingCode: 'Mã tháp',
    buildingName: 'Tên tháp',
    floorCount: 'Số tầng',
    residentCount: 'Số cư dân',
    createBuildingSubmit: 'Tạo tháp',
    displayOrder: 'Thứ tự hiển thị'
  },
  common: { cancel: 'Hủy', description: 'Mô tả', status: 'Trạng thái' }
} as any

/** One "render" of the hook (state slots survive between calls, like re-renders). */
const renderHook = () => {
  hookState.cursor = 0

  return useBuildingCreateForm({ dictionary, sessiontoken: 'token', locale: 'vi' })
}

const fill = (values: Record<string, string>) => {
  for (const [key, value] of Object.entries(values)) renderHook().updateValue(key as any, value)
}

const inputOf = (call = 0) => runFODynamic.mock.calls[call][0]

const renderPage = () => {
  hookState.cursor = 0

  return renderToStaticMarkup(createElement(BuildingCreatePage, { dictionary, session: { user: { token: 'token' } } as any, locale: 'vi' }))
}

describe('Tower create page — form', () => {
  it('shows the working project and Tower code / name / Floor count / Resident count / Description, no Status / Display order', () => {
    const html = renderPage()

    expect(html).toContain('Thêm tháp')
    expect(html).toContain('Bất động sản / Tháp / Thêm tháp')
    expect(html).toContain('Thông tin tháp')
    expect(html).toContain('Dự án')
    expect(html).toContain('[TEST IT] TEST IT')

    const labels = captured.filter(item => item.name === 'TextField').map(item => item.props.label)

    expect(labels).toEqual(['Mã tháp', 'Tên tháp', 'Số tầng', 'Số cư dân', 'Mô tả'])
    expect(html).not.toContain('Trạng thái')
    expect(html).not.toContain('Thứ tự hiển thị')
  })

  it('project is read-only (no project select in the form); description is multiline', () => {
    renderPage()

    const fields = captured.filter(item => item.name === 'TextField')

    expect(fields.some(item => item.props.select)).toBe(false)
    expect(fields.find(item => item.props.label === 'Mô tả')?.props.multiline).toBe(true)
    expect(fields.filter(item => item.props.required).map(item => item.props.label)).toEqual(['Mã tháp', 'Tên tháp'])
  })

  it('bottom actions are "Hủy" and "Tạo tháp"; Cancel goes back to the tower list', () => {
    const html = renderPage()

    expect(html).toContain('Hủy')
    expect(html).toContain('Tạo tháp')

    captured.find(item => item.name === 'Button' && item.props.children === 'Hủy')!.props.onClick()
    expect(routerPush).toHaveBeenCalledWith('/vi/properties/building')
  })
})

describe('Tower create page — WF_BO_CREATE_BUILDING', () => {
  it('sends project_id from the working project and the trimmed contract fields', async () => {
    fill({ building_code: ' S1 ', name: ' Tòa S1 ', floor_count: '25', resident_count: '200', description: ' Mô tả tòa nhà ' })

    await renderHook().submit()

    expect(inputOf().workflowid).toBe('WF_BO_CREATE_BUILDING')
    expect(inputOf().input).toEqual({
      project_id: 5,
      building_code: 'S1',
      name: 'Tòa S1',
      floor_count: '25',
      description: 'Mô tả tòa nhà',
      resident_count: 200
    })
    expect(inputOf().input).not.toHaveProperty('status')
    expect(inputOf().input).not.toHaveProperty('display_order')
  })

  it('project_id follows the working project (not hard-coded)', async () => {
    workingProject.current = { id: 42, code: 'AGR', name: 'AN GIA' }
    fill({ building_code: 'S1', name: 'n' })

    await renderHook().submit()

    expect(inputOf().input.project_id).toBe(42)

    const source = readFileSync(new URL('./hooks/useBuildingCreateForm.ts', import.meta.url), 'utf8')

    expect(source).toContain('const project = useWorkingProject()')
    expect(source).not.toMatch(/project_id:\s*\d/)
  })

  it('resident_count 0 is sent as the number 0; empty is sent as null (never "" / undefined)', async () => {
    fill({ building_code: 'S1', name: 'n', resident_count: '0' })
    await renderHook().submit()
    expect(inputOf().input.resident_count).toBe(0)

    hookState.slots = []
    fill({ building_code: 'S1', name: 'n' })
    await renderHook().submit()
    expect(inputOf(1).input.resident_count).toBeNull()
    expect(inputOf(1).input.floor_count).toBe('')
    expect(inputOf(1).input.description).toBe('')
  })

  it('blocks submit on missing code / name or invalid numbers', async () => {
    fill({ floor_count: '2.5', resident_count: '-1' })

    await renderHook().submit()

    expect(runFODynamic).not.toHaveBeenCalled()
    expect(Object.keys(renderHook().errors).sort()).toEqual(['building_code', 'floor_count', 'name', 'resident_count'])
  })

  it('no working project -> no request', async () => {
    workingProject.current = null
    fill({ building_code: 'S1', name: 'n' })

    await renderHook().submit()

    expect(runFODynamic).not.toHaveBeenCalled()
  })

  it('success with an id -> tower detail', async () => {
    runFODynamic.mockResolvedValue({ success: true, code: 'success', data: { id: 12 }, errors: [] })
    fill({ building_code: 'S1', name: 'n' })

    await renderHook().submit()

    expect(routerPush).toHaveBeenCalledWith('/vi/properties/building/12')
  })

  it('success without an id -> tower list', async () => {
    fill({ building_code: 'S1', name: 'n' })

    await renderHook().submit()

    expect(routerPush).toHaveBeenCalledWith('/vi/properties/building')
  })

  it('error stays on the page with the Backend message + reference and keeps the typed values', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Mã tháp đã tồn tại' }], execution_id: 'EXEC-C' })
    fill({ building_code: 'S1', name: 'Tòa S1', resident_count: '200' })

    await renderHook().submit()

    const form = renderHook()

    expect(routerPush).not.toHaveBeenCalled()
    expect(form.submitError).toBe('Mã tháp đã tồn tại Mã tra cứu lỗi: EXEC-C')
    expect(form.values).toMatchObject({ building_code: 'S1', name: 'Tòa S1', resident_count: '200' })
    expect(form.saving).toBe(false)
  })

  it('ignores a second submit while saving (button also disabled)', async () => {
    let resolve: (value: unknown) => void = () => {}

    runFODynamic.mockReturnValue(new Promise(done => { resolve = done }))
    fill({ building_code: 'S1', name: 'n' })

    const pending = renderHook().submit()

    expect(renderHook().saving).toBe(true)
    await renderHook().submit()
    expect(runFODynamic).toHaveBeenCalledTimes(1)

    resolve({ success: true, code: 'success', data: {}, errors: [] })
    await pending
  })
})
