import {
  Button,
  FormControl,
  FormHelperText,
  TextField
} from '@mui/material';
import { ReactNode } from 'react';
import { Controller, FieldErrors, FieldValues, Path } from 'react-hook-form';
import DateFieldForm from './DateFieldForm';
import SelectFormField from './SelectFormField';
import TextFieldForm from './TextFieldForm';
import { getInputSlotProps } from './library';

interface FormFieldProps<T extends FieldValues = any> {
  name: Path<T>;
  control: any;
  errors: FieldErrors<T>;
  label: string;
  placeholder?: string;
  rules?: any;
  type?: 'text' | 'select' | 'password' | 'number' | 'textarea' | 'date' | 'file';
  options?: { value: string; label: string }[];
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  isLoading?: boolean;
  banklist?: { bin: string; name: string; logo: string; shortname: string }[];
  selectType?: 'default' | 'custom';
  required?: boolean;
  size?: 'small' | 'medium' | undefined;
  disabled?: boolean;
  value?: any;
  onFocus?: (value: string) => void;
  onBlur?: (value: string) => void;
  onChange?: (value: string) => void;
}

const FormField = ({
  name,
  control,
  errors,
  label,
  placeholder = '',
  rules,
  type = 'text',
  options = [],
  startAdornment,
  endAdornment,
  isLoading = false,
  banklist = [],
  selectType = 'default',
  size = 'small',
  disabled = false,
  value,
  onBlur,
  onChange
}: FormFieldProps) => {


  const renderField = (field: any, fieldState: any) => {
    switch (type) {
      case 'select':
        return (
          <SelectFormField
            field={field}
            label={label}
            placeholder={placeholder}
            error={!!fieldState?.error}
            startAdornment={startAdornment}
            endAdornment={endAdornment}
            isLoading={isLoading}
            size={size}
            disabled={disabled}
            options={options}
            selectType={selectType}
            banklist={banklist}
            onBlur={onBlur}
            onChange={onChange}
          />

        );

      case 'textarea':
        return (
          <TextField
            {...field}
            placeholder={placeholder}
            variant="outlined"
            multiline
            rows={4}
            slotProps={{ input: getInputSlotProps({ startAdornment, endAdornment, isLoading }) }}
            error={Boolean(errors[name])}
          />
        );

      case 'password':
        return (
          <TextField
            {...field}
            type="password"
            placeholder={placeholder}
            variant="outlined"
            slotProps={{ input: getInputSlotProps({ startAdornment, endAdornment, isLoading }) }}
            error={Boolean(errors[name])}
          />
        );

      case 'number':
        return (
          <TextField
            {...field}
            type="number"
            placeholder={placeholder}
            variant="outlined"
            slotProps={{ input: getInputSlotProps({ startAdornment, endAdornment, isLoading }) }}
            error={Boolean(errors[name])}
          />
        );

      case 'date':
        return (
          <DateFieldForm
            field={field}
            error={!!fieldState?.error}
            label={label}
            startAdornment={startAdornment}
            endAdornment={endAdornment}
            isLoading={isLoading}
            size={size}
            disabled={disabled}
            onChange={onChange}
            onBlur={onBlur}
          />
        );

      case 'file':
        return (
          <>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ justifyContent: 'flex-start' }}
            >
              {field.value?.name || placeholder || 'Upload File'}
              <input
                type="file"
                hidden
                accept="image/*"
                disabled={disabled}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  field.onChange(file);
                }}
                onBlur={field.onBlur}
              />
            </Button>
            {field.value?.name && (
              <FormHelperText>{field.value.name}</FormHelperText>
            )}
          </>
        );


      case 'text':
      default:
        return (
          <TextFieldForm
            field={field}
            placeholder={placeholder}
            error={!!fieldState?.error}
            startAdornment={startAdornment}
            endAdornment={endAdornment}
            isLoading={isLoading}
            label={label}
            size={size}
            disabled={disabled}
            onBlur={onBlur}
            onChange={onChange}
          />
        );
    }
  };

  return (
    <FormControl fullWidth>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState }) => {
          const mergedField = {
            ...field,
            value: value !== undefined ? value : field.value ?? '',
          };

          return renderField(mergedField, fieldState);
        }}

      />
      {errors[name] && (
        <FormHelperText error>{typeof errors[name]?.message === 'string' ? errors[name]?.message : ''}</FormHelperText>
      )}
    </FormControl>
  );
};

export default FormField;
