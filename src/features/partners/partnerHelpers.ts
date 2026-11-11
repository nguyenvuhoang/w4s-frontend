import type { ChipProps } from '@mui/material/Chip'

import type { PartnerCreateFormValues, PartnerDictionary, PartnerFilterModel, PartnerStatus } from './types'

type DictionarySection = Record<string, unknown>

export const emptyPartnerFilter: PartnerFilterModel = {
  page_size: 10,
  page_index: 1,
  search_text: ''
}

export const partnerText = (dictionary: PartnerDictionary, key: string, fallback: string) => {
  const section = (dictionary as unknown as Record<string, unknown>).partnerManagement

  return typeof section === 'object' && section !== null && typeof (section as DictionarySection)[key] === 'string'
    ? (section as DictionarySection)[key] as string
    : fallback
}

export const commonText = (dictionary: PartnerDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const displayPartnerText = (value: unknown) => (
  value === null || value === undefined || value === '' ? '-' : String(value)
)

const partnerStatusAliases: Record<string, 'ACTIVE' | 'INACTIVE'> = {
  A: 'ACTIVE',
  ACTIVE: 'ACTIVE',
  I: 'INACTIVE',
  INACTIVE: 'INACTIVE'
}

/** UI-only: maps backend codes (A/ACTIVE, I/INACTIVE; trimmed, case-insensitive) to one canonical value. Unknown codes are returned as-is. */
export const normalizePartnerStatus = (status: PartnerStatus | null | undefined): PartnerStatus => {
  const raw = String(status ?? '').trim()

  return partnerStatusAliases[raw.toUpperCase()] ?? raw
}

export const getPartnerStatusColor = (status: PartnerStatus): ChipProps['color'] => {
  const normalized = normalizePartnerStatus(status)

  return normalized === 'ACTIVE' ? 'success' : normalized === 'INACTIVE' ? 'default' : 'info'
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[0-9+\-\s().]{6,20}$/

type PartnerValidatedFields = Pick<PartnerCreateFormValues, 'partner_name' | 'phone' | 'email'> & { partner_code?: string }

/** Shared create/edit rules: name required, phone/email format-checked only when filled. */
export const validatePartnerValues = (
  dictionary: PartnerDictionary,
  values: PartnerValidatedFields,
  options: { requireCode?: boolean } = {}
) => {
  const errors: Partial<Record<keyof PartnerValidatedFields, string>> = {}

  if (options.requireCode && !values.partner_code?.trim()) errors.partner_code = partnerText(dictionary, 'validation_partner_code_required', 'Partner code is required.')
  if (!values.partner_name.trim()) errors.partner_name = partnerText(dictionary, 'validation_partner_name_required', 'Partner name is required.')
  if (values.phone.trim() && !phonePattern.test(values.phone.trim())) errors.phone = partnerText(dictionary, 'validation_phone_invalid', 'Phone number is invalid.')
  if (values.email.trim() && !emailPattern.test(values.email.trim())) errors.email = partnerText(dictionary, 'validation_email_invalid', 'Email is invalid.')

  return errors
}

export const getPartnerStatusLabel = (dictionary: PartnerDictionary, status: PartnerStatus) => {
  const normalized = normalizePartnerStatus(status)

  if (normalized === 'ACTIVE') return partnerText(dictionary, 'status_active', 'Active')
  if (normalized === 'INACTIVE') return partnerText(dictionary, 'status_inactive', 'Inactive')

  return displayPartnerText(normalized)
}
