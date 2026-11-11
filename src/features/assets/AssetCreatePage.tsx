'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'

import AssetForm from './components/AssetForm'
import { assetText, commonText } from './components/assetHelpers'
import { useAssetForm } from './hooks/useAssetForm'
import type { AssetDictionary } from './types'

type Props = {
  dictionary: AssetDictionary
  locale: string
  sessiontoken?: string
}

const AssetCreatePage = ({
  dictionary,
  locale,
  sessiontoken
}: Props) => {
  const workingProject = useWorkingProject()
  const projectOptions = workingProject ? [workingProject] : []
  const assetForm = useAssetForm({
    dictionary,
    locale,
    sessiontoken,
    language: locale,
    mode: 'create',
    projectOptions
  })

  return (
    <ContentWrapper
      title={assetText(dictionary, 'create_page_title', 'Create Asset')}
      description={assetText(dictionary, 'create_page_subtitle', 'Create a new asset for a project.')}
      icon={<Inventory2Icon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={assetForm.goBack}>
            {commonText(dictionary, 'back', 'Back')}
          </Button>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
            <Button variant="outlined" onClick={assetForm.goBack}>
              {commonText(dictionary, 'cancel', 'Cancel')}
            </Button>
            <Button variant="contained" disabled={assetForm.saving} onClick={() => void assetForm.submit()}>
              {assetForm.saving
                ? commonText(dictionary, 'processing', 'Processing...')
                : commonText(dictionary, 'save', 'Save')}
            </Button>
          </Stack>
        </Stack>

        {assetForm.submitError && <Alert severity="error">{assetForm.submitError}</Alert>}

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {assetText(dictionary, 'create_form_title', 'Asset Information')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {assetText(dictionary, 'create_form_subtitle', 'Fill in the fields below to create a new asset.')}
              </Typography>
            </Stack>

            <AssetForm
              dictionary={dictionary}
              locale={locale}
              values={assetForm.values}
              errors={assetForm.errors}
              categoryOptions={assetForm.categoryOptions}
              statusOptions={assetForm.statusOptions}
              projectOptions={projectOptions}
              showProject
              showStatus={false}
              updateValue={assetForm.updateValue}
            />
          </Stack>
        </Paper>
      </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default AssetCreatePage
