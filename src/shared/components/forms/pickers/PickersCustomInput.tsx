import { forwardRef } from 'react';
import TextField from '@mui/material/TextField';
import type { SxProps, Theme } from '@mui/material';

interface PickerProps {
  label?: string;
  readOnly?: boolean;
  sx?: SxProps<Theme>;
  endAdornment?: React.ReactNode;
}

const PickersComponent = forwardRef(({ label, readOnly, endAdornment, sx, ...rest }: PickerProps, ref) => {
  return (
    <TextField
      inputRef={ref}
      label={label || ''}
      sx={sx}
      InputProps={{
        endAdornment: endAdornment
      }}
      inputProps={readOnly ? { readOnly: true } : {}}
      {...rest}
    />
  );
});

PickersComponent.displayName = 'PickersComponent';

export default PickersComponent;
