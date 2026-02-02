import { env } from '@/env.mjs';
import { Box, Typography } from '@mui/material';

const Footer = ({ dictionary }: { dictionary?: any }) => {
    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: { xs: 'auto', sm: 8 },
                top: { xs: 10, sm: 'auto' },
                right: { xs: 8, sm: 16 },
                zIndex: 1000,
            }}
        >
            <Typography
                variant="body2"
                sx={{
                    fontSize: { xs: '14px', sm: '16px' },
                    color: '#999',
                    opacity: 0.7,
                    fontFamily: 'var(--app-font-family)',
                }}
            >
                v{env.NEXT_PUBLIC_VERSION} - {dictionary?.common?.[env.NEXT_PUBLIC_ENVIRONMENT.toLowerCase()] || env.NEXT_PUBLIC_ENVIRONMENT}
            </Typography>
        </Box>
    );
}

export default Footer;
