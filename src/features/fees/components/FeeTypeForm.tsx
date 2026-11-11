'use client'

import {
  FormControl,
  FormHelperText,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import { useEffect, useState, type ChangeEvent } from 'react'

import AmountFieldForm from '@/@core/components/form-field/AmountFieldForm'
import SelectFormField from '@/@core/components/form-field/SelectFormField'
import TextFieldForm from '@/@core/components/form-field/TextFieldForm'

import {
  commonText,
  feeText,
  getFeeTypeStatusLabel
} from './feeTypeHelpers'
import type { CodeListOption } from '@/shared/utils/buildCodeListOptions'
import { i18n } from '@/configs/i18n'
import type {
  FeeDictionary,
  FeeTypeFormValues
} from '../types'

const createFieldAdapter = <T extends string | number>({
  value,
  onChange,
  name = ''
}: {
  value: T
  onChange: (nextValue: T) => void
  name?: string
}) => ({
  value,
  onChange: (eventOrValue: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | T) => {
    if (typeof eventOrValue === 'string' || typeof eventOrValue === 'number') {
      onChange(eventOrValue as T)

      return
    }

    onChange(eventOrValue.target.value as T)
  },
  onBlur: () => undefined,
  name
})

type Props = {
  dictionary: FeeDictionary
  locale: string
  mode: 'create' | 'edit'
  values: FeeTypeFormValues
  errors: Partial<Record<keyof FeeTypeFormValues, string>>
  calculationMethodOptions: CodeListOption[]
  calculationMethodLoading: boolean
  groupTypeOptions: CodeListOption[]
  groupTypeLoading: boolean
  statusOptions: string[]
  updateValue: <K extends keyof FeeTypeFormValues>(key: K, value: FeeTypeFormValues[K]) => void
}

const FeeTypeForm = ({
  dictionary,
  locale,
  mode,
  values,
  errors,
  calculationMethodOptions,
  calculationMethodLoading,
  groupTypeOptions,
  groupTypeLoading,
  statusOptions,
  updateValue
}: Props) => {
  const isEdit = mode === 'edit'
  const supportedTranslationLocales = i18n.locales.filter((item): item is 'vi' | 'en' => item === 'vi' || item === 'en')
  const [contentLocale, setContentLocale] = useState<'vi' | 'en'>(locale === 'en' ? 'en' : 'vi')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (errors.name) setContentLocale('vi')
  }, [errors.name])

  useEffect(() => {
    if (!errors.name || contentLocale !== 'vi') return

    document.querySelector<HTMLInputElement>('input[name="fee_type_name"]')?.focus()
  }, [contentLocale, errors.name])

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth error={Boolean(errors.fee_type_code)}>
          <TextFieldForm
            field={createFieldAdapter({
              value: values.fee_type_code,
              onChange: nextValue => updateValue('fee_type_code', nextValue)
            })}
            required
            label={feeText(dictionary, 'field_fee_type_code', 'Fee Type Code')}
            placeholder={feeText(dictionary, 'fee_type_code_placeholder', 'FEE_MGMT')}
            error={Boolean(errors.fee_type_code)}
          />
          <FormHelperText>{errors.fee_type_code}</FormHelperText>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth>
          <SelectFormField
            field={createFieldAdapter({ value: values.group_type, onChange: nextValue => updateValue('group_type', nextValue) })}
            disabled={groupTypeLoading}
            isLoading={groupTypeLoading}
            label={feeText(dictionary, 'field_group_type', 'Fee Type Group')}
            options={groupTypeOptions}
          />
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{feeText(dictionary, 'fee_type_localized_content', 'Localized content')}</Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={contentLocale}
            onChange={(_, nextLocale) => nextLocale && setContentLocale(nextLocale)}
            aria-label={feeText(dictionary, 'fee_type_content_language', 'Content language')}
          >
            {supportedTranslationLocales.map(item => <ToggleButton key={item} value={item}>{item === 'vi' ? feeText(dictionary, 'language_vi', 'Tiếng Việt') : feeText(dictionary, 'language_en', 'English')}</ToggleButton>)}
          </ToggleButtonGroup>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth error={Boolean(errors.name)}>
          <TextFieldForm
            field={createFieldAdapter({
              value: contentLocale === 'vi' ? values.name : values.name_en,
              onChange: nextValue => updateValue(contentLocale === 'vi' ? 'name' : 'name_en', nextValue),
              name: contentLocale === 'vi' ? 'fee_type_name' : 'fee_type_name_en'
            })}
            required={contentLocale === 'vi'}
            label={contentLocale === 'vi' ? feeText(dictionary, 'field_fee_type_name', 'Fee Type Name') : feeText(dictionary, 'field_fee_type_name_en', 'Fee Type Name (English)')}
            error={Boolean(errors.name)}
          />
          <FormHelperText>{errors.name}</FormHelperText>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextFieldForm
          field={createFieldAdapter({ value: values.document_code, onChange: nextValue => updateValue('document_code', nextValue) })}
          label={feeText(dictionary, 'field_document_code', 'Document Code')}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth error={Boolean(errors.calculation_method)}>
          <SelectFormField
            field={createFieldAdapter({
              value: values.calculation_method,
              onChange: nextValue => updateValue('calculation_method', nextValue)
            })}
            required
            disabled={calculationMethodLoading}
            isLoading={calculationMethodLoading}
            label={feeText(dictionary, 'field_calculation_method', 'Calculation Method')}
            error={Boolean(errors.calculation_method)}
            options={calculationMethodOptions}
          />
          <FormHelperText>{errors.calculation_method}</FormHelperText>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <TextFieldForm
          field={createFieldAdapter({
            value: values.unit,
            onChange: nextValue => updateValue('unit', nextValue)
          })}
          label={feeText(dictionary, 'field_unit', 'Unit')}
          placeholder={feeText(dictionary, 'unit_placeholder', 'đ/month')}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth error={Boolean(errors.default_amount)}>
          <AmountFieldForm
            value={values.default_amount}
            locale={locale}
            label={feeText(dictionary, 'field_default_amount', 'Default Amount')}
            error={Boolean(errors.default_amount)}
            allowNegative={false}
            onChange={nextValue => updateValue('default_amount', nextValue)}
          />
          <FormHelperText>{errors.default_amount}</FormHelperText>
        </FormControl>
      </Grid>
      {isEdit && (
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth error={Boolean(errors.status)}>
            <SelectFormField
              field={createFieldAdapter({
                value: values.status,
                onChange: nextValue => updateValue('status', nextValue)
              })}
              required
              label={feeText(dictionary, 'field_status', 'Status')}
              error={Boolean(errors.status)}
              options={statusOptions.map(option => ({
                value: option,
                label: getFeeTypeStatusLabel(dictionary, option)
              }))}
            />
            <FormHelperText>{errors.status}</FormHelperText>
          </FormControl>
        </Grid>
      )}
      <Grid size={{ xs: 12 }}>
        <TextFieldForm
          field={createFieldAdapter({
            value: contentLocale === 'vi' ? values.description : values.description_en,
            onChange: nextValue => updateValue(contentLocale === 'vi' ? 'description' : 'description_en', nextValue)
          })}
          label={contentLocale === 'vi' ? commonText(dictionary, 'description', 'Description') : feeText(dictionary, 'field_description_en', 'Description (English)')}
          multiline
          minRows={4}
        />
      </Grid>
    </Grid>
  )
}

export default FeeTypeForm
