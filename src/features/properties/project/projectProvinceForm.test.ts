import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { runFODynamic, captured } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  captured: [] as Array<{ name: string; props: Record<string, any> }>
}))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')
  const make = (name: string) => (props: Record<string, any>) => {
    captured.push({ name, props })

    return h(Fragment, null, props.children ?? null)
  }

  return {
    Autocomplete: make('Autocomplete'), Box: make('Box'), Button: make('Button'), CircularProgress: make('CircularProgress'),
    Paper: make('Paper'), TextField: make('TextField'), Typography: make('Typography')
  }
})

let ProvinceSelect: typeof import('./province/ProvinceSelect').default
let toProjectProvinceValue: typeof import('./province/projectProvinceValue').toProjectProvinceValue
let provinceValue: typeof import('./province/projectProvinceValue')
let editForm: typeof import('./hooks/useProjectEditForm')

beforeAll(async () => {
  ;({ default: ProvinceSelect } = await import('./province/ProvinceSelect'))
  provinceValue = await import('./province/projectProvinceValue')
  ;({ toProjectProvinceValue } = provinceValue)
  editForm = await import('./hooks/useProjectEditForm')
})

beforeEach(() => {
  runFODynamic.mockReset()
  captured.length = 0
})

const HA_NOI = {
  id: 1, province_code: 'VN-HN', province_name: 'Thành phố Hà Nội', m_province_name: 'Hanoi City',
  short_name: 'Hà Nội', administrative_type: 'MUNICIPALITY', region: 'Đồng bằng sông Hồng', sort_order: 1
}
const messages = { loadingText: 'Đang tải', emptyText: 'Không có', loadErrorText: 'Lỗi', retryLabel: 'Thử lại', loadingMoreText: 'Đang tải thêm' }
const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')

// Same props as the Project Create / Edit forms.
const renderFormLookup = (props: Record<string, unknown> = {}) => {
  captured.length = 0
  renderToStaticMarkup(createElement(ProvinceSelect, {
    label: 'Tỉnh/Thành phố', value: '', onChange: vi.fn(), getOptionValue: toProjectProvinceValue, showAllOption: false,
    sessiontoken: 'token', locale: 'vi', messages, ...props
  }))

  return captured.find(item => item.name === 'Autocomplete')!.props
}

describe('Project form Province lookup (shared WF_BO_SIMPLE_SEARCH_PROVINCES datasource)', () => {
  it('create / edit / legacy drawer use the shared lookup — no hard-coded list, no free-text province', () => {
    const create = read('./ProjectCreatePage.tsx')
    const createHook = read('./hooks/useProjectCreateForm.ts')
    const detail = read('./ProjectEditPage.tsx')
    const management = read('./ProjectManagementPage.tsx')

    for (const source of [create, detail, management]) {
      expect(source).toMatch(/<ProvinceSelect[\s\S]*?getOptionValue=\{toProjectProvinceValue\}/)
      expect(source).toContain('messages={projectProvinceSelectMessages(dictionary)}')
    }
    for (const source of [create, createHook, detail, management]) {
      expect(source).not.toMatch(/'TP\.HCM'|'Ha Noi'|'Da Nang'|'Binh Duong'|provinceOptions/)
    }
    // the edit province is no longer a plain TextField
    expect(detail).not.toMatch(/<TextField[^>]*value=\{values\.province\}/)
    // the detail page has no edit dialog / form any more
    expect(read('./ProjectDetailPage.tsx')).not.toMatch(/<ProvinceSelect|<Dialog/)
    expect(createHook).toContain("province: '',")
  })

  it('options come from the master only (no "all" option in forms); label VI province_name / EN m_province_name', () => {
    const vi_ = renderFormLookup()
    const en = renderFormLookup({ locale: 'en' })

    expect(vi_.options).toEqual([])
    expect(vi_.getOptionLabel(HA_NOI)).toBe('Thành phố Hà Nội')
    expect(en.getOptionLabel(HA_NOI)).toBe('Hanoi City')
    expect(en.getOptionLabel({ ...HA_NOI, m_province_name: '' })).toBe('Thành phố Hà Nội')
  })

  it('option identity is province_code; the value sent for Project is the province_code (never the name)', () => {
    const onChange = vi.fn()
    const lookup = renderFormLookup({ onChange })

    expect(lookup.isOptionEqualToValue(HA_NOI, { ...HA_NOI, id: 99 })).toBe(true)
    lookup.onChange({}, HA_NOI)
    lookup.onChange({}, null)
    expect(onChange.mock.calls.map(call => call[0])).toEqual(['VN-HN', ''])
    expect(toProjectProvinceValue(HA_NOI)).toBe('VN-HN')
    expect(read('./hooks/useProjectCreateForm.ts')).toContain('province: values.province,')
  })

  it('edit preselects the saved province, including a legacy value not in the master, without changing it', () => {
    const onChange = vi.fn()
    const saved = renderFormLookup({ value: 'VN-HN', knownOption: HA_NOI, onChange })
    const legacy = renderFormLookup({ value: 'TP.HCM', onChange })

    expect(saved.getOptionLabel(saved.value)).toBe('Thành phố Hà Nội')
    expect(legacy.getOptionLabel(legacy.value)).toBe('TP.HCM')
    expect(legacy.isOptionEqualToValue(legacy.value, legacy.value)).toBe(true)
    // rendering / opening edit never emits a value by itself
    expect(onChange).not.toHaveBeenCalled()
  })

  it('edit with a null province does not crash and shows no selection', () => {
    expect(renderFormLookup({ value: '' }).value).toBeNull()
  })

  it('matches a stored province by code or exact name only (no fuzzy guess)', () => {
    const { matchesStoredProvince } = provinceValue

    expect(matchesStoredProvince(HA_NOI, 'VN-HN')).toBe(true)
    expect(matchesStoredProvince(HA_NOI, ' thành phố hà nội ')).toBe(true)
    expect(matchesStoredProvince(HA_NOI, 'Hanoi City')).toBe(true)
    expect(matchesStoredProvince(HA_NOI, 'Hà Nội')).toBe(false)
    expect(matchesStoredProvince(HA_NOI, '')).toBe(false)
  })

  it('resolves a legacy name to its master row and returns null (no fallback) when nothing matches', async () => {
    const HCM = { ...HA_NOI, id: 2, province_code: 'VN-HCM', province_name: 'Thành phố Hồ Chí Minh', m_province_name: 'Ho Chi Minh City' }

    runFODynamic.mockResolvedValue({ success: true, data: { items: [HA_NOI, HCM], total_count: 2, has_next_page: false } })

    await expect(provinceValue.resolveProjectProvince({ sessiontoken: 't', value: 'Thành phố Hồ Chí Minh' })).resolves.toMatchObject({ province_code: 'VN-HCM' })
    await expect(provinceValue.resolveProjectProvince({ sessiontoken: 't', value: 'VN-HCM' })).resolves.toMatchObject({ province_code: 'VN-HCM' })
    await expect(provinceValue.resolveProjectProvince({ sessiontoken: 't', value: 'TP.HCM' })).resolves.toBeNull()
    await expect(provinceValue.resolveProjectProvince({ sessiontoken: 't', value: '' })).resolves.toBeNull()
  })

  it('edit starts from the resolved province_code; an unresolved value starts empty, never a fallback province', () => {
    const project = {
      id: 1, project_code: 'P', name: 'P', address: '512 Nguyễn Xiển, TP. Thủ Đức', description: null, logo_url: null,
      status: 'active', investor: null, province: 'Thành phố Hồ Chí Minh', handover_date: null
    } as any
    const HCM = { ...HA_NOI, id: 2, province_code: 'VN-HCM', province_name: 'Thành phố Hồ Chí Minh' }

    expect(editForm.buildProjectEditForm(project, HCM).province).toBe('VN-HCM')
    expect(editForm.buildProjectEditForm(project, null).province).toBe('')
    // no change + save sends the same code; the name is never sent
    const payload = editForm.buildProjectUpdatePayload(project, editForm.buildProjectEditForm(project, HCM), '')

    expect(payload.province).toBe('VN-HCM')
    // an unresolved stored province must be picked again before saving
    const hook = read('./hooks/useProjectEditForm.ts')

    expect(hook).toContain("if (provinceUnresolved) nextErrors.province = text(dictionary, 'provinceUnresolvedRequired'")
  })

  it('searches the master server-side with paging (not a fixed first 20)', () => {
    const select = read('./province/ProvinceSelect.tsx')

    expect(select).toContain('filter: { search_text: text, page_index: nextPageIndex, page_size: PAGE_SIZE }')
    expect(select).toContain('void runSearch(pageIndex + 1, debouncedSearchText, true)')
  })

  it('the Project module has a single Province lookup implementation (shared service)', () => {
    for (const file of ['./ProjectCreatePage.tsx', './ProjectDetailPage.tsx', './ProjectEditPage.tsx', './ProjectManagementPage.tsx', './province/ProvinceSelect.tsx', './province/projectProvinceValue.ts', './hooks/useProjectCreateForm.ts', './hooks/useProjectEditForm.ts']) {
      expect(read(file)).not.toMatch(/workflowid:\s*'WF_BO_SIMPLE_SEARCH_PROVINCES'|runFODynamic/)
    }
    expect(read('./province/ProvinceSelect.tsx')).toContain("from '@/shared/services/provinceLookupService'")
  })

  it('the Project List filter keeps province_code values and its "all" option', () => {
    const list = read('./ProjectManagementPage.tsx')
    const filter = list.slice(list.indexOf('<ProvinceSelect'), list.indexOf('/>', list.indexOf('<ProvinceSelect')))
    const lookup = (() => {
      captured.length = 0
      renderToStaticMarkup(createElement(ProvinceSelect, { label: 'Tỉnh', emptyLabel: 'Tất cả Tỉnh/Thành phố', value: '', onChange: vi.fn(), locale: 'vi', messages }))

      return captured.find(item => item.name === 'Autocomplete')!.props
    })()

    expect(filter).not.toContain('getOptionValue')
    expect(lookup.options[0]).toMatchObject({ province_code: '', province_name: 'Tất cả Tỉnh/Thành phố' })
  })
})
