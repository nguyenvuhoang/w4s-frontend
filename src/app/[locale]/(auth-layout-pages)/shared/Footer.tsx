import { env } from '@/env.mjs';
import { Box } from '@mui/material';

const Footer = () => {
    return (
        <Box
            sx={{
                position: 'absolute',
                bottom: { xs: 'auto', sm: 8 },
                top: { xs: 8, sm: 'auto' },
                right: { xs: 8, sm: 16 },
                fontSize: { xs: '14px', sm: '16px' },
                color: '#999',
                opacity: 0.7,
                fontFamily: 'Quicksand, sans-serif',
                zIndex: 1000
            }}
        >
            v{env.NEXT_PUBLIC_VERSION} - {env.NEXT_PUBLIC_ENVIRONMENT}
        </Box>
    );
}

export default Footer;
