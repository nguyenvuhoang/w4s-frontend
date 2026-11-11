'use client'

import { FormControl, FormHelperText, Grid } from '@mui/material'
import type { ChangeEvent } from 'react'

import AmountFieldForm from '@/@core/components/form-field/AmountFieldForm'
import DateFieldForm from '@/@core/components/form-field/DateFieldForm'
import SelectFormField from '@/@core/components/form-field/SelectFormField'
import TextFieldForm from '@/@core/components/form-field/TextFieldForm'

import {
  assetText,
  getAssetCategoryLabel,
  getAssetStatusLabel
} from './assetHelpers'
import type { AssetDictionary, AssetFormValues, AssetProjectOption } from '../types'

const createFieldAdapter = <T extends string>({
  value,
  onChange
}: {
  value: T
  onChange: (nextValue: T) => void
}) => ({
  value,
  onChange: (eventOrValue: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | T) => {
    if (typeof eventOrValue === 'string') {
      onChange(eventOrValue as T)

      return
    }

    onChange(eventOrValue.target.value as T)
  },
  onBlur: () => undefined,
  name: ''
})

type Props = {
  dictionary: AssetDictionary
  locale: string
  values: AssetFormValues
  errors: Partial<Record<keyof AssetFormValues, string>>
  categoryOptions: string[]
  statusOptions: string[]
  projectOptions?: AssetProjectOption[]
  showProject?: boolean
  showStatus?: boolean
  updateValue: <K extends keyof AssetFormValues>(key: K, value: AssetFormValues[K]) => void
}

const AssetForm = ({
  dictionary,
  locale,
  values,
  errors,
  categoryOptions,
  statusOptions,
  projectOptions = [],
  showProject = false,
  showStatus = true,
  updateValue
}: Props) => (
  <Grid container spacing={2.5}>
    {showProject && (
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth error={Boolean(errors.project_id)}>
          <SelectFormField
            field={createFieldAdapter({
              value: values.project_id,
              onChange: nextValue => updateValue('project_id', nextValue)
            })}
            required
            label={assetText(dictionary, 'field_project_reference', 'Project')}
            error={Boolean(errors.project_id)}
            options={(projectOptions.length > 0
              ? projectOptions
              : values.project_id
                ? [{ id: Number(values.project_id), code: '', name: values.project_id }]
                : []
            ).map(option => ({
              value: String(option.id),
              label: option.code ? `${option.code} - ${option.name}` : option.name
            }))}
          />
          <FormHelperText>{errors.project_id}</FormHelperText>
        </FormControl>
      </Grid>
    )}
    <Grid size={{ xs: 12, md: 6 }}>
      <FormControl fullWidth error={Boolean(errors.asset_code)}>
        <TextFieldForm
          field={createFieldAdapter({
            value: values.asset_code,
            onChange: nextValue => updateValue('asset_code', nextValue)
          })}
          required
          label={assetText(dictionary, 'field_asset_code', 'Asset Code')}
          error={Boolean(errors.asset_code)}
        />
        <FormHelperText>{errors.asset_code}</FormHelperText>
      </FormControl>
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <FormControl fullWidth error={Boolean(errors.name)}>
        <TextFieldForm
          field={createFieldAdapter({
            value: values.name,
            onChange: nextValue => updateValue('name', nextValue)
          })}
          required
          label={assetText(dictionary, 'field_name', 'Name')}
          error={Boolean(errors.name)}
        />
        <FormHelperText>{errors.name}</FormHelperText>
      </FormControl>
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <FormControl fullWidth error={Boolean(errors.category)}>
        <SelectFormField
          field={createFieldAdapter({
            value: values.category,
            onChange: nextValue => updateValue('category', nextValue)
          })}
          required
          label={assetText(dictionary, 'field_category', 'Category')}
          error={Boolean(errors.category)}
          options={categoryOptions.map(option => ({
            value: option,
            label: getAssetCategoryLabel(dictionary, option)
          }))}
        />
        <FormHelperText>{errors.category}</FormHelperText>
      </FormControl>
    </Grid>
    {showStatus && (
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth error={Boolean(errors.status)}>
          <SelectFormField
            field={createFieldAdapter({
              value: values.status,
              onChange: nextValue => updateValue('status', nextValue)
            })}
            required
            label={assetText(dictionary, 'field_status', 'Status')}
            error={Boolean(errors.status)}
            options={statusOptions.map(option => ({
              value: option,
              label: getAssetStatusLabel(dictionary, option)
            }))}
          />
          <FormHelperText>{errors.status}</FormHelperText>
        </FormControl>
      </Grid>
    )}
    <Grid size={{ xs: 12, md: 6 }}>
      <TextFieldForm
        field={createFieldAdapter({
          value: values.location,
          onChange: nextValue => updateValue('location', nextValue)
        })}
        label={assetText(dictionary, 'field_location', 'Location')}
      />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextFieldForm
        field={createFieldAdapter({
          value: values.qr_code,
          onChange: nextValue => updateValue('qr_code', nextValue)
        })}
        label={assetText(dictionary, 'field_qr_code', 'QR Code')}
      />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <DateFieldForm
        field={createFieldAdapter({
          value: values.purchase_date,
          onChange: nextValue => updateValue('purchase_date', nextValue)
        })}
        label={assetText(dictionary, 'field_purchase_date', 'Purchase Date')}
      />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <FormControl fullWidth error={Boolean(errors.purchase_value)}>
        <AmountFieldForm
          value={values.purchase_value}
          locale={locale}
          label={assetText(dictionary, 'field_purchase_value', 'Purchase Value')}
          error={Boolean(errors.purchase_value)}
          allowNegative={false}
          decimalScale={2}
          onChange={nextValue => updateValue('purchase_value', nextValue)}
        />
        <FormHelperText>{errors.purchase_value}</FormHelperText>
      </FormControl>
    </Grid>
    <Grid size={{ xs: 12 }}>
      <TextFieldForm
        field={createFieldAdapter({
          value: values.description,
          onChange: nextValue => updateValue('description', nextValue)
        })}
        label={assetText(dictionary, 'field_description', 'Description')}
        multiline
        minRows={4}
      />
    </Grid>
  </Grid>
)

export default AssetForm
