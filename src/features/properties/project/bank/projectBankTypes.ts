/**
 * Project bank accounts (`operating_bank_account` / `deposit_bank_account`) — NOT the payment gateway
 * (PaymentConfig, WF_BO_*_PROJECT_PAYMENT_CONFIG*), which is a separate business.
 * - WF_BO_CREATE_PROJECT: { bank_name, account_number, account_holder, transfer_content }.
 * - WF_BO_UPDATE_PROJECT: { id, bank_name, account_number, account_holder, branch, qr_code_url, transfer_content },
 *   `id` = the bank account ID (the outer `fields.id` is the Project ID).
 * - WF_BO_GET_PROJECT_DETAIL: the real sample does not return these objects yet; they are mapped only when the
 *   response carries them (null = not returned). `id` / `branch` / `qr_code_url` are kept only when returned.
 */

/** Backend object names of the two receiving accounts of a project. */
export type ProjectBankAccountGroup = 'operating_bank_account' | 'deposit_bank_account'

/** The 4 text fields of every account (Create contract), always strings in the model. */
export type ProjectBankAccountBaseField = 'bank_name' | 'account_number' | 'account_holder' | 'transfer_content'

/** One receiving account, Backend field names. `account_number` is always a string (leading zeros kept). */
export type ProjectBankAccount = {
  /** Bank account ID from GET; absent when not returned (never inferred). */
  id?: number | null
  bank_name: string
  account_number: string
  account_holder: string
  /** UPDATE contract only; absent = not returned by GET, null = returned as null. */
  branch?: string | null
  qr_code_url?: string | null
  transfer_content: string
  /** Text fields GET returned as null (shown as ''); an untouched one is sent back as null, never as ''. */
  null_fields?: ProjectBankAccountBaseField[]
}

export type ProjectBankAccounts = Record<ProjectBankAccountGroup, ProjectBankAccount | null>

export const EMPTY_PROJECT_BANK_ACCOUNT: ProjectBankAccount = {
  bank_name: '',
  account_number: '',
  account_holder: '',
  transfer_content: ''
}

/** Display order and texts of the groups (dictionary key + English fallback). */
export const PROJECT_BANK_ACCOUNT_GROUPS: { group: ProjectBankAccountGroup; titleKey: string; titleFallback: string }[] = [
  { group: 'operating_bank_account', titleKey: 'bankOperatingAccount', titleFallback: 'Operating account' },
  { group: 'deposit_bank_account', titleKey: 'bankDepositAccount', titleFallback: 'Deposit account' }
]

/** Fields of an account card, in display order. */
export const PROJECT_BANK_ACCOUNT_FIELDS: { field: ProjectBankAccountBaseField; labelKey: string; labelFallback: string }[] = [
  { field: 'bank_name', labelKey: 'bankName', labelFallback: 'Bank name' },
  { field: 'account_number', labelKey: 'bankAccountNumber', labelFallback: 'Account number' },
  { field: 'account_holder', labelKey: 'bankAccountHolder', labelFallback: 'Account holder' },
  { field: 'transfer_content', labelKey: 'bankTransferContent', labelFallback: 'Transfer content' }
]

/** True when at least one field of the account has a value (an all-empty object counts as no account). */
export const hasProjectBankAccountValue = (account: ProjectBankAccount | null | undefined) =>
  Boolean(account && PROJECT_BANK_ACCOUNT_FIELDS.some(({ field }) => account[field].trim()))

/**
 * Create payload of one account: explicit Backend fields, trimmed, `account_number` kept as a string (never
 * converted to a number). An account left empty is sent with empty strings (no null / omitted object).
 */
export const toProjectBankAccountPayload = (account: ProjectBankAccount): ProjectBankAccount => ({
  bank_name: account.bank_name.trim(),
  account_number: account.account_number.trim(),
  account_holder: account.account_holder.trim(),
  transfer_content: account.transfer_content.trim()
})

const toText = (value: unknown) => (value === null || value === undefined ? '' : String(value))

const toNullableText = (value: unknown) => (value === null || value === undefined ? null : String(value))

/** Account record id: a positive integer (number or digit string) or null. Only for `id`, never account_number. */
const toPositiveId = (value: unknown) => {
  const digits = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : ''

  if (!/^[1-9]\d*$/.test(digits)) return null

  const parsed = +digits

  return Number.isSafeInteger(parsed) ? parsed : null
}

/**
 * Maps a Backend account object; anything that is not an object (missing / null) = no account. `id`, `branch`
 * and `qr_code_url` are set only when the object carries the key (null kept as null, never turned into '').
 */
export const mapProjectBankAccount = (raw: unknown): ProjectBankAccount | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null

  const item = raw as Record<string, unknown>
  const null_fields = (['bank_name', 'account_number', 'account_holder', 'transfer_content'] as const).filter(field => item[field] === null)

  return {
    ...('id' in item ? { id: toPositiveId(item.id) } : {}),
    bank_name: toText(item.bank_name),
    account_number: toText(item.account_number),
    account_holder: toText(item.account_holder),
    ...('branch' in item ? { branch: toNullableText(item.branch) } : {}),
    ...('qr_code_url' in item ? { qr_code_url: toNullableText(item.qr_code_url) } : {}),
    transfer_content: toText(item.transfer_content),
    ...(null_fields.length > 0 ? { null_fields: [...null_fields] } : {})
  }
}

/* ------------------------------------------------------------------------------------------------------------
 * Edit Project (WF_BO_UPDATE_PROJECT)
 * ---------------------------------------------------------------------------------------------------------- */

export type ProjectBankAccountUpdateField = 'bank_name' | 'account_number' | 'account_holder' | 'branch' | 'qr_code_url' | 'transfer_content'

/** Fields of an account card on the Edit page (UPDATE contract), in display order. */
export const PROJECT_BANK_ACCOUNT_UPDATE_FIELDS: { field: ProjectBankAccountUpdateField; labelKey: string; labelFallback: string; required?: boolean }[] = [
  { field: 'bank_name', labelKey: 'bankName', labelFallback: 'Bank name', required: true },
  { field: 'account_number', labelKey: 'bankAccountNumber', labelFallback: 'Account number', required: true },
  { field: 'account_holder', labelKey: 'bankAccountHolder', labelFallback: 'Account holder', required: true },
  { field: 'branch', labelKey: 'bankBranch', labelFallback: 'Branch' },
  { field: 'qr_code_url', labelKey: 'bankQrCodeUrl', labelFallback: 'QR code URL' },
  { field: 'transfer_content', labelKey: 'bankTransferContent', labelFallback: 'Transfer content' }
]

export type ProjectBankAccountFormState = Record<ProjectBankAccountUpdateField, string>

/**
 * Exact object of WF_BO_UPDATE_PROJECT (the workflow creates or updates both accounts):
 * - existing account: its own `id` (from GET);
 * - new account (GET returned null, user filled it): no `id` key at all — same shape as the WF_BO_CREATE_PROJECT
 *   account objects; never `id: null`, never the Project ID, never a guessed id.
 * A field GET did not return and the user did not fill is omitted.
 */
export type ProjectBankAccountUpdatePayload = {
  id?: number
  bank_name: string | null
  account_number: string | null
  account_holder: string | null
  branch?: string | null
  qr_code_url?: string | null
  transfer_content: string | null
}

export type ProjectBankAccountUpdatePayloads = Partial<Record<ProjectBankAccountGroup, ProjectBankAccountUpdatePayload>>

/**
 * An account can be updated only when GET returned it with its own ID. A missing account (null) or one without
 * an ID is never sent: creating an account through WF_BO_UPDATE_PROJECT (no id / id null) is not confirmed.
 */
export const isProjectBankAccountUpdatable = (account: ProjectBankAccount | null | undefined): account is ProjectBankAccount & { id: number } =>
  Boolean(account && typeof account.id === 'number' && account.id > 0)

/** Form values (null / not returned -> empty input); the original account keeps its nulls. */
export const buildProjectBankAccountForm = (account: ProjectBankAccount | null | undefined): ProjectBankAccountFormState => ({
  bank_name: account?.bank_name ?? '',
  account_number: account?.account_number ?? '',
  account_holder: account?.account_holder ?? '',
  branch: account?.branch ?? '',
  qr_code_url: account?.qr_code_url ?? '',
  transfer_content: account?.transfer_content ?? ''
})

const isBankFieldChanged = (account: ProjectBankAccount, values: ProjectBankAccountFormState, field: ProjectBankAccountUpdateField) =>
  values[field].trim() !== (account[field] ?? '').trim()

export const getChangedProjectBankAccountFields = (account: ProjectBankAccount, values: ProjectBankAccountFormState) =>
  PROJECT_BANK_ACCOUNT_UPDATE_FIELDS.map(({ field }) => field).filter(field => isBankFieldChanged(account, values, field))

/** At least one input of the account card is filled (trimmed). */
export const hasProjectBankAccountFormValue = (values: ProjectBankAccountFormState) =>
  PROJECT_BANK_ACCOUNT_UPDATE_FIELDS.some(({ field }) => values[field].trim() !== '')

/** The account does not exist yet (GET returned null / nothing): its card starts empty and editable. */
export const isProjectBankAccountMissing = (account: ProjectBankAccount | null | undefined) => !account

/**
 * Changed account: an existing one (with id) whose inputs differ from GET, or a missing one the user started to
 * fill. A missing account left empty is not dirty (no empty object is ever built for it).
 */
export const isProjectBankAccountDirty = (account: ProjectBankAccount | null | undefined, values: ProjectBankAccountFormState) => {
  if (isProjectBankAccountMissing(account)) return hasProjectBankAccountFormValue(values)

  return isProjectBankAccountUpdatable(account) && getChangedProjectBankAccountFields(account, values).length > 0
}

/** Object of a NEW account built from the form (trimmed, no id: Backend creates the account and its id). */
export const buildNewProjectBankAccountPayload = (values: ProjectBankAccountFormState): ProjectBankAccountUpdatePayload => ({
  bank_name: values.bank_name.trim(),
  account_number: values.account_number.trim(),
  account_holder: values.account_holder.trim(),
  branch: values.branch.trim(),
  qr_code_url: values.qr_code_url.trim(),
  transfer_content: values.transfer_content.trim()
})

/**
 * After WF_BO_UPDATE_PROJECT, the account re-read from WF_BO_GET_PROJECT_DETAIL holds what was sent: same id
 * (when one was sent) and the same trimmed values for every sent field.
 */
export const isProjectBankAccountPersisted = (sent: ProjectBankAccountUpdatePayload, fresh: ProjectBankAccount | null | undefined) => {
  if (!fresh) return false
  if (sent.id !== undefined && fresh.id !== sent.id) return false

  return PROJECT_BANK_ACCOUNT_UPDATE_FIELDS.every(({ field }) => {
    if (!(field in sent)) return true

    return (sent[field] ?? '').trim() === (fresh[field] ?? '').trim()
  })
}

export type ProjectBankAccountValidationMessages = { required: string; invalidUrl: string }

/**
 * Validates an updatable account: bank name / account number / account holder cannot be cleared, and a filled
 * QR code URL must be http(s). No length / format rule is added to account_number (kept as typed, a string).
 */
export const validateProjectBankAccountForm = (values: ProjectBankAccountFormState, messages: ProjectBankAccountValidationMessages) => {
  const errors: Partial<Record<ProjectBankAccountUpdateField, string>> = {}

  for (const { field, required } of PROJECT_BANK_ACCOUNT_UPDATE_FIELDS) {
    if (required && !values[field].trim()) errors[field] = messages.required
  }

  const qr = values.qr_code_url.trim()

  if (qr) {
    try {
      const url = new URL(qr)

      if (url.protocol !== 'http:' && url.protocol !== 'https:') errors.qr_code_url = messages.invalidUrl
    } catch {
      errors.qr_code_url = messages.invalidUrl
    }
  }

  return errors
}

/**
 * UPDATE object of one account: its own `id`, an untouched field keeps its original value exactly (null stays
 * null; a field GET did not return stays omitted), an edited field is trimmed (placeholders such as "[CanHo]"
 * are kept as typed). `account_number` stays a string.
 */
export const buildProjectBankAccountUpdatePayload = (
  account: ProjectBankAccount & { id: number },
  values: ProjectBankAccountFormState
): ProjectBankAccountUpdatePayload => {
  const pick = (field: ProjectBankAccountUpdateField): string | null | undefined => {
    if (isBankFieldChanged(account, values, field)) return values[field].trim()

    return (account.null_fields as string[] | undefined)?.includes(field) ? null : account[field]
  }

  const optional = (field: 'branch' | 'qr_code_url') => {
    const value = pick(field)

    return value === undefined ? {} : { [field]: value }
  }

  return {
    id: account.id,
    bank_name: pick('bank_name') ?? null,
    account_number: pick('account_number') ?? null,
    account_holder: pick('account_holder') ?? null,
    ...optional('branch'),
    ...optional('qr_code_url'),
    transfer_content: pick('transfer_content') ?? null
  }
}
