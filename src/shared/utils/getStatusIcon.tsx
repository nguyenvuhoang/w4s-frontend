import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { green, red, grey } from '@mui/material/colors';

export const getStatusIcon = (status: number) => {
  switch (status) {
    case 2:
      return <CheckCircleIcon sx={{ color: green[600] }} titleAccess="Success" />;
    case 3:
      return <CancelIcon sx={{ color: red[600] }} titleAccess="Failed" />;
    default:
      return <HelpOutlineIcon sx={{ color: grey[500] }} titleAccess="Unknown" />;
  }
};
