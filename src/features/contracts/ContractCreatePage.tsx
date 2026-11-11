'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DescriptionIcon from '@mui/icons-material/Description'
import SaveIcon from '@mui/icons-material/Save'
import {
    Alert,
    Button,
    CircularProgress,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import { useState } from 'react'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import SwalAlert from '@/shared/utils/SwalAlert'

import {
    commonText,
    contractsText
} from './components/contractHelpers'
import { contractService } from './services/contractService'
import type { ContractFormValues, ContractsDictionary, CreateContractRequest } from './types'

type Props = {
    dictionary: ContractsDictionary
    locale: Locale
    sessiontoken?: string
}

type FormErrors = Partial<Record<keyof ContractFormValues, string>>

const toWorkflowDate = (value: string) => new Date(`${value}T00:00:00Z`).toISOString()

const normalizeContractValue = (value: string | number): number | '' => {
    if (value === '') return ''

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : ''
}

const buildInitialForm = (projectId?: number): ContractFormValues => ({
    contract_number: '',
    title: '',
    description: '',
    project_id: projectId ?? '',
    vendor_id: '',
    start_date: '',
    end_date: '',
    contract_value: '',
    attachment_url: '',
    status: 'A'
})

const ContractCreatePage = ({ dictionary, locale, sessiontoken }: Props) => {
    const router = useRouter()
    const workingProject = useWorkingProject()
    const [form, setForm] = useState<ContractFormValues>(() => buildInitialForm(workingProject?.id))
    const [errors, setErrors] = useState<FormErrors>({})
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const projectOptions = workingProject ? [workingProject] : []
    const projectSelectValue = projectOptions.some(project => project.id === Number(form.project_id)) ? form.project_id : ''

    const goBack = () => router.push(`/${locale}/contracts/contracts`)

    const setField = <K extends keyof ContractFormValues>(key: K, value: ContractFormValues[K]) => {
        setSubmitError(null)
        setForm(current => ({ ...current, [key]: value }))
        setErrors(current => ({ ...current, [key]: undefined }))
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

    const submit = async () => {
        if (!validate() || saving) return

        setSaving(true)
        setSubmitError(null)

        try {
            const payload: CreateContractRequest = {
                description: form.description.trim(),
                start_date: toWorkflowDate(form.start_date),
                project_id: Number(form.project_id),
                contract_value: normalizeContractValue(form.contract_value),
                vendor_id: Number(form.vendor_id),
                attachment_url: form.attachment_url.trim(),
                title: form.title.trim(),
                end_date: toWorkflowDate(form.end_date),
                ContractNumber: form.contract_number.trim()
            }

            await contractService.createContract({
                sessiontoken,
                language: locale,
                fields: payload
            })

            SwalAlert('success', contractsText(dictionary, 'contract_created', 'Contract has been created.'), 'center')
            router.push(`/${locale}/contracts/contracts`)
            router.refresh()
        } catch (caught) {
            const message = caught instanceof Error
                ? caught.message
                : contractsText(dictionary, 'contract_create_failed', 'Failed to create contract.')

            setSubmitError(message)
            SwalAlert('error', message, 'center')
        } finally {
            setSaving(false)
        }
    }

    return (
        <ContentWrapper
            title={contractsText(dictionary, 'contract_create_page_title', 'Create Contract')}
            description={contractsText(dictionary, 'contract_create_page_subtitle', 'Create a new contract for the current project.')}
            icon={<DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
                <Stack spacing={3} sx={{ mt: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
                            {commonText(dictionary, 'back', 'Back')}
                        </Button>

                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
                            <Button variant="outlined" onClick={goBack} disabled={saving}>
                                {commonText(dictionary, 'cancel', 'Cancel')}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={saving ? <CircularProgress color="inherit" size={16} /> : <SaveIcon />}
                                disabled={saving}
                                onClick={() => void submit()}
                            >
                                {saving
                                    ? commonText(dictionary, 'processing', 'Processing...')
                                    : contractsText(dictionary, 'create_action', 'Create')}
                            </Button>
                        </Stack>
                    </Stack>

                    {submitError && <Alert severity="error">{submitError}</Alert>}

                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                        <Stack spacing={3}>
                            <Stack spacing={0.5}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    {contractsText(dictionary, 'contract_create_form_title', 'Contract Information')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {contractsText(dictionary, 'contract_create_form_subtitle', 'Fill in the fields below to create a new contract.')}
                                </Typography>
                            </Stack>

                            <Stack
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                    gap: 2
                                }}
                            >
                                <TextField
                                    required
                                    size="small"
                                    label={contractsText(dictionary, 'contract_number', 'Contract Number')}
                                    value={form.contract_number}
                                    onChange={event => setField('contract_number', event.target.value)}
                                    error={Boolean(errors.contract_number)}
                                    helperText={errors.contract_number}
                                />
                                <TextField
                                    required
                                    size="small"
                                    label={contractsText(dictionary, 'contract_title', 'Title')}
                                    value={form.title}
                                    onChange={event => setField('title', event.target.value)}
                                    error={Boolean(errors.title)}
                                    helperText={errors.title}
                                />
                                <TextField
                                    required
                                    select
                                    size="small"
                                    label={contractsText(dictionary, 'project_id', 'Project ID')}
                                    value={projectSelectValue}
                                    onChange={event => setField('project_id', event.target.value)}
                                    disabled={saving || projectOptions.length === 0}
                                    error={Boolean(errors.project_id)}
                                    helperText={errors.project_id}
                                >
                                    {projectOptions.map(project => (
                                        <MenuItem key={project.id} value={project.id}>
                                            {project.name || project.code || project.id}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    required
                                    size="small"
                                    type="number"
                                    label={contractsText(dictionary, 'vendor', 'Vendor')}
                                    value={form.vendor_id}
                                    onChange={event => setField('vendor_id', event.target.value)}
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
                                    onChange={event => setField('start_date', event.target.value)}
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
                                    onChange={event => setField('end_date', event.target.value)}
                                    error={Boolean(errors.end_date)}
                                    helperText={errors.end_date}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                                <TextField
                                    size="small"
                                    type="number"
                                    label={contractsText(dictionary, 'contract_value', 'Contract Value')}
                                    value={form.contract_value}
                                    onChange={event => setField('contract_value', event.target.value)}
                                    error={Boolean(errors.contract_value)}
                                    helperText={errors.contract_value}
                                    slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                                />
                                <TextField
                                    size="small"
                                    label={contractsText(dictionary, 'attachment', 'Attachment URL')}
                                    value={form.attachment_url}
                                    onChange={event => setField('attachment_url', event.target.value)}
                                />
                                <TextField
                                    multiline
                                    minRows={3}
                                    label={contractsText(dictionary, 'description', 'Description')}
                                    value={form.description}
                                    onChange={event => setField('description', event.target.value)}
                                    sx={{ gridColumn: '1 / -1' }}
                                />
                            </Stack>
                        </Stack>
                    </Paper>
                </Stack>
            </RequireWorkingProject>
        </ContentWrapper>
    )
}

export default ContractCreatePage
