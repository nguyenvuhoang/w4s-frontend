'use client'

import { Autocomplete, Avatar, Box, Stack, TextField, Typography } from '@mui/material'

import { findVietQrBank, matchesVietQrBank, vietQrBankLabel, type VietQrBank } from './vietqr'

type Props = {
  banks: VietQrBank[]
  /** Stored `bank_name` (bank short name); a value not in the VietQR list is still shown (BIN unknown). */
  value: string
  label: string
  required?: boolean
  error?: string
  disabled?: boolean
  noOptionsText: string
  onChange: (bankName: string) => void
}

const UNKNOWN_BANK_ID = -1

/** Bank picker of an account card: logo, short name, full name, code; searchable by name / code / BIN. */
const VietQrBankAutocomplete = ({ banks, value, label, required, error, disabled, noOptionsText, onChange }: Props) => {
  const selected = findVietQrBank(banks, value)
  // A stored name that VietQR does not know stays visible as is (no BIN -> no QR), never silently replaced.
  const unknown: VietQrBank | null = !selected && value.trim()
    ? { id: UNKNOWN_BANK_ID, name: value, code: '', bin: '', shortName: value, logo: '', transferSupported: false }
    : null

  return (
    <Autocomplete
      options={unknown ? [unknown, ...banks] : banks}
      value={selected ?? unknown}
      disabled={disabled}
      autoHighlight
      noOptionsText={noOptionsText}
      getOptionLabel={vietQrBankLabel}
      isOptionEqualToValue={(option, current) => option.id === current.id && option.bin === current.bin}
      filterOptions={(options, state) => options.filter(option => matchesVietQrBank(option, state.inputValue))}
      onChange={(_, bank) => onChange(bank ? vietQrBankLabel(bank) : '')}
      renderOption={({ key, ...props }, bank) => (
        <Box component="li" key={`${bank.id}-${bank.bin}`} {...props} data-vietqr-bank={bank.bin || 'unknown'}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar src={bank.logo || undefined} alt={bank.shortName} variant="rounded" sx={{ width: 56, height: 28, bgcolor: 'transparent' }} slotProps={{ img: { sx: { objectFit: 'contain' } } }}>
              {bank.shortName.slice(0, 2)}
            </Avatar>
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{`${vietQrBankLabel(bank)}${bank.code ? ` (${bank.code})` : ''}`}</Typography>
              {bank.name !== bank.shortName && (
                <Typography variant="caption" color="text.secondary" noWrap>{bank.name}</Typography>
              )}
            </Stack>
          </Stack>
        </Box>
      )}
      renderInput={params => (
        <TextField
          {...params}
          required={required}
          label={label}
          error={Boolean(error)}
          helperText={error}
          inputProps={{ ...params.inputProps, 'data-bank-field': 'bank_name' }}
        />
      )}
    />
  )
}

export default VietQrBankAutocomplete
