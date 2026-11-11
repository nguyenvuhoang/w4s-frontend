'use client'

import { TextField } from '@mui/material'
import { ReactNode } from 'react'

import {
  formatRawAmountInput,
  normalizeAmountInput
} from '@/shared/utils/formatCurrencyAmount'

import { getInputSlotProps } from './library'

interface AmountFieldFormProps {
  value: string
  locale?: string
  placeholder?: string
  error?: boolean
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  isLoading?: boolean
  label?: string
  size?: 'small' | 'medium'
  disabled?: boolean
  required?: boolean
  fullWidth?: boolean
  allowNegative?: boolean
  decimalScale?: number
  onBlur?: (value: string) => void
  onChange?: (value: string) => void
}

const AmountFieldForm = ({
  value,
  locale,
  placeholder = '',
  error = false,
  startAdornment,
  endAdornment,
  isLoading = false,
  label,
  size = 'small',
  disabled = false,
  required = false,
  fullWidth = true,
  allowNegative = false,
  decimalScale,
  onBlur,
  onChange
}: AmountFieldFormProps) => {
  const displayValue = formatRawAmountInput(value || '', locale)

  return (
    <TextField
      value={displayValue}
      placeholder={placeholder}
      variant="outlined"
      error={error}
      label={label}
      required={required}
      fullWidth={fullWidth}
      slotProps={{
        input: {
          ...getInputSlotProps({ startAdornment, endAdornment, isLoading }),
          inputMode: 'decimal'
        },
        inputLabel: {
          shrink: true,
          sx: {
            '& .MuiInputLabel-asterisk': {
              color: 'red'
            }
          }
        }
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: '#048d48a1 !important',
            filter: 'invert(0%) !important',
            WebkitFilter: 'invert(0%) !important'
          },
          '&:hover fieldset': {
            borderColor: '#8e8e8e !important'
          },
          '&.Mui-focused fieldset': {
            borderColor: '#03492a !important'
          },
          '&.Mui-error fieldset': {
            borderColor: '#d32f2f !important'
          }
        },
        '& .MuiInputBase-input': {
          color: 'inherit'
        }
      }}
      size={size}
      disabled={disabled}
      onBlur={() => onBlur?.(value || '')}
      onChange={event => {
        const normalized = normalizeAmountInput(event.target.value, locale)

        if (!allowNegative && normalized.startsWith('-')) {
          return
        }

        if (decimalScale !== undefined) {
          const [, fraction = ''] = normalized.split('.')

          if (fraction.length > decimalScale) {
            return
          }
        }

        onChange?.(normalized)
      }}
    />
  )
}

export default AmountFieldForm
