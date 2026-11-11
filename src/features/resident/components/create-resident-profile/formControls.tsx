import { ReactNode } from 'react'
import { Control, Controller, RegisterOptions } from 'react-hook-form'

import {
    Avatar,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Divider,
    InputAdornment,
    MenuItem,
    TextField,
    Typography
} from '@mui/material'

import { HierarchyOption, ResidentProfileFormValues } from '../../types'
import { optionLabel, ResidentDictionary, text } from '../../utils/residentLabels'
import { getAllowedRelationshipsByRole } from '../../utils/residentRoleRelationship'

export type { ResidentDictionary } from '../../utils/residentLabels'
export { text } from '../../utils/residentLabels'

const selectOptionStyles = {
    color: 'text.primary',
    '&:hover': {
        backgroundColor: '#f1f5f9'
    },
    '&.Mui-focusVisible, &.Mui-focused': {
        backgroundColor: '#e8f0fb'
    },
    '&.Mui-selected': {
        backgroundColor: '#dbeafe',
        color: '#1f5591',
        fontWeight: 500
    },
    '&.Mui-selected:hover, &.Mui-selected.Mui-focusVisible, &.Mui-selected.Mui-focused': {
        backgroundColor: '#e8f0fb'
    }
} as const

export const labelSx = {
    color: 'primary.main',
    '&.Mui-focused': { color: 'primary.main' },
    '& .MuiFormLabel-asterisk, & .MuiInputLabel-asterisk': {
        color: '#dc2626'
    }
} as const

export const residentOptions = (dict: ResidentDictionary) => ({
    gender: [
        { value: 'M', label: text(dict, 'option_gender_m', 'Male') },
        { value: 'F', label: text(dict, 'option_gender_f', 'Female') },
        { value: 'O', label: text(dict, 'option_gender_o', 'Other') }
    ]
})

export const relationshipOptionsByRole = (dict: ResidentDictionary, role: string) => (
    getAllowedRelationshipsByRole(role).map(value => ({
        value,
        label: optionLabel(dict, value, `option_relationship_${value.toLowerCase()}`, value)
    }))
)

type SectionCardProps = {
    title: string
    subtitle?: ReactNode
    icon: ReactNode
    children: ReactNode
}

type Option = {
    value: string
    label: string
}

type FieldProps = {
    control: Control<ResidentProfileFormValues>
    name: keyof ResidentProfileFormValues
    label: string
    placeholder?: string
    required?: boolean
    requiredMark?: boolean
    requiredMessage: string
    type?: string
    multiline?: boolean
    minRows?: number
    rules?: RegisterOptions<ResidentProfileFormValues, any>
    disabled?: boolean
    readOnly?: boolean
    onClick?: () => void
    onValueChange?: (value: string) => void
    endAdornment?: ReactNode
}

type SelectFieldProps = Omit<FieldProps, 'type' | 'placeholder' | 'endAdornment'> & {
    options: Option[] | HierarchyOption[]
    allowEmpty?: boolean
    emptyLabel: string
    loading?: boolean
    loadingLabel?: string
    externalErrorMessage?: string
}

export function SectionCard({ title, subtitle, icon, children }: SectionCardProps) {
    return (
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', height: '100%' }}>
            <CardHeader
                avatar={<Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>{icon}</Avatar>}
                title={<Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>}
                subheader={subtitle}
                sx={{ p: 3, pb: 0, mb: 2 }}
            />
            <Divider sx={{ mx: 3 }} />
            <CardContent>{children}</CardContent>
        </Card>
    )
}

export function FormTextField({
    control,
    name,
    label,
    placeholder,
    required,
    requiredMark,
    requiredMessage,
    type = 'text',
    multiline = false,
    minRows,
    rules,
    disabled,
    readOnly,
    onClick,
    onValueChange,
    endAdornment
}: FieldProps) {
    const computedRules = rules ?? (required ? { required: requiredMessage.replace('{field}', label) } : undefined)

    return (
        <Controller
            name={name}
            control={control}
            rules={computedRules}
            render={({ field, fieldState }) => (
                <TextField
                    {...field}
                    value={typeof field.value === 'boolean' ? String(field.value) : field.value ?? ''}
                    onChange={(event) => {
                        field.onChange(event)
                        onValueChange?.(event.target.value)
                    }}
                    label={label}
                    placeholder={placeholder}
                    type={type}
                    multiline={multiline}
                    minRows={minRows}
                    fullWidth
                    size="small"
                    disabled={disabled}
                    onClick={onClick}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || ''}
                    slotProps={{
                        inputLabel: {
                            shrink: type === 'date' ? true : undefined,
                            sx: labelSx,
                            required: required || requiredMark
                        },
                        input: endAdornment || readOnly
                            ? {
                                endAdornment,
                                readOnly
                            }
                            : undefined
                    }}
                />
            )}
        />
    )
}

export function FormSelectField({
    control,
    name,
    label,
    options,
    required,
    requiredMark,
    requiredMessage,
    rules,
    allowEmpty = true,
    emptyLabel,
    disabled,
    loading,
    loadingLabel = 'Loading...',
    externalErrorMessage,
    onValueChange
}: SelectFieldProps) {
    const computedRules = rules ?? (required ? { required: requiredMessage.replace('{field}', label) } : undefined)

    return (
        <Controller
            name={name}
            control={control}
            rules={computedRules}
            render={({ field, fieldState }) => (
                <TextField
                    {...field}
                    value={typeof field.value === 'boolean' ? String(field.value) : field.value ?? ''}
                    onChange={(event) => {
                        field.onChange(event)
                        onValueChange?.(event.target.value)
                    }}
                    select
                    label={label}
                    fullWidth
                    size="small"
                    disabled={disabled || loading}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || (loading ? loadingLabel : externalErrorMessage || '')}
                    slotProps={{
                        inputLabel: { sx: labelSx, required: required || requiredMark },
                        input: loading
                            ? {
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ mr: 3 }}>
                                        <CircularProgress color="inherit" size={18} />
                                    </InputAdornment>
                                )
                            }
                            : undefined
                    }}
                >
                    {loading && <MenuItem value="" disabled>{loadingLabel}</MenuItem>}
                    {allowEmpty && <MenuItem value="">{emptyLabel}</MenuItem>}
                    {options.map(option => (
                        <MenuItem key={option.value} value={option.value} sx={selectOptionStyles}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
            )}
        />
    )
}
