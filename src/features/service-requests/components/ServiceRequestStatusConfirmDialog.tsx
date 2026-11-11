import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    Typography
} from '@mui/material'
import type { ReactNode } from 'react'

import type { ServiceRequestsDictionary } from '../types'
import { commonText, serviceRequestsText } from './serviceRequestHelpers'

type Props = {
    dictionary: ServiceRequestsDictionary
    open: boolean
    title: string
    message: string
    confirmLabel: string
    icon?: ReactNode
    requestCode: string
    loading: boolean
    error: string | null
    onClose: () => void
    onConfirm: () => void
}

const ServiceRequestStatusConfirmDialog = ({
    dictionary,
    open,
    title,
    message,
    confirmLabel,
    icon,
    requestCode,
    loading,
    error,
    onClose,
    onConfirm
}: Props) => (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
        <DialogContent>
            <Stack spacing={1.5}>
                <DialogContentText>{message}</DialogContentText>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {serviceRequestsText(dictionary, 'request_code')}: {requestCode}
                </Typography>
                {error && <Alert severity="error">{error}</Alert>}
            </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={onClose} disabled={loading}>{commonText(dictionary, 'cancel')}</Button>
            <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : (icon ?? <CheckCircleIcon />)}
                onClick={onConfirm}
                disabled={loading}
            >
                {confirmLabel}
            </Button>
        </DialogActions>
    </Dialog>
)

export default ServiceRequestStatusConfirmDialog
