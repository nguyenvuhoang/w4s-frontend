import { CircularProgress, InputAdornment } from '@mui/material';
import { ReactNode } from 'react';

interface InputSlotProps {
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  isLoading?: boolean;
}

export const getInputSlotProps = ({
  startAdornment,
  endAdornment,
  isLoading = false,
}: InputSlotProps) => ({
  startAdornment,
  endAdornment: isLoading ? (
    <InputAdornment position="end">
      <CircularProgress size={20} />
    </InputAdornment>
  ) : endAdornment,
});
