import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildProjectBankAccountForm,
  buildProjectBankAccountUpdatePayload,
  isProjectBankAccountPersisted,
  isProjectBankAccountUpdatable,
  mapProjectBankAccount,
  type ProjectBankAccount
} from './bank/projectBankTypes'

const { runFODynamic, hookState, routerPush } = vi.hoisted(() => ({
  runFODynamic: vi.fn(),
  routerPush: vi.fn(),
  hookState: { cursor: 0, slots: {} as Record<number, unknown> }
}))

// Run the hook outside React: state / ref slots survive between "renders" (see buildingCreate.test.ts).
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

  const useRef = (initial: unknown) => {
    const index = hookState.cursor++

    if (!(index in hookState.slots)) hookState.slots[index] = { current: initial }

    return hookState.slots[index]
  }

  return { ...actual, default: { ...actual, useState, useRef }, useState, useRef }
})

vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: routerPush, refresh: vi.fn() }) }))
vi.mock('@shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('./logo/useProjectLogoFile', () => ({ useProjectLogoFile: () => ({ file: null, clear: vi.fn() }), projectLogoUploadErrorMessage: () => '' }))

let useProjectEditForm: typeof import('./hooks/useProjectEditForm').useProjectEditForm
let buildProjectBankAccountsPayload: typeof import('./hooks/useProjectEditForm').buildProjectBankAccountsPayload

beforeAll(async () => {
  ;({ useProjectEditForm, buildProjectBankAccountsPayload } = await import('./hooks/useProjectEditForm'))
})

beforeEach(() => {
  hookState.cursor = 0
  hookState.slots = {}
  runFODynamic.mockReset()
  installBackend()
  routerPush.mockReset()
})

// Bank objects as GET would return them with the WF_BO_UPDATE_PROJECT shape (the real GET sample has none yet).
const OPERATING_RAW = {
  id: 11,
  bank_name: 'Vietcombank',
  account_number: '001234567890',
  account_holder: 'BQL AN GIA RIVERSIDE',
  branch: 'Chi nhánh Tân Bình',
  qr_code_url: null, // no stored QR here: changing the account must not hit the outdated-QR guard (see projectBankQr.test.ts)
  transfer_content: 'AGR [CanHo] Dong phi quan ly'
}
const DEPOSIT_RAW = {
  id: 22,
  bank_name: 'Techcombank',
  account_number: '9876543210',
  account_holder: 'BQL AN GIA RIVERSIDE',
  branch: null,
  qr_code_url: null,
  transfer_content: 'AGR [CanHo] Dat coc tien ich'
}

const projectWith = (operating: unknown, deposit: unknown) => ({
  id: 5,
  name: 'An Gia Riverside',
  project_code: 'AGR',
  address: '512 Nguyen Xien',
  description: 'Mo ta',
  status: 'active',
  investor: 'An Gia',
  province: '',
  handover_date: '2026-06-15',
  logo_url: 'https://cdn.example.com/project/5/logo.png',
  operating_bank_account: mapProjectBankAccount(operating),
  deposit_bank_account: mapProjectBankAccount(deposit)
}) as any

const dictionary = { projectManagement: {}, common: {} } as any

const render = (project: any) => {
  hookState.cursor = 0

  return useProjectEditForm({ dictionary, locale: 'vi', sessiontoken: 'token', project, initialProvince: null, detailHref: '/system-settings/projects/5' })
}

const updateInput = () => {
  const call = runFODynamic.mock.calls.find(item => item[0].workflowid === 'WF_BO_UPDATE_PROJECT')

  return call?.[0].input
}

/**
 * Fake Backend: WF_BO_UPDATE_PROJECT stores the bank objects it receives (when `persist`), and
 * WF_BO_GET_PROJECT_DETAIL returns them as the real response does (inside `project`, null when absent).
 */
const backend = { persist: true, createNew: true, stored: {} as Record<string, unknown> }

function installBackend(initial: Record<string, unknown> = {}) {
  backend.persist = true
  backend.createNew = true
  backend.stored = { ...initial }
  runFODynamic.mockImplementation(async ({ workflowid, input }: { workflowid: string; input: Record<string, any> }) => {
    if (workflowid === 'WF_BO_UPDATE_PROJECT' && backend.persist) {
      for (const group of ['operating_bank_account', 'deposit_bank_account']) {
        if (input[group] && (input[group].id !== undefined || backend.createNew)) backend.stored[group] = { id: input[group].id ?? 99, ...input[group] }
      }
    }

    if (workflowid === 'WF_BO_GET_PROJECT_DETAIL') {
      return {
        success: true,
        code: 'success',
        errors: [],
        data: {
          project: {
            id: 5, project_code: 'AGR', name: 'An Gia Riverside', status: 'A',
            operating_bank_account: backend.stored.operating_bank_account ?? null,
            deposit_bank_account: backend.stored.deposit_bank_account ?? null
          }
        }
      }
    }

    return { success: true, code: 'success', data: {}, errors: [] }
  })
}

const workflows = () => runFODynamic.mock.calls.map(call => call[0].workflowid)

/** Real WF_BO_GET_PROJECT_DETAIL of project 22: both accounts null (inside `project` and at the root). */
const NULL_ACCOUNTS_PROJECT = () => projectWith(null, null)

describe('cards when the accounts are null / present', () => {
  it('1. both accounts null -> both forms are editable, empty, independent', () => {
    const project = NULL_ACCOUNTS_PROJECT()

    expect(render(project).bank.values.operating_bank_account).toEqual({ bank_name: '', account_number: '', account_holder: '', branch: '', qr_code_url: '', transfer_content: '' })

    render(project).bank.updateValue('operating_bank_account', 'bank_name', 'Vietcombank')

    const form = render(project)

    expect(form.bank.values.operating_bank_account.bank_name).toBe('Vietcombank')
    expect(form.bank.values.deposit_bank_account.bank_name).toBe('')
    expect(form.bank.dirtyGroups).toEqual(['operating_bank_account'])

    render(project).bank.updateValue('deposit_bank_account', 'bank_name', 'ACB')
    expect(render(project).bank.dirtyGroups).toEqual(['operating_bank_account', 'deposit_bank_account'])
  })

  it('2. operating null, deposit present -> operating empty + editable, deposit prefilled with its id', () => {
    const form = render(projectWith(null, DEPOSIT_RAW))

    expect(form.bank.accounts.operating_bank_account).toBeNull()
    expect(form.bank.values.operating_bank_account.bank_name).toBe('')
    expect(form.bank.accounts.deposit_bank_account?.id).toBe(22)
    expect(form.bank.values.deposit_bank_account.bank_name).toBe('Techcombank')
  })

  it('3. deposit null, operating present', () => {
    const form = render(projectWith(OPERATING_RAW, null))

    expect(form.bank.accounts.operating_bank_account?.id).toBe(11)
    expect(form.bank.values.operating_bank_account).toMatchObject({ bank_name: 'Vietcombank', transfer_content: 'AGR [CanHo] Dong phi quan ly' })
    expect(form.bank.accounts.deposit_bank_account).toBeNull()
    expect(form.bank.values.deposit_bank_account.account_number).toBe('')
  })

  it('4. both present -> prefilled, each with its own id', () => {
    const form = render(projectWith(OPERATING_RAW, DEPOSIT_RAW))

    expect(form.bank.accounts.operating_bank_account?.id).toBe(11)
    expect(form.bank.accounts.deposit_bank_account?.id).toBe(22)
    expect(form.bank.values.deposit_bank_account).toMatchObject({ account_number: '9876543210', branch: '', qr_code_url: '' })
  })

  it('an account returned WITHOUT id stays read-only (cannot be targeted)', () => {
    const legacy = { bank_name: 'VCB', account_number: '01', account_holder: 'A', transfer_content: 'T' }
    const project = projectWith(legacy, null)

    render(project).bank.updateValue('operating_bank_account', 'bank_name', 'X')
    expect(render(project).bank.values.operating_bank_account.bank_name).toBe('VCB')
    expect(isProjectBankAccountUpdatable(project.operating_bank_account)).toBe(false)
  })
})

describe('WF_BO_UPDATE_PROJECT payload', () => {
  it('5. null and not filled -> no bank object at all (no empty object)', async () => {
    const project = NULL_ACCOUNTS_PROJECT()

    installBackend()
    render(project).updateValue('name', 'Dự án ma 2')
    await render(project).submit()

    expect(updateInput()).not.toHaveProperty('operating_bank_account')
    expect(updateInput()).not.toHaveProperty('deposit_bank_account')
    expect(workflows()).toEqual(['WF_BO_UPDATE_PROJECT'])
    expect(routerPush).toHaveBeenCalledWith('/vi/system-settings/projects/5')
  })

  it('6. null and filled -> new object built from the form, without any id key (never id: null / Project ID)', () => {
    const accounts = { operating_bank_account: null, deposit_bank_account: null }
    const values = {
      operating_bank_account: { bank_name: ' Vietcombank ', account_number: ' 001234567890 ', account_holder: 'BQL', branch: '', qr_code_url: '', transfer_content: ' AGR [CanHo] Dong phi ' },
      deposit_bank_account: buildProjectBankAccountForm(null)
    }
    const payload = buildProjectBankAccountsPayload(accounts, values)

    // deposit (empty) is not sent at all
    expect(payload).toEqual({
      operating_bank_account: {
        bank_name: 'Vietcombank', account_number: '001234567890', account_holder: 'BQL', branch: '', qr_code_url: '', transfer_content: 'AGR [CanHo] Dong phi'
      }
    })
    expect(payload.operating_bank_account).not.toHaveProperty('id')
  })

  it('6b. new account typed on a project with no accounts -> WF_BO_UPDATE_PROJECT is called (no guard), GET confirms it', async () => {
    const project = NULL_ACCOUNTS_PROJECT()

    installBackend()
    render(project).bank.updateValue('deposit_bank_account', 'bank_name', 'Techcombank')
    render(project).bank.updateValue('deposit_bank_account', 'account_number', ' 9876543210 ')
    render(project).bank.updateValue('deposit_bank_account', 'account_holder', 'BQL AN GIA')
    render(project).bank.updateValue('deposit_bank_account', 'branch', 'Quận 7')
    render(project).bank.updateValue('deposit_bank_account', 'qr_code_url', 'https://minio.ips.test/ips-documents/project-bank-qr/5/deposit_bank_account/qr.png')
    render(project).bank.updateValue('deposit_bank_account', 'transfer_content', 'AGR [CanHo] Dat coc')
    await render(project).submit()

    const input = updateInput()

    expect(workflows()).toEqual(['WF_BO_UPDATE_PROJECT', 'WF_BO_GET_PROJECT_DETAIL'])
    expect(input.id).toBe(5)
    expect(input.deposit_bank_account).toEqual({
      bank_name: 'Techcombank',
      account_number: '9876543210',
      account_holder: 'BQL AN GIA',
      branch: 'Quận 7',
      qr_code_url: 'https://minio.ips.test/ips-documents/project-bank-qr/5/deposit_bank_account/qr.png',
      transfer_content: 'AGR [CanHo] Dat coc'
    })
    expect(input.deposit_bank_account).not.toHaveProperty('id')
    expect(input).not.toHaveProperty('operating_bank_account')
    expect(render(project).submitError).toBeNull()
    expect(routerPush).toHaveBeenCalledWith('/vi/system-settings/projects/5')
  })

  it('both accounts new -> both sent without id in the same WF_BO_UPDATE_PROJECT', async () => {
    const project = NULL_ACCOUNTS_PROJECT()

    installBackend()
    for (const group of ['operating_bank_account', 'deposit_bank_account'] as const) {
      render(project).bank.updateValue(group, 'bank_name', group === 'operating_bank_account' ? 'Vietcombank' : 'Techcombank')
      render(project).bank.updateValue(group, 'account_number', group === 'operating_bank_account' ? '001' : '002')
      render(project).bank.updateValue(group, 'account_holder', 'BQL')
    }
    await render(project).submit()

    const input = updateInput()

    expect(input.operating_bank_account).toMatchObject({ bank_name: 'Vietcombank', account_number: '001' })
    expect(input.deposit_bank_account).toMatchObject({ bank_name: 'Techcombank', account_number: '002' })
    expect(input.operating_bank_account).not.toHaveProperty('id')
    expect(input.deposit_bank_account).not.toHaveProperty('id')
    expect(workflows().filter(id => id === 'WF_BO_UPDATE_PROJECT')).toHaveLength(1)
    expect(routerPush).toHaveBeenCalled()
  })

  it('one existing (id kept) + one new (no id): only the new one is created, the existing one is updated', async () => {
    const project = projectWith(OPERATING_RAW, null)

    installBackend({ operating_bank_account: OPERATING_RAW })
    render(project).bank.updateValue('operating_bank_account', 'account_holder', 'BQL MOI')
    render(project).bank.updateValue('deposit_bank_account', 'bank_name', 'ACB')
    render(project).bank.updateValue('deposit_bank_account', 'account_number', '123')
    render(project).bank.updateValue('deposit_bank_account', 'account_holder', 'BQL')
    await render(project).submit()

    const input = updateInput()

    expect(input.operating_bank_account).toEqual({ ...OPERATING_RAW, account_holder: 'BQL MOI' })
    expect(input.deposit_bank_account).toMatchObject({ bank_name: 'ACB', account_number: '123', account_holder: 'BQL' })
    expect(input.deposit_bank_account).not.toHaveProperty('id')
    expect(routerPush).toHaveBeenCalled()
  })

  it('only one existing account changed: the other existing account is sent unchanged, a null account is not sent', async () => {
    const project = projectWith(OPERATING_RAW, null)

    installBackend({ operating_bank_account: OPERATING_RAW })
    render(project).bank.updateValue('operating_bank_account', 'branch', 'Chi nhánh mới')
    await render(project).submit()

    expect(updateInput().operating_bank_account).toEqual({ ...OPERATING_RAW, branch: 'Chi nhánh mới' })
    expect(updateInput()).not.toHaveProperty('deposit_bank_account')
  })

  it('validates only the account being filled (required fields, QR URL)', async () => {
    const project = NULL_ACCOUNTS_PROJECT()

    render(project).bank.updateValue('operating_bank_account', 'qr_code_url', 'not a url')
    await render(project).submit()

    expect(Object.keys(render(project).bank.errors.operating_bank_account ?? {}).sort()).toEqual(['account_holder', 'account_number', 'bank_name', 'qr_code_url'])
    expect(render(project).bank.errors.deposit_bank_account).toBeUndefined()
    expect(runFODynamic).not.toHaveBeenCalled()
  })

  it('7 + 8. existing accounts keep their own ids; the Project ID is never used as a Bank Account ID', async () => {
    const project = projectWith(OPERATING_RAW, DEPOSIT_RAW)

    installBackend({ operating_bank_account: OPERATING_RAW, deposit_bank_account: DEPOSIT_RAW })
    render(project).bank.updateValue('operating_bank_account', 'account_holder', '  BQL MOI  ')
    await render(project).submit()

    const input = updateInput()

    expect(input.id).toBe(5)
    expect(input.operating_bank_account).toEqual({ ...OPERATING_RAW, account_holder: 'BQL MOI' })
    expect(input.deposit_bank_account).toEqual(DEPOSIT_RAW)
    expect([input.operating_bank_account.id, input.deposit_bank_account.id]).not.toContain(project.id)
  })

  it('editing only the project keeps the bank data (both accounts sent unchanged), logo/status/handover kept', async () => {
    const project = projectWith(OPERATING_RAW, DEPOSIT_RAW)

    installBackend({ operating_bank_account: OPERATING_RAW, deposit_bank_account: DEPOSIT_RAW })
    render(project).updateValue('address', '1 Le Loi')
    await render(project).submit()

    expect(updateInput()).toMatchObject({ address: '1 Le Loi', logo_url: 'https://cdn.example.com/project/5/logo.png', status: 'A', handover_date: '2026-06-15' })
    expect(updateInput().operating_bank_account).toEqual(OPERATING_RAW)
    expect(updateInput().deposit_bank_account).toEqual(DEPOSIT_RAW)
  })

  it('no PaymentConfig data / workflow in the save', async () => {
    const project = projectWith(OPERATING_RAW, DEPOSIT_RAW)

    installBackend({ operating_bank_account: OPERATING_RAW, deposit_bank_account: DEPOSIT_RAW })
    render(project).bank.updateValue('operating_bank_account', 'bank_name', 'ACB')
    await render(project).submit()

    expect(workflows().every(id => !/PAYMENT_CONFIG/.test(id))).toBe(true)
    expect(JSON.stringify(updateInput())).not.toMatch(/config_code|payment_purpose|merchant_id|terminal_id|metadata_json/)
  })
})

describe('after save: WF_BO_GET_PROJECT_DETAIL is read again', () => {
  it('9. saved and re-read with the same data -> success, back to the detail (tab reloads from the server)', async () => {
    const project = projectWith(OPERATING_RAW, DEPOSIT_RAW)

    installBackend({ operating_bank_account: OPERATING_RAW, deposit_bank_account: DEPOSIT_RAW })
    render(project).bank.updateValue('deposit_bank_account', 'branch', ' Chi nhánh Quận 7 ')
    await render(project).submit()

    expect(workflows()).toEqual(['WF_BO_UPDATE_PROJECT', 'WF_BO_GET_PROJECT_DETAIL'])
    expect(runFODynamic.mock.calls[1][0].input).toEqual({ project_id: 5 })
    expect(routerPush).toHaveBeenCalledWith('/vi/system-settings/projects/5')
    expect(render(project).submitWarning).toBeNull()
  })

  it('UPDATE accepted but GET does not hold the bank data -> no success, error naming the account, values kept', async () => {
    const project = projectWith(OPERATING_RAW, DEPOSIT_RAW)

    installBackend({ operating_bank_account: OPERATING_RAW, deposit_bank_account: DEPOSIT_RAW })
    backend.persist = false
    render(project).bank.updateValue('operating_bank_account', 'bank_name', 'ACB')
    await render(project).submit()

    const form = render(project)

    expect(routerPush).not.toHaveBeenCalled()
    expect(form.submitError).toBe('The project was saved, but the system did not store these bank accounts: Operating account.')
    expect(form.bank.values.operating_bank_account.bank_name).toBe('ACB')
    expect(form.bank.dirtyGroups).toEqual(['operating_bank_account'])
  })

  it('Backend accepts the UPDATE but does not create the new account -> real error for that account only, input kept', async () => {
    const project = projectWith(OPERATING_RAW, null)

    installBackend({ operating_bank_account: OPERATING_RAW })
    backend.createNew = false
    render(project).bank.updateValue('deposit_bank_account', 'bank_name', 'ACB')
    render(project).bank.updateValue('deposit_bank_account', 'account_number', '123')
    render(project).bank.updateValue('deposit_bank_account', 'account_holder', 'BQL')
    await render(project).submit()

    const form = render(project)

    expect(routerPush).not.toHaveBeenCalled()
    expect(form.submitError).toBe('The project was saved, but the system did not store these bank accounts: Deposit account.')
    expect(form.bank.accounts.deposit_bank_account).toBeNull()
    expect(form.bank.values.deposit_bank_account).toMatchObject({ bank_name: 'ACB', account_number: '123', account_holder: 'BQL' })
    expect(form.bank.dirtyGroups).toEqual(['deposit_bank_account'])
  })

  it('Backend rejects the new account (workflow error) -> its message + reference shown, no GET, input kept', async () => {
    const project = NULL_ACCOUNTS_PROJECT()

    runFODynamic.mockResolvedValue({ success: false, code: 'failed', execution_id: 'EXEC-NEW', errors: [{ info: 'Bank account number already exists' }] })
    render(project).bank.updateValue('operating_bank_account', 'bank_name', 'ACB')
    render(project).bank.updateValue('operating_bank_account', 'account_number', '123')
    render(project).bank.updateValue('operating_bank_account', 'account_holder', 'BQL')
    await render(project).submit()

    expect(render(project).submitError).toBe('Bank account number already exists Mã tra cứu lỗi: EXEC-NEW')
    expect(workflows()).toEqual(['WF_BO_UPDATE_PROJECT'])
    expect(render(project).bank.values.operating_bank_account.account_number).toBe('123')
  })

  it('10. Backend rejects the UPDATE -> page kept, error shown, values kept, no GET', async () => {
    const project = projectWith(OPERATING_RAW, DEPOSIT_RAW)

    runFODynamic.mockResolvedValue({ success: false, code: 'failed', execution_id: 'EXEC-BANK', errors: [{ info: 'Invalid bank account' }] })
    render(project).bank.updateValue('operating_bank_account', 'bank_name', 'ACB')
    await render(project).submit()

    const form = render(project)

    expect(form.submitError).toBe('Invalid bank account Mã tra cứu lỗi: EXEC-BANK')
    expect(form.bank.values.operating_bank_account.bank_name).toBe('ACB')
    expect(workflows()).toEqual(['WF_BO_UPDATE_PROJECT'])
    expect(routerPush).not.toHaveBeenCalled()
  })
})

describe('bank helpers', () => {
  it('keeps a null text field null when untouched (never "")', () => {
    const account = mapProjectBankAccount({ ...OPERATING_RAW, transfer_content: null }) as ProjectBankAccount & { id: number }

    expect(buildProjectBankAccountUpdatePayload(account, buildProjectBankAccountForm(account)).transfer_content).toBeNull()
  })

  it('persistence check compares id and every sent field', () => {
    const sent = { ...OPERATING_RAW, bank_name: 'ACB' }

    expect(isProjectBankAccountPersisted(sent, mapProjectBankAccount(sent))).toBe(true)
    expect(isProjectBankAccountPersisted(sent, mapProjectBankAccount(OPERATING_RAW))).toBe(false)
    expect(isProjectBankAccountPersisted(sent, mapProjectBankAccount({ ...sent, id: 5 }))).toBe(false)
    expect(isProjectBankAccountPersisted(sent, null)).toBe(false)
  })

  it('the bank section / types never use the PaymentConfig workflows', () => {
    const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8')

    for (const file of ['./bank/projectBankTypes.ts', './bank/ProjectBankAccountsEditSection.tsx']) {
      expect(read(file)).not.toMatch(/WF_BO_[A-Z_]*PAYMENT_CONFIG|projectPaymentConfig/)
    }
  })
})
