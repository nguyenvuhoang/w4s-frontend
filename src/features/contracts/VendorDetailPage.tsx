'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BusinessIcon from '@mui/icons-material/Business'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import { Alert, Box, Button, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import { usePermission } from '@shared/permissions/usePermission'
import SwalAlert from '@shared/utils/SwalAlert'

import {
    commonText,
    displayVendorValue,
    getVendorStatusColor,
    getVendorStatusLabel,
    vendorsText
} from './components/vendorHelpers'
import { useVendorDetail } from './hooks/useVendorDetail'
import type { VendorItem, VendorsDictionary } from './vendorTypes'

type Props = {
    dictionary: VendorsDictionary
    locale: string
    sessiontoken?: string
    vendor: VendorItem | null
    error?: string | null
}

const actionButtonSx = {
    minWidth: 112,
    height: 36
}

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <Grid size={{ xs: 12, md: 6 }}>
        <Stack spacing={0.75}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Box sx={{ minHeight: 28, display: 'flex', alignItems: 'center' }}>
                {children}
            </Box>
        </Stack>
    </Grid>
)

const VendorDetailPage = ({ dictionary, locale, sessiontoken, vendor, error }: Props) => {
    const detail = useVendorDetail({
        dictionary,
        locale,
        sessiontoken,
        vendor,
        initialError: error
    })
    const permission = usePermission({ href: '/contracts/company' })

    const handleDeleteVendor = () => {
        if (!permission.canDelete) {
            SwalAlert('warning', dictionary['common'].nopermissionview, 'center')

            return
        }

        void detail.deleteVendor()
    }

    return (
        <ContentWrapper
            title={vendorsText(dictionary, 'vendor_detail_page_title', 'Vendor Company Detail')}
            description={vendorsText(dictionary, 'vendor_detail_page_subtitle', 'View vendor company information.')}
            icon={<BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={detail.goBack}>
                        {commonText(dictionary, 'back', 'Back')}
                    </Button>

                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
                        <PermissionGuard href="/contracts/company" action="MODIFY">
                            <Button
                                component={Link}
                                href={detail.vendor?.id ? `/${locale}/contracts/company/${detail.vendor.id}/edit` : `/${locale}/contracts/company`}
                                variant="contained"
                                startIcon={<EditIcon />}
                                sx={actionButtonSx}
                                disabled={!detail.vendor?.id}
                            >
                                {commonText(dictionary, 'edit', 'Edit')}
                            </Button>
                        </PermissionGuard>
                        <PermissionGuard href="/contracts/company" action="DELETE">
                            <Button
                                color="error"
                                variant="outlined"
                                startIcon={<DeleteOutlineIcon />}
                                sx={actionButtonSx}
                                disabled={!detail.vendor?.id || detail.deleting}
                                onClick={handleDeleteVendor}
                            >
                                {detail.deleting
                                    ? vendorsText(dictionary, 'deleting', 'Deleting...')
                                    : commonText(dictionary, 'delete', 'Delete')}
                            </Button>
                        </PermissionGuard>
                    </Stack>
                </Stack>

                {detail.error && <Alert severity="error">{detail.error}</Alert>}

                {!detail.vendor ? (
                    <Alert severity={detail.error ? 'warning' : 'info'}>
                        {vendorsText(dictionary, 'vendor_detail_not_found', 'Vendor detail was not found.')}
                    </Alert>
                ) : (
                    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                        <Stack spacing={3}>
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                                <Stack spacing={0.5}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        {displayVendorValue(detail.vendor.name)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {displayVendorValue(detail.vendor.vendor_code)}
                                    </Typography>
                                </Stack>
                                <Chip
                                    size="small"
                                    color={getVendorStatusColor(detail.vendor.status)}
                                    label={getVendorStatusLabel(dictionary, detail.vendor.status)}
                                    sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
                                />
                            </Stack>

                            <Divider />

                            <Stack spacing={2}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {vendorsText(dictionary, 'general_information', 'General Information')}
                                </Typography>
                                <Grid container spacing={3}>
                                    <DetailRow label={vendorsText(dictionary, 'vendor_code', 'Vendor Code')}>
                                        <Typography sx={{ fontWeight: 700 }}>{displayVendorValue(detail.vendor.vendor_code)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={vendorsText(dictionary, 'vendor_name', 'Company / Vendor Name')}>
                                        <Typography>{displayVendorValue(detail.vendor.name)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={vendorsText(dictionary, 'tax_code', 'Tax Code')}>
                                        <Typography>{displayVendorValue(detail.vendor.tax_code)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={vendorsText(dictionary, 'project_id', 'Project ID')}>
                                        <Typography>{displayVendorValue(detail.vendor.project_id)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={vendorsText(dictionary, 'status', 'Status')}>
                                        <Chip
                                            size="small"
                                            color={getVendorStatusColor(detail.vendor.status)}
                                            label={getVendorStatusLabel(dictionary, detail.vendor.status)}
                                        />
                                    </DetailRow>
                                </Grid>
                            </Stack>

                            <Divider />

                            <Stack spacing={2}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    {vendorsText(dictionary, 'contact_information', 'Contact Information')}
                                </Typography>
                                <Grid container spacing={3}>
                                    <DetailRow label={vendorsText(dictionary, 'contact_person', 'Contact Person')}>
                                        <Typography>{displayVendorValue(detail.vendor.contact_person)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={vendorsText(dictionary, 'phone', 'Phone')}>
                                        <Typography>{displayVendorValue(detail.vendor.phone)}</Typography>
                                    </DetailRow>
                                    <DetailRow label={vendorsText(dictionary, 'email', 'Email')}>
                                        <Typography>{displayVendorValue(detail.vendor.email)}</Typography>
                                    </DetailRow>
                                    <Grid size={{ xs: 12 }}>
                                        <Stack spacing={0.75}>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                                {vendorsText(dictionary, 'address', 'Address')}
                                            </Typography>
                                            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{displayVendorValue(detail.vendor.address)}</Typography>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Stack>
                    </Paper>
                )}
            </Stack>
        </ContentWrapper>
    )
}

export default VendorDetailPage
