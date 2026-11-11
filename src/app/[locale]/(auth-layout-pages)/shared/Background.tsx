import React from 'react'
import { Box } from '@mui/material'

const Background = ({ children }: { children: React.ReactNode }) => {
    return (
        <Box
            sx={{
                position: 'relative',
                width: '100%',
                minHeight: '100vh',
                overflow: 'hidden',
                background: `
          radial-gradient(circle at 15% 20%, rgba(59,130,246,0.12) 0%, transparent 26%),
          radial-gradient(circle at 85% 18%, rgba(96,165,250,0.14) 0%, transparent 24%),
          radial-gradient(circle at 20% 85%, rgba(37,99,235,0.10) 0%, transparent 30%),
          radial-gradient(circle at 80% 80%, rgba(125,211,252,0.12) 0%, transparent 22%),
          linear-gradient(180deg, #F8FBFF 0%, #EEF5FF 45%, #F8FBFF 100%)
        `
            }}
        >
            {/* soft top blur */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -120,
                    left: '8%',
                    width: 420,
                    height: 420,
                    borderRadius: '50%',
                    background: 'rgba(59,130,246,0.12)',
                    filter: 'blur(80px)',
                    zIndex: 0
                }}
            />

            {/* soft bottom blur */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -140,
                    right: '10%',
                    width: 480,
                    height: 480,
                    borderRadius: '50%',
                    background: 'rgba(37,99,235,0.14)',
                    filter: 'blur(95px)',
                    zIndex: 0
                }}
            />

            {/* logo-inspired floating shapes */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '14%',
                    right: '16%',
                    width: 120,
                    height: 120,
                    opacity: 0.14,
                    transform: 'rotate(18deg)',
                    zIndex: 0
                }}
            >
                {[
                    { top: 0, left: 36 },
                    { top: 36, left: 0 },
                    { top: 36, left: 72 },
                    { top: 72, left: 36 }
                ].map((p, i) => (
                    <Box
                        key={i}
                        sx={{
                            position: 'absolute',
                            top: p.top,
                            left: p.left,
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
                            filter: 'blur(1px)'
                        }}
                    />
                ))}
            </Box>

            <Box
                sx={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '10%',
                    width: 160,
                    height: 160,
                    opacity: 0.1,
                    transform: 'rotate(-12deg)',
                    zIndex: 0
                }}
            >
                {[
                    { top: 0, left: 48 },
                    { top: 48, left: 0 },
                    { top: 48, left: 96 },
                    { top: 96, left: 48 }
                ].map((p, i) => (
                    <Box
                        key={i}
                        sx={{
                            position: 'absolute',
                            top: p.top,
                            left: p.left,
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563EB 0%, #93C5FD 100%)'
                        }}
                    />
                ))}
            </Box>

            {/* content */}
            <Box sx={{ position: 'relative', zIndex: 2 }}>
                {children}
            </Box>
        </Box>
    )
}

export default Background