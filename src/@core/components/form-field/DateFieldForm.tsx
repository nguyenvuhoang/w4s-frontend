'use client';

import { TextField } from '@mui/material';
import { ReactNode } from 'react';
import { getInputSlotProps } from './library';

interface DateFieldFormProps {
  field: any;
  error?: boolean;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  isLoading?: boolean;
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  onBlur?: (value: string) => void;
  onChange?: (value: string) => void;
}

const DateFieldForm = ({
  field,
  error = false,
  startAdornment,
  endAdornment,
  isLoading = false,
  label,
  size = 'small',
  disabled = false,
  onBlur,
  onChange
}: DateFieldFormProps) => {
  return (
    <TextField
      {...field}
      onBlur={(e) => {
        field.onBlur();
        onBlur?.(e.target.value);
      }}
      onChange={(e) => {
        field.onChange(e);
        onChange?.(e.target.value);
      }}
      value={field.value ?? ''}
      type="date"
      variant="outlined"
      error={error}
      label={label}
      slotProps={{
        input: getInputSlotProps({ startAdornment, endAdornment, isLoading }),
        inputLabel: {
          shrink: true,
          sx: {
            '& .MuiInputLabel-asterisk': {
              color: 'red',
            },
          },
        },
      }}
      sx={{
        '& input[type="date"]::-webkit-calendar-picker-indicator': {
          opacity: 0,
          position: 'absolute',
          right: 0,
          width: '100%',
          height: '100%',
          cursor: 'pointer',
        },

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
      size={size}
      disabled={disabled}
    />
  );
};

export default DateFieldForm;
