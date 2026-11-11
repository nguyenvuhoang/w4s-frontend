import { FormControl, FormHelperText, Grid } from '@mui/material'
import type { ChangeEvent } from 'react'

import SelectFormField from '@/@core/components/form-field/SelectFormField'
import TextFieldForm from '@/@core/components/form-field/TextFieldForm'

import { getPartnerStatusLabel, partnerText } from '../partnerHelpers'
import type { PartnerDictionary } from '../types'

type PartnerFieldKey = 'partner_code' | 'partner_name' | 'contact_name' | 'phone' | 'email' | 'address' | 'status'
type PartnerFieldValues = Partial<Record<PartnerFieldKey, string>>

const createFieldAdapter = <T extends string>(value: T, onChange: (value: T) => void) => ({
  value,
  onChange: (eventOrValue: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | T) => onChange(typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value as T),
  onBlur: () => undefined,
  name: ''
})

type Props<T extends PartnerFieldValues> = {
  dictionary: PartnerDictionary
  values: T
  errors: Partial<Record<keyof T, string>>
  updateValue: <K extends keyof T>(key: K, value: T[K]) => void
  /** create shows partner_code and hides status (not part of WF_BO_CREATE_PARTNER). */
  mode?: 'create' | 'edit'
  disabled?: boolean
}

const PartnerEditForm = <T extends PartnerFieldValues>({ dictionary, values, errors, updateValue, mode = 'edit', disabled = false }: Props<T>) => {
  const isCreate = mode === 'create'
  const field = (key: PartnerFieldKey) => createFieldAdapter(String(values[key] ?? ''), (value: string) => updateValue(key as keyof T, value as T[keyof T]))
  const errorOf = (key: PartnerFieldKey) => errors[key as keyof T]
  const textField = (key: PartnerFieldKey, labelKey: string, fallback: string, props: { required?: boolean; multiline?: boolean; minRows?: number } = {}) => (
    <FormControl fullWidth error={Boolean(errorOf(key))}>
      <TextFieldForm field={field(key)} label={partnerText(dictionary, labelKey, fallback)} error={Boolean(errorOf(key))} disabled={disabled} {...props} />
      {errorOf(key) && <FormHelperText>{errorOf(key)}</FormHelperText>}
    </FormControl>
  )

  return (
    <Grid container spacing={2.5}>
      {isCreate && <Grid size={{ xs: 12, md: 6 }}>{textField('partner_code', 'field_partner_code', 'Partner Code', { required: true })}</Grid>}
      <Grid size={{ xs: 12, md: 6 }}>{textField('partner_name', 'field_partner_name', 'Partner Name', { required: true })}</Grid>
      <Grid size={{ xs: 12, md: 6 }}>{textField('contact_name', 'field_contact_name', 'Contact Person')}</Grid>
      <Grid size={{ xs: 12, md: 6 }}>{textField('phone', 'field_phone', 'Phone')}</Grid>
      <Grid size={{ xs: 12, md: isCreate ? 12 : 6 }}>{textField('email', 'field_email', 'Email')}</Grid>
      {!isCreate && <Grid size={{ xs: 12, md: 6 }}><SelectFormField field={field('status')} required disabled={disabled} label={partnerText(dictionary, 'field_status', 'Status')} options={['ACTIVE', 'INACTIVE'].map(status => ({ value: status, label: getPartnerStatusLabel(dictionary, status) }))} /></Grid>}
      <Grid size={{ xs: 12 }}>{textField('address', 'field_address', 'Address', { multiline: true, minRows: 3 })}</Grid>
    </Grid>
  )
}

export default PartnerEditForm
