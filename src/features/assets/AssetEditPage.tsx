'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'

import AssetForm from './components/AssetForm'
import { assetText, commonText } from './components/assetHelpers'
import { useAssetForm } from './hooks/useAssetForm'
import type { AssetDictionary, AssetItem } from './types'

type Props = {
  dictionary: AssetDictionary
  locale: string
  sessiontoken?: string
  asset: AssetItem | null
  error?: string | null
}

type AssetEditFormContentProps = {
  dictionary: AssetDictionary
  locale: string
  sessiontoken?: string
  asset: AssetItem
  error?: string | null
}

const AssetEditFormContent = ({ dictionary, locale, sessiontoken, asset, error }: AssetEditFormContentProps) => {
  const assetForm = useAssetForm({
    dictionary,
    locale,
    sessiontoken,
    language: locale,
    mode: 'edit',
    asset
  })

  return (
    <ContentWrapper
      title={assetText(dictionary, 'edit_page_title', 'Edit Asset')}
      description={assetText(dictionary, 'edit_page_subtitle', 'Update asset information.')}
      icon={<Inventory2Icon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
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

        {error && <Alert severity="error">{error}</Alert>}
        {assetForm.submitError && <Alert severity="error">{assetForm.submitError}</Alert>}

        <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {assetText(dictionary, 'edit_form_title', 'Asset Information')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {assetText(dictionary, 'edit_form_subtitle', 'Update the fields below and save changes.')}
              </Typography>
            </Stack>

            <AssetForm
              dictionary={dictionary}
              locale={locale}
              values={assetForm.values}
              errors={assetForm.errors}
              categoryOptions={assetForm.categoryOptions}
              statusOptions={assetForm.statusOptions}
              updateValue={assetForm.updateValue}
            />
          </Stack>
        </Paper>
      </Stack>
    </ContentWrapper>
  )
}

const AssetEditPage = ({ dictionary, locale, sessiontoken, asset, error }: Props) => {
  if (!asset) {
    return (
      <ContentWrapper
        title={assetText(dictionary, 'edit_page_title', 'Edit Asset')}
        description={assetText(dictionary, 'edit_page_subtitle', 'Update asset information.')}
        icon={<Inventory2Icon sx={{ fontSize: 40, color: 'primary.main' }} />}
        dictionary={dictionary}
        issearch
      >
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Button component={Link} variant="outlined" startIcon={<ArrowBackIcon />} href={`/${locale}/assets/assets`}>
            {commonText(dictionary, 'back', 'Back')}
          </Button>
          <Alert severity={error ? 'error' : 'info'}>
            {error || assetText(dictionary, 'detail_not_found', 'Asset detail was not found.')}
          </Alert>
        </Stack>
      </ContentWrapper>
    )
  }

  return (
    <AssetEditFormContent
      dictionary={dictionary}
      locale={locale}
      sessiontoken={sessiontoken}
      asset={asset}
      error={error}
    />
  )
}

export default AssetEditPage
