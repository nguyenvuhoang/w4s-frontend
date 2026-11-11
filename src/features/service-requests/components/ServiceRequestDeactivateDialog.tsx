import BlockIcon from '@mui/icons-material/Block'
import {
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

import type { ServiceRequestItem, ServiceRequestsDictionary } from '../types'
import { commonText, serviceRequestsText } from './serviceRequestHelpers'

type Props = {
    dictionary: ServiceRequestsDictionary
    request: ServiceRequestItem | null
    loading: boolean
    onClose: () => void
    onConfirm: () => void
}

const ServiceRequestDeactivateDialog = ({ dictionary, request, loading, onClose, onConfirm }: Props) => (
    <Dialog open={Boolean(request)} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
            {serviceRequestsText(dictionary, 'confirm_deactivate_service_request')}
        </DialogTitle>
        <DialogContent>
            <Stack spacing={1.5}>
                <DialogContentText>{serviceRequestsText(dictionary, 'deactivate_service_request_message')}</DialogContentText>
                {request && (
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {request.request_code} - {request.title}
                    </Typography>
                )}
            </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={onClose} disabled={loading}>{commonText(dictionary, 'cancel')}</Button>
            <Button
                variant="contained"
                color="warning"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <BlockIcon />}
                onClick={onConfirm}
                disabled={loading}
            >
                {serviceRequestsText(dictionary, 'deactivate_service_request')}
            </Button>
        </DialogActions>
    </Dialog>
)

export default ServiceRequestDeactivateDialog
