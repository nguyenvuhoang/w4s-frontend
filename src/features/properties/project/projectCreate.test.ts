import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProjectCreatePayload } from '../types'

const { runFODynamic } = vi.hoisted(() => ({ runFODynamic: vi.fn() }))

// The shared Province lookup (Autocomplete + master workflow) is covered by projectProvinceForm.test.ts.
vi.mock('./province/ProvinceSelect', async () => {
  const { createElement: h } = await import('react')

  return { default: ({ label }: { label: string }) => h('span', { 'data-province-select': true }, label) }
})
vi.mock('@/servers/system-service', () => ({ workflowService: { runFODynamic } }))

vi.mock('@mui/material', async () => {
  const { createElement: h, Fragment } = await import('react')

  const Stub = ({ children, label }: { children?: React.ReactNode; label?: React.ReactNode }) => h(Fragment, null, label ?? null, children ?? null)

  return { Alert: Stub, Box: Stub, Button: Stub, Divider: Stub, Grid: Stub, MenuItem: Stub, Paper: Stub, Stack: Stub, TextField: Stub, Typography: Stub }
})
vi.mock('@mui/material/styles', () => ({ alpha: () => '' }))
vi.mock('@mui/icons-material/AccountBalanceOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/SavingsOutlined', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Close', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ZoomIn', () => ({ default: () => null }))
vi.mock('@mui/icons-material/AddCircleOutline', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Apartment', () => ({ default: () => null }))
vi.mock('@mui/icons-material/ArrowBack', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Cancel', () => ({ default: () => null }))
vi.mock('@mui/icons-material/Domain', () => ({ default: () => null }))
vi.mock('@shared/hooks/useRouter', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('@/shared/utils/SwalAlert', () => ({ default: vi.fn() }))
vi.mock('@/features/dynamicform/components/layout/content-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => children
}))

let propertyAggregateService: typeof import('../propertyAggregateService').propertyAggregateService
let ProjectCreatePage: typeof import('./ProjectCreatePage').default

beforeAll(async () => {
  ({ propertyAggregateService } = await import('../propertyAggregateService'))
  ;({ default: ProjectCreatePage } = await import('./ProjectCreatePage'))
})

beforeEach(() => {
  runFODynamic.mockReset()
})

const payload: ProjectCreatePayload = {
  name: 'Demo name',
  province: 'Ho Chi Minh',
  address: '512 Nguyen Xien, Thu Duc, HCMC',
  investor: 'Vinhomes',
  project_code: 'PRJ99',
  logo_url: '',
  description: 'Demo description',
  handover_date: '2026-12-31',
  operating_bank_account: {
    bank_name: 'Vietcombank',
    account_number: '001234567890',
    account_holder: 'BQL AN GIA RIVERSIDE',
    transfer_content: 'AGR [CanHo] Dong phi quan ly'
  },
  deposit_bank_account: {
    bank_name: 'Techcombank',
    account_number: '009876543210',
    account_holder: 'BQL AN GIA RIVERSIDE',
    transfer_content: 'AGR [CanHo] Dat coc tien ich'
  }
}

const emptyAccount = { bank_name: '', account_number: '', account_holder: '', transfer_content: '' }

const successResponse = (data: unknown) => ({ success: true, code: 'success', data, errors: [], execution_id: 'EXEC-OK' })

describe('propertyAggregateService.create_project_detail', () => {
  it('calls WF_BO_CREATE_PROJECT with exactly the planned contract fields', async () => {
    runFODynamic.mockResolvedValue(successResponse({ project: { id: 15, project_code: 'PRJ99', name: 'Demo name' } }))

    await propertyAggregateService.create_project_detail({ sessiontoken: 'token', language: 'vi', payload })

    expect(runFODynamic).toHaveBeenCalledTimes(1)

    const request = runFODynamic.mock.calls[0][0]

    expect(request.workflowid).toBe('WF_BO_CREATE_PROJECT')
    expect(request.sessiontoken).toBe('token')
    expect(request.input).toEqual(payload)
    expect(Object.keys(request.input).sort()).toEqual([
      'address', 'deposit_bank_account', 'description', 'handover_date', 'investor', 'logo_url', 'name', 'operating_bank_account', 'project_code', 'province'
    ])
    expect(request.input.handover_date).toBe('2026-12-31')
    expect(request.input).not.toHaveProperty('project_type')
    expect(request.input).not.toHaveProperty('status')
    expect(request.input).not.toHaveProperty('id')
    expect(request.input).not.toHaveProperty('project_id')
  })

  it('does not forward extra properties even if the caller passes them', async () => {
    runFODynamic.mockResolvedValue(successResponse({}))

    await propertyAggregateService.create_project_detail({
      sessiontoken: 'token',
      payload: { ...payload, status: 'active', project_type: 'apartment', project_id: 1 } as ProjectCreatePayload
    })

    expect(runFODynamic.mock.calls[0][0].input).toEqual(payload)
  })

  it('sends the exact operating / deposit bank objects, account_number as a string with its leading zeros', async () => {
    runFODynamic.mockResolvedValue(successResponse({}))

    await propertyAggregateService.create_project_detail({ sessiontoken: 'token', payload })

    const input = runFODynamic.mock.calls[0][0].input

    expect(input.operating_bank_account).toEqual({
      bank_name: 'Vietcombank',
      account_number: '001234567890',
      account_holder: 'BQL AN GIA RIVERSIDE',
      transfer_content: 'AGR [CanHo] Dong phi quan ly'
    })
    expect(input.deposit_bank_account).toEqual({
      bank_name: 'Techcombank',
      account_number: '009876543210',
      account_holder: 'BQL AN GIA RIVERSIDE',
      transfer_content: 'AGR [CanHo] Dat coc tien ich'
    })
    expect(typeof input.operating_bank_account.account_number).toBe('string')
    expect(typeof input.deposit_bank_account.account_number).toBe('string')
  })

  it('trims every bank field and keeps only the 4 Backend fields', async () => {
    runFODynamic.mockResolvedValue(successResponse({}))

    await propertyAggregateService.create_project_detail({
      sessiontoken: 'token',
      payload: {
        ...payload,
        operating_bank_account: {
          bank_name: '  Vietcombank ',
          account_number: ' 001234567890 ',
          account_holder: ' BQL AN GIA RIVERSIDE ',
          transfer_content: ' AGR [CanHo] Dong phi quan ly  ',
          beneficiary_name: 'legacy'
        } as ProjectCreatePayload['operating_bank_account']
      }
    })

    expect(runFODynamic.mock.calls[0][0].input.operating_bank_account).toEqual(payload.operating_bank_account)
  })

  it('an account left empty is sent as an object of empty strings (not null, not omitted)', async () => {
    runFODynamic.mockResolvedValue(successResponse({}))

    await propertyAggregateService.create_project_detail({
      sessiontoken: 'token',
      payload: { ...payload, operating_bank_account: emptyAccount, deposit_bank_account: { ...emptyAccount, bank_name: '   ' } }
    })

    const input = runFODynamic.mock.calls[0][0].input

    expect(input.operating_bank_account).toEqual(emptyAccount)
    expect(input.deposit_bank_account).toEqual(emptyAccount)
  })

  it('returns the created project when the response carries it', async () => {
    runFODynamic.mockResolvedValue(successResponse({ project: { id: 15, project_code: 'PRJ99', name: 'Demo name' } }))

    const created = await propertyAggregateService.create_project_detail({ sessiontoken: 'token', payload })

    expect(created?.id).toBe(15)
    expect(created?.project_code).toBe('PRJ99')
  })

  it('returns null (no fabricated project) when the response has no project data', async () => {
    runFODynamic.mockResolvedValue(successResponse({}))

    const created = await propertyAggregateService.create_project_detail({ sessiontoken: 'token', payload })

    expect(created).toBeNull()
  })

  it('surfaces the backend error message with the execution reference', async () => {
    runFODynamic.mockResolvedValue({
      success: false,
      code: 'failed',
      data: null,
      errors: [{ info: 'Project code already exists', execution_id: 'EXEC-ERR' }],
      execution_id: 'EXEC-ERR'
    })

    await expect(propertyAggregateService.create_project_detail({ sessiontoken: 'token', language: 'en', payload }))
      .rejects.toThrow('Project code already exists Error Reference: EXEC-ERR')
  })

  it('does not call the workflow without a session', async () => {
    await expect(propertyAggregateService.create_project_detail({ payload })).rejects.toThrow()
    expect(runFODynamic).not.toHaveBeenCalled()
  })
})

describe('ProjectCreatePage form', () => {
  it('does not show Project Type or Status, and has an empty Handover date', () => {
    const html = renderToStaticMarkup(createElement(ProjectCreatePage, {
      dictionary: {
        projectManagement: { projectName: 'Tên dự án', projectType: 'Loại dự án', statusProjectActive: 'Đang hoạt động', handoverDate: 'Ngày bàn giao' },
        common: { status: 'Trạng thái' }
      } as any,
      locale: 'vi',
      sessiontoken: 'token'
    }))

    expect(html).toContain('Tên dự án')
    expect(html).not.toContain('Loại dự án')
    expect(html).not.toContain('Trạng thái')
    expect(html).not.toContain('Đang hoạt động')
    expect(html).toContain('Ngày bàn giao')
  })

  it('has a "Thông tin ngân hàng" section with Operating + Deposit accounts of 4 optional fields each', () => {
    const html = renderToStaticMarkup(createElement(ProjectCreatePage, {
      dictionary: {
        projectManagement: {
          bankInformation: 'Thông tin ngân hàng',
          bankOperatingAccount: 'Tài khoản vận hành',
          bankDepositAccount: 'Tài khoản đặt cọc',
          bankName: 'Tên ngân hàng',
          bankAccountNumber: 'Số tài khoản',
          bankAccountHolder: 'Tên chủ tài khoản',
          bankTransferContent: 'Nội dung chuyển khoản'
        },
        common: {}
      } as any,
      locale: 'vi',
      sessiontoken: 'token'
    }))
    const count = (text: string) => html.split(text).length - 1

    expect(html).toContain('Thông tin ngân hàng')
    expect(html.indexOf('Tài khoản vận hành')).toBeLessThan(html.indexOf('Tài khoản đặt cọc'))
    for (const label of ['Tên ngân hàng', 'Số tài khoản', 'Tên chủ tài khoản', 'Nội dung chuyển khoản']) expect(count(label)).toBe(2)

    const card = readFileSync(new URL('./bank/ProjectBankAccountCard.tsx', import.meta.url), 'utf8')
    const types = readFileSync(new URL('./bank/projectBankTypes.ts', import.meta.url), 'utf8')

    // optional: no required mark, no numeric input / conversion for the account number
    expect(card).not.toMatch(/\brequired\b|type="number"|Number\(|parseInt|parseFloat/)
    expect(types).not.toMatch(/Number\(|parseInt|parseFloat/)
  })

  it('reuses the shared bank cards (edit mode), 2 columns from lg and 1 column below', () => {
    const page = readFileSync(new URL('./ProjectCreatePage.tsx', import.meta.url), 'utf8')
    const groups = readFileSync(new URL('./bank/ProjectBankAccountGroups.tsx', import.meta.url), 'utf8')

    expect(page).toContain("import ProjectBankAccountGroups from './bank/ProjectBankAccountGroups'")
    expect(page).toContain('editing={{ disabled: projectForm.saving, onChange: projectForm.updateBankAccount }}')
    expect(page).not.toContain('bank_name')
    expect(groups).toContain('size={{ xs: 12, lg: 6 }}')
  })
})

// The hook needs a DOM to drive state updates (no jsdom in this repo), so its submit flow is pinned at
// source level, following the convention of useResidentDetailActions.test.ts.
describe('useProjectCreateForm submit', () => {
  const source = readFileSync(new URL('./hooks/useProjectCreateForm.ts', import.meta.url), 'utf8')
  const submit = source.slice(source.indexOf('const submit = async'), source.indexOf('return {\n    values'))

  it('builds the payload without project_type (no legacy default) and with handover_date', () => {
    expect(source).not.toContain('DEFAULT_PROJECT_TYPE')
    expect(source).not.toContain('project_type')
    expect(source).not.toContain("'apartment'")
    expect(submit).not.toMatch(/\bstatus:/)
    expect(submit).toContain('handover_date: toHandoverDatePayload(values.handover_date)')
  })

  it('adds both bank accounts to the payload from form state (no JSX payload), without any required rule', () => {
    const validate = source.slice(source.indexOf('const validate = () =>'), source.indexOf('const goBack'))

    expect(submit).toContain('operating_bank_account: values.operating_bank_account,')
    expect(submit).toContain('deposit_bank_account: values.deposit_bank_account')
    expect(source).toContain('operating_bank_account: EMPTY_PROJECT_BANK_ACCOUNT,')
    expect(source).toContain('deposit_bank_account: EMPTY_PROJECT_BANK_ACCOUNT')
    expect(validate).not.toMatch(/bank/)
  })

  it('starts with an empty handover date (no automatic today)', () => {
    expect(source).toContain("handover_date: ''")
    expect(source).not.toMatch(/new Date\(/)
  })

  it('keeps the existing success behavior: success alert then navigate to the created project or the list', () => {
    expect(submit).toContain("SwalAlert('success'")
    expect(submit).toContain('created?.id ? `/${locale}${basePath}/${created.id}` : `/${locale}${basePath}`')
  })

  it('keeps the backend error visible on the page', () => {
    expect(submit).toContain('setSubmitError(message)')
    expect(submit).toContain("SwalAlert('error', message")
  })

  it('creates through create_project_with_logo with the selected file, never a typed URL', () => {
    expect(submit).toContain('create_project_with_logo(')
    expect(submit).toContain('logo_file: logo.file')
    expect(source).not.toContain('image_url')
  })

  it('labels logo upload failures distinctly from workflow errors', () => {
    expect(submit).toContain('error instanceof ProjectLogoUploadError')
    expect(submit).toContain('projectLogoUploadErrorMessage(dictionary, error)')
  })
})
