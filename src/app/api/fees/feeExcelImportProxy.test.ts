import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const { proxyImportValidationRequest, getBackendToken } = vi.hoisted(() => ({
  proxyImportValidationRequest: vi.fn(),
  getBackendToken: vi.fn()
}))
const fetchMock = vi.fn()

vi.mock('../_lib/importValidationProxy', () => ({
  proxyImportValidationRequest,
  resolveImportGatewayBaseUrl: () => (process.env.NEXT_PUBLIC_REST_API_ENDPOINT ?? '').replace(/\/?api\/v1\/gateway\/?$/i, '')
}))
vi.mock('@/server/auth/getBackendToken', () => ({ getBackendToken }))

import { POST as validate } from './excel-import/validate/route'
import { POST as importFile } from './excel-import/route'
import { GET as downloadTemplate } from './import-template/route'

describe('Fee Excel Import Next.js proxies', () => {
  beforeEach(() => {
    proxyImportValidationRequest.mockReset().mockResolvedValue(NextResponse.json({ success: true }))
    getBackendToken.mockReset().mockResolvedValue({ accessToken: 'SESSION-TOKEN' })
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('NEXT_PUBLIC_REST_API_ENDPOINT', 'https://gateway.example.test/api/v1/gateway')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('keeps internal routes separate and supplies the confirmed IPS validate/import upstream paths', async () => {
    await validate(new NextRequest('http://localhost/api/fees/excel-import/validate', { method: 'POST' }))
    await importFile(new NextRequest('http://localhost/api/fees/excel-import', { method: 'POST' }))

    expect(proxyImportValidationRequest.mock.calls[0][0].upstreamPath).toBe('/ips/api/FeeExcelImport/Validate')
    expect(proxyImportValidationRequest.mock.calls[1][0].upstreamPath).toBe('/ips/api/FeeExcelImport/Import')
  })

  it('downloads the template from the confirmed IPS URL and forwards scope/session headers', async () => {
    fetchMock.mockResolvedValue(new Response(new Uint8Array([80, 75]), { status: 200, headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'content-disposition': 'attachment; filename="fee.xlsx"' } }))

    const response = await downloadTemplate(new NextRequest('http://localhost/api/fees/import-template', { headers: { scope: 'P10', lang: 'en', app: 'BO', 'X-TimeZone': 'Asia/Ho_Chi_Minh' } }))
    const [url, init] = fetchMock.mock.calls[0]

    expect(url).toBe('https://gateway.example.test/ips/api/FeeExcelImport/DownloadTemplate')
    expect(init.headers).toMatchObject({ uid: 'SESSION-TOKEN', scope: 'P10', lang: 'en', app: 'BO', 'X-TimeZone': 'Asia/Ho_Chi_Minh' })
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="fee.xlsx"')
  })
})
