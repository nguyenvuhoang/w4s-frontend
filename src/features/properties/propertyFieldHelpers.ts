// Shared display / input rules of the Properties fields added to the Tower, Floor and Apartment contracts
// (description, resident_count, room_count, apartment_status).

/** Count for display: "--" when not returned, a real 0 stays "0", otherwise grouped (1.234). */
export const formatPropertyCount = (value: number | null | undefined, locale: string) => (
  value === null || value === undefined ? '--' : new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(value)
)

/** Free text for display: "--" when null / empty. */
export const formatPropertyText = (value: string | null | undefined) => value?.trim() || '--'

/** Resident count input: empty, or a whole number >= 0 (no sign, no decimals). */
export const isValidResidentCountInput = (value: string) => value.trim() === '' || /^\d+$/.test(value.trim())

/** Form value -> contract number; an empty input is sent as null (never a made-up 0). */
export const toResidentCountPayload = (value: string) => (value.trim() === '' ? null : Number.parseInt(value.trim(), 10))

/** Contract value -> form input ("" when not returned). */
export const toResidentCountInput = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value))

/** Optional text returned by a workflow: null when absent, otherwise the string (kept as-is). */
export const toOptionalText = (value: unknown) => (value === null || value === undefined ? null : String(value))
