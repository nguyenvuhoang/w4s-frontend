'use client';

import {
  TextField
} from '@mui/material';
import { ReactNode } from 'react';
import { getInputSlotProps } from './library';

interface TextFieldFormProps {
  field: any;
  placeholder?: string;
  error?: boolean;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  isLoading?: boolean;
  label?: string;
  size?: 'small' | 'medium' | undefined;
  disabled?: boolean;
  onBlur?: (value: string) => void;
  onChange?: (value: string) => void;
}

const TextFieldForm = ({
  field,
  placeholder = '',
  error = false,
  startAdornment,
  endAdornment,
  isLoading = false,
  label,
  size = 'small',
  disabled = false,
  onBlur,
  onChange
}: TextFieldFormProps) => {

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
      placeholder={placeholder}
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
        }
      }}
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
      size={size}
      disabled={disabled}

    />
  );
};

export default TextFieldForm;
