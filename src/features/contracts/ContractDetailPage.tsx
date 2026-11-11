'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DescriptionIcon from '@mui/icons-material/Description'
import EditIcon from '@mui/icons-material/Edit'
import { Alert, Box, Button, Chip, Divider, Grid, Link, Paper, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import { useState } from 'react'

import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import { usePermission } from '@shared/permissions/usePermission'
import SwalAlert from '@shared/utils/SwalAlert'

import ContractDeleteDialog from './components/ContractDeleteDialog'
import ContractEditDialog from './components/ContractEditDialog'
import {
    commonText,
    contractsText,
    emptyText,
    formatContractDate,
    formatContractValue,
    getContractStatusColor,
    getContractStatusLabel
} from './components/contractHelpers'
import { contractService } from './services/contractService'
import type { ContractFormValues, ContractItem, ContractsDictionary } from './types'

type ContractDetailError = {
    message: string
    executionId?: string
}

type Props = {
    dictionary: ContractsDictionary
    locale: Locale
    sessiontoken?: string
    contract: ContractItem | null
    error?: ContractDetailError | null
}

const actionButtonSx = {
    minWidth: 112,
    height: 36
}

const toWorkflowDate = (value: string) => new Date(`${value}T00:00:00Z`).toISOString()

const normalizeContractValue = (value: string | number): number | '' => {
    if (value === '') return ''

    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : ''
}

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={0.75}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                {children}
            </Box>
        </Stack>
    </Grid>
)

const ContractDetailPage = ({ dictionary, locale, sessiontoken, contract, error }: Props) => {
    const router = useRouter()
    const permission = usePermission({ href: '/contracts/contracts' })
    const [detail, setDetail] = useState(contract)
    const [detailError, setDetailError] = useState(error ?? null)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)

    const goBack = () => router.push(`/${locale}/contracts/contracts`)

    const projectOptions = detail
        ? [{ id: detail.project_id, code: detail.project_code, name: detail.project_code || String(detail.project_id) }]
        : []

    const refreshDetail = async (id: number) => {
        const fresh = await contractService.getContractById({
            sessiontoken,
            language: locale,
            id
        })

        setDetail(fresh)
        setDetailError(null)
    }

    const handleUpdate = async (values: ContractFormValues) => {
        if (!detail || saving) return

        setSaving(true)
        setActionError(null)

        try {
            await contractService.updateContract({
                sessiontoken,
                language: locale,
                fields: {
                    id: Number(values.id),
                    start_date: toWorkflowDate(values.start_date),
                    contract_value: normalizeContractValue(values.contract_value),
                    description: values.description.trim(),
                    status: values.status,
                    vendor_id: Number(values.vendor_id),
                    attachment_url: values.attachment_url.trim(),
                    title: values.title.trim(),
                    end_date: toWorkflowDate(values.end_date),
                    ContractNumber: values.contract_number.trim()
                }
            })
            await refreshDetail(detail.id)
            setEditOpen(false)
        } catch (caught) {
            setActionError(caught instanceof Error
                ? caught.message
                : contractsText(dictionary, 'contract_update_failed', 'Failed to update contract.'))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!detail || deleting) return

        if (!permission.canDelete) {
            SwalAlert('warning', dictionary['common'].nopermissionview, 'center')

            return
        }

        setDeleting(true)
        setActionError(null)

        try {
            await contractService.deleteContract({
                sessiontoken,
                language: locale,
                id: detail.id
            })
            router.push(`/${locale}/contracts/contracts`)
        } catch (caught) {
            setActionError(caught instanceof Error
                ? caught.message
                : contractsText(dictionary, 'contract_delete_failed', 'Failed to delete contract.'))
        } finally {
            setDeleting(false)
        }
    }

    return (
        <ContentWrapper
            title={contractsText(dictionary, 'contract_detail_page_title', 'Contract Detail')}
            description={contractsText(dictionary, 'contract_detail_page_subtitle', 'View contract information.')}
            icon={<DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>
                        {commonText(dictionary, 'back', 'Back')}
                    </Button>

                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
                        <PermissionGuard href="/contracts/contracts" action="MODIFY">
                            <Button
                                variant="contained"
                                startIcon={<EditIcon />}
                                sx={actionButtonSx}
                                disabled={!detail?.id}
                                onClick={() => setEditOpen(true)}
                            >
                                {commonText(dictionary, 'edit', 'Edit')}
                            </Button>
                        </PermissionGuard>
                        <PermissionGuard href="/contracts/contracts" action="DELETE">
                            <Button
                                color="error"
                                variant="outlined"
                                startIcon={<DeleteOutlineIcon />}
                                sx={actionButtonSx}
                                disabled={!detail?.id || deleting}
                                onClick={() => setDeleteOpen(true)}
                            >
                                {deleting
                                    ? contractsText(dictionary, 'deleting', 'Deleting...')
                                    : commonText(dictionary, 'delete', 'Delete')}
                            </Button>
                        </PermissionGuard>
                    </Stack>
                </Stack>

                {detailError && (
                    <WorkflowErrorAlert
                        title={contractsText(dictionary, 'detail_load_failed', 'Unable to load contract detail.')}
                        message={detailError.message}
                        executionId={detailError.executionId}
                        executionIdLabel={contractsText(dictionary, 'error_reference_label', locale === 'vi' ? 'Mã tra cứu lỗi' : 'Error Reference')}
                        copyLabel={commonText(dictionary, 'copy', locale === 'vi' ? 'Sao chép' : 'Copy')}
                        copiedLabel={commonText(dictionary, 'copiedErrorReference', locale === 'vi' ? 'Đã sao chép mã tra cứu' : 'Error reference copied')}
                        copySuccessMessage={contractsText(dictionary, 'copy_error_reference_success', locale === 'vi' ? 'Đã sao chép mã tra cứu' : 'Copied error reference.')}
                        copyFailedMessage={contractsText(dictionary, 'copy_error_reference_failed', locale === 'vi' ? 'Không thể sao chép mã tra cứu.' : 'Unable to copy error reference.')}
                    />
                )}

                {actionError && <Alert severity="error">{actionError}</Alert>}

                {!detail ? (
                    <Alert severity={detailError ? 'warning' : 'info'}>
                        {contractsText(dictionary, 'contract_detail_not_found', 'Contract detail was not found.')}
                    </Alert>
                ) : (
                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                        <Stack spacing={3}>
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                                <Stack spacing={0.5}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        {emptyText(detail.contract_number)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {emptyText(detail.title)}
                                    </Typography>
                                </Stack>
                                <Chip
                                    size="small"
                                    color={getContractStatusColor(detail.status)}
                                    label={getContractStatusLabel(dictionary, detail.status)}
                                    sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
                                />
                            </Stack>

                            <Divider />

                            <Stack spacing={2}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {contractsText(dictionary, 'general_information', 'General Information')}
                                </Typography>
                                <Grid container spacing={3}>
                                    <DetailRow label={contractsText(dictionary, 'contract_number', 'Contract Number')}>
                                        <Typography sx={{ fontWeight: 700 }}>{emptyText(detail.contract_number)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={contractsText(dictionary, 'contract_title', 'Title')}>
                                        <Typography>{emptyText(detail.title)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={contractsText(dictionary, 'project_code', 'Project Code')}>
                                        <Typography>{emptyText(detail.project_code || detail.project_id)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={contractsText(dictionary, 'vendor_code', 'Vendor Code')}>
                                        <Typography>{emptyText(detail.vendor_code || detail.vendor_id)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={contractsText(dictionary, 'start_date', 'Start Date')}>
                                        <Typography>{formatContractDate(detail.start_date)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={contractsText(dictionary, 'end_date', 'End Date')}>
                                        <Typography>{formatContractDate(detail.end_date)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={contractsText(dictionary, 'contract_value', 'Contract Value')}>
                                        <Typography>{formatContractValue(detail.contract_value)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={contractsText(dictionary, 'status', 'Status')}>
                                        <Chip
                                            size="small"
                                            color={getContractStatusColor(detail.status)}
                                            label={getContractStatusLabel(dictionary, detail.status)}
                                        />
                                    </DetailRow>
                                    <Grid size={{ xs: 12 }}>
                                        <Stack spacing={0.75}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                                {contractsText(dictionary, 'description', 'Description')}
                                            </Typography>
                                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{emptyText(detail.description)}</Typography>
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12 }}>
                                        <Stack spacing={0.75}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                                {contractsText(dictionary, 'attachment', 'Attachment URL')}
                                            </Typography>
                                            {detail.attachment_url ? (
                                                <Link href={detail.attachment_url} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: 'anywhere' }}>
                                                    {detail.attachment_url}
                                                </Link>
                                            ) : (
                                                <Typography>{emptyText(null)}</Typography>
                                            )}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Stack>
                    </Paper>
                )}
            </Stack>

            {detail && (
                <ContractEditDialog
                    dictionary={dictionary}
                    open={editOpen}
                    contract={detail}
                    defaultProjectId={detail.project_id}
                    projectOptions={projectOptions}
                    projectsLoading={false}
                    loading={saving}
                    error={actionError}
                    onClose={() => { if (!saving) setEditOpen(false) }}
                    onSubmit={handleUpdate}
                />
            )}

            <ContractDeleteDialog
                dictionary={dictionary}
                open={deleteOpen}
                loading={deleting}
                onClose={() => { if (!deleting) setDeleteOpen(false) }}
                onConfirm={() => void handleDelete()}
            />
        </ContentWrapper>
    )
}

export default ContractDetailPage
