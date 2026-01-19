import React from 'react'
import { Box } from '@mui/material'

const Background = ({ children }: { children: React.ReactNode }) => {
    const lightImg = '/images/pages/login-day.jpg'
    const authBackground = lightImg

    return (
        <Box sx={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
            {/* Background image (absolute) */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    backgroundImage: `url(${authBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 0,
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        boxShadow: 'inset 0 0 120px 80px rgba(255, 255, 255, 1)',
                        pointerEvents: 'none',
                    },
                }}
            />

            {/* Foreground children */}
            <Box sx={{ position: 'relative', zIndex: 10 }}>{children}</Box>
        </Box>
    )
}

export default Background
