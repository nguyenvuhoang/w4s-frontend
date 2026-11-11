'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BusinessIcon from '@mui/icons-material/Business'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'

import VendorForm from './components/VendorForm'
import { commonText, vendorsText } from './components/vendorHelpers'
import { useVendorForm } from './hooks/useVendorForm'
import type { VendorItem, VendorsDictionary } from './vendorTypes'

type Props = {
    dictionary: VendorsDictionary
    locale: string
    sessiontoken?: string
    vendor: VendorItem | null
    error?: string | null
}

type VendorEditFormContentProps = {
    dictionary: VendorsDictionary
    locale: string
    sessiontoken?: string
    vendor: VendorItem
    error?: string | null
}

const VendorEditFormContent = ({ dictionary, locale, sessiontoken, vendor, error }: VendorEditFormContentProps) => {
    const vendorForm = useVendorForm({
        dictionary,
        locale,
        sessiontoken,
        language: locale,
        mode: 'edit',
        vendor
    })

    return (
        <ContentWrapper
            title={vendorsText(dictionary, 'vendor_edit_page_title', 'Edit Vendor Company')}
            description={vendorsText(dictionary, 'vendor_edit_page_subtitle', 'Update vendor company information.')}
            icon={<BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
            <Stack spacing={3} sx={{ mt: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={vendorForm.goBack}>
                        {commonText(dictionary, 'back', 'Back')}
                    </Button>

                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
                        <Button variant="outlined" onClick={vendorForm.goBack}>
                            {commonText(dictionary, 'cancel', 'Cancel')}
                        </Button>
                        <Button variant="contained" disabled={vendorForm.saving} onClick={() => void vendorForm.submit()}>
                            {vendorForm.saving
                                ? commonText(dictionary, 'processing', 'Processing...')
                                : commonText(dictionary, 'save', 'Save')}
                        </Button>
                    </Stack>
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}
                {vendorForm.submitError && <Alert severity="error">{vendorForm.submitError}</Alert>}

                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                    <Stack spacing={3}>
                        <Stack spacing={0.5}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {vendorsText(dictionary, 'vendor_edit_form_title', 'Vendor Information')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {vendorsText(dictionary, 'vendor_edit_form_subtitle', 'Update the fields below and save changes.')}
                            </Typography>
                        </Stack>

                        <VendorForm
                            dictionary={dictionary}
                            values={vendorForm.values}
                            errors={vendorForm.errors}
                            statusOptions={vendorForm.statusOptions}
                            updateValue={vendorForm.updateValue}
                        />
                    </Stack>
                </Paper>
            </Stack>
        </ContentWrapper>
    )
}

const VendorEditPage = ({ dictionary, locale, sessiontoken, vendor, error }: Props) => {
    if (!vendor) {
        return (
            <ContentWrapper
                title={vendorsText(dictionary, 'vendor_edit_page_title', 'Edit Vendor Company')}
                description={vendorsText(dictionary, 'vendor_edit_page_subtitle', 'Update vendor company information.')}
                icon={<BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
                dictionary={dictionary}
                issearch
            >
                <Stack spacing={3} sx={{ mt: 3 }}>
                    <Button component={Link} variant="outlined" startIcon={<ArrowBackIcon />} href={`/${locale}/contracts/company`}>
                        {commonText(dictionary, 'back', 'Back')}
                    </Button>
                    <Alert severity={error ? 'error' : 'info'}>
                        {error || vendorsText(dictionary, 'vendor_detail_not_found', 'Vendor detail was not found.')}
                    </Alert>
                </Stack>
            </ContentWrapper>
        )
    }

    return (
        <VendorEditFormContent
            dictionary={dictionary}
            locale={locale}
            sessiontoken={sessiontoken}
            vendor={vendor}
            error={error}
        />
    )
}

export default VendorEditPage
