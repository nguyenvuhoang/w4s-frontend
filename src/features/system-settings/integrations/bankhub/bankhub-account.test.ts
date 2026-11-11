import { beforeEach, describe, expect, it, vi } from 'vitest'

const runFODynamic = vi.fn()

vi.mock('@/servers/system-service', () => ({
  workflowService: { runFODynamic: (...args: unknown[]) => runFODynamic(...args) }
}))

// integrationModules pulls MUI icons, which do not load in the node test environment.
vi.mock('../integrationModules', () => ({
  integrationsText: (_dictionary: unknown, key: string) => key
}))

import { formatBankHubAccountDateTime, getBankHubAccountBankMeta } from './bankhub-account.mapper'
import { bankHubService } from './bankhub.service'

const companyXid = '06861d5d-e042-4da5-98b0-85061af87a9e'
const accountXid = 'da231649-bf37-11f1-b21a-a6006ab65aca'

const successResponse = {
  status: 200,
  payload: {
    dataresponse: {
      code: 'success',
      success: true,
      data: {
        data: [
          {
            xid: accountXid,
            company_xid: companyXid,
            brand_name: 'ACB',
            bank_bin: '970416',
            bank_code: 'ACB',
            account_holder_name: 'BUI VAN G',
            account_number: '4567890123',
            accumulated: '0.00',
            account_type: 'individual',
            bank_api_connected: '1',
            active: '1',
            last_transaction: null,
            created_at: '2026-10-03 21:36:42',
            updated_at: '2026-10-03 21:36:42'
          }
        ],
        meta: { per_page: 10, total: 1, has_more: false, current_page: 1, page_count: 1 }
      }
    }
  }
}

describe('bankHubService.searchAccounts', () => {
  beforeEach(() => runFODynamic.mockReset())

  it('sends the 0-based request fields and reads the nested data.data / data.meta response', async () => {
    runFODynamic.mockResolvedValue(successResponse)

    const result = await bankHubService.searchAccounts({
      sessiontoken: 'token',
      companyXid,
      provider: 'SEPAY',
      filter: { page: 1, page_size: 10 },
      fallbackMessage: 'failed'
    })

    expect(runFODynamic).toHaveBeenCalledWith(expect.objectContaining({
      workflowid: 'WF_BO_GET_BANKHUB_ACCOUNTS',
      input: {
        page_index: 0,
        page_size: 10,
        search_text: '',
        company_xid: companyXid,
        bank_id: '',
        provider: 'SEPAY'
      }
    }))
    expect(result.items).toHaveLength(1)
    expect(result.items[0].xid).toBe(accountXid)
    expect(result.items[0].company_xid).toBe(companyXid)
    expect(result.total_count).toBe(1)
    expect(result.total_pages).toBe(1)
    expect(result.has_next_page).toBe(false)
  })

  it('maps UI page 2 to page_index 1 and defaults provider to SEPAY', async () => {
    runFODynamic.mockResolvedValue(successResponse)

    await bankHubService.searchAccounts({
      sessiontoken: 'token',
      companyXid,
      provider: '',
      filter: { page: 2, page_size: 10 },
      fallbackMessage: 'failed'
    })

    expect(runFODynamic.mock.calls[0][0].input).toMatchObject({ page_index: 1, provider: 'SEPAY' })
  })

  it('throws a workflow error when the backend reports failure', async () => {
    runFODynamic.mockResolvedValue({
      status: 200,
      payload: { dataresponse: { success: false, code: 'failed', message: 'Boom', execution_id: 'exec-1', errors: [] } }
    })

    await expect(bankHubService.searchAccounts({
      sessiontoken: 'token',
      companyXid,
      filter: { page: 1, page_size: 10 },
      fallbackMessage: 'failed'
    })).rejects.toThrow()
  })
})

describe('bankhub account mapper', () => {
  it('formats provider-local date text without timezone shifting', () => {
    expect(formatBankHubAccountDateTime('2026-10-03 21:36:42')).toBe('03/10/2026 21:36:42')
    expect(formatBankHubAccountDateTime(null)).toBe('-')
  })

  it('builds bank code / BIN meta', () => {
    expect(getBankHubAccountBankMeta({ bank_code: 'ACB', bank_bin: '970416' } as never)).toBe('ACB · BIN 970416')
  })
})
