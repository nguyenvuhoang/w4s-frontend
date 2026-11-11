/** Notification template group used by the fee notices (fixed for this module). */
export const FEE_TEMPLATE_GROUP = 'FEE'
/** `ALL` is a search-only CodeList value and must never be persisted as a template channel. */
export const NOTIFICATION_TEMPLATE_ALL_CHANNEL = 'ALL'

export type FeeTemplateLanguage = 'vi' | 'en'

export const FEE_TEMPLATE_LANGUAGES: FeeTemplateLanguage[] = ['vi', 'en']

/**
 * Soft length guides shown as counters (not enforced: the backend contract defines no limit yet).
 * App push title/body follow common mobile notification display limits; SMS shows segments of 160.
 */
export const FEE_TEMPLATE_LENGTH_GUIDE = {
  PUSH_NOTI_SUBJECT: 65,
  PUSH_NOTI_BODY: 240,
  SMS_SEGMENT: 160
} as const

/**
 * Dynamic data variables documented by the backend for fee notices. The token syntax is the
 * documented `{ApartmentCode}` form; it is kept in one place (FEE_TEMPLATE_TOKEN) because the
 * renderer convention could not be confirmed from this frontend repository.
 * Existing content is never rewritten: tokens already present in a template are kept as typed.
 * Preview fixtures live separately, never in the workflow save request.
 */
export const FEE_TEMPLATE_VARIABLES = [
  { key: 'ApartmentCode' },
  { key: 'CustomerName' },
  { key: 'PeriodName' },
  { key: 'TableBody' },
  { key: 'TotalAmount' },
  { key: 'BalanceAmount' },
  { key: 'FinalPayAmount' },
  { key: 'PaymentQr' }
] as const

export const FEE_TEMPLATE_TOKEN = (key: string) => `{${key}}`

export const escapeFeeTemplateHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

/** Variables (documented ones) found in the given texts, in documented order. */
export const findUsedFeeTemplateVariables = (...texts: string[]) => {
  const joined = texts.join('\n')

  return FEE_TEMPLATE_VARIABLES.filter(variable => joined.includes(FEE_TEMPLATE_TOKEN(variable.key))).map(variable => variable.key)
}

/** `{"vi":"…","en":"…"}` JSON string ⇄ object, tolerant to empty / invalid values. */
export const parseFeeTemplateTranslations = (value: unknown): Record<FeeTemplateLanguage, string> => {
  const empty = { vi: '', en: '' }

  if (!value) return empty

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value

    return {
      vi: typeof parsed?.vi === 'string' ? parsed.vi : '',
      en: typeof parsed?.en === 'string' ? parsed.en : ''
    }
  } catch {
    return empty
  }
}

export const stringifyFeeTemplateTranslations = (value: Record<FeeTemplateLanguage, string>) => JSON.stringify({ vi: value.vi, en: value.en })

/** `/{locale}/system-settings/fee-management/fee-templates{suffix}` */
export const feeTemplatesHref = (locale: string, suffix = '') => `/${locale}/system-settings/fee-management/fee-templates${suffix}`
