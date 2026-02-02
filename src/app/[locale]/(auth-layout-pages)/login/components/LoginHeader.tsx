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
      sx={{}}
    >
      {appTitle}
    </Typography>
    <Typography
      variant="body1"
      className='text-primary'
      sx={{
        fontSize: '16px',
        fontWeight: 500,
        fontFamily: 'var(--app-font-family)'
      }}
    >
      {welcomeText}
    </Typography>
  </Box>
);

export default LoginHeader;
