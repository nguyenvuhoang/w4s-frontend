import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, Dialog, DialogActions, DialogContent, IconButton, Stack, Typography } from '@mui/material'
import { QRCode } from 'react-qrcode-logo'

import { CreatedResidentActivation } from '../../types'
import { ResidentDictionary, text } from './formControls'

type Props = {
    open: boolean
    activation: CreatedResidentActivation | null
    dict: ResidentDictionary
    onClose: () => void
}

export function ResidentActivationQrDialog({ open, activation, dict, onClose }: Props) {
    const qr_value = activation
        ? JSON.stringify({
            activation_code: activation.activation_code,
            username: activation.username,
            password: activation.password
        })
        : ''

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    overflow: 'hidden'
                }
            }}
        >
            <DialogContent sx={{ p: 0 }}>
                <Box
                    sx={{
                        px: 3,
                        pt: 3,
                        pb: 2,
                        bgcolor: 'background.paper',
                        position: 'relative'
                    }}
                >
                    <IconButton
                        aria-label={text(dict, 'close', 'Close')}
                        onClick={onClose}
                        sx={{ position: 'absolute', right: 14, top: 14 }}
                    >
                        <CloseIcon />
                    </IconButton>

                    <Stack spacing={1.5} alignItems="center" sx={{ pr: 3 }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                bgcolor: 'success.light',
                                color: 'success.dark'
                            }}
                        >
                            <CheckCircleIcon />
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                {text(dict, 'create_success', 'Resident profile created successfully')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {text(dict, 'activation_qr_title', 'Resident activation QR')}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Stack spacing={2.5} alignItems="center" sx={{ px: 3, pb: 3 }}>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 4,
                            bgcolor: 'grey.50',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)'
                        }}
                    >
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: 3,
                                bgcolor: 'common.white',
                                lineHeight: 0
                            }}
                        >
                            <QRCode
                                value={qr_value || ' '}
                                size={210}
                                quietZone={6}
                                bgColor="#ffffff"
                                fgColor="#111827"
                                qrStyle="squares"
                                eyeRadius={8}
                            />
                        </Box>
                    </Box>

                    <Stack
                        spacing={1.5}
                        sx={{
                            width: '100%',
                            p: 2,
                            borderRadius: 3,
                            bgcolor: 'grey.50',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                {text(dict, 'username', 'Username')}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 800, wordBreak: 'break-word' }}>
                                {activation?.username || '-'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                {text(dict, 'password', 'Password')}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 800, wordBreak: 'break-word' }}>
                                {activation?.password || '-'}
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
                <Button fullWidth variant="contained" onClick={onClose} sx={{ borderRadius: 2, py: 1 }}>
                    {text(dict, 'close', 'Close')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
