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

import type { ContractFormValues, ContractItem, ContractProjectOption, ContractsDictionary } from '../types'
import { commonText, contractsText } from './contractHelpers'

type Props = {
    dictionary: ContractsDictionary
    open: boolean
    mode: 'create' | 'edit'
    contract?: ContractItem | null
    defaultProjectId: number
    projectOptions: ContractProjectOption[]
    projectsLoading: boolean
    loading: boolean
    error: string | null
    onClose: () => void
    onSubmit: (values: ContractFormValues) => void
}

type FormErrors = Partial<Record<keyof ContractFormValues, string>>

const toDateInput = (value: string) => {
    if (!value) return ''

    const date = new Date(value)

    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

const getInitialForm = (mode: Props['mode'], contract: ContractItem | null | undefined, projectId: number): ContractFormValues => ({
    id: contract?.id,
    contract_number: contract?.contract_number ?? '',
    title: contract?.title ?? '',
    description: contract?.description ?? '',
    project_id: contract?.project_id || projectId,
    vendor_id: contract?.vendor_id ?? '',
    start_date: toDateInput(contract?.start_date ?? ''),
    end_date: toDateInput(contract?.end_date ?? ''),
    contract_value: contract?.contract_value ?? '',
    attachment_url: contract?.attachment_url ?? '',
    status: mode === 'edit' ? contract?.status || 'A' : 'A'
})

const ContractFormDialog = ({
    dictionary,
    open,
    mode,
    contract,
    defaultProjectId,
    projectOptions,
    projectsLoading,
    loading,
    error,
    onClose,
    onSubmit
}: Props) => {
    const [form, setForm] = useState(() => getInitialForm(mode, contract, defaultProjectId))
    const [errors, setErrors] = useState<FormErrors>({})
    const projectSelectValue = projectOptions.some(project => project.id === Number(form.project_id)) ? form.project_id : ''

    const setField = <K extends keyof ContractFormValues>(key: K, value: ContractFormValues[K]) => {
        setForm(current => ({ ...current, [key]: value }))
        setErrors(current => ({ ...current, [key]: undefined }))
    }

    const handleChange = (key: keyof ContractFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
        setField(key, event.target.value)
    }

    const validate = () => {
        const nextErrors: FormErrors = {}
        const requiredMessage = contractsText(dictionary, 'validation_required', 'Required')

        if (!form.contract_number.trim()) nextErrors.contract_number = requiredMessage
        if (!form.title.trim()) nextErrors.title = requiredMessage
        if (!Number.isInteger(Number(form.vendor_id)) || Number(form.vendor_id) <= 0) nextErrors.vendor_id = requiredMessage
        if (!Number.isInteger(Number(form.project_id)) || Number(form.project_id) <= 0) nextErrors.project_id = requiredMessage
        if (projectOptions.length > 0 && !projectOptions.some(project => project.id === Number(form.project_id))) {
            nextErrors.project_id = contractsText(dictionary, 'validation_project', 'Select a valid project')
        }
        if (!form.start_date) nextErrors.start_date = requiredMessage
        if (!form.end_date) nextErrors.end_date = requiredMessage
        if (form.start_date && form.end_date && form.end_date < form.start_date) {
            nextErrors.end_date = contractsText(dictionary, 'validation_end_date', 'End Date must be on or after Start Date')
        }
        if (form.contract_value !== '' && (!Number.isFinite(Number(form.contract_value)) || Number(form.contract_value) < 0)) {
            nextErrors.contract_value = contractsText(dictionary, 'validation_contract_value', 'Enter a valid contract value')
        }

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
                {mode === 'create'
                    ? contractsText(dictionary, 'add_contract', 'Add Contract')
                    : contractsText(dictionary, 'edit_contract', 'Edit Contract')}
                <IconButton
                    aria-label={commonText(dictionary, 'close', 'Close')}
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
                    id="contract-form"
                    onSubmit={handleSubmit}
                    sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, pt: 1 }}
                >
                    {error && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{error}</Alert>}
                    <TextField
                        required
                        size="small"
                        label={contractsText(dictionary, 'contract_number', 'Contract Number')}
                        value={form.contract_number}
                        onChange={handleChange('contract_number')}
                        error={Boolean(errors.contract_number)}
                        helperText={errors.contract_number}
                    />
                    <TextField
                        required
                        size="small"
                        label={contractsText(dictionary, 'contract_title', 'Title')}
                        value={form.title}
                        onChange={handleChange('title')}
                        error={Boolean(errors.title)}
                        helperText={errors.title}
                    />
                    <TextField
                        required
                        select
                        size="small"
                        label={contractsText(dictionary, 'project_id', 'Project ID')}
                        value={projectSelectValue}
                        onChange={handleChange('project_id')}
                        disabled={mode === 'edit' || loading || projectsLoading || projectOptions.length === 0}
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
                        label={contractsText(dictionary, 'vendor', 'Vendor')}
                        value={form.vendor_id}
                        onChange={handleChange('vendor_id')}
                        error={Boolean(errors.vendor_id)}
                        helperText={errors.vendor_id}
                        slotProps={{ htmlInput: { min: 1 } }}
                    />
                    <TextField
                        required
                        size="small"
                        type="date"
                        label={contractsText(dictionary, 'start_date', 'Start Date')}
                        value={form.start_date}
                        onChange={handleChange('start_date')}
                        error={Boolean(errors.start_date)}
                        helperText={errors.start_date}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                        required
                        size="small"
                        type="date"
                        label={contractsText(dictionary, 'end_date', 'End Date')}
                        value={form.end_date}
                        onChange={handleChange('end_date')}
                        error={Boolean(errors.end_date)}
                        helperText={errors.end_date}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    <TextField
                        size="small"
                        type="number"
                        label={contractsText(dictionary, 'contract_value', 'Contract Value')}
                        value={form.contract_value}
                        onChange={handleChange('contract_value')}
                        error={Boolean(errors.contract_value)}
                        helperText={errors.contract_value}
                        slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                    />
                    {mode === 'edit' && (
                        <TextField
                            select
                            size="small"
                            label={contractsText(dictionary, 'status', 'Status')}
                            value={form.status}
                            onChange={handleChange('status')}
                        >
                            <MenuItem value="A">{contractsText(dictionary, 'status_active', 'Active')}</MenuItem>
                            <MenuItem value="I">{contractsText(dictionary, 'status_inactive', 'Inactive')}</MenuItem>
                        </TextField>
                    )}
                    <TextField
                        size="small"
                        label={contractsText(dictionary, 'attachment', 'Attachment URL')}
                        value={form.attachment_url}
                        onChange={handleChange('attachment_url')}
                    />
                    <TextField
                        multiline
                        minRows={3}
                        label={contractsText(dictionary, 'description', 'Description')}
                        value={form.description}
                        onChange={handleChange('description')}
                        sx={{ gridColumn: '1 / -1' }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={loading}>{commonText(dictionary, 'cancel', 'Cancel')}</Button>
                <Button
                    type="submit"
                    form="contract-form"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    disabled={loading}
                >
                    {commonText(dictionary, 'save', 'Save')}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ContractFormDialog
