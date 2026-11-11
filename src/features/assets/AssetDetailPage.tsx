'use client'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import { Alert, Box, Button, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import { usePermission } from '@shared/permissions/usePermission'
import SwalAlert from '@shared/utils/SwalAlert'

import {
  assetText,
  commonText,
  formatAssetDate,
  formatAssetValue,
  getAssetCategoryLabel,
  getAssetStatusColor,
  getAssetStatusLabel
} from './components/assetHelpers'
import { useAssetDetail } from './hooks/useAssetDetail'
import type { AssetDictionary, AssetItem } from './types'

type Props = {
  dictionary: AssetDictionary
  locale: string
  sessiontoken?: string
  asset: AssetItem | null
  error?: string | null
}

const actionButtonSx = {
  minWidth: 112,
  height: 36
}

const emptyText = (value?: string | number | null) => (
  value === null || value === undefined || value === '' ? '-' : String(value)
)

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

const AssetDetailPage = ({ dictionary, locale, sessiontoken, asset, error }: Props) => {
  const assetDetail = useAssetDetail({
    dictionary,
    locale,
    sessiontoken,
    asset,
    initialError: error
  })

  const { deleting, deleteAsset } = assetDetail
  const permission = usePermission({ href: '/assets/assets' })

  const handleDeleteAsset = () => {
    if (!permission.canDelete) {
      SwalAlert('warning', dictionary['common'].nopermissionview, 'center')

      return
    }

    void deleteAsset()
  }

  return (
    <ContentWrapper
      title={assetText(dictionary, 'detail_page_title', 'Asset Detail')}
      description={assetText(dictionary, 'detail_page_subtitle', 'View asset information.')}
      icon={<Inventory2Icon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={assetDetail.goBack}>
            {commonText(dictionary, 'back', 'Back')}
          </Button>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
            <PermissionGuard href="/assets/assets" action="MODIFY">
              <Button
                component={Link}
                href={asset?.id ? `/${locale}/assets/assets/${asset.id}/edit` : `/${locale}/assets/assets`}
                variant="contained"
                startIcon={<EditIcon />}
                sx={actionButtonSx}
                disabled={!asset?.id}
              >
                {commonText(dictionary, 'edit', 'Edit')}
              </Button>
            </PermissionGuard>
            <PermissionGuard href="/assets/assets" action="DELETE">
              <Button
                color="error"
                variant="outlined"
                startIcon={<DeleteOutlineIcon />}
                sx={actionButtonSx}
                disabled={!asset?.id || deleting}
                onClick={handleDeleteAsset}
              >
                {deleting
                  ? assetText(dictionary, 'deleting', 'Deleting...')
                  : commonText(dictionary, 'delete', 'Delete')}
              </Button>
            </PermissionGuard>
          </Stack>
        </Stack>

        {assetDetail.error && <Alert severity="error">{assetDetail.error}</Alert>}

        {!asset ? (
          <Alert severity={assetDetail.error ? 'warning' : 'info'}>
            {assetText(dictionary, 'detail_not_found', 'Asset detail was not found.')}
          </Alert>
        ) : (
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <Stack spacing={0.5}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {emptyText(asset.name)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {emptyText(asset.asset_code)}
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  color={getAssetStatusColor(asset.status)}
                  label={getAssetStatusLabel(dictionary, asset.status)}
                  sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
                />
              </Stack>

              <Divider />

              <Grid container spacing={3}>
                <DetailRow label={assetText(dictionary, 'field_asset_code', 'Asset Code')}>
                  <Typography sx={{ fontWeight: 700 }}>{emptyText(asset.asset_code)}</Typography>
                </DetailRow>
                <DetailRow label={assetText(dictionary, 'field_name', 'Name')}>
                  <Typography>{emptyText(asset.name)}</Typography>
                </DetailRow>
                <DetailRow label={assetText(dictionary, 'field_project_id', 'Project ID')}>
                  <Typography>{emptyText(asset.project_id || null)}</Typography>
                </DetailRow>
                <DetailRow label={assetText(dictionary, 'field_category', 'Category')}>
                  <Chip size="small" variant="outlined" label={getAssetCategoryLabel(dictionary, asset.category)} />
                </DetailRow>
                <DetailRow label={assetText(dictionary, 'field_location', 'Location')}>
                  <Typography>{emptyText(asset.location)}</Typography>
                </DetailRow>
                <DetailRow label={assetText(dictionary, 'field_qr_code', 'QR Code')}>
                  <Typography>{emptyText(asset.qr_code)}</Typography>
                </DetailRow>
                <Grid size={{ xs: 12 }}>
                  <Stack spacing={0.75}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                      {assetText(dictionary, 'field_description', 'Description')}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{emptyText(asset.description)}</Typography>
                  </Stack>
                </Grid>
                <DetailRow label={assetText(dictionary, 'field_purchase_date', 'Purchase Date')}>
                  <Typography>{formatAssetDate(asset.purchase_date)}</Typography>
                </DetailRow>
                <DetailRow label={assetText(dictionary, 'field_purchase_value', 'Purchase Value')}>
                  <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                    {formatAssetValue(asset.purchase_value, locale)}
                  </Typography>
                </DetailRow>
                <DetailRow label={assetText(dictionary, 'field_status', 'Status')}>
                  <Chip size="small" color={getAssetStatusColor(asset.status)} label={getAssetStatusLabel(dictionary, asset.status)} />
                </DetailRow>
              </Grid>
            </Stack>
          </Paper>
        )}
      </Stack>
    </ContentWrapper>
  )
}

export default AssetDetailPage
