import { Box, Typography } from '@mui/material';

interface LoginHeaderProps {
  appTitle: string;
  welcomeText: string;
}

/**
 * Pure UI component for login header, can be used in server or client components.
 */
const LoginHeader = ({ appTitle, welcomeText }: LoginHeaderProps) => (
  <Box className="space-y-1 body-header ng-star-inserted">
    <Typography
      variant='h2'
      className='text-primary'
      sx={{ fontFamily: 'Quicksand' }}
    >
      {appTitle}
    </Typography>
    <Box className="text-primary" sx={{ fontFamily: 'Quicksand' }}>
      {welcomeText}
    </Box>
  </Box>
);

export default LoginHeader;
