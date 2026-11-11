/**
 * Project payment configuration — contract of
 * - WF_BO_LIST_PROJECT_PAYMENT_CONFIGS      (fields: { project_id }) -> data.payment_configs[]   ← used by the Edit page
 * - WF_BO_GET_PROJECT_PAYMENT_CONFIG_BY_ID  (fields: { id } = PaymentConfig ID, NOT the Project ID)
 * - WF_BO_UPDATE_PROJECT_PAYMENT_CONFIG     (fields: id + the 11 editable fields below)
 *
 * LIST rows (real sample): { project_id, project_code, config_code, payment_purpose, provider, merchant_id,
 * terminal_id, account_no, account_name, qr_template, callback_url, is_default, created_by, updated_by }.
 * They carry NO record `id` (nor status / metadata_json). The PaymentConfig ID is never derived from the
 * Project ID, the array index or `config_code`: without it UPDATE stays disabled (see
 * `PAYMENT_CONFIG_UPDATE_ID_CONFIRMED`).
 */

/**
 * NOT CONFIRMED by Backend: which ID `fields.id` of WF_BO_UPDATE_PROJECT_PAYMENT_CONFIG expects (PaymentConfig ID
 * or Project ID), and there is no update-by-config_code contract. Until it is confirmed (and LIST returns the
 * record id) every configuration is read-only and UPDATE is never called.
 */
export const PAYMENT_CONFIG_UPDATE_ID_CONFIRMED = false

/** Payment configuration (LIST row or GET data). Nullable fields stay null (never turned into ''). */
export type ProjectPaymentConfig = {
  /** PaymentConfig record ID; null when the source (LIST) does not return it. Never inferred. */
  id: number | null
  project_id: number
  /** Read-only: returned by GET, not part of the UPDATE contract (never created, changed or sent). */
  config_code: string | null
  payment_purpose: string | null
  provider: string | null
  merchant_id: string | null
  terminal_id: string | null
  account_no: string | null
  account_name: string | null
  qr_template: string | null
  callback_url: string | null
  /** JSON text or null as stored by Backend (not parsed, never defaulted to "{}"). */
  metadata_json: string | null
  is_default: boolean
  /** Backend status code (A / I ...), kept as returned. */
  status: string | null
}

/** Exact field set of WF_BO_UPDATE_PROJECT_PAYMENT_CONFIG (no project_id, no config_code). */
export type ProjectPaymentConfigUpdatePayload = {
  id: number
  qr_template: string | null
  merchant_id: string | null
  is_default: boolean
  account_no: string | null
  status: string | null
  account_name: string | null
  callback_url: string | null
  terminal_id: string | null
  payment_purpose: string | null
  provider: string | null
  metadata_json: string | null
}

export const PROJECT_PAYMENT_CONFIG_UPDATE_FIELDS = [
  'id',
  'qr_template',
  'merchant_id',
  'is_default',
  'account_no',
  'status',
  'account_name',
  'callback_url',
  'terminal_id',
  'payment_purpose',
  'provider',
  'metadata_json'
] as const

/** Text fields edited by the form (everything editable except is_default). */
export const PROJECT_PAYMENT_CONFIG_TEXT_FIELDS = [
  'provider',
  'payment_purpose',
  'merchant_id',
  'terminal_id',
  'account_no',
  'account_name',
  'callback_url',
  'status',
  'qr_template',
  'metadata_json'
] as const

export type ProjectPaymentConfigTextField = (typeof PROJECT_PAYMENT_CONFIG_TEXT_FIELDS)[number]

/** Form state: text inputs hold '' for a null value; the original config keeps the null. */
export type ProjectPaymentConfigFormState = Record<ProjectPaymentConfigTextField, string> & { is_default: boolean }

export type ProjectPaymentConfigErrorKey = keyof ProjectPaymentConfigFormState

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

const toNullableText = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  return null
}

const toPositiveInteger = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const toBooleanFlag = (value: unknown) => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'T' || value === 'Y'
)

/**
 * Maps the GET `data` object. Anything without a numeric `id` and `project_id` (null data, an envelope, an
 * array) is "no configuration" (null) — never a placeholder config.
 */
export const mapProjectPaymentConfig = (raw: unknown): ProjectPaymentConfig | null => {
  if (!isRecord(raw)) return null

  const id = toPositiveInteger(raw.id)
  const project_id = toPositiveInteger(raw.project_id)

  if (id === null || project_id === null) return null

  // metadata_json is a string (or null) in the contract; an object is kept as its JSON text, not reshaped.
  const metadata = raw.metadata_json
  const metadata_json = isRecord(metadata) || Array.isArray(metadata) ? JSON.stringify(metadata) : toNullableText(metadata)

  return {
    id,
    project_id,
    config_code: toNullableText(raw.config_code),
    payment_purpose: toNullableText(raw.payment_purpose),
    provider: toNullableText(raw.provider),
    merchant_id: toNullableText(raw.merchant_id),
    terminal_id: toNullableText(raw.terminal_id),
    account_no: toNullableText(raw.account_no),
    account_name: toNullableText(raw.account_name),
    qr_template: toNullableText(raw.qr_template),
    callback_url: toNullableText(raw.callback_url),
    metadata_json,
    is_default: toBooleanFlag(raw.is_default),
    status: toNullableText(raw.status)
  }
}

/**
 * Maps one row of WF_BO_LIST_PROJECT_PAYMENT_CONFIGS `data.payment_configs`. A row needs a numeric `project_id`
 * (ownership check) and a `config_code` (list key); `id` is read only when Backend sends it, otherwise null.
 * Fields LIST does not return (status, metadata_json) are null.
 */
export const mapProjectPaymentConfigListItem = (raw: unknown): ProjectPaymentConfig | null => {
  if (!isRecord(raw)) return null

  const project_id = toPositiveInteger(raw.project_id)
  const config_code = toNullableText(raw.config_code)?.trim() ?? ''

  if (project_id === null || !config_code) return null

  const metadata = raw.metadata_json
  const metadata_json = isRecord(metadata) || Array.isArray(metadata) ? JSON.stringify(metadata) : toNullableText(metadata)

  return {
    id: toPositiveInteger(raw.id),
    project_id,
    config_code,
    payment_purpose: toNullableText(raw.payment_purpose),
    provider: toNullableText(raw.provider),
    merchant_id: toNullableText(raw.merchant_id),
    terminal_id: toNullableText(raw.terminal_id),
    account_no: toNullableText(raw.account_no),
    account_name: toNullableText(raw.account_name),
    qr_template: toNullableText(raw.qr_template),
    callback_url: toNullableText(raw.callback_url),
    metadata_json,
    is_default: toBooleanFlag(raw.is_default),
    status: toNullableText(raw.status)
  }
}

/** Maps LIST `data` (`{ payment_configs: [...] }`); a missing / non-array list is "no configuration". */
export const mapProjectPaymentConfigList = (root: unknown): ProjectPaymentConfig[] => {
  const items = isRecord(root) ? root.payment_configs : undefined

  if (!Array.isArray(items)) return []

  return items.map(mapProjectPaymentConfigListItem).filter((item): item is ProjectPaymentConfig => item !== null)
}

export const buildProjectPaymentConfigForm =(config: ProjectPaymentConfig): ProjectPaymentConfigFormState => ({
  provider: config.provider ?? '',
  payment_purpose: config.payment_purpose ?? '',
  merchant_id: config.merchant_id ?? '',
  terminal_id: config.terminal_id ?? '',
  account_no: config.account_no ?? '',
  account_name: config.account_name ?? '',
  callback_url: config.callback_url ?? '',
  status: config.status ?? '',
  qr_template: config.qr_template ?? '',
  metadata_json: config.metadata_json ?? '',
  is_default: config.is_default
})

/** A text field is changed when its trimmed value differs from the original (null counts as ''). */
const isTextFieldChanged = (config: ProjectPaymentConfig, values: ProjectPaymentConfigFormState, field: ProjectPaymentConfigTextField) =>
  values[field].trim() !== (config[field] ?? '').trim()

export const getChangedProjectPaymentConfigFields = (config: ProjectPaymentConfig, values: ProjectPaymentConfigFormState) => {
  const changed: ProjectPaymentConfigErrorKey[] = PROJECT_PAYMENT_CONFIG_TEXT_FIELDS.filter(field => isTextFieldChanged(config, values, field))

  if (values.is_default !== config.is_default) changed.push('is_default')

  return changed
}

export const isProjectPaymentConfigDirty = (config: ProjectPaymentConfig, values: ProjectPaymentConfigFormState) =>
  getChangedProjectPaymentConfigFields(config, values).length > 0

/**
 * UPDATE payload: every contract field is sent so nothing is overwritten by omission. An untouched field
 * keeps its original value exactly (null stays null, metadata_json is never defaulted to "{}"); an edited
 * field is trimmed, and a field the user cleared is sent as null.
 */
export const buildProjectPaymentConfigUpdatePayload = (
  config: ProjectPaymentConfig,
  values: ProjectPaymentConfigFormState
): ProjectPaymentConfigUpdatePayload => {
  // Never send a guessed id (Project ID / index / config_code): without the record id there is no UPDATE.
  if (config.id === null) throw new Error('PaymentConfig ID is unknown: the configuration cannot be updated.')

  const pick =(field: ProjectPaymentConfigTextField): string | null => {
    if (!isTextFieldChanged(config, values, field)) return config[field]

    const next = values[field].trim()

    return next ? next : null
  }

  return {
    id: config.id,
    qr_template: pick('qr_template'),
    merchant_id: pick('merchant_id'),
    is_default: values.is_default,
    account_no: pick('account_no'),
    status: pick('status'),
    account_name: pick('account_name'),
    callback_url: pick('callback_url'),
    terminal_id: pick('terminal_id'),
    payment_purpose: pick('payment_purpose'),
    provider: pick('provider'),
    metadata_json: pick('metadata_json')
  }
}

export type ProjectPaymentConfigValidationMessages = {
  required: string
  invalidJson: string
  invalidUrl: string
}

/** Validates only the fields the user changed (untouched backend values are never blocked). */
export const validateProjectPaymentConfigForm = (
  config: ProjectPaymentConfig,
  values: ProjectPaymentConfigFormState,
  messages: ProjectPaymentConfigValidationMessages
) => {
  const changed = new Set(getChangedProjectPaymentConfigFields(config, values))
  const errors: Partial<Record<ProjectPaymentConfigErrorKey, string>> = {}

  for (const field of ['provider', 'payment_purpose', 'status'] as const) {
    if (changed.has(field) && !values[field].trim()) errors[field] = messages.required
  }

  const metadata = values.metadata_json.trim()

  if (changed.has('metadata_json') && metadata) {
    try {
      JSON.parse(metadata)
    } catch {
      errors.metadata_json = messages.invalidJson
    }
  }

  const callbackUrl = values.callback_url.trim()

  if (changed.has('callback_url') && callbackUrl) {
    try {
      const url = new URL(callbackUrl)

      if (url.protocol !== 'http:' && url.protocol !== 'https:') errors.callback_url = messages.invalidUrl
    } catch {
      errors.callback_url = messages.invalidUrl
    }
  }

  return errors
}

/**
/** One configuration of the project on the Edit page. `key` identifies it in the list (UI only, never sent). */
export type ProjectPaymentConfigEntry = {
  key: string
  config: ProjectPaymentConfig
  /** UPDATE may be called: the record id is known AND the UPDATE id contract is confirmed (and the key is unique). */
  editable: boolean
}

/**
 * State of the payment configurations on the Edit page (WF_BO_LIST_PROJECT_PAYMENT_CONFIGS).
 * - ready:     configurations of this project (one or many). `foreignCount` rows of other projects were
 *              dropped; `duplicateCodes` = config_code values that are not unique in this project.
 * - empty:     LIST succeeded without any configuration (nothing is created here).
 * - mismatch:  LIST returned only configurations of other projects (shown nowhere, never updated).
 * - error:     LIST failed (message already carries the execution reference).
 */
export type ProjectPaymentConfigLoad =
  | { state: 'ready'; entries: ProjectPaymentConfigEntry[]; foreignCount: number; duplicateCodes: string[] }
  | { state: 'empty' }
  | { state: 'mismatch' }
  | { state: 'error'; message: string }

/**
 * Ownership guard: keeps only rows whose `project_id` is the route project (both normalized to a positive
 * integer, then compared strictly: "1" === 1, "1abc" / 1.5 never match). `config_code` is the list key; a
 * code that is not unique is kept visible but read-only (a later duplicate gets a "#n" UI-only key).
 */
export const resolveProjectPaymentConfigList = (projectId: number | string, configs: ProjectPaymentConfig[]): ProjectPaymentConfigLoad => {
  if (configs.length === 0) return { state: 'empty' }

  const ownerProjectId = toPositiveInteger(projectId)
  const owned = ownerProjectId === null ? [] : configs.filter(config => toPositiveInteger(config.project_id) === ownerProjectId)

  if (owned.length === 0) return { state: 'mismatch' }

  const occurrences = new Map<string, number>()

  for (const config of owned) {
    const code = config.config_code ?? ''

    occurrences.set(code, (occurrences.get(code) ?? 0) + 1)
  }

  const duplicateCodes = [...occurrences].filter(([, count]) => count > 1).map(([code]) => code)
  const seen = new Map<string, number>()

  const entries = owned.map(config => {
    const code = config.config_code ?? ''
    const index = (seen.get(code) ?? 0) + 1

    seen.set(code, index)

    return {
      key: index === 1 ? code : `${code}#${index}`,
      config,
      editable: PAYMENT_CONFIG_UPDATE_ID_CONFIRMED && config.id !== null && !duplicateCodes.includes(code)
    }
  })

  return { state: 'ready', entries, foreignCount: configs.length - owned.length, duplicateCodes }
}

/* ------------------------------------------------------------------------------------------------------------
 * CREATE — WF_BO_CREATE_PROJECT_PAYMENT_CONFIG. Independent of UPDATE: Backend creates the record (and its id),
 * so CREATE needs neither a PaymentConfig ID nor PAYMENT_CONFIG_UPDATE_ID_CONFIRMED.
 * ---------------------------------------------------------------------------------------------------------- */

/** Exact field set of WF_BO_CREATE_PROJECT_PAYMENT_CONFIG (no id, no status). */
export const PROJECT_PAYMENT_CONFIG_CREATE_FIELDS = [
  'qr_template',
  'project_id',
  'config_code',
  'merchant_id',
  'is_default',
  'account_no',
  'account_name',
  'callback_url',
  'terminal_id',
  'payment_purpose',
  'provider',
  'metadata_json'
] as const

export type ProjectPaymentConfigCreatePayload = {
  qr_template: string
  project_id: number
  config_code: string
  merchant_id: string
  is_default: boolean
  account_no: string
  account_name: string
  callback_url: string
  terminal_id: string
  payment_purpose: string
  provider: string
  metadata_json: string
}

/** Text inputs of the create form, in display order. */
export const PROJECT_PAYMENT_CONFIG_CREATE_TEXT_FIELDS = [
  'config_code',
  'payment_purpose',
  'provider',
  'merchant_id',
  'terminal_id',
  'account_no',
  'account_name',
  'callback_url',
  'qr_template',
  'metadata_json'
] as const

export type ProjectPaymentConfigCreateTextField = (typeof PROJECT_PAYMENT_CONFIG_CREATE_TEXT_FIELDS)[number]

export const PROJECT_PAYMENT_CONFIG_CREATE_REQUIRED_FIELDS = ['config_code', 'payment_purpose', 'provider'] as const

export type ProjectPaymentConfigCreateFormState = Record<ProjectPaymentConfigCreateTextField, string> & { is_default: boolean }

export type ProjectPaymentConfigCreateErrorKey = keyof ProjectPaymentConfigCreateFormState

export const emptyProjectPaymentConfigCreateForm = (): ProjectPaymentConfigCreateFormState => ({
  config_code: '',
  payment_purpose: '',
  provider: '',
  merchant_id: '',
  terminal_id: '',
  account_no: '',
  account_name: '',
  callback_url: '',
  qr_template: '',
  metadata_json: '',
  is_default: false
})

export type ProjectPaymentConfigCreateValidationMessages = ProjectPaymentConfigValidationMessages & { duplicateCode: string }

const normalizeConfigCode = (value: string | null | undefined) => (value ?? '').trim().toUpperCase()

/**
 * Validates the create form before any workflow call: required fields, a config_code not already listed for
 * this project (case-insensitive), valid metadata JSON and an http(s) callback URL when filled.
 */
export const validateProjectPaymentConfigCreateForm = (
  values: ProjectPaymentConfigCreateFormState,
  existingCodes: Array<string | null>,
  messages: ProjectPaymentConfigCreateValidationMessages
) => {
  const errors: Partial<Record<ProjectPaymentConfigCreateErrorKey, string>> = {}

  for (const field of PROJECT_PAYMENT_CONFIG_CREATE_REQUIRED_FIELDS) {
    if (!values[field].trim()) errors[field] = messages.required
  }

  const code = normalizeConfigCode(values.config_code)

  if (code && existingCodes.some(existing => normalizeConfigCode(existing) === code)) errors.config_code = messages.duplicateCode

  const metadata = values.metadata_json.trim()

  if (metadata) {
    try {
      JSON.parse(metadata)
    } catch {
      errors.metadata_json = messages.invalidJson
    }
  }

  const callbackUrl = values.callback_url.trim()

  if (callbackUrl) {
    try {
      const url = new URL(callbackUrl)

      if (url.protocol !== 'http:' && url.protocol !== 'https:') errors.callback_url = messages.invalidUrl
    } catch {
      errors.callback_url = messages.invalidUrl
    }
  }

  return errors
}

/**
 * CREATE payload with exactly the contract fields. `project_id` is the current project (never typed by the
 * user); text values are trimmed and an empty optional text is sent as "" as in the contract sample; an empty
 * metadata is sent as "{}" (valid empty JSON, as in the sample).
 */
export const buildProjectPaymentConfigCreatePayload = (
  projectId: number,
  values: ProjectPaymentConfigCreateFormState
): ProjectPaymentConfigCreatePayload => ({
  qr_template: values.qr_template.trim(),
  project_id: projectId,
  config_code: values.config_code.trim(),
  merchant_id: values.merchant_id.trim(),
  is_default: values.is_default,
  account_no: values.account_no.trim(),
  account_name: values.account_name.trim(),
  callback_url: values.callback_url.trim(),
  terminal_id: values.terminal_id.trim(),
  payment_purpose: values.payment_purpose.trim(),
  provider: values.provider.trim(),
  metadata_json: values.metadata_json.trim() || '{}'
})
