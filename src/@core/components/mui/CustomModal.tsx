'use client'

import { Box, IconButton, Modal, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { ReactNode } from 'react'

type CustomModalProps = {
    open: boolean
    onClose: () => void
    title?: string
    children: ReactNode
    maxWidth?: string | number
    maxHeight?: string | number
    position?: 'default' | 'center'
}

const CustomModal = ({ open, onClose, title = '', children, maxWidth = '800px', maxHeight = '600px', position = 'default' }: CustomModalProps) => {
    const isCentered = position === 'center'
    return (
        <Modal
            open={open}
            onClose={(event, reason) => {
                if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                    onClose();
                }
            }}
            closeAfterTransition
            hideBackdrop={false}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth,
                    maxHeight,
                    borderRadius: 2,
                    boxShadow: 3,
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                    position: 'absolute',
                    ...(isCentered
                        ? {
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }
                        : {
                            left: '50%',
                            transform: 'translateX(-50%)',
                            top: '10vh'
                        }),
                    mx: 'auto',
                    my: '10vh',
                }}

            >
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        color: 'white',
                    }}
                >
                    <CloseIcon />
                </IconButton>

                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', color: 'white' }}>
                        {title}
                    </Typography>
                </Box>

                <Box sx={{ p: 3 }}>{children}</Box>
            </Box>
        </Modal>
    )
}

export default CustomModal
