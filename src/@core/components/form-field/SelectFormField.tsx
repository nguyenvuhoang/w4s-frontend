'use client';

import { MenuItem, TextField } from '@mui/material';
import { ReactNode } from 'react';
import { getInputSlotProps } from './library';

interface SelectFormFieldProps {
  field: any;
  error?: boolean;
  label?: string;
  placeholder?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  isLoading?: boolean;
  options?: { value: string; label: string }[];
  selectType?: 'default' | 'custom';
  banklist?: { bin: string; name: string; logo: string; shortname: string }[];
  onBlur?: (value: string) => void;
  onChange?: (value: string) => void;
}

const SelectFormField = ({
  field,
  error = false,
  label,
  placeholder,
  size = 'small',
  disabled = false,
  startAdornment,
  endAdornment,
  isLoading = false,
  options = [],
  selectType = 'default',
  banklist = [],
  onBlur,
  onChange
}: SelectFormFieldProps) => {
  const value =
    selectType === 'custom'
      ? field.value?.bankcode ?? ''
      : field.value ?? '';

  const handleChange = (e: any) => {
    const newValue = e.target.value;
    if (selectType === 'custom' && banklist.length > 0) {
      const selected = banklist.find((b) => b.bin === e.target.value);
      field.onChange(
        selected
          ? {
            bankcode: selected.bin,
            bankname: selected.name,
            banklogo: selected.logo,
            bankshortname: selected.shortname,
          }
          : null
      );
    } else {
      field.onChange(newValue);
      onChange?.(newValue);
    }
  };

  return (
    <TextField
      {...field}
      onBlur={(e) => {
        field.onBlur();
        onBlur?.(e.target.value);
      }}
      value={value}
      onChange={handleChange}
      select
      fullWidth
      variant="outlined"
      error={error}
      label={label}
      disabled={disabled}
      size={size}
      slotProps={{
        input: getInputSlotProps({ startAdornment, endAdornment, isLoading }),
        inputLabel: {
          shrink: true,
          sx: {
            '& .MuiInputLabel-asterisk': { color: 'red' },
          },
        },
      }}
      placeholder={placeholder}

      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: '#048d48a1 !important',
            filter: 'invert(0%) !important',
            WebkitFilter: 'invert(0%) !important',
          },
          '&:hover fieldset': {
            borderColor: '#8e8e8e !important',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#03492a !important',
          },
          '&.Mui-error fieldset': {
            borderColor: '#d32f2f !important',
          },
        },
        '& .MuiInputBase-input': {
          color: 'inherit',
        },

      }}
    >
      {(selectType === 'custom' && banklist.length > 0
        ? banklist.map((bank) => (
          <MenuItem key={bank.bin} value={bank.bin}>
            {bank.name}
          </MenuItem>
        ))
        : options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))
      )}

    </TextField>
  );
};

export default SelectFormField;
