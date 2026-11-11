import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildProjectPaymentConfigUpdatePayload,
  mapProjectPaymentConfigList,
  mapProjectPaymentConfigListItem,
  PAYMENT_CONFIG_UPDATE_ID_CONFIRMED,
  resolveProjectPaymentConfigList,
  buildProjectPaymentConfigForm,
  type ProjectPaymentConfig
} from './payment/projectPaymentConfig'

const { runFODynamic } = vi.hoisted(() => ({ runFODynamic: vi.fn() }))

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

let propertyAggregateService: typeof import('../propertyAggregateService').propertyAggregateService

beforeAll(async () => {
  ;({ propertyAggregateService } = await import('../propertyAggregateService'))
})

beforeEach(() => {
  runFODynamic.mockReset()
})

/** Real WF_BO_LIST_PROJECT_PAYMENT_CONFIGS response for project_id 1 (rows carry no `id`). */
const REAL_LIST_RESPONSE = {
  code: 'success',
  success: true,
  data: {
    payment_configs: [
      {
        project_id: 1, project_code: 'AGR', config_code: 'PAY_FEE_VNPAY', payment_purpose: 'FEE', provider: 'VNPAY',
        merchant_id: 'VGP_MERCHANT', terminal_id: 'VGP_TERM01', account_no: null, account_name: null, qr_template: null,
        callback_url: null, is_default: true, created_by: null, updated_by: null
      },
      {
        project_id: 1, project_code: 'AGR', config_code: 'PAY_FACILITY_BANK', payment_purpose: 'FACILITY', provider: 'BANK_TRANSFER',
        merchant_id: null, terminal_id: null, account_no: '1234567890', account_name: 'BQL Vinhomes Grand Park', qr_template: null,
        callback_url: null, is_default: true, created_by: null, updated_by: null
      }
    ]
  },
  errors: [],
  metadata: null
}

const row = (overrides: Record<string, unknown>) => ({ ...REAL_LIST_RESPONSE.data.payment_configs[0], ...overrides })
const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('WF_BO_LIST_PROJECT_PAYMENT_CONFIGS service', () => {
  it('sends only { project_id } and parses data.payment_configs (no id -> null, never inferred)', async () => {
    runFODynamic.mockResolvedValue(REAL_LIST_RESPONSE)

    const configs = await propertyAggregateService.list_project_payment_configs_workflow({ sessiontoken: 'token', language: 'vi', project_id: 1 })
    const request = runFODynamic.mock.calls[0][0]

    expect(request.workflowid).toBe('WF_BO_LIST_PROJECT_PAYMENT_CONFIGS')
    expect(request.input).toEqual({ project_id: 1 })
    expect(configs.map(config => config.config_code)).toEqual(['PAY_FEE_VNPAY', 'PAY_FACILITY_BANK'])
    expect(configs.every(config => config.id === null)).toBe(true)
    expect(configs[1]).toMatchObject({ project_id: 1, provider: 'BANK_TRANSFER', account_no: '1234567890', merchant_id: null, status: null, metadata_json: null })
  })

  it('returns [] when the project has no configuration', async () => {
    runFODynamic.mockResolvedValue({ ...REAL_LIST_RESPONSE, data: { payment_configs: [] } })
    await expect(propertyAggregateService.list_project_payment_configs_workflow({ sessiontoken: 'token', project_id: 1 })).resolves.toEqual([])

    runFODynamic.mockResolvedValue({ ...REAL_LIST_RESPONSE, data: null })
    await expect(propertyAggregateService.list_project_payment_configs_workflow({ sessiontoken: 'token', project_id: 1 })).resolves.toEqual([])
  })

  it('a failure throws the backend message with the error reference', async () => {
    runFODynamic.mockResolvedValue({ success: false, code: 'failed', execution_id: 'EXEC-LIST', errors: [{ info: 'Project not found' }] })

    await expect(propertyAggregateService.list_project_payment_configs_workflow({ sessiontoken: 'token', language: 'vi', project_id: 1 }))
      .rejects.toThrow('Project not found Mã tra cứu lỗi: EXEC-LIST')
  })
})

describe('LIST mapping', () => {
  it('keeps null fields null and reads `id` only when Backend sends it', () => {
    expect(mapProjectPaymentConfigListItem(row({}))).toMatchObject({ id: null, account_no: null, qr_template: null, callback_url: null })
    expect(mapProjectPaymentConfigListItem(row({ id: 12 }))?.id).toBe(12)
  })

  it('drops rows without project_id or config_code (they cannot be checked or keyed)', () => {
    expect(mapProjectPaymentConfigListItem(row({ project_id: null }))).toBeNull()
    expect(mapProjectPaymentConfigListItem(row({ config_code: '  ' }))).toBeNull()
    expect(mapProjectPaymentConfigList({ payment_configs: [row({}), row({ project_id: undefined }), 'x'] })).toHaveLength(1)
    expect(mapProjectPaymentConfigList(null)).toEqual([])
  })
})

describe('resolveProjectPaymentConfigList (ownership by project_id)', () => {
  const list = (rows: Record<string, unknown>[]) => mapProjectPaymentConfigList({ payment_configs: rows })

  it('a project with several configurations -> all listed, keyed by config_code, no mismatch', () => {
    const load = resolveProjectPaymentConfigList(1, mapProjectPaymentConfigList(REAL_LIST_RESPONSE.data))

    expect(load.state).toBe('ready')
    if (load.state !== 'ready') return
    expect(load.entries.map(entry => entry.key)).toEqual(['PAY_FEE_VNPAY', 'PAY_FACILITY_BANK'])
    // both are is_default: several defaults are kept as returned
    expect(load.entries.every(entry => entry.config.is_default)).toBe(true)
    expect(load.foreignCount).toBe(0)
    expect(load.duplicateCodes).toEqual([])
  })

  it('no configuration -> empty', () => {
    expect(resolveProjectPaymentConfigList(1, [])).toEqual({ state: 'empty' })
  })

  it('Project ID different from any PaymentConfig ID -> shown (ownership uses project_id only)', () => {
    const load = resolveProjectPaymentConfigList(5, list([row({ id: 12, project_id: 5 })]))

    expect(load).toMatchObject({ state: 'ready', entries: [{ key: 'PAY_FEE_VNPAY', config: { id: 12, project_id: 5 } }] })
  })

  it('route id "1" (string) matches backend project_id 1; loose values never match', () => {
    expect(resolveProjectPaymentConfigList('1', list([row({})])).state).toBe('ready')
    expect(resolveProjectPaymentConfigList('1abc', list([row({})]))).toEqual({ state: 'mismatch' })
    expect(resolveProjectPaymentConfigList(1.5, list([row({})]))).toEqual({ state: 'mismatch' })
  })

  it('configurations of another project are dropped; only foreign rows -> mismatch', () => {
    const mixed = resolveProjectPaymentConfigList(1, list([row({}), row({ project_id: 2, config_code: 'OTHER' })]))

    expect(mixed).toMatchObject({ state: 'ready', foreignCount: 1 })
    if (mixed.state === 'ready') expect(mixed.entries.map(entry => entry.key)).toEqual(['PAY_FEE_VNPAY'])
    expect(resolveProjectPaymentConfigList(5, list([row({ project_id: 1 })]))).toEqual({ state: 'mismatch' })
  })

  it('missing PaymentConfig id / unconfirmed UPDATE contract -> read-only', () => {
    expect(PAYMENT_CONFIG_UPDATE_ID_CONFIRMED).toBe(false)

    const load = resolveProjectPaymentConfigList(1, list([row({}), row({ id: 3, config_code: 'WITH_ID' })]))

    expect(load.state === 'ready' && load.entries.every(entry => !entry.editable)).toBe(true)
  })

  it('a duplicated config_code stays visible, read-only, with a UI-only key', () => {
    const load = resolveProjectPaymentConfigList(1, list([row({}), row({ provider: 'MOMO' })]))

    expect(load).toMatchObject({ state: 'ready', duplicateCodes: ['PAY_FEE_VNPAY'] })
    if (load.state === 'ready') expect(load.entries.map(entry => entry.key)).toEqual(['PAY_FEE_VNPAY', 'PAY_FEE_VNPAY#2'])
  })

  it('UPDATE payload is never built without the record id', () => {
    const config = mapProjectPaymentConfigListItem(row({})) as ProjectPaymentConfig

    expect(() => buildProjectPaymentConfigUpdatePayload(config, buildProjectPaymentConfigForm(config))).toThrow()
  })
})

