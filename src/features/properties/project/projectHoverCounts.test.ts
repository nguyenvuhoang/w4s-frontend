import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { runFODynamic } = vi.hoisted(() => ({ runFODynamic: vi.fn() }))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

let propertyAggregateService: typeof import('../propertyAggregateService').propertyAggregateService
let helpers: typeof import('./projectListHelpers')

beforeAll(async () => {
  ({ propertyAggregateService } = await import('../propertyAggregateService'))
  helpers = await import('./projectListHelpers')
})

beforeEach(() => runFODynamic.mockReset())

const searchWith = async (item: Record<string, unknown>) => {
  runFODynamic.mockResolvedValue({
    success: true, code: 'success', errors: [],
    data: { items: [item], total_count: 1, total_pages: 1, page_index: 0, page_size: 10 }
  })

  const response = await propertyAggregateService.simpleSearchProjects({ sessiontoken: 'token', filter: helpers.EMPTY_PROJECT_FILTER, isSuperAdmin: true })

  return response.items[0]
}

// Actual WF_BO_SIMPLE_SEARCH_PROJECTS item.
const SEARCH_ITEM = {
  id: 1,
  project_code: 'AGR',
  name: 'AN GIA RIVERSIDE',
  address: '89 Hoàng Quốc Việt, Phường Phú Thuận, TP.HCM',
  province: null,
  description: 'Test description',
  logo_url: 'https://cdn/agr.png',
  status: 'A',
  total_buildings: 4,
  total_floors: 28,
  total_apartments: 257
}

const panelSource = () => {
  const page = readFileSync(new URL('./ProjectManagementPage.tsx', import.meta.url), 'utf8')

  return page.slice(page.indexOf('const ProjectProvinceRow'), page.indexOf('const ProjectSkeletonGrid'))
}

describe('project card hover popover (WF_BO_SIMPLE_SEARCH_PROJECTS only)', () => {
  it('maps the search response: address, province, the three counts (null province -> "")', async () => {
    const project = await searchWith(SEARCH_ITEM)

    expect(project).toMatchObject({
      name: 'AN GIA RIVERSIDE',
      project_code: 'AGR',
      address: '89 Hoàng Quốc Việt, Phường Phú Thuận, TP.HCM',
      province: '',
      total_buildings: 4,
      total_floors: 28,
      total_units: 257
    })
    expect((await searchWith({ ...SEARCH_ITEM, province: 'VN-HCM' })).province).toBe('VN-HCM')
  })

  it('shows exactly: name, code, address, province, towers, floors, apartments', () => {
    const panel = panelSource()
    const rows = [...panel.matchAll(/<DetailRow label=\{text\(dictionary, '(\w+)'/g)].map(match => match[1])

    expect(panel).toContain('{project.project_name}')
    expect(panel).toContain('{project.project_code}')
    expect(rows).toEqual(['province', 'address', 'totalBuildings', 'totalFloors', 'totalApartments'])
    expect(panel).toContain('value={formatProjectValue(project.address)}')
    // province row: the stored province_code shown with its master name
    expect(panel.indexOf('<ProjectProvinceRow dictionary={dictionary} province={project.province} locale={locale} />'))
      .toBeGreaterThan(panel.indexOf('value={formatProjectValue(project.address)}'))
    expect(panel).toContain('value={formatProjectValue(provinceLabel)}')
    expect(panel).toContain('value={formatProjectCount(project.total_buildings)}')
    expect(panel).toContain('value={formatProjectCount(project.total_floors)}')
    expect(panel).toContain('value={formatProjectCount(project.total_units)}')
  })

  it('no longer shows investor / management company / residents / payment / QR / voucher / last modified / description', () => {
    const panel = panelSource()

    expect(panel).not.toMatch(/investor|management_company|managementCompany|active_residents|activeResidents|payment_config|paymentConfig|qr_payment|qrPayment|voucher|last_modified|lastModified|description/i)
  })

  it('empty text -> "--"; counts: missing -> "--", 0 -> "0", positive -> formatted', () => {
    expect(helpers.formatProjectValue(null)).toBe('--')
    expect(helpers.formatProjectValue('')).toBe('--')
    expect(helpers.formatProjectValue('  ')).toBe('--')
    expect(helpers.formatProjectValue('89 Hoàng Quốc Việt')).toBe('89 Hoàng Quốc Việt')
    expect(helpers.formatProjectCount(null)).toBe('--')
    expect(helpers.formatProjectCount(undefined)).toBe('--')
    expect(helpers.formatProjectCount(0)).toBe('0')
    expect(helpers.formatProjectCount(1248)).toBe('1.248')
  })

  it('a record without counts shows "--" for them (never a fake 0), and total_residents is not used as active residents', async () => {
    const project = await searchWith({ id: 1, project_code: 'AGR', name: 'AN GIA RIVERSIDE', total_residents: 2860 })

    expect([project.total_buildings, project.total_floors, project.total_units].map(helpers.formatProjectCount)).toEqual(['--', '--', '--'])
    expect(project.active_residents).toBeNull()
  })

  it('labels: VI Tổng số tháp / tầng / căn hộ, EN Total towers / floors / apartments', () => {
    const read = (locale: string) => JSON.parse(readFileSync(new URL(`../../../data/dictionaries/${locale}.json`, import.meta.url), 'utf8')).projectManagement

    expect([read('vi').address, read('vi').province, read('vi').totalBuildings, read('vi').totalFloors, read('vi').totalApartments])
      .toEqual(['Địa chỉ', 'Tỉnh/Thành phố', 'Tổng số tháp', 'Tổng số tầng', 'Tổng số căn hộ'])
    expect([read('en').address, read('en').province, read('en').totalBuildings, read('en').totalFloors, read('en').totalApartments])
      .toEqual(['Address', 'Province/City', 'Total towers', 'Total floors', 'Total apartments'])
  })
})
