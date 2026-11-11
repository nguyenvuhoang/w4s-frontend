import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Stack,
    TextField
} from '@mui/material'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'

import type {
    ServiceRequestActionForm,
    ServiceRequestItem,
    ServiceRequestsDictionary
} from '../types'
import {
    commonText,
    getRequestStatusLabel,
    requestStatusOptions,
    serviceRequestsText
} from './serviceRequestHelpers'

export type ServiceRequestActionMode = 'status' | 'cancel'

type Props = {
    dictionary: ServiceRequestsDictionary
    open: boolean
    mode: ServiceRequestActionMode
    request: ServiceRequestItem
    loading: boolean
    error: string | null
    onClose: () => void
    onSubmit: (values: ServiceRequestActionForm) => void
}

type FormErrors = Partial<Record<keyof ServiceRequestActionForm, string>>

const titleKeys: Record<ServiceRequestActionMode, string> = {
    status: 'update_request_status',
    cancel: 'cancel_service_request'
}

const ServiceRequestActionDialog = ({ dictionary, open, mode, request, loading, error, onClose, onSubmit }: Props) => {
    const [form, setForm] = useState<ServiceRequestActionForm>({
        request_status: '',
        internal_note: '',
        cancel_reason: ''
    })
    const [errors, setErrors] = useState<FormErrors>({})

    const handleChange = (key: keyof ServiceRequestActionForm) => (event: ChangeEvent<HTMLInputElement>) => {
        setForm(current => ({ ...current, [key]: event.target.value }))
        setErrors(current => ({ ...current, [key]: undefined }))
    }

    const validate = () => {
        const nextErrors: FormErrors = {}

        if (mode === 'status' && !form.request_status) {
            nextErrors.request_status = serviceRequestsText(dictionary, 'request_status_required')
        }
        if (mode === 'cancel' && !form.cancel_reason.trim()) {
            nextErrors.cancel_reason = serviceRequestsText(dictionary, 'cancel_reason_required')
        }

        setErrors(nextErrors)

        return Object.keys(nextErrors).length === 0
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        if (validate()) onSubmit(form)
    }

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
                {serviceRequestsText(dictionary, titleKeys[mode])}
                <IconButton
                    aria-label={commonText(dictionary, 'close')}
                    onClick={onClose}
                    disabled={loading}
                    sx={{ position: 'absolute', right: 12, top: 10 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack component="form" id="service-request-action-form" onSubmit={handleSubmit} spacing={2} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField
                        size="small"
                        label={serviceRequestsText(dictionary, 'request_code')}
                        value={request.request_code}
                        slotProps={{ input: { readOnly: true } }}
                    />
                    {mode === 'status' && (
                        <>
                            <TextField
                                required
                                select
                                size="small"
                                label={serviceRequestsText(dictionary, 'request_status')}
                                value={form.request_status}
                                onChange={handleChange('request_status')}
                                error={Boolean(errors.request_status)}
                                helperText={errors.request_status}
                            >
                                {requestStatusOptions.filter(Boolean).map(status => (
                                    <MenuItem key={status} value={status}>{getRequestStatusLabel(dictionary, status)}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                multiline
                                minRows={3}
                                label={serviceRequestsText(dictionary, 'internal_note')}
                                value={form.internal_note}
                                onChange={handleChange('internal_note')}
                            />
                        </>
                    )}
                    {mode === 'cancel' && (
                        <TextField
                            required
                            multiline
                            minRows={3}
                            label={serviceRequestsText(dictionary, 'cancel_reason')}
                            value={form.cancel_reason}
                            onChange={handleChange('cancel_reason')}
                            error={Boolean(errors.cancel_reason)}
                            helperText={errors.cancel_reason}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={loading}>{commonText(dictionary, 'cancel')}</Button>
                <Button
                    type="submit"
                    form="service-request-action-form"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    disabled={loading}
                >
                    {commonText(dictionary, 'save')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ServiceRequestActionDialog
