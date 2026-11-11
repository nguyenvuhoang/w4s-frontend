/**
 * VietQR helpers for the project bank accounts (client-safe: no credentials here).
 * - Bank list: GET https://api.vietqr.io/v2/banks (public) — loaded server-side, see vietqr.server.ts.
 * - Preview: Quick Link image https://img.vietqr.io/image/{BIN}-{ACCOUNT_NO}-{TEMPLATE}.png?addInfo=&accountName=
 * - Stored QR: generated server-side (/api/projects/bank-qr: Generate API with server credentials when
 *   configured, else the Quick Link image) and uploaded to the IPS storage; only its IPS URL is saved.
 * WF_BO_UPDATE_PROJECT keeps `bank_name` (the bank short name) — the BIN / code are UI state only.
 */

export const VIETQR_BANKS_URL = 'https://api.vietqr.io/v2/banks'
export const VIETQR_QUICK_LINK_BASE = 'https://img.vietqr.io/image'
export const VIETQR_TEMPLATE = 'compact2'

export type VietQrBank = {
  id: number
  name: string
  code: string
  bin: string
  shortName: string
  logo: string
  transferSupported: boolean
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '')

/** Maps the `/v2/banks` response ({ code, desc, data: [...] }); invalid rows (no BIN / name) are dropped. */
export const mapVietQrBanks = (raw: unknown): VietQrBank[] => {
  const data = raw && typeof raw === 'object' ? (raw as { data?: unknown }).data : undefined

  if (!Array.isArray(data)) return []

  return data
    .map((item: any): VietQrBank => ({
      id: Number(item?.id) || 0,
      name: text(item?.name),
      code: text(item?.code),
      bin: text(item?.bin),
      shortName: text(item?.shortName ?? item?.short_name),
      logo: text(item?.logo),
      transferSupported: item?.transferSupported === 1 || item?.transferSupported === true
    }))
    .filter(bank => /^\d{6}$/.test(bank.bin) && Boolean(bank.shortName || bank.name))
}

/** Value stored in `bank_name` for a chosen bank (same convention as the existing data, e.g. "Vietcombank"). */
export const vietQrBankLabel = (bank: VietQrBank) => bank.shortName || bank.name

const normalize = (value: string) => value.trim().toLowerCase()

/** Bank of a stored `bank_name` (short name, full name or code, case-insensitive); null when unknown. */
export const findVietQrBank = (banks: VietQrBank[], bankName: string | null | undefined): VietQrBank | null => {
  const key = normalize(bankName ?? '')

  if (!key) return null

  return banks.find(bank => [bank.shortName, bank.name, bank.code].some(value => value && normalize(value) === key)) ?? null
}

/** Autocomplete search: short name, full name, code or BIN. */
export const matchesVietQrBank = (bank: VietQrBank, query: string) => {
  const key = normalize(query)

  return !key || [bank.shortName, bank.name, bank.code, bank.bin].some(value => normalize(value).includes(key))
}

/** IPS business placeholder in a transfer content, e.g. "[CanHo]" (replaced per apartment at payment time). */
export const hasTransferPlaceholder = (value: string | null | undefined) => /\[[^\]]+\]/.test(value ?? '')

/** Vietnamese text without diacritics (QR / NAPAS fields), whitespace collapsed. */
export const toQrText = (value: string) => value
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .replace(/\s+/g, ' ')
  .trim()

export type VietQrInput = {
  bin: string
  accountNo: string
  accountName: string
  /** Omitted when the content is empty or still contains a placeholder (static QR). */
  addInfo?: string
}

export type VietQrMissingField = 'bank' | 'account_number' | 'account_holder'

export type VietQrInputResult =
  | { ok: true; input: VietQrInput; placeholderSkipped: boolean }
  | { ok: false; missing: VietQrMissingField[] }

/**
 * Validated QR input of one account. Needs a bank with a known BIN, an account number (letters / digits, no
 * spaces) and an account holder. A transfer content with a placeholder ([CanHo]) is NOT put in the QR: the
 * project QR is then a static QR (no fixed content), never one carrying the raw placeholder.
 */
export const buildVietQrInput = (
  bank: VietQrBank | null,
  values: { account_number: string; account_holder: string; transfer_content: string }
): VietQrInputResult => {
  const accountNo = values.account_number.trim()
  const accountName = toQrText(values.account_holder).toUpperCase()
  const missing: VietQrMissingField[] = []

  if (!bank?.bin) missing.push('bank')
  if (!accountNo || !/^[0-9A-Za-z]+$/.test(accountNo)) missing.push('account_number')
  if (!accountName) missing.push('account_holder')
  if (missing.length > 0 || !bank) return { ok: false, missing }

  const content = values.transfer_content.trim()
  const placeholderSkipped = hasTransferPlaceholder(content)
  const addInfo = !placeholderSkipped && content ? toQrText(content) : ''

  return { ok: true, placeholderSkipped, input: { bin: bank.bin, accountNo, accountName, ...(addInfo ? { addInfo } : {}) } }
}

/** Quick Link image URL; every part is URL-encoded and only validated input is used. */
export const buildVietQrQuickLink = (input: VietQrInput, template: string = VIETQR_TEMPLATE) => {
  const params = new URLSearchParams()

  if (input.addInfo) params.set('addInfo', input.addInfo)
  params.set('accountName', input.accountName)

  return `${VIETQR_QUICK_LINK_BASE}/${encodeURIComponent(input.bin)}-${encodeURIComponent(input.accountNo)}-${encodeURIComponent(template)}.png?${params.toString()}`
}

/** Stable identity of the QR content: a QR is valid only while the account still has this signature. */
export const vietQrSignature = (input: VietQrInput) => JSON.stringify([input.bin, input.accountNo, input.accountName, input.addInfo ?? ''])

/** Signature of a stored Quick Link URL (to detect an outdated saved QR); null for any other URL. */
export const parseVietQrQuickLinkSignature = (url: string | null | undefined): string | null => {
  try {
    const parsed = new URL(url ?? '')

    if (`${parsed.origin}/image` !== VIETQR_QUICK_LINK_BASE || !parsed.pathname.startsWith('/image/')) return null

    const match = decodeURIComponent(parsed.pathname.slice('/image/'.length)).match(/^(\d{6})-([0-9A-Za-z]+)-[^.]+\.(png|jpg)$/)

    if (!match) return null

    const addInfo = parsed.searchParams.get('addInfo') ?? undefined

    return vietQrSignature({ bin: match[1], accountNo: match[2], accountName: parsed.searchParams.get('accountName') ?? '', ...(addInfo ? { addInfo } : {}) })
  } catch {
    return null
  }
}

/** QR identity of an account form (BIN when the bank is known, else the bank name), for change detection. */
export const accountQrIdentity = (
  banks: VietQrBank[],
  values: { bank_name: string; account_number: string; account_holder: string; transfer_content: string }
) => {
  const result = buildVietQrInput(findVietQrBank(banks, values.bank_name), values)

  if (result.ok) return vietQrSignature(result.input)

  const content = values.transfer_content.trim()

  return JSON.stringify([
    normalize(values.bank_name),
    values.account_number.trim(),
    toQrText(values.account_holder).toUpperCase(),
    hasTransferPlaceholder(content) ? '' : toQrText(content)
  ])
}
