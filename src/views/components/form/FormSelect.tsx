// components/form/FormSelect.tsx
'use client';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { MenuItem, TextField, TextFieldProps } from '@mui/material';

type Option = { value: string; label: string };
type Props<T extends FieldValues> = {
    control: Control<T>;
    name: Path<T>;
    options: Option[];
} & Omit<TextFieldProps, 'name' | 'select' | 'children'>;

export function FormSelect<T extends FieldValues>({ control, name, options, ...rest }: Props<T>) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <TextField {...field} select fullWidth size="small" {...rest}>
                    {options.map(opt => (
                        <MenuItem key={opt.value ?? `opt-${opt.label}`} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </TextField>
            )}
        />
    );
}
