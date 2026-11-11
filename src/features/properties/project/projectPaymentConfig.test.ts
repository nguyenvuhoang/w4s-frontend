import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildProjectPaymentConfigForm,
  buildProjectPaymentConfigUpdatePayload,
  getChangedProjectPaymentConfigFields,
  isProjectPaymentConfigDirty,
  mapProjectPaymentConfig,
  PROJECT_PAYMENT_CONFIG_UPDATE_FIELDS,
  validateProjectPaymentConfigForm,
  type ProjectPaymentConfig
} from './payment/projectPaymentConfig'

const { runFODynamic } = vi.hoisted(() => ({ runFODynamic: vi.fn() }))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

let propertyAggregateService: typeof import('../propertyAggregateService').propertyAggregateService
let isProjectEditFormDirty: typeof import('./hooks/useProjectEditForm').isProjectEditFormDirty

beforeAll(async () => {
  ({ propertyAggregateService } = await import('../propertyAggregateService'))
  ;({ isProjectEditFormDirty } = await import('./hooks/useProjectEditForm'))
})

beforeEach(() => {
  runFODynamic.mockReset()
})

/** Real WF_BO_GET_PROJECT_PAYMENT_CONFIG_BY_ID response (execution bcd3fe47...). */
const REAL_GET_RESPONSE = {
  code: 'success',
  success: true,
  message: null,
  execution_id: 'bcd3fe4710e442b6a6f6b97450e27009',
  timestamp: '2026-11-04T08:24:17.331057Z',
  data: {
    id: 1,
    project_id: 1,
    config_code: 'PAY_FEE_VNPAY',
    payment_purpose: 'FEE',
    provider: 'VNPAY',
    merchant_id: 'VGP_MERCHANT',
    terminal_id: 'VGP_TERM01',
    account_no: null,
    account_name: null,
    qr_template: null,
    callback_url: null,
    metadata_json: null,
    is_default: true,
    status: 'A'
  },
  errors: [],
  metadata: null
}

const realConfig = () => mapProjectPaymentConfig(REAL_GET_RESPONSE.data) as ProjectPaymentConfig

/** Source read with LF line endings (the working copy may be CRLF). */
const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

const messages = { required: 'REQUIRED', invalidJson: 'INVALID_JSON', invalidUrl: 'INVALID_URL' }

describe('mapProjectPaymentConfig (real GET response)', () => {
  it('maps every field of the real response, keeping id and project_id distinct', () => {
    expect(realConfig()).toEqual({
      id: 1,
      project_id: 1,
      config_code: 'PAY_FEE_VNPAY',
      payment_purpose: 'FEE',
      provider: 'VNPAY',
      merchant_id: 'VGP_MERCHANT',
      terminal_id: 'VGP_TERM01',
      account_no: null,
      account_name: null,
      qr_template: null,
      callback_url: null,
      metadata_json: null,
      is_default: true,
      status: 'A'
    })
    expect(mapProjectPaymentConfig({ ...REAL_GET_RESPONSE.data, id: 7, project_id: 3 })).toMatchObject({ id: 7, project_id: 3 })
  })

  it('keeps nullable fields null (never "") and metadata_json as text, never defaulted to "{}"', () => {
    const config = realConfig()

    for (const field of ['account_no', 'account_name', 'qr_template', 'callback_url', 'metadata_json'] as const) {
      expect(config[field]).toBeNull()
    }

    expect(mapProjectPaymentConfig({ ...REAL_GET_RESPONSE.data, metadata_json: '{"a":1}' })?.metadata_json).toBe('{"a":1}')
    expect(mapProjectPaymentConfig({ ...REAL_GET_RESPONSE.data, metadata_json: { a: 1 } })?.metadata_json).toBe('{"a":1}')
  })

  it('treats null data, arrays or rows without id / project_id as "no configuration"', () => {
    expect(mapProjectPaymentConfig(null)).toBeNull()
    expect(mapProjectPaymentConfig(undefined)).toBeNull()
    expect(mapProjectPaymentConfig([REAL_GET_RESPONSE.data])).toBeNull()
    expect(mapProjectPaymentConfig({ ...REAL_GET_RESPONSE.data, id: null })).toBeNull()
    expect(mapProjectPaymentConfig({ ...REAL_GET_RESPONSE.data, project_id: undefined })).toBeNull()
    // an envelope (data: null fell back to the response) is not a configuration
    expect(mapProjectPaymentConfig({ ...REAL_GET_RESPONSE, data: null })).toBeNull()
  })
})

describe('payment configuration form: prefill, dirty state, payload', () => {
  it('prefills every field from GET (null -> empty input) and starts clean', () => {
    const config = realConfig()
    const form = buildProjectPaymentConfigForm(config)

    expect(form).toEqual({
      provider: 'VNPAY',
      payment_purpose: 'FEE',
      merchant_id: 'VGP_MERCHANT',
      terminal_id: 'VGP_TERM01',
      account_no: '',
      account_name: '',
      callback_url: '',
      status: 'A',
      qr_template: '',
      metadata_json: '',
      is_default: true
    })
    expect(isProjectPaymentConfigDirty(config, form)).toBe(false)
  })

  it('detects changed fields only (whitespace-only edits are not changes)', () => {
    const config = realConfig()
    const form = buildProjectPaymentConfigForm(config)

    expect(isProjectPaymentConfigDirty(config, { ...form, merchant_id: ' VGP_MERCHANT ' })).toBe(false)
    expect(getChangedProjectPaymentConfigFields(config, { ...form, terminal_id: 'T2', is_default: false })).toEqual(['terminal_id', 'is_default'])
  })

  it('UPDATE payload has exactly the contract fields: no project_id, no config_code', () => {
    const config = realConfig()
    const payload = buildProjectPaymentConfigUpdatePayload(config, { ...buildProjectPaymentConfigForm(config), terminal_id: 'T2' })

    expect(Object.keys(payload).sort()).toEqual([...PROJECT_PAYMENT_CONFIG_UPDATE_FIELDS].sort())
    expect(payload).not.toHaveProperty('project_id')
    expect(payload).not.toHaveProperty('config_code')
  })

  it('keeps untouched values exactly (null stays null, metadata_json not "{}"), sends edited values trimmed', () => {
    const config = realConfig()
    const payload = buildProjectPaymentConfigUpdatePayload(config, { ...buildProjectPaymentConfigForm(config), account_no: ' 0123456789 ' })

    expect(payload).toEqual({
      id: 1,
      qr_template: null,
      merchant_id: 'VGP_MERCHANT',
      is_default: true,
      account_no: '0123456789',
      status: 'A',
      account_name: null,
      callback_url: null,
      terminal_id: 'VGP_TERM01',
      payment_purpose: 'FEE',
      provider: 'VNPAY',
      metadata_json: null
    })
  })

  it('sends a field the user cleared as null (not an empty string)', () => {
    const config = realConfig()
    const payload = buildProjectPaymentConfigUpdatePayload(config, { ...buildProjectPaymentConfigForm(config), merchant_id: '  ' })

    expect(payload.merchant_id).toBeNull()
  })
})

describe('validateProjectPaymentConfigForm', () => {
  const config = realConfig()
  const form = buildProjectPaymentConfigForm(config)

  it('rejects invalid metadata JSON and accepts valid / empty JSON', () => {
    expect(validateProjectPaymentConfigForm(config, { ...form, metadata_json: '{bad' }, messages)).toEqual({ metadata_json: 'INVALID_JSON' })
    expect(validateProjectPaymentConfigForm(config, { ...form, metadata_json: '{"bank":"VCB"}' }, messages)).toEqual({})
    expect(validateProjectPaymentConfigForm(config, { ...form, metadata_json: '' }, messages)).toEqual({})
  })

  it('requires provider / payment purpose / status when they are cleared', () => {
    expect(validateProjectPaymentConfigForm(config, { ...form, provider: '', payment_purpose: ' ', status: '' }, messages))
      .toEqual({ provider: 'REQUIRED', payment_purpose: 'REQUIRED', status: 'REQUIRED' })
  })

  it('validates an edited callback URL', () => {
    expect(validateProjectPaymentConfigForm(config, { ...form, callback_url: 'not a url' }, messages)).toEqual({ callback_url: 'INVALID_URL' })
    expect(validateProjectPaymentConfigForm(config, { ...form, callback_url: 'ftp://x.y' }, messages)).toEqual({ callback_url: 'INVALID_URL' })
    expect(validateProjectPaymentConfigForm(config, { ...form, callback_url: 'https://pay.example.com/cb' }, messages)).toEqual({})
  })

  it('never blocks untouched backend values', () => {
    const stored = { ...config, metadata_json: '{bad' }

    expect(validateProjectPaymentConfigForm(stored, buildProjectPaymentConfigForm(stored), messages)).toEqual({})
  })
})

describe('propertyAggregateService payment configuration workflows', () => {
  it('GET calls WF_BO_GET_PROJECT_PAYMENT_CONFIG_BY_ID with { id } and maps the real response', async () => {
    runFODynamic.mockResolvedValue(REAL_GET_RESPONSE)

    const config = await propertyAggregateService.get_project_payment_config_by_id({ sessiontoken: 'token', language: 'vi', id: 1 })
    const request = runFODynamic.mock.calls[0][0]

    expect(request.workflowid).toBe('WF_BO_GET_PROJECT_PAYMENT_CONFIG_BY_ID')
    expect(request.input).toEqual({ id: 1 })
    expect(config).toEqual(realConfig())
  })

  it('GET returns null when the workflow succeeds without a configuration', async () => {
    runFODynamic.mockResolvedValue({ ...REAL_GET_RESPONSE, data: null })

    await expect(propertyAggregateService.get_project_payment_config_by_id({ sessiontoken: 'token', id: 99 })).resolves.toBeNull()
  })

  it('GET failure throws the backend message with the error reference', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', execution_id: 'EXEC-PAY', errors: [{ info: 'Config not found' }] })

    await expect(propertyAggregateService.get_project_payment_config_by_id({ sessiontoken: 'token', language: 'vi', id: 1 }))
      .rejects.toThrow('Config not found Mã tra cứu lỗi: EXEC-PAY')
  })

  it('UPDATE calls WF_BO_UPDATE_PROJECT_PAYMENT_CONFIG with exactly the contract fields', async () => {
    runFODynamic.mockResolvedValue({ success: true, code: 'success', data: {}, errors: [] })

    const config = realConfig()
    const payload = buildProjectPaymentConfigUpdatePayload(config, { ...buildProjectPaymentConfigForm(config), terminal_id: 'T2' })

    await propertyAggregateService.update_project_payment_config_workflow({
      sessiontoken: 'token',
      payload: { ...payload, project_id: 1, config_code: 'X' } as typeof payload
    })

    const request = runFODynamic.mock.calls[0][0]

    expect(request.workflowid).toBe('WF_BO_UPDATE_PROJECT_PAYMENT_CONFIG')
    expect(Object.keys(request.input).sort()).toEqual([...PROJECT_PAYMENT_CONFIG_UPDATE_FIELDS].sort())
    expect(request.input).toEqual(payload)
  })

  it('UPDATE failure throws with the error reference', async () => {
    runFODynamic.mockResolvedValue({ success: false, execution_id: 'EXEC-UPD-PAY', errors: [{ info: 'Invalid merchant' }] })

    const config = realConfig()

    await expect(propertyAggregateService.update_project_payment_config_workflow({
      sessiontoken: 'token',
      language: 'en',
      payload: buildProjectPaymentConfigUpdatePayload(config, buildProjectPaymentConfigForm(config))
    })).rejects.toThrow('Invalid merchant Error Reference: EXEC-UPD-PAY')
  })

  it('the old in-memory payment config mock is not used by these files', () => {
    for (const file of ['./hooks/useProjectEditForm.ts', './payment/projectPaymentConfig.ts', './projectDetailRoute.server.tsx']) {
      const source = read(file)

      expect(source).not.toMatch(/payment_configs_seed|get_project_payment_configs|update_project_payment_config\(|create_project_payment_config/)
    }
  })
})

describe('project section dirty state', () => {
  const baseline = {
    name: 'P', project_code: 'PRJ', address: '', description: '', status: 'active' as const, investor: '', province: '', handover_date: ''
  }

  it('is clean without edits, dirty after an edit or a new logo', () => {
    expect(isProjectEditFormDirty(baseline, { ...baseline }, false)).toBe(false)
    expect(isProjectEditFormDirty(baseline, { ...baseline, name: ' P ' }, false)).toBe(false)
    expect(isProjectEditFormDirty(baseline, { ...baseline, name: 'Q' }, false)).toBe(true)
    expect(isProjectEditFormDirty(baseline, { ...baseline }, true)).toBe(true)
  })
})

// The Edit Project page no longer has a payment configuration section (PaymentConfig = payment gateway, a
// separate business). The service / mappers above stay as the workflow layer.
describe('Edit Project page without PaymentConfig', () => {
  const route = read('./projectDetailRoute.server.tsx')
  const page = read('./ProjectEditPage.tsx')
  const hook = read('./hooks/useProjectEditForm.ts')

  it('opening the edit page calls no PaymentConfig workflow (only the project detail)', () => {
    const editBranch = route.slice(route.indexOf("} else if (mode === 'edit') {"), route.indexOf('const [projectResult, buildingsResult, contactsResult]'))

    expect(editBranch).toContain('get_project_detail(')
    expect(route).not.toMatch(/payment_config|PaymentConfig|initialPaymentConfig/)
  })

  it('the page renders no payment configuration section, button, list or form', () => {
    expect(page).not.toMatch(/ProjectPaymentConfigSection|form\.payment|initialPaymentConfig|partialSave/)
    expect(page.indexOf("'projectInfoSection'")).toBeGreaterThan(-1)
    expect(page.indexOf("'projectAdditionalSection'")).toBeGreaterThan(page.indexOf("'projectInfoSection'"))
    expect(page.indexOf('<ProjectBankAccountsEditSection')).toBeGreaterThan(page.indexOf("'projectAdditionalSection'"))
    expect(page.indexOf("'saveChanges'")).toBeGreaterThan(page.indexOf('<ProjectBankAccountsEditSection'))
  })

  it('the edit hook has no PaymentConfig state, handler or workflow', () => {
    expect(hook).not.toMatch(/[Pp]ayment|partialSave/)
  })
})

// No DOM runner in this repo: the save flow of useProjectEditForm is pinned at source level.
describe('useProjectEditForm save flow (WF_BO_UPDATE_PROJECT only)', () => {
  const source = read('./hooks/useProjectEditForm.ts')
  const submit = source.slice(source.indexOf('const submit = async'), source.indexOf('return {\n    values'))

  it('nothing changed -> no workflow; otherwise validate before the first call', () => {
    expect(submit).toContain('if (!projectDirty) {')
    const beforeCalls = submit.slice(0, submit.indexOf('setSaving(true)'))

    expect(beforeCalls).toContain('if (!validate()) return')
    expect(beforeCalls).not.toContain('await ')
  })

  it('saves with update_project_detail (with the bank accounts) then re-reads get_project_detail; no PaymentConfig call', () => {
    expect(submit).toContain('buildProjectUpdatePayload(project, values, logo_url, bankPayload)')
    expect(submit.match(/propertyAggregateService\.\w+/g)).toEqual([
      'propertyAggregateService.upload_project_logo',
      'propertyAggregateService.update_project_detail',
      'propertyAggregateService.get_project_detail'
    ])
    expect(submit).toContain('finishWithSuccess(')
    expect(submit.slice(submit.indexOf('} catch (err) {'))).not.toContain('finishWithSuccess(')
    expect(submit).toContain('setSubmitError(err instanceof ProjectLogoUploadError')
  })
})
