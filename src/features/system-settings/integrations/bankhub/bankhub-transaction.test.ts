import { beforeEach, describe, expect, it, vi } from 'vitest'

const runFODynamic = vi.fn()

vi.mock('@/servers/system-service', () => ({
  workflowService: { runFODynamic: (...args: unknown[]) => runFODynamic(...args) }
}))

// integrationModules pulls MUI icons, which do not load in the node test environment.
vi.mock('../integrationModules', () => ({
  integrationsText: (_dictionary: unknown, key: string) => key
}))

import {
  formatBankHubTransactionAmount,
  formatBankHubTransactionDateTime,
  getBankHubAccountOptionLabel,
  getBankHubTransactionWebhookLabel,
  getBankHubTransferTypeLabel,
  mergeBankHubAccountOptions
} from './bankhub-transaction.mapper'
import { bankHubService, getDefaultBankHubTransactionFilter, toTransactionSearchRequest } from './bankhub.service'
import type { BankHubAccount, BankHubTransaction } from './bankhub.types'

const companyXid = '06861d5d-e042-4da5-98b0-85061af87a9e'
const accountXid = 'da231649-bf37-11f1-b21a-a6006ab65aca'
const dictionary = {} as never

const transactionItem = {
  transaction_id: 'b8de7b5e-bfe6-11f1-b21a-a6006ab65aca',
  transaction_date: '2026-10-04 18:25:46',
  bank_account_xid: accountXid,
  company_xid: companyXid,
  brand_name: 'ACB',
  account_number: '4567890123',
  va: null,
  va_xid: null,
  reference_number: 'MOCK2610041825463655',
  transfer_type: 'credit',
  amount: 500000,
  transaction_content: 'TEST BANKHUB SANDBOX TRANSACTION',
  payment_code: null,
  webhook_success: 0
}

const successResponse = {
  status: 200,
  payload: {
    dataresponse: {
      code: 'success',
      success: true,
      data: {
        data: [transactionItem],
        meta: { per_page: 10, total: 1, has_more: false, current_page: 1, page_count: 1 }
      },
      errors: [],
      metadata: null
    }
  }
}

describe('Bank Hub transactions request', () => {
  it('maps the default filter to the provided WF_BO_GET_BANK_HUB_TRANSACTIONS sample', () => {
    expect(toTransactionSearchRequest(companyXid, 'SEPAY', getDefaultBankHubTransactionFilter())).toEqual({
      page_index: 0,
      page_size: 10,
      search_text: '',
      company_xid: companyXid,
      bank_account_xid: '',
      brand_name: '',
      transaction_date: null,
      start_transaction_date: null,
      end_transaction_date: null,
      transfer_type: '',
      webhook_success: null,
      provider: 'SEPAY'
    })
  })

  it('sends 0-based page_index, account xid, dates and webhook flag', () => {
    const request = toTransactionSearchRequest(companyXid, null, {
      ...getDefaultBankHubTransactionFilter(),
      page: 3,
      page_size: 20,
      search_text: ' MOCK2610041825463655 ',
      bank_account_xid: accountXid,
      brand_name: 'ACB',
      start_transaction_date: '2026-10-01',
      end_transaction_date: '2026-10-04',
      transfer_type: 'debit',
      webhook_success: '0'
    })

    expect(request).toMatchObject({
      page_index: 2,
      page_size: 20,
      search_text: 'MOCK2610041825463655',
      bank_account_xid: accountXid,
      brand_name: 'ACB',
      start_transaction_date: '2026-10-01',
      end_transaction_date: '2026-10-04',
      transfer_type: 'debit',
      webhook_success: 0,
      provider: 'SEPAY'
    })
    expect(toTransactionSearchRequest(companyXid, 'SEPAY', { ...getDefaultBankHubTransactionFilter(), webhook_success: '1' }).webhook_success).toBe(1)
  })
})

describe('bankHubService.searchTransactions', () => {
  beforeEach(() => runFODynamic.mockReset())

  it('reads the list from data.data and paging from data.meta', async () => {
    runFODynamic.mockResolvedValue(successResponse)

    const result = await bankHubService.searchTransactions({
      sessiontoken: 'token',
      companyXid,
      provider: 'SEPAY',
      filter: getDefaultBankHubTransactionFilter(),
      fallbackMessage: 'failed'
    })

    expect(runFODynamic).toHaveBeenCalledWith(expect.objectContaining({ workflowid: 'WF_BO_GET_BANK_HUB_TRANSACTIONS' }))
    expect(result.total_count).toBe(1)
    expect(result.total_pages).toBe(1)
    expect(result.page_size).toBe(10)
    expect(result.items[0]).toMatchObject({
      transaction_id: transactionItem.transaction_id,
      bank_account_xid: accountXid,
      transfer_type: 'credit',
      amount: 500000,
      webhook_success: 0
    })
  })

  it('throws a workflow error with execution_id on failure', async () => {
    runFODynamic.mockResolvedValue({
      status: 200,
      payload: { dataresponse: { code: 'failed', success: false, message: 'Boom', execution_id: 'exec-1', errors: [] } }
    })

    await expect(bankHubService.searchTransactions({
      sessiontoken: 'token',
      companyXid,
      filter: getDefaultBankHubTransactionFilter(),
      fallbackMessage: 'failed'
    })).rejects.toBeTruthy()
  })

  it('does not call the workflow without company_xid', async () => {
    const result = await bankHubService.searchTransactions({
      sessiontoken: 'token',
      companyXid: ' ',
      filter: getDefaultBankHubTransactionFilter(),
      fallbackMessage: 'failed'
    })

    expect(runFODynamic).not.toHaveBeenCalled()
    expect(result.items).toEqual([])
  })
})

describe('Bank Hub transaction mapper', () => {
  const transaction = transactionItem as BankHubTransaction

  it('formats date, signed amount and labels', () => {
    expect(formatBankHubTransactionDateTime(transaction.transaction_date)).toBe('04/10/2026 18:25:46')
    expect(formatBankHubTransactionAmount(transaction)).toBe('+500.000')
    expect(formatBankHubTransactionAmount({ ...transaction, transfer_type: 'debit' })).toBe('-500.000')
    expect(getBankHubTransferTypeLabel(dictionary, 'credit')).toBe('bankhub_transaction_transfer_type_credit')
    expect(getBankHubTransactionWebhookLabel(dictionary, transaction)).toBe('bankhub_transaction_webhook_failed')
    expect(getBankHubTransactionWebhookLabel(dictionary, { ...transaction, webhook_success: 1 })).toBe('bankhub_transaction_webhook_success')
  })

  it('builds unique account options labelled "brand - number"', () => {
    const account = { xid: accountXid, brand_name: 'ACB', account_number: '4567890123' } as BankHubAccount
    const options = mergeBankHubAccountOptions([account], [account])

    expect(options).toHaveLength(1)
    expect(getBankHubAccountOptionLabel(options[0])).toBe('ACB - 4567890123')
  })
})
