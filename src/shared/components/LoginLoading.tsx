'use client'

import FallbackSpinner from '@components/spinners'
import { Box } from '@mui/material'

const LoginLoading = ({ loadingtext }: { loadingtext: string }) => {
    return (
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}
        >
            <FallbackSpinner loadingtext={loadingtext} />
        </Box>
    )
}

export default LoginLoading

