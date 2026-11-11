import { readFileSync } from 'node:fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { getBackendToken } = vi.hoisted(() => ({ getBackendToken: vi.fn() }))

vi.mock('@/env.mjs', () => ({ env: { NEXT_PUBLIC_APPLICATION_CODE: 'BO' } }))
vi.mock('@/server/auth/getBackendToken', () => ({ getBackendToken }))
vi.mock('@lib/logger', () => ({ default: { log: vi.fn(), error: vi.fn() } }))

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const fileResponse = (headers: Record<string, string>, bytes = new Uint8Array([80, 75, 3, 4])) => new Response(bytes, { status: 200, headers })
const jsonResponse = (status: number, payload: unknown) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } })

const fetchMock = vi.fn()

let service: typeof import('./services/unitImportService')
let route: typeof import('../../../../app/api/apartment/import-template/route')

beforeAll(async () => {
  service = await import('./services/unitImportService')
  route = await import('../../../../app/api/apartment/import-template/route')
})

beforeEach(() => {
  fetchMock.mockReset()
  getBackendToken.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

const download = () => service.unitImportService.downloadApartmentImportTemplate({ language: 'vi', failedMessage: 'Không thể tải file mẫu.' })

describe('downloadApartmentImportTemplate (browser -> BFF)', () => {
  it('POSTs to the internal BFF route only, without any token in the browser request', async () => {
    fetchMock.mockResolvedValue(fileResponse({ 'content-type': XLSX_TYPE, 'content-disposition': 'attachment; filename="Apartment_Template.xlsx"' }))

    await download()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toBe('/api/apartment/import-template')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ app: 'BO', lang: 'vi' })
    expect(init.headers).not.toHaveProperty('uid')
  })

  it('keeps the Backend file and prefers its Content-Disposition filename (RFC 5987 first)', async () => {
    fetchMock.mockResolvedValue(fileResponse({
      'content-type': XLSX_TYPE,
      'content-disposition': "attachment; filename=\"fallback.xlsx\"; filename*=UTF-8''M%E1%BA%ABu_c%C4%83n_h%E1%BB%99.xlsm"
    }))

    const file = await download()

    expect(file.filename).toBe('Mẫu_căn_hộ.xlsm')
    expect(file.blob.type).toBe(XLSX_TYPE)
    expect(file.blob.size).toBe(4)
  })

  it('reads a plain filename="..." too', async () => {
    fetchMock.mockResolvedValue(fileResponse({ 'content-type': XLSX_TYPE, 'content-disposition': 'attachment; filename="APARTMENT_TEMPLATE.xlsx"' }))

    expect((await download()).filename).toBe('APARTMENT_TEMPLATE.xlsx')
  })

  it('falls back to Apartment_Import_Template.xlsx only when the Backend gives no filename', async () => {
    fetchMock.mockResolvedValue(fileResponse({ 'content-type': XLSX_TYPE }))

    expect((await download()).filename).toBe('Apartment_Import_Template.xlsx')
  })

  it('an error response raises the Backend message + execution_id and returns no file', async () => {
    fetchMock.mockResolvedValue(jsonResponse(422, { message: 'Template APARTMENT not found', execution_id: 'EXEC-TPL' }))

    const error = await download().catch(caught => caught)

    expect(error).toBeInstanceOf(service.UnitImportTemplateError)
    expect(error.message).toBe('Template APARTMENT not found')
    expect(error.execution_id).toBe('EXEC-TPL')
  })

  it('a JSON body with 200, or an empty body, is never treated as the file', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: false }))
    await expect(download()).rejects.toThrow('Không thể tải file mẫu.')

    fetchMock.mockResolvedValueOnce(fileResponse({ 'content-type': XLSX_TYPE }, new Uint8Array()))
    await expect(download()).rejects.toThrow('Không thể tải file mẫu.')
  })
})

describe('/api/apartment/import-template BFF -> POST /ips/api/ImportTemplate/DownloadTemplate', () => {
  const call = async () => {
    const { NextRequest } = await import('next/server')

    return route.POST(new NextRequest('http://localhost/api/apartment/import-template', { method: 'POST', headers: { lang: 'en', app: 'BO' } }))
  }

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_REST_API_ENDPOINT', 'https://gateway.example.test/api/v1/gateway')
    getBackendToken.mockResolvedValue({ accessToken: 'SESSION-ACCESS-TOKEN' })
  })

  it('calls the direct IPS API (not the workflow gateway) with exactly { template_code: "APARTMENT" } and the session credential', async () => {
    fetchMock.mockResolvedValue(fileResponse({ 'content-type': XLSX_TYPE, 'content-disposition': 'attachment; filename="APARTMENT.xlsx"' }))

    await call()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toBe('https://gateway.example.test/ips/api/ImportTemplate/DownloadTemplate')
    expect(url).not.toContain('/api/v1/gateway')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ template_code: 'APARTMENT' })
    expect(init.body).toBe('{"template_code":"APARTMENT"}')
    expect(init.headers).toMatchObject({ uid: 'SESSION-ACCESS-TOKEN', lang: 'en', app: 'BO', 'Content-Type': 'application/json' })
  })

  it('streams the Backend file back with its Content-Type and Content-Disposition', async () => {
    fetchMock.mockResolvedValue(fileResponse({ 'content-type': XLSX_TYPE, 'content-disposition': 'attachment; filename="APARTMENT.xlsx"' }))

    const response = await call()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(XLSX_TYPE)
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="APARTMENT.xlsx"')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([80, 75, 3, 4]))
  })

  it('passes a structured Backend error on as JSON (message + execution_id), never as a file', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { message: 'Invalid template_code', execution_id: 'EXEC-1' }))

    const response = await call()

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: 'Invalid template_code', execution_id: 'EXEC-1' })
  })

  it('a 200 JSON or empty upstream body is an error, not a file', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { success: false, message: 'No template' }))
    expect((await call()).status).toBe(502)

    fetchMock.mockResolvedValueOnce(fileResponse({ 'content-type': XLSX_TYPE }, new Uint8Array()))
    expect((await call()).status).toBe(502)
  })

  it('without a session credential: 401 and no upstream call', async () => {
    getBackendToken.mockResolvedValue(null)

    expect((await call()).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// The page needs a DOM to click (no jsdom in this repo): its handler is pinned at source level.
describe('UnitImportPage "Tải file mẫu"', () => {
  const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')
  const page = read('./UnitImportPage.tsx')
  const handler = page.slice(page.indexOf('const handleDownloadTemplate'), page.indexOf('const runValidation'))
  const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')

  it('loading + disabled while downloading; a synchronous guard drops a double click', () => {
    expect(handler).toContain('if (templateDownloadInFlightRef.current) return')
    expect(handler.indexOf('templateDownloadInFlightRef.current = true')).toBeLessThan(handler.indexOf('await unitImportService.downloadApartmentImportTemplate('))
    expect(handler).toContain('setIsDownloadingTemplate(true)')
    expect(page).toContain('startIcon={isDownloadingTemplate ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}')
    expect(page).toContain('disabled={isDownloadingTemplate}')
  })

  it('saves the Backend file on success; on error shows the IPS notification and re-enables the button (no file, no navigation)', () => {
    const tryBlock = handler.slice(handler.indexOf('try {'), handler.indexOf('} catch'))
    const catchBlock = handler.slice(handler.indexOf('} catch'), handler.indexOf('} finally'))
    const finallyBlock = handler.slice(handler.indexOf('} finally'))

    expect(tryBlock).toContain('saveUnitImportTemplate(file)')
    expect(catchBlock).toContain("SwalAlert('error', { message: error.message, execution_id: error.execution_id ?? undefined }, 'center')")
    expect(catchBlock).not.toMatch(/saveUnitImportTemplate|router\.|alert\(/)
    expect(finallyBlock).toContain('templateDownloadInFlightRef.current = false')
    expect(finallyBlock).toContain('setIsDownloadingTemplate(false)')
  })

  it('no FE-generated Excel, no workflow gateway, no hard-coded host or token', () => {
    const files = [
      code(page),
      code(read('./utils/unitImportTemplate.ts')),
      code(read('./services/unitImportService.ts')),
      code(read('../../../../app/api/apartment/import-template/route.ts'))
    ]

    for (const source of files) {
      expect(source).not.toMatch(/from 'xlsx'|aoa_to_sheet|book_new|workflowid|\/api\/v1\/gateway'|emicms|jits\.com\.vn|:2611|eyJ[\w-]{10,}|Bearer /)
    }
    expect(() => read('./utils/unitImportValidation.ts')).toThrow()
  })

  it('upload area, validation and import are unchanged', () => {
    expect(page).toContain("const UNIT_IMPORT_FILE_EXTENSIONS = new Set(['.xlsx', '.xls', '.xlsm'])")
    expect(page).toContain('useDropzone(')
    expect(page).toContain('unitImportService.validateUnitImportFile(file, {')
    expect(page).toContain('unitImportService.submitUnitImport(')
  })

  it('VI / EN error text', () => {
    const texts = (locale: string) => JSON.parse(readFileSync(new URL(`../../../../data/dictionaries/${locale}.json`, import.meta.url), 'utf8')).propertyManagement

    expect(texts('vi').importApartmentTemplateDownloadFailed).toBe('Không thể tải file mẫu.')
    expect(texts('en').importApartmentTemplateDownloadFailed).toBe('Unable to download the template file.')
    expect(texts('vi').importApartmentDownloadTemplate).toBe('Tải file mẫu')
  })
})
