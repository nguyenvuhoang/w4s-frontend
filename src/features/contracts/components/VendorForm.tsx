'use client'

import { FormControl, FormHelperText, Grid } from '@mui/material'
import type { ChangeEvent } from 'react'

import SelectFormField from '@/@core/components/form-field/SelectFormField'
import TextFieldForm from '@/@core/components/form-field/TextFieldForm'

import type { VendorFormValues, VendorProjectOption, VendorsDictionary } from '../vendorTypes'
import { getVendorStatusLabel, vendorsText } from './vendorHelpers'

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
    dictionary: VendorsDictionary
    values: VendorFormValues
    errors: Partial<Record<keyof VendorFormValues, string>>
    statusOptions: string[]
    projectOptions?: VendorProjectOption[]
    showProject?: boolean
    showStatus?: boolean
    updateValue: <K extends keyof VendorFormValues>(key: K, value: VendorFormValues[K]) => void
}

const VendorForm = ({
    dictionary,
    values,
    errors,
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
                        label={vendorsText(dictionary, 'project_id', 'Project ID')}
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
            <FormControl fullWidth error={Boolean(errors.vendor_code)}>
                <TextFieldForm
                    field={createFieldAdapter({
                        value: values.vendor_code,
                        onChange: nextValue => updateValue('vendor_code', nextValue)
                    })}
                    required
                    label={vendorsText(dictionary, 'vendor_code', 'Vendor Code')}
                    error={Boolean(errors.vendor_code)}
                />
                <FormHelperText>{errors.vendor_code}</FormHelperText>
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
                    label={vendorsText(dictionary, 'vendor_name', 'Company / Vendor Name')}
                    error={Boolean(errors.name)}
                />
                <FormHelperText>{errors.name}</FormHelperText>
            </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <TextFieldForm
                field={createFieldAdapter({
                    value: values.tax_code,
                    onChange: nextValue => updateValue('tax_code', nextValue)
                })}
                label={vendorsText(dictionary, 'tax_code', 'Tax Code')}
            />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <TextFieldForm
                field={createFieldAdapter({
                    value: values.contact_person,
                    onChange: nextValue => updateValue('contact_person', nextValue)
                })}
                label={vendorsText(dictionary, 'contact_person', 'Contact Person')}
            />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth error={Boolean(errors.phone)}>
                <TextFieldForm
                    field={createFieldAdapter({
                        value: values.phone,
                        onChange: nextValue => updateValue('phone', nextValue)
                    })}
                    label={vendorsText(dictionary, 'phone', 'Phone')}
                    error={Boolean(errors.phone)}
                />
                <FormHelperText>{errors.phone}</FormHelperText>
            </FormControl>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth error={Boolean(errors.email)}>
                <TextFieldForm
                    field={createFieldAdapter({
                        value: values.email,
                        onChange: nextValue => updateValue('email', nextValue)
                    })}
                    label={vendorsText(dictionary, 'email', 'Email')}
                    error={Boolean(errors.email)}
                />
                <FormHelperText>{errors.email}</FormHelperText>
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
                        label={vendorsText(dictionary, 'status', 'Status')}
                        error={Boolean(errors.status)}
                        options={statusOptions.map(option => ({
                            value: option,
                            label: getVendorStatusLabel(dictionary, option)
                        }))}
                    />
                    <FormHelperText>{errors.status}</FormHelperText>
                </FormControl>
            </Grid>
        )}
        <Grid size={{ xs: 12 }}>
            <TextFieldForm
                field={createFieldAdapter({
                    value: values.address,
                    onChange: nextValue => updateValue('address', nextValue)
                })}
                label={vendorsText(dictionary, 'address', 'Address')}
                multiline
                minRows={3}
            />
        </Grid>
    </Grid>
)

export default VendorForm
