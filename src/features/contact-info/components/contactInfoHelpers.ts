import type { ChipProps } from '@mui/material/Chip'

import type { ContactInfoDictionary, ContactInfoFilterModel, ContactInfoStatus, CreateContactInfoFormValues } from '../types'

export const emptyContactInfoFilter: ContactInfoFilterModel = {
  search_text: '',
  project_id: null,
  page_index: 0,
  page_size: 10
}

export const contactInfoText = (dictionary: ContactInfoDictionary, key: string, fallback: string) => (
  dictionary.contactInfo?.[key] ?? fallback
)

export const commonText = (dictionary: ContactInfoDictionary, key: string, fallback: string) => (
  dictionary.common?.[key] ?? fallback
)

export const emptyCreateContactInfoForm: CreateContactInfoFormValues = {
  contact_type: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  working_hours: '',
  note: '',
  display_order: '',
  status: 'A'
}

export const displayText = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-'

  return String(value)
}

export const getContactTypeLabel = (dictionary: ContactInfoDictionary, type: string) => {
  if (type === 'BQL') return contactInfoText(dictionary, 'contact_type_bql', 'Management Board')
  if (type === 'SECURITY') return contactInfoText(dictionary, 'contact_type_security', 'Security')
  if (type === 'EMERGENCY') return contactInfoText(dictionary, 'contact_type_emergency', 'Emergency')
  if (type === 'MANAGEMENT') return contactInfoText(dictionary, 'contact_type_management', 'Management')

  return displayText(type)
}

export const contactTypeOptions = ['BQL', 'SECURITY', 'EMERGENCY', 'MANAGEMENT'] as const

export const getContactStatusColor = (status: ContactInfoStatus): ChipProps['color'] => {
  if (status === 'A') return 'success'
  if (status === 'I') return 'default'
  if (status === 'B') return 'error'
  if (status === 'DRAFT') return 'warning'

  return 'info'
}

export const getContactStatusLabel = (dictionary: ContactInfoDictionary, status: ContactInfoStatus) => {
  if (status === 'A') return contactInfoText(dictionary, 'status_active', 'Active')
  if (status === 'I') return contactInfoText(dictionary, 'status_inactive', 'Inactive')
  if (status === 'B') return contactInfoText(dictionary, 'status_blocked', 'Blocked')
  if (status === 'DRAFT') return contactInfoText(dictionary, 'status_draft', 'Draft')

  return displayText(status)
}
