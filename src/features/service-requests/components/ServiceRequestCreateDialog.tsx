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
    CreateServiceRequestForm,
    ServiceRequestProjectOption,
    ServiceRequestsDictionary
} from '../types'
import {
    commonText,
    getRequestTypeLabel,
    requestTypeOptions,
    serviceRequestsText
} from './serviceRequestHelpers'

type Props = {
    dictionary: ServiceRequestsDictionary
    open: boolean
    loading: boolean
    error: string | null
    defaultProjectId: number
    projectOptions: ServiceRequestProjectOption[]
    projectsLoading: boolean
    onClose: () => void
    onSubmit: (values: CreateServiceRequestForm) => void
}

type FormErrors = Partial<Record<keyof CreateServiceRequestForm, string>>

const ServiceRequestCreateDialog = ({
    dictionary,
    open,
    loading,
    error,
    defaultProjectId,
    projectOptions,
    projectsLoading,
    onClose,
    onSubmit
}: Props) => {
    const [form, setForm] = useState<CreateServiceRequestForm>({
        attachments: '',
        request_type: 'SR',
        apartment_id: '',
        project_id: defaultProjectId,
        title: '',
        content: '',
        service_request_category_id: ''
    })
    const [errors, setErrors] = useState<FormErrors>({})
    const projectValue = projectOptions.some(project => project.id === Number(form.project_id)) ? form.project_id : ''

    const handleChange = (key: keyof CreateServiceRequestForm) => (event: ChangeEvent<HTMLInputElement>) => {
        setForm(current => ({ ...current, [key]: event.target.value }))
        setErrors(current => ({ ...current, [key]: undefined }))
    }

    const validate = () => {
        const nextErrors: FormErrors = {}
        const required = serviceRequestsText(dictionary, 'validation_required')

        if (!form.request_type) nextErrors.request_type = required
        if (!Number.isInteger(Number(form.project_id)) || Number(form.project_id) <= 0) nextErrors.project_id = required
        if (!Number.isInteger(Number(form.apartment_id)) || Number(form.apartment_id) <= 0) nextErrors.apartment_id = required
        if (!Number.isInteger(Number(form.service_request_category_id)) || Number(form.service_request_category_id) <= 0) {
            nextErrors.service_request_category_id = required
        }
        if (!form.title.trim()) nextErrors.title = required
        if (!form.content.trim()) nextErrors.content = required

        setErrors(nextErrors)

        return Object.keys(nextErrors).length === 0
    }

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        if (validate()) onSubmit(form)
    }

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ pr: 7, fontWeight: 800 }}>
                {serviceRequestsText(dictionary, 'create_service_request')}
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
                <Stack
                    component="form"
                    id="service-request-create-form"
                    onSubmit={handleSubmit}
                    sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, pt: 1 }}
                >
                    {error && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{error}</Alert>}
                    <TextField
                        required
                        select
                        size="small"
                        label={serviceRequestsText(dictionary, 'request_type')}
                        value={form.request_type}
                        onChange={handleChange('request_type')}
                        error={Boolean(errors.request_type)}
                        helperText={errors.request_type}
                    >
                        {requestTypeOptions.map(type => (
                            <MenuItem key={type} value={type}>{getRequestTypeLabel(dictionary, type)}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        required
                        select
                        size="small"
                        label={serviceRequestsText(dictionary, 'project')}
                        value={projectValue}
                        onChange={handleChange('project_id')}
                        disabled={loading || projectsLoading || projectOptions.length === 0}
                        error={Boolean(errors.project_id)}
                        helperText={errors.project_id}
                        slotProps={{
                            input: {
                                endAdornment: projectsLoading ? <CircularProgress size={16} color="inherit" /> : undefined
                            }
                        }}
                    >
                        {projectOptions.map(project => (
                            <MenuItem key={project.id} value={project.id}>{project.name || project.code || project.id}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        required
                        size="small"
                        type="number"
                        label={serviceRequestsText(dictionary, 'apartment_id')}
                        value={form.apartment_id}
                        onChange={handleChange('apartment_id')}
                        error={Boolean(errors.apartment_id)}
                        helperText={errors.apartment_id}
                        slotProps={{ htmlInput: { min: 1 } }}
                    />
                    <TextField
                        required
                        size="small"
                        type="number"
                        label={serviceRequestsText(dictionary, 'service_request_category_id')}
                        value={form.service_request_category_id}
                        onChange={handleChange('service_request_category_id')}
                        error={Boolean(errors.service_request_category_id)}
                        helperText={errors.service_request_category_id}
                        slotProps={{ htmlInput: { min: 1 } }}
                    />
                    <TextField
                        required
                        size="small"
                        label={serviceRequestsText(dictionary, 'request_title')}
                        value={form.title}
                        onChange={handleChange('title')}
                        error={Boolean(errors.title)}
                        helperText={errors.title}
                        sx={{ gridColumn: '1 / -1' }}
                    />
                    <TextField
                        required
                        multiline
                        minRows={4}
                        label={serviceRequestsText(dictionary, 'content')}
                        value={form.content}
                        onChange={handleChange('content')}
                        error={Boolean(errors.content)}
                        helperText={errors.content}
                        sx={{ gridColumn: '1 / -1' }}
                    />
                    <TextField
                        size="small"
                        label={serviceRequestsText(dictionary, 'attachments')}
                        value={form.attachments}
                        onChange={handleChange('attachments')}
                        sx={{ gridColumn: '1 / -1' }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={loading}>{commonText(dictionary, 'cancel')}</Button>
                <Button
                    type="submit"
                    form="service-request-create-form"
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

export default ServiceRequestCreateDialog
