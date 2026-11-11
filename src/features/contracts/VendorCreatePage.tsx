'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BusinessIcon from '@mui/icons-material/Business'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'

import VendorForm from './components/VendorForm'
import { commonText, vendorsText } from './components/vendorHelpers'
import { useVendorForm } from './hooks/useVendorForm'
import type { VendorsDictionary } from './vendorTypes'

type Props = {
    dictionary: VendorsDictionary
    locale: string
    sessiontoken?: string
}

const VendorCreatePage = ({
    dictionary,
    locale,
    sessiontoken
}: Props) => {
    const workingProject = useWorkingProject()
    const projectOptions = workingProject ? [workingProject] : []
    const vendorForm = useVendorForm({
        dictionary,
        locale,
        sessiontoken,
        language: locale,
        mode: 'create',
        projectOptions
    })

    return (
        <ContentWrapper
            title={vendorsText(dictionary, 'vendor_create_page_title', 'Create Vendor Company')}
            description={vendorsText(dictionary, 'vendor_create_page_subtitle', 'Create a new vendor company for a project.')}
            icon={<BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            dictionary={dictionary}
            issearch
        >
          <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
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
                                : vendorsText(dictionary, 'create_action', 'Create')}
                        </Button>
                    </Stack>
                </Stack>

                {vendorForm.submitError && <Alert severity="error">{vendorForm.submitError}</Alert>}

                <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
                    <Stack spacing={3}>
                        <Stack spacing={0.5}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {vendorsText(dictionary, 'vendor_create_form_title', 'Vendor Information')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {vendorsText(dictionary, 'vendor_create_form_subtitle', 'Fill in the fields below to create a new vendor.')}
                            </Typography>
                        </Stack>

                        <VendorForm
                            dictionary={dictionary}
                            values={vendorForm.values}
                            errors={vendorForm.errors}
                            statusOptions={vendorForm.statusOptions}
                            projectOptions={projectOptions}
                            showProject
                            showStatus={false}
                            updateValue={vendorForm.updateValue}
                        />
                    </Stack>
                </Paper>
            </Stack>
          </RequireWorkingProject>
        </ContentWrapper>
    )
}

export default VendorCreatePage
