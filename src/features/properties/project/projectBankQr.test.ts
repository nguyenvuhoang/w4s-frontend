import { readFileSync } from 'node:fs'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  accountQrIdentity,
  buildVietQrInput,
  buildVietQrQuickLink,
  findVietQrBank,
  mapVietQrBanks,
  matchesVietQrBank,
  parseVietQrQuickLinkSignature,
  vietQrSignature,
  type VietQrBank
} from './bank/vietqr'
import { mapProjectBankAccount } from './bank/projectBankTypes'

const { runFODynamic, hookState, routerPush, s3Send, backendToken } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  routerPush: vi.fn(),
  s3Send: vi.fn(),
  backendToken: vi.fn(),
  hookState: { cursor: 0, slots: {} as Record<number, unknown> }
}))

// Run the hooks outside React: state slots survive between "renders" (see buildingCreate.test.ts).
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

vi.mock('server-only', () => ({}))
vi.mock('@lib/logger', () => ({ default: { error: vi.fn(), info: vi.fn() } }))
vi.mock('@/server/auth/getBackendToken', () => ({ getBackendToken: backendToken }))
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class { send = s3Send },
  PutObjectCommand: class { constructor(readonly input: Record<string, unknown>) {} }
}))
vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: routerPush, refresh: vi.fn() }) }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('./logo/useProjectLogoFile', () => ({ useProjectLogoFile: () => ({ file: null, clear: vi.fn() }), projectLogoUploadErrorMessage: () => '' }))

/** Shape of the real GET https://api.vietqr.io/v2/banks response (excerpt). */
const BANKS_RESPONSE = {
  code: '00',
  desc: 'Get Bank list successful! Total 2 banks',
  data: [
    { id: 17, name: 'Ngân hàng TMCP Ngoại Thương Việt Nam', code: 'VCB', bin: '970436', shortName: 'Vietcombank', logo: 'https://api.vietqr.io/img/VCB.png', transferSupported: 1, lookupSupported: 1 },
    { id: 43, name: 'Ngân hàng TMCP Kỹ thương Việt Nam', code: 'TCB', bin: '970407', shortName: 'Techcombank', logo: 'https://api.vietqr.io/img/TCB.png', transferSupported: 1, lookupSupported: 1 },
    { id: 0, name: 'broken', code: 'X', bin: '', shortName: 'Broken' }
  ]
}
const BANKS = mapVietQrBanks(BANKS_RESPONSE)
const VCB = BANKS[0]
const TCB = BANKS[1]

const fetchMock = vi.fn()

beforeEach(() => {
  hookState.cursor = 0
  hookState.slots = {}
  runFODynamic.mockReset()
  routerPush.mockReset()
  s3Send.mockReset()
  s3Send.mockResolvedValue({})
  backendToken.mockReset()
  backendToken.mockResolvedValue({ accessToken: 'session-token', refreshToken: null })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  process.env.MINIO_PUBLIC_ENDPOINT = 'https://minio.ips.test'
  process.env.MINIO_ACCESS_KEY = 'minio-key'
  process.env.MINIO_SECRET_KEY = 'minio-secret'
  process.env.MINIO_BUCKET = 'ips-documents'
  delete process.env.VIETQR_CLIENT_ID
  delete process.env.VIETQR_API_KEY
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const pngResponse = () => new Response(new Uint8Array([137, 80, 78, 71]), { status: 200, headers: { 'content-type': 'image/png' } })

describe('VietQR bank list', () => {
  it('maps /v2/banks (logo, name, code, BIN) and drops rows without a BIN', () => {
    expect(BANKS).toHaveLength(2)
    expect(VCB).toEqual({ id: 17, name: 'Ngân hàng TMCP Ngoại Thương Việt Nam', code: 'VCB', bin: '970436', shortName: 'Vietcombank', logo: 'https://api.vietqr.io/img/VCB.png', transferSupported: true })
    expect(mapVietQrBanks(null)).toEqual([])
  })

  it('selects a bank and gets its BIN from the stored bank_name (short name / name / code)', () => {
    expect(findVietQrBank(BANKS, 'vietcombank')?.bin).toBe('970436')
    expect(findVietQrBank(BANKS, 'TCB')?.bin).toBe('970407')
    expect(findVietQrBank(BANKS, 'Ngân hàng lạ')).toBeNull()
    expect(matchesVietQrBank(TCB, '970407')).toBe(true)
    expect(matchesVietQrBank(TCB, 'kỹ thương')).toBe(true)
    expect(matchesVietQrBank(TCB, 'vcb')).toBe(false)
  })

  it('server load: success, upstream error and timeout never throw', async () => {
    const { fetchVietQrBanks } = await import('./bank/vietqr.server')

    fetchMock.mockResolvedValueOnce(jsonResponse(BANKS_RESPONSE))
    expect(await fetchVietQrBanks()).toEqual({ banks: BANKS, error: null })
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.vietqr.io/v2/banks')

    fetchMock.mockResolvedValueOnce(jsonResponse({}, 500))
    expect(await fetchVietQrBanks()).toEqual({ banks: [], error: 'upstream' })

    fetchMock.mockRejectedValueOnce(Object.assign(new Error('timeout'), { name: 'TimeoutError' }))
    expect(await fetchVietQrBanks()).toEqual({ banks: [], error: 'timeout' })
  })
})

describe('QR input, Quick Link and placeholder', () => {
  const values = { account_number: '001234567890', account_holder: 'BQL An Gia Riverside', transfer_content: 'Phí quản lý T6' }

  it('requires a bank with BIN, an account number and an account holder', () => {
    expect(buildVietQrInput(null, values)).toEqual({ ok: false, missing: ['bank'] })
    expect(buildVietQrInput(VCB, { ...values, account_number: '12 34', account_holder: ' ' })).toEqual({ ok: false, missing: ['account_number', 'account_holder'] })
  })

  it('builds an encoded Quick Link from validated data only (no amount)', () => {
    const result = buildVietQrInput(VCB, { ...values, transfer_content: 'Phí & quản lý #6' })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.input).toEqual({ bin: '970436', accountNo: '001234567890', accountName: 'BQL AN GIA RIVERSIDE', addInfo: 'Phi & quan ly #6' })

    const url = new URL(buildVietQrQuickLink(result.input))

    expect(`${url.origin}${url.pathname}`).toBe('https://img.vietqr.io/image/970436-001234567890-compact2.png')
    expect(url.searchParams.get('addInfo')).toBe('Phi & quan ly #6')
    expect(url.searchParams.get('accountName')).toBe('BQL AN GIA RIVERSIDE')
    expect(url.searchParams.has('amount')).toBe(false)
    expect(buildVietQrQuickLink(result.input)).not.toMatch(/[ #&]quan/)
    expect(parseVietQrQuickLinkSignature(buildVietQrQuickLink(result.input))).toBe(vietQrSignature(result.input))
  })

  it('never encodes a [CanHo] placeholder: the project QR becomes a static QR without content', () => {
    const result = buildVietQrInput(VCB, { ...values, transfer_content: 'AGR [CanHo] Dong phi quan ly' })

    expect(result).toMatchObject({ ok: true, placeholderSkipped: true })
    if (!result.ok) return
    expect(result.input).not.toHaveProperty('addInfo')
    expect(buildVietQrQuickLink(result.input)).not.toContain('CanHo')
  })
})

describe('BFF /api/projects/bank-qr', () => {
  let POST: typeof import('../../../app/api/projects/bank-qr/route').POST

  beforeAll(async () => {
    ;({ POST } = await import('../../../app/api/projects/bank-qr/route'))
  })

  const request = (body: Record<string, unknown>, origin = 'http://localhost:3000') => {
    const req = new Request('http://localhost:3000/api/projects/bank-qr', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) },
      body: JSON.stringify(body)
    }) as any

    req.nextUrl = new URL('http://localhost:3000/api/projects/bank-qr')

    return req
  }

  const body = { project_id: 22, group: 'operating_bank_account', bin: '970436', account_number: '001234567890', account_holder: 'BQL An Gia', transfer_content: 'AGR [CanHo] Dong phi' }

  it('rejects cross-origin and anonymous calls', async () => {
    expect((await POST(request(body, ''))).status).toBe(403)

    backendToken.mockResolvedValueOnce(null)
    expect((await POST(request(body))).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('without server credentials: Quick Link image -> IPS storage URL; placeholder never sent', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(BANKS_RESPONSE)).mockResolvedValueOnce(pngResponse())

    const response = await POST(request(body))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.source).toBe('quick_link')
    expect(json.data.qr_code_url).toMatch(/^https:\/\/minio\.ips\.test\/ips-documents\/project-bank-qr\/22\/operating_bank_account\/\d{4}\/\d{2}\/[0-9a-f-]+\.png$/)
    expect(String(fetchMock.mock.calls[1][0])).not.toContain('CanHo')
    expect(s3Send.mock.calls[0][0].input).toMatchObject({ Bucket: 'ips-documents', ContentType: 'image/png' })
  })

  it('with server credentials: POST /v2/generate (headers server-side), base64 uploaded, nothing secret returned', async () => {
    process.env.VIETQR_CLIENT_ID = 'client-123'
    process.env.VIETQR_API_KEY = 'secret-api-key'
    fetchMock
      .mockResolvedValueOnce(jsonResponse(BANKS_RESPONSE))
      .mockResolvedValueOnce(jsonResponse({ code: '00', desc: 'ok', data: { qrCode: '000201...', qrDataURL: 'data:image/png;base64,iVBORw0KGgo=' } }))

    const response = await POST(request({ ...body, transfer_content: 'Phi quan ly' }))
    const text = await response.text()
    const [url, init] = fetchMock.mock.calls[1]

    expect(response.status).toBe(200)
    expect(url).toBe('https://api.vietqr.io/v2/generate')
    expect(init.headers).toMatchObject({ 'x-client-id': 'client-123', 'x-api-key': 'secret-api-key' })
    expect(JSON.parse(init.body)).toEqual({ accountNo: '001234567890', accountName: 'BQL AN GIA', acqId: '970436', addInfo: 'Phi quan ly', template: 'compact2' })
    expect(text).not.toMatch(/secret-api-key|client-123|base64|iVBOR/)
    expect(JSON.parse(text).data.source).toBe('generate')
  })

  it('VietQR timeout / unknown BIN are reported without upload', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(BANKS_RESPONSE)).mockRejectedValueOnce(Object.assign(new Error('t'), { name: 'TimeoutError' }))
    expect((await POST(request(body))).status).toBe(504)

    fetchMock.mockResolvedValueOnce(jsonResponse(BANKS_RESPONSE))
    expect((await POST(request({ ...body, bin: '999999' }))).status).toBe(400)
    expect(s3Send).not.toHaveBeenCalled()
  })
})

describe('Edit page VietQR flow (useProjectEditForm)', () => {
  let useProjectEditForm: typeof import('./hooks/useProjectEditForm').useProjectEditForm

  beforeAll(async () => {
    ;({ useProjectEditForm } = await import('./hooks/useProjectEditForm'))
  })

  const OPERATING = { id: 11, bank_name: 'Vietcombank', account_number: '001234567890', account_holder: 'BQL AN GIA', branch: null, qr_code_url: null, transfer_content: 'AGR [CanHo] Dong phi quan ly' }
  const DEPOSIT = { id: 22, bank_name: 'Techcombank', account_number: '9876543210', account_holder: 'BQL AN GIA', branch: null, qr_code_url: null, transfer_content: 'Dat coc tien ich' }
  const STORED_URL = 'https://minio.ips.test/ips-documents/project-bank-qr/5/operating_bank_account/2026/11/a.png'

  const projectWith = (operating: unknown, deposit: unknown) => ({
    id: 5, name: 'AGR', project_code: 'AGR', address: '', description: '', status: 'active', investor: '', province: '', handover_date: null, logo_url: '',
    operating_bank_account: mapProjectBankAccount(operating), deposit_bank_account: mapProjectBankAccount(deposit)
  }) as any

  const render = (project: any, banks: VietQrBank[] = BANKS, generateAvailable = false) => {
    hookState.cursor = 0

    return useProjectEditForm({
      dictionary: { projectManagement: {}, common: {} } as any,
      locale: 'vi',
      sessiontoken: 'token',
      project,
      initialProvince: null,
      detailHref: '/system-settings/projects/5',
      vietQrBanks: banks,
      vietQrGenerateAvailable: generateAvailable
    })
  }

  /** Generate API configured on the server: "Use this QR" goes through the BFF (Base64 -> MinIO URL). */
  const renderGenerate = (project: any) => render(project, BANKS, true)

  /** Project as WF_BO_GET_PROJECT_DETAIL returns it after the save (fake backend below). */
  const reloaded = () => projectWith(stored.operating_bank_account ?? null, stored.deposit_bank_account ?? null)

  /** IPS backend: UPDATE stores the bank objects, GET returns them. */
  const stored: Record<string, unknown> = {}

  beforeEach(() => {
    for (const key of Object.keys(stored)) delete stored[key]
    runFODynamic.mockImplementation(async ({ workflowid, input }: any) => {
      if (workflowid === 'WF_BO_UPDATE_PROJECT') {
        for (const group of ['operating_bank_account', 'deposit_bank_account']) if (input[group]) stored[group] = input[group]
      }

      if (workflowid === 'WF_BO_GET_PROJECT_DETAIL') {
        return { success: true, data: { project: { id: 5, project_code: 'AGR', name: 'AGR', status: 'A', operating_bank_account: stored.operating_bank_account ?? null, deposit_bank_account: stored.deposit_bank_account ?? null } } }
      }

      return { success: true, code: 'success', data: {}, errors: [] }
    })
  })

  it('preview builds the QR in UI state only: no form change, no request, no workflow', () => {
    const project = projectWith(OPERATING, DEPOSIT)

    render(project).bank.qr.preview('operating_bank_account')

    const form = render(project)

    expect(form.bank.qr.previews.operating_bank_account?.url).toMatch(/^https:\/\/img\.vietqr\.io\/image\/970436-001234567890-compact2\.png\?accountName=BQL\+AN\+GIA$/)
    expect(form.bank.qr.previews.operating_bank_account?.placeholderSkipped).toBe(true)
    expect(form.bank.values.operating_bank_account.qr_code_url).toBe('')
    expect(form.bank.dirtyGroups).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
    expect(runFODynamic).not.toHaveBeenCalled()
  })

  it('missing BIN (bank unknown / list unavailable) -> no QR', () => {
    const project = projectWith({ ...OPERATING, bank_name: 'Ngân hàng lạ' }, DEPOSIT)

    render(project).bank.qr.preview('operating_bank_account')
    expect(render(project).bank.qr.inputOf('operating_bank_account')).toEqual({ ok: false, missing: ['bank'] })
    expect(render(project).bank.qr.previews.operating_bank_account).toBeUndefined()
    expect(render(projectWith(OPERATING, DEPOSIT), []).bank.qr.inputOf('operating_bank_account')).toMatchObject({ ok: false, missing: ['bank'] })
  })

  it('Generate API mode: use QR -> BFF (Base64 uploaded to MinIO) URL in the right account only; save + GET re-read', async () => {
    const project = projectWith(OPERATING, DEPOSIT)

    fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { qr_code_url: STORED_URL, source: 'generate' } }))
    renderGenerate(project).bank.qr.preview('operating_bank_account')
    await renderGenerate(project).bank.qr.apply('operating_bank_account')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/projects/bank-qr')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      project_id: 5, group: 'operating_bank_account', bin: '970436', account_number: '001234567890', account_holder: 'BQL AN GIA', transfer_content: 'AGR [CanHo] Dong phi quan ly'
    })
    expect(renderGenerate(project).bank.values.operating_bank_account.qr_code_url).toBe(STORED_URL)
    expect(renderGenerate(project).bank.values.deposit_bank_account.qr_code_url).toBe('')
    expect(runFODynamic).not.toHaveBeenCalled()

    await renderGenerate(project).submit()

    const update = runFODynamic.mock.calls.find(call => call[0].workflowid === 'WF_BO_UPDATE_PROJECT')![0].input

    expect(update.operating_bank_account).toMatchObject({ id: 11, qr_code_url: STORED_URL })
    expect(update.deposit_bank_account).toMatchObject({ id: 22, qr_code_url: null })
    expect(runFODynamic.mock.calls.map(call => call[0].workflowid)).toEqual(['WF_BO_UPDATE_PROJECT', 'WF_BO_GET_PROJECT_DETAIL'])
    expect(routerPush).toHaveBeenCalledWith('/vi/system-settings/projects/5')
  })

  it('changing the bank / account number after using a QR marks it outdated and blocks the save', async () => {
    const project = projectWith(OPERATING, DEPOSIT)

    render(project).bank.qr.preview('operating_bank_account')
    await render(project).bank.qr.apply('operating_bank_account')
    expect(render(project).bank.qr.stale.operating_bank_account).toBe(false)

    render(project).bank.updateValue('operating_bank_account', 'account_number', '1111')
    expect(render(project).bank.qr.stale.operating_bank_account).toBe(true)
    expect(render(project).bank.qr.stale.deposit_bank_account).toBe(false)

    await render(project).submit()
    expect(render(project).bank.errors.operating_bank_account?.qr_code_url).toBeTruthy()
    expect(runFODynamic).not.toHaveBeenCalled()

    render(project).bank.updateValue('operating_bank_account', 'account_number', '001234567890')
    expect(render(project).bank.qr.stale.operating_bank_account).toBe(false)

    render(project).bank.updateValue('operating_bank_account', 'bank_name', 'Techcombank')
    expect(render(project).bank.qr.stale.operating_bank_account).toBe(true)
  })

  it('a QR loaded from GET becomes outdated when the account changes (or when its Quick Link no longer matches)', () => {
    const project = projectWith({ ...OPERATING, qr_code_url: 'https://minio.ips.test/old.png' }, DEPOSIT)

    expect(render(project).bank.qr.stale.operating_bank_account).toBe(false)
    render(project).bank.updateValue('operating_bank_account', 'account_holder', 'BQL MOI')
    expect(render(project).bank.qr.stale.operating_bank_account).toBe(true)

    const quick = buildVietQrQuickLink({ bin: '970407', accountNo: '9876543210', accountName: 'BQL CU' })
    const withQuickLink = projectWith(OPERATING, { ...DEPOSIT, qr_code_url: quick })

    hookState.slots = {} // a second, separate page

    expect(render(withQuickLink).bank.qr.stale.deposit_bank_account).toBe(true)
    expect(accountQrIdentity(BANKS, { bank_name: 'Techcombank', account_number: '9876543210', account_holder: 'BQL CU', transfer_content: '' }))
      .toBe(parseVietQrQuickLinkSignature(quick))
  })

  it('operating and deposit QR are independent', async () => {
    const project = projectWith(OPERATING, DEPOSIT)

    render(project).bank.qr.preview('deposit_bank_account')

    const form = render(project)

    expect(form.bank.qr.previews.deposit_bank_account?.url).toContain('970407-9876543210')
    expect(form.bank.qr.previews.deposit_bank_account?.url).toContain('addInfo=Dat+coc+tien+ich')
    expect(form.bank.qr.previews.operating_bank_account).toBeUndefined()
  })

  it('upload / generate failure (timeout) keeps the preview, shows the error and leaves qr_code_url unchanged', async () => {
    const project = projectWith(OPERATING, DEPOSIT)

    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, code: 'vietqr_timeout', message: 'timeout' }, 504))
    renderGenerate(project).bank.qr.preview('operating_bank_account')
    await renderGenerate(project).bank.qr.apply('operating_bank_account')

    const form = renderGenerate(project)

    expect(form.bank.qr.errors.operating_bank_account).toBe('VietQR did not answer in time. Please try again.')
    expect(form.bank.values.operating_bank_account.qr_code_url).toBe('')
    expect(form.bank.qr.previews.operating_bank_account?.url).toContain('970436-001234567890')
    expect(form.bank.qr.applying.operating_bank_account).toBe(false)
    expect(form.bank.dirtyGroups).toEqual([])

    fetchMock.mockResolvedValueOnce(jsonResponse({ success: false, code: 'storage', message: 'minio down' }, 500))
    await renderGenerate(project).bank.qr.apply('operating_bank_account')
    expect(renderGenerate(project).bank.qr.errors.operating_bank_account).toBe('The QR image could not be stored. Please try again later.')
    expect(renderGenerate(project).bank.values.operating_bank_account.qr_code_url).toBe('')

    renderGenerate(project).bank.qr.previewFailed('deposit_bank_account')
    expect(renderGenerate(project).bank.qr.errors.deposit_bank_account).toBeTruthy()
  })

  it('Quick Link flow: Preview -> Use -> field filled + dirty -> Save (WF_BO_UPDATE_PROJECT) -> reload shows the saved QR', async () => {
    const project = projectWith(OPERATING, DEPOSIT)

    // Preview: only UI state
    render(project).bank.qr.preview('operating_bank_account')

    const previewUrl = render(project).bank.qr.previews.operating_bank_account!.url

    expect(render(project).bank.values.operating_bank_account.qr_code_url).toBe('')

    // Use: the VietQR Quick Link URL itself, no network, no workflow
    await render(project).bank.qr.apply('operating_bank_account')

    let form = render(project)

    expect(form.bank.values.operating_bank_account.qr_code_url).toBe(previewUrl)
    expect(form.bank.values.deposit_bank_account.qr_code_url).toBe('')
    expect(form.bank.dirtyGroups).toEqual(['operating_bank_account'])
    expect(form.projectDirty).toBe(true)
    expect(form.bank.qr.stale.operating_bank_account).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(runFODynamic).not.toHaveBeenCalled()

    // Save: qr_code_url sent with the operating account (its own id), deposit unchanged
    await render(project).submit()

    const update = runFODynamic.mock.calls.find(call => call[0].workflowid === 'WF_BO_UPDATE_PROJECT')![0].input

    expect(update.operating_bank_account).toMatchObject({ id: 11, qr_code_url: previewUrl })
    expect(update.deposit_bank_account).toMatchObject({ id: 22, qr_code_url: null })
    expect(runFODynamic.mock.calls.map(call => call[0].workflowid)).toEqual(['WF_BO_UPDATE_PROJECT', 'WF_BO_GET_PROJECT_DETAIL'])
    expect(routerPush).toHaveBeenCalledWith('/vi/system-settings/projects/5')

    // Reload: the saved QR is shown, still valid, nothing dirty
    hookState.slots = {}
    form = render(reloaded())

    expect(form.bank.values.operating_bank_account.qr_code_url).toBe(previewUrl)
    expect(form.bank.accounts.operating_bank_account?.qr_code_url).toBe(previewUrl)
    expect(form.bank.qr.stale.operating_bank_account).toBe(false)
    expect(form.bank.dirtyGroups).toEqual([])
  })

  it('"Re-create QR" only refreshes the preview: the form keeps the QR in use until "Use this QR"', async () => {
    const project = projectWith(OPERATING, DEPOSIT)

    render(project).bank.qr.preview('operating_bank_account')
    await render(project).bank.qr.apply('operating_bank_account')

    const used = render(project).bank.values.operating_bank_account.qr_code_url

    render(project).bank.updateValue('operating_bank_account', 'account_number', '2222')
    render(project).bank.qr.preview('operating_bank_account')

    let form = render(project)

    expect(form.bank.qr.previews.operating_bank_account?.url).toContain('970436-2222')
    expect(form.bank.values.operating_bank_account.qr_code_url).toBe(used)
    expect(form.bank.qr.stale.operating_bank_account).toBe(true)

    await render(project).bank.qr.apply('operating_bank_account')
    form = render(project)

    expect(form.bank.values.operating_bank_account.qr_code_url).toContain('970436-2222')
    expect(form.bank.qr.stale.operating_bank_account).toBe(false)
  })

  it('an outdated QR can be removed (field read-only): the account becomes dirty without a QR', async () => {
    const project = projectWith({ ...OPERATING, qr_code_url: 'https://minio.ips.test/old.png' }, DEPOSIT)

    render(project).bank.updateValue('operating_bank_account', 'account_number', '3333')
    expect(render(project).bank.qr.stale.operating_bank_account).toBe(true)

    render(project).bank.qr.clear('operating_bank_account')

    const form = render(project)

    expect(form.bank.values.operating_bank_account.qr_code_url).toBe('')
    expect(form.bank.qr.stale.operating_bank_account).toBe(false)

    await render(project).submit()
    expect(runFODynamic.mock.calls.find(call => call[0].workflowid === 'WF_BO_UPDATE_PROJECT')![0].input.operating_bank_account)
      .toMatchObject({ id: 11, account_number: '3333', qr_code_url: '' })
  })
})

describe('download QR', () => {
  it('downloads the image as a file, or opens it when the host blocks it', async () => {
    const { downloadQrImage } = await import('./bank/projectBankQrService')
    const click = vi.fn()
    const open = vi.fn()

    vi.stubGlobal('document', { createElement: () => ({ click, remove: vi.fn() }), body: { appendChild: vi.fn() } })
    vi.stubGlobal('window', { open })
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:qr', revokeObjectURL: vi.fn() }))

    fetchMock.mockResolvedValueOnce(pngResponse())
    expect(await downloadQrImage('https://img.vietqr.io/image/x.png', 'vietqr.png')).toBe('downloaded')
    expect(click).toHaveBeenCalled()

    fetchMock.mockRejectedValueOnce(new TypeError('CORS'))
    expect(await downloadQrImage('https://img.vietqr.io/image/x.png', 'vietqr.png')).toBe('opened')
    expect(open).toHaveBeenCalledWith('https://img.vietqr.io/image/x.png', '_blank', 'noopener,noreferrer')
  })
})

describe('no VietQR credentials on the client', () => {
  const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')

  it('client modules never read the API key / client id; only the server module does', () => {
    for (const file of ['./bank/vietqr.ts', './bank/projectBankQrService.ts', './bank/ProjectBankQrPanel.tsx', './bank/VietQrBankAutocomplete.tsx', './hooks/useProjectBankQr.ts', './hooks/useProjectEditForm.ts']) {
      expect(read(file), file).not.toMatch(/VIETQR_API_KEY|VIETQR_CLIENT_ID|x-api-key|x-client-id/)
    }
    expect(read('./bank/vietqr.server.ts')).toContain("import 'server-only'")
    expect(read('../../../env.mjs')).not.toMatch(/NEXT_PUBLIC_VIETQR/)
  })
})
