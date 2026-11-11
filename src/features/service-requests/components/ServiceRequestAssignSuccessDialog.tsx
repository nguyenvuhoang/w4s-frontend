import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    Typography
} from '@mui/material'
import type { Locale } from '@/configs/i18n'
import Link from 'next/link'

import type { AssignSuccessInfo } from '../hooks/useServiceRequests'
import type { ServiceRequestsDictionary } from '../types'
import {
    commonText,
    displayText,
    getRequestStatusColor,
    getRequestStatusLabel,
    serviceRequestsText
} from './serviceRequestHelpers'

type Props = {
    dictionary: ServiceRequestsDictionary
    locale: Locale
    info: AssignSuccessInfo
    onClose: () => void
}

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' }, gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
        <Box>{children}</Box>
    </Box>
)

const ServiceRequestAssignSuccessDialog = ({ dictionary, locale, info, onClose }: Props) => (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
            <Stack direction="row" alignItems="center" gap={1}>
                <CheckCircleIcon color="success" />
                {serviceRequestsText(dictionary, 'assign_handler_success_title')}
            </Stack>
            <IconButton
                aria-label={commonText(dictionary, 'close')}
                onClick={onClose}
                sx={{ position: 'absolute', right: 12, top: 10 }}
            >
                <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
                <Typography>{serviceRequestsText(dictionary, 'assign_handler_success_message')}</Typography>

                <Divider />

                <Stack spacing={1.25}>
                    <InfoRow label={serviceRequestsText(dictionary, 'request_code')}>
                        <Typography sx={{ fontWeight: 700 }}>{displayText(info.response.request_code)}</Typography>
                    </InfoRow>
                    <InfoRow label={serviceRequestsText(dictionary, 'handler_employee_label')}>
                        <Typography>{displayText(info.handlerName)}</Typography>
                    </InfoRow>
                    <InfoRow label={serviceRequestsText(dictionary, 'handler_user_code')}>
                        <Typography>{displayText(info.response.handler_user_code)}</Typography>
                    </InfoRow>
                    <InfoRow label={serviceRequestsText(dictionary, 'request_status')}>
                        <Chip
                            size="small"
                            color={getRequestStatusColor(info.response.status)}
                            label={getRequestStatusLabel(dictionary, info.response.status)}
                        />
                    </InfoRow>
                    <InfoRow label={serviceRequestsText(dictionary, 'supervisor_user_code')}>
                        <Typography>{displayText(info.response.supervisor_user_code)}</Typography>
                    </InfoRow>
                </Stack>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={onClose}>{commonText(dictionary, 'close')}</Button>
            <Button
                component={Link}
                href={`/${locale}/service-requests/service-requests/${encodeURIComponent(info.requestCode)}`}
                variant="contained"
                startIcon={<VisibilityIcon />}
            >
                {serviceRequestsText(dictionary, 'view_detail')}
            </Button>
        </DialogActions>
    </Dialog>
)

export default ServiceRequestAssignSuccessDialog
