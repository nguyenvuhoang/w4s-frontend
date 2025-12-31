import React from 'react'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import { InputAdornment, Box } from '@mui/material'
import { requiredFields } from './requiredFields'

export const buildFieldProps = (
  field: string,
  dictionary: any,
  errors: Record<string, any>,
  opts?: {
    extraRules?: Record<string, any>
    extraEnd?: React.ReactNode
    requiredOverride?: boolean
  }
) => {
  const isRequired = (opts?.requiredOverride ?? requiredFields[field]) === true
  const hasError = Boolean(errors?.[field])

  const rules = isRequired
    ? {
      required: dictionary['common'].fieldrequired.replace(
        '{field}',
        dictionary['contract'][field] || field
      ),
      ...(opts?.extraRules ?? {})
    }
    : (opts?.extraRules ?? {})

  // ⬇️ Only the red icon gets animation
  const requiredIcon = isRequired ? (
    <AcUnitIcon
      sx={{
        color: 'red !important',
        ...(hasError ? { animation: 'spin 1s linear infinite' } : {})
      }}
    />
  ) : null

  // ⬇️ No animation/style on the wrapper so other icons don’t rotate
  const endAdornment =
    requiredIcon || opts?.extraEnd ? (
      <InputAdornment position="end">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {requiredIcon}
          {opts?.extraEnd}
        </Box>
      </InputAdornment>
    ) : undefined

  return { rules, endAdornment }
}
