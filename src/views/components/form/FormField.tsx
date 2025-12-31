// components/form/FormField.tsx
'use client';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { TextField, TextFieldProps } from '@mui/material';

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
} & Omit<TextFieldProps, 'name'>;

export function FormField<T extends FieldValues>({ control, name, ...rest }: Props<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => <TextField {...field} {...rest} fullWidth size="small" />}
    />
  );
}
