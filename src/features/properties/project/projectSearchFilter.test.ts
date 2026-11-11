import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProjectFilterModel } from '../types'

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
    Autocomplete: make('Autocomplete'), Box: make('Box'), Button: make('Button'), CircularProgress: make('CircularProgress'),
    MenuItem: make('MenuItem', 'option'), Paper: make('Paper'), TextField: make('TextField'), Typography: make('Typography')
  }
})

let propertyAggregateService: typeof import('../propertyAggregateService').propertyAggregateService
let buildProjectSearchRequest: typeof import('../propertyAggregateService').buildProjectSearchRequest
let helpers: typeof import('./projectListHelpers')
let ProvinceSelect: typeof import('./province/ProvinceSelect').default
let provinceLookup: typeof import('@/shared/services/provinceLookupService')

beforeAll(async () => {
  ({ propertyAggregateService, buildProjectSearchRequest } = await import('../propertyAggregateService'))
  helpers = await import('./projectListHelpers')
  ;({ default: ProvinceSelect } = await import('./province/ProvinceSelect'))
  provinceLookup = await import('@/shared/services/provinceLookupService')
})

beforeEach(() => {
  runFODynamic.mockReset()
  captured.length = 0
})

const CONTRACT_FIELDS = ['page_index', 'page_size', 'project_name', 'province', 'search_text', 'status']

const searchResponse = (items: unknown[]) => ({
  success: true,
  code: 'success',
  errors: [],
  data: { items, total_count: items.length, total_pages: 1, page_index: 0, page_size: 10 }
})

const search = async (filter: ProjectFilterModel) => {
  runFODynamic.mockResolvedValue(searchResponse([
    { id: 1, project_code: 'P1', name: 'One', status: 'A' },
    { id: 2, project_code: 'P2', name: 'Two', status: 'I' }
  ]))

  const response = await propertyAggregateService.simpleSearchProjects({ sessiontoken: 'token', filter, isSuperAdmin: true })

  return { request: runFODynamic.mock.calls[0][0], response }
}

describe('WF_BO_SIMPLE_SEARCH_PROJECTS request', () => {
  it('sends exactly the 6 planned contract fields', async () => {
    const { request } = await search(helpers.EMPTY_PROJECT_FILTER)

    expect(request.workflowid).toBe('WF_BO_SIMPLE_SEARCH_PROJECTS')
    expect(Object.keys(request.input).sort()).toEqual(CONTRACT_FIELDS)
  })

  it('defaults status and province to "" and still sends province when empty', async () => {
    const { request } = await search(helpers.EMPTY_PROJECT_FILTER)

    expect(request.input).toEqual({ page_size: 10, page_index: 0, status: '', search_text: '', project_name: '', province: '' })
    expect(request.input).toHaveProperty('province', '')
  })

  it('maps Active -> "A" and Inactive -> "I"', () => {
    expect(buildProjectSearchRequest(helpers.withProjectStatus(helpers.EMPTY_PROJECT_FILTER, 'A')).status).toBe('A')
    expect(buildProjectSearchRequest(helpers.withProjectStatus(helpers.EMPTY_PROJECT_FILTER, 'I')).status).toBe('I')
    expect(helpers.PROJECT_STATUS_FILTER_OPTIONS).toEqual(['', 'A', 'I'])
  })

  it('sends the selected province_code as `province` to the workflow', async () => {
    const { request } = await search(helpers.withProjectProvince(helpers.EMPTY_PROJECT_FILTER, 'VN-HN'))

    expect(request.input.province).toBe('VN-HN')
  })

  it('does not copy search_text into project_name', () => {
    const request = buildProjectSearchRequest({ ...helpers.EMPTY_PROJECT_FILTER, search_text: 'sun' })

    expect(request.search_text).toBe('sun')
    expect(request.project_name).toBe('')
  })

  it('never filters by province or status on the client', async () => {
    const filter = helpers.withProjectStatus(helpers.withProjectProvince(helpers.EMPTY_PROJECT_FILTER, 'Ha Noi'), 'A')
    const { response } = await search(filter)

    // Items are returned exactly as the workflow sent them, even ones not matching the filter.
    expect(response.items.map(item => item.project_code)).toEqual(['P1', 'P2'])
  })
})

describe('Project filter state', () => {
  const current: ProjectFilterModel = { search_text: 'sun', status: 'I', province: 'Da Nang', page_index: 3, page_size: 20 }

  it('changing status resets to page 0 and keeps province, search_text and page_size', () => {
    expect(helpers.withProjectStatus(current, 'A')).toEqual({ search_text: 'sun', status: 'A', province: 'Da Nang', page_index: 0, page_size: 20 })
  })

  it('changing province resets to page 0 and keeps status, search_text and page_size', () => {
    expect(helpers.withProjectProvince(current, 'Hue')).toEqual({ search_text: 'sun', status: 'I', province: 'Hue', page_index: 0, page_size: 20 })
  })

  it('reset clears search/status/province and goes back to page 0', () => {
    const reset = helpers.resetProjectFilter()

    expect(reset).toEqual({ search_text: '', status: '', province: '', page_index: 0, page_size: 10 })
    expect(reset).not.toBe(helpers.EMPTY_PROJECT_FILTER)
  })
})

describe('Project page wiring', () => {
  const source = readFileSync(new URL('./ProjectManagementPage.tsx', import.meta.url), 'utf8')

  it('status and province changes reload through the workflow search', () => {
    expect(source).toContain('void loadProjects(withProjectStatus(filter, status))')
    expect(source).toContain('void loadProjects(withProjectProvince(filter, province))')
  })

  it('reset reloads with the reset filter but does not touch the Grid/List mode', () => {
    const reset = source.slice(source.indexOf('const resetFilter = () =>'), source.indexOf('const handleStatusChange'))

    expect(reset).toContain('resetProjectFilter()')
    expect(reset).toContain('void loadProjects(next_filter)')
    expect(reset).not.toContain('setViewMode')
  })

  it('Grid/List switching does not touch the filter', () => {
    expect(source.match(/setViewMode/g)).toHaveLength(2)
    expect(source).toContain('onChange={setViewMode}')
  })

  it('province filter is the Backend lookup (code value, session + locale), no local options', () => {
    const select = source.slice(source.indexOf('<ProvinceSelect'), source.indexOf('/>', source.indexOf('<ProvinceSelect')))

    expect(select).toContain('value={filter.province}')
    expect(select).toContain('onChange={handleProvinceChange}')
    expect(select).toContain('sessiontoken={session?.user?.token ?? undefined}')
    expect(select).toContain('locale={params.locale}')
    expect(source).not.toMatch(/useProvinceOptions|options=\{provinces/)
  })
})

const HA_NOI = {
  id: 1, country_id: 'VN', province_code: 'VN-HN', administrative_code: '01', province_name: 'Thành phố Hà Nội', m_province_name: 'Hanoi City',
  short_name: 'Hà Nội', administrative_type: 'MUNICIPALITY', region: 'Đồng bằng sông Hồng', postal_code: '100000', phone_area_code: '024',
  is_merged: false, merged_into_province_code: null, merged_date: null, effective_status: 'ACTIVE', status: 'A', sort_order: 1
}

describe('WF_BO_SIMPLE_SEARCH_PROVINCES lookup', () => {
  it('sends exactly the contract: active VN provinces, status A, not deleted, with the search text and page', async () => {
    runFODynamic.mockResolvedValue({ success: true, code: 'success', errors: [], data: { items: [HA_NOI], total_count: 34, has_next_page: true } })

    const result = await provinceLookup.provinceLookupService.searchProvinces({ sessiontoken: 'token', language: 'vi', filter: { search_text: ' hà ', page_index: 1, page_size: 20 } })
    const call = runFODynamic.mock.calls[0][0]

    expect(call.workflowid).toBe('WF_BO_SIMPLE_SEARCH_PROVINCES')
    expect(call.input).toEqual({
      country_id: 'VN', effective_status: 'ACTIVE', administrative_type: '', region: '', search_text: 'hà',
      page_index: 1, page_size: 20, status: 'A', exclude_deleted: true
    })
    expect(result).toEqual({
      items: [{ id: 1, province_code: 'VN-HN', province_name: 'Thành phố Hà Nội', m_province_name: 'Hanoi City', short_name: 'Hà Nội', administrative_type: 'MUNICIPALITY', region: 'Đồng bằng sông Hồng', sort_order: 1 }],
      total_count: 34,
      has_next_page: true
    })
  })

  it('surfaces workflow errors with the error reference (no fallback list)', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', errors: [{ info: 'Province service down' }], execution_id: 'EXEC-P' })

    await expect(provinceLookup.provinceLookupService.searchProvinces({ sessiontoken: 'token', language: 'vi', filter: { search_text: '', page_index: 0, page_size: 20 } }))
      .rejects.toThrow('Province service down Mã tra cứu lỗi: EXEC-P')
  })

  it('label: province_name on /vi, m_province_name on /en (fallback province_name); never the id', () => {
    const [item] = [{ province_code: 'VN-HN', province_name: 'Thành phố Hà Nội', m_province_name: 'Hanoi City' }]

    expect(provinceLookup.formatProvinceLabel(item, 'vi')).toBe('Thành phố Hà Nội')
    expect(provinceLookup.formatProvinceLabel(item, 'en')).toBe('Hanoi City')
    expect(provinceLookup.formatProvinceLabel({ ...item, m_province_name: '' }, 'en')).toBe('Thành phố Hà Nội')
  })
})

describe('ProvinceSelect (server-side searchable lookup)', () => {
  const messages = { loadingText: 'Đang tải', emptyText: 'Không có', loadErrorText: 'Lỗi', retryLabel: 'Thử lại', loadingMoreText: 'Đang tải thêm' }
  const render = (props: Record<string, unknown> = {}) => {
    captured.length = 0
    renderToStaticMarkup(createElement(ProvinceSelect, {
      label: 'Tỉnh/Thành phố', emptyLabel: 'Tất cả Tỉnh/Thành phố', value: '', onChange: vi.fn(), sessiontoken: 'token', locale: 'vi', messages, ...props
    }))

    return captured.find(item => item.name === 'Autocomplete')!.props
  }

  it('offers "Tất cả Tỉnh/Thành phố" (value "") first and does not fetch before it is opened', () => {
    const autocomplete = render()

    expect(autocomplete.options[0]).toMatchObject({ province_code: '', province_name: 'Tất cả Tỉnh/Thành phố' })
    expect(autocomplete.value).toBeNull()
    expect(runFODynamic).not.toHaveBeenCalled()
  })

  it('selecting a province reports its province_code; "all" or clearing reports ""', () => {
    const onChange = vi.fn()
    const autocomplete = render({ onChange })

    autocomplete.onChange({}, { ...HA_NOI })
    autocomplete.onChange({}, autocomplete.options[0])
    autocomplete.onChange({}, null)
    expect(onChange.mock.calls.map(call => call[0])).toEqual(['VN-HN', '', ''])
  })

  it('labels options per locale and keeps the server-side result as is (no client filtering)', () => {
    const vi_ = render()
    const en = render({ locale: 'en' })

    expect(vi_.getOptionLabel(HA_NOI)).toBe('Thành phố Hà Nội')
    expect(en.getOptionLabel(HA_NOI)).toBe('Hanoi City')
    expect(vi_.filterOptions([HA_NOI])).toEqual([HA_NOI])
  })

  it('searches on the server (debounced) and pages through the whole master — not just the first 20', () => {
    const select = readFileSync(new URL('./province/ProvinceSelect.tsx', import.meta.url), 'utf8')

    expect(select).toContain('filter: { search_text: text, page_index: nextPageIndex, page_size: PAGE_SIZE }')
    expect(select).toContain('useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS)')
    expect(select).toContain('void runSearch(pageIndex + 1, debouncedSearchText, true)')
    expect(select).toContain('result.has_next_page || loadedCountRef.current < result.total_count')
    expect(select).not.toMatch(/VN-HN|Hà Nội|TP\.HCM|9999/)
  })
})
