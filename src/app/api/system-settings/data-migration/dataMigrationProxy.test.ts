import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { getContext } = vi.hoisted(() => ({ getContext: vi.fn() }))
const upstream = vi.fn()

vi.mock('@/servers/system-settings/configFilesGateway.server', () => ({
  buildConfigFilesBackendHeaders: async () => ({ uid: 'session', 'content-type': 'application/json' }),
  getConfigFilesBackendBaseUrl: () => 'https://gateway.example.test'
}))
vi.mock('@/shared/services/boContextService', () => ({
  BoContextError: class extends Error {},
  boContextService: { getContext }
}))

import { GET, POST } from './[operation]/route'

const listTables = (service: string) =>
  GET(new NextRequest(`http://localhost/api/system-settings/data-migration/tables?service=${service}`, {
    headers: { 'X-Timezone': 'Asia/Ho_Chi_Minh', 'X-From-Swagger': 'true' }
  }), { params: Promise.resolve({ operation: 'tables' }) })

const send = (operation: string, query: string, body: BodyInit, origin = 'http://localhost') =>
  POST(new NextRequest(`http://localhost/api/system-settings/data-migration/${operation}?${query}`, {
    method: 'POST',
    headers: { origin, 'X-Timezone': 'Asia/Ho_Chi_Minh' },
    body
  }), { params: Promise.resolve({ operation }) })

const zip = new Uint8Array([80, 75, 5, 6, ...Array(18).fill(0)])

const importBody = () => {
  const body = new FormData()

  body.set('file', new File([zip], 'migration.zip', { type: 'application/zip' }))

  return body
}

describe('Data migration reverse-proxy routing', () => {
  beforeEach(() => {
    getContext.mockReset().mockResolvedValue({ isSuperAdmin: true })
    upstream.mockReset()
    vi.stubGlobal('fetch', upstream)
  })

  afterEach(() => vi.unstubAllGlobals())

  it.each([
    ['cms', ['Setting']],
    ['cth', { success: true, data: ['Setting'] }]
  ] as const)('loads and normalizes the %s catalog using the session', async (service, payload) => {
    upstream.mockResolvedValue(Response.json(payload))

    const response = await listTables(service)
    const [url, init] = upstream.mock.calls[0]

    expect(url).toBe(`https://gateway.example.test/${service}/api/datatransfer/getavailabletables`)
    expect(init.method).toBe('GET')
    expect(init.headers.get('uid')).toBe('session')
    expect(init.headers.get('X-Timezone')).toBe('Asia/Ho_Chi_Minh')
    expect(init.headers.has('X-From-Swagger')).toBe(false)
    expect(await response.json()).toEqual({ tables: ['Setting'] })
  })

  it('reports an invalid catalog as an error and preserves the execution reference', async () => {
    upstream.mockResolvedValue(Response.json({ success: true, data: { items: [] }, execution_id: 'catalog-ref' }))

    const response = await listTables('ips')

    expect(upstream.mock.calls[0][0]).toBe('https://gateway.example.test/ips/api/datatransfer/getavailabletables')
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ success: false, execution_id: 'catalog-ref' })
  })

  it.each(['cms', 'cth', 'ips'])('routes %s exports and preserves the ZIP response', async service => {
    upstream.mockResolvedValue(new Response(zip, {
      headers: { 'content-type': 'application/octet-stream', 'content-disposition': 'attachment; filename="config.zip"' }
    }))

    const body = JSON.stringify({
      table_names: service === 'cms' ? ['Setting'] : ['C_CODELIST', 'UserRight'],
      format: 'Json',
      batch_size: 0
    })
    const response = await send('export', `service=${service}`, body)

    expect(upstream).toHaveBeenCalledWith(
      `https://gateway.example.test/${service}/api/datatransfer/exporttableszip/export-zip`,
      expect.objectContaining({ body })
    )
    expect(upstream.mock.calls[0][1].headers.get('X-Timezone')).toBe('Asia/Ho_Chi_Minh')
    expect(upstream.mock.calls[0][1].headers.get('Accept')).toBe('application/zip')
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="config.zip"')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(zip)
  })

  it.each([['cms', 'true'], ['cth', 'false'], ['ips', 'true']])('routes %s multipart imports with preserveIdentity=%s', async (service, preserveIdentity) => {
    upstream.mockResolvedValue(Response.json({ success: true, description: 'Import completed' }))

    const response = await send('import', `service=${service}&preserveIdentity=${preserveIdentity}`, importBody())
    const [url, init] = upstream.mock.calls[0]

    expect(url).toBe(`https://gateway.example.test/${service}/api/datatransfer/importtableszip/import-zip?preserveIdentity=${preserveIdentity}`)
    expect(init.headers.get('uid')).toBe('session')
    expect(init.headers.has('content-type')).toBe(false)
    expect(init.headers.get('accept')).toBe('application/json')
    expect(init.headers.get('X-Timezone')).toBe('Asia/Ho_Chi_Minh')
    expect(init.body.get('file').name).toBe('migration.zip')
    expect(new Uint8Array(await init.body.get('file').arrayBuffer())).toEqual(zip)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, description: 'Import completed' })
  })

  it.each([400, 401, 403, 413, 500])('preserves HTTP %s and its import error reference', async status => {
    upstream.mockResolvedValue(Response.json({ success: false, execution_id: 'import-ref' }, { status }))

    const response = await send('import', 'service=cth&preserveIdentity=true', importBody())

    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ success: false, execution_id: 'import-ref' })
  })

  it('rejects invalid success JSON and reports upstream timeouts', async () => {
    upstream.mockResolvedValueOnce(new Response('invalid json')).mockRejectedValueOnce(new DOMException('Timed out', 'TimeoutError'))

    expect((await send('import', 'service=cth&preserveIdentity=true', importBody())).status).toBe(502)
    expect((await send('import', 'service=cth&preserveIdentity=true', importBody())).status).toBe(504)
  })

  it.each(['missing', 'empty', 'multiple'])('rejects a %s file selection before contacting upstream', async selection => {
    const body = new FormData()

    if (selection !== 'missing') body.append('file', new File([selection === 'empty' ? '' : zip], 'first.zip'))
    if (selection === 'multiple') body.append('file', new File([zip], 'second.zip'))

    expect((await send('import', 'service=cth&preserveIdentity=true', body)).status).toBe(400)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('rejects unknown destinations, cross-origin requests and non-admin sessions before calling upstream', async () => {
    expect((await send('import', 'service=https://evil.test', importBody())).status).toBe(400)
    expect((await send('import', 'service=cms', importBody(), 'https://evil.test')).status).toBe(403)
    getContext.mockResolvedValue({ isSuperAdmin: false })
    expect((await send('import', 'service=cms', importBody())).status).toBe(403)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('rejects a renamed non-ZIP file before upload', async () => {
    const body = new FormData()

    body.set('file', new File(['invalid'], 'migration.zip'))
    expect((await send('import', 'service=cms&preserveIdentity=false', body)).status).toBe(400)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('maps unsupported services and preserves a nested execution reference', async () => {
    upstream.mockResolvedValue(Response.json({ data: { errors: [{ execute_id: 'ref-123' }] } }, { status: 404 }))

    const response = await send('import', 'service=cth&preserveIdentity=true', importBody())

    expect(response.status).toBe(501)
    expect(await response.json()).toEqual({ success: false, execution_id: 'ref-123' })
  })

  it('reports an import business error even when upstream responds with HTTP 200', async () => {
    upstream.mockResolvedValue(Response.json({ data: { success: false, execution_id: 'ref-456' } }))

    const response = await send('import', 'service=cth&preserveIdentity=false', importBody())

    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ success: false, execution_id: 'ref-456' })
  })
})
