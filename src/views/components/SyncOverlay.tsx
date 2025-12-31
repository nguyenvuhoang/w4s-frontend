'use client'

import { Box } from '@mui/material'
import ComputerIcon from '@mui/icons-material/Computer'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import { keyframes } from '@mui/system'

const syncMove = keyframes`
  0% {
    left: -30%;
  }
  100% {
    left: 100%;
  }
`

type SyncOverlayProps = {
    open: boolean
}

const SyncOverlay = ({ open }: SyncOverlayProps) => {
    if (!open) return null // Không hiển thị nếu không bật

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.3)',
                zIndex: 1300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* Icon hệ thống A */}
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    <ComputerIcon sx={{ fontSize: 48 }} />
                </Box>

                {/* Line sync animation */}
                <Box
                    sx={{
                        position: 'relative',
                        width: 200,
                        height: 6,
                        backgroundColor: '#bbb',
                        borderRadius: 3,
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: '-30%',
                            width: '30%',
                            height: '100%',
                            backgroundColor: '#4caf50',
                            animation: `${syncMove} 1.2s linear infinite`,
                        }}
                    />
                </Box>

                {/* Icon hệ thống B */}
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    <AccountBalanceIcon sx={{ fontSize: 48 }} />
                </Box>
            </Box>
        </Box>
    )
}

export default SyncOverlay
