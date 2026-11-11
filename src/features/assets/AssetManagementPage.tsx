'use client'

import AddIcon from '@mui/icons-material/Add'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import { Alert, Button, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { toClientSessionToken } from '@/shared/utils/safeSessionToken'

import AssetFilterBar from './components/AssetFilterBar'
import AssetTable from './components/AssetTable'
import { assetText, commonText } from './components/assetHelpers'
import { useAssetSearch } from './hooks/useAssetSearch'
import type {
  AssetPageProps,
  AssetFilterModel,
  AssetSearchResponse
} from './types'

type Props = AssetPageProps & {
  initialFilter: AssetFilterModel
  initialData: AssetSearchResponse
  initialError?: string | null
  initialErrorReference?: string | null
  initialScope?: string | null
}

const actionButtonSx = {
  minWidth: 112,
  height: 36
}

const AssetManagementPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData,
  initialError = null,
  initialErrorReference = null,
  initialScope = null
}: Props) => {
  const router = useRouter()
  const sessiontoken = toClientSessionToken(session)
  const assets = useAssetSearch({
    dictionary,
    sessiontoken,
    language: locale,
    initialFilter,
    initialData,
    initialError,
    initialErrorReference,
    initialScope
  })

  const handleViewAsset = (assetId: number | null) => {
    if (!assetId) return

    router.push(`/${locale}/assets/assets/${assetId}`)
  }

  return (
    <ContentWrapper
      title={assetText(dictionary, 'page_title', 'Asset Management')}
      description={assetText(dictionary, 'page_subtitle', 'Manage assets by project, category and status.')}
      icon={<Inventory2Icon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Stack>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {assetText(dictionary, 'list_title', 'Assets')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {assetText(dictionary, 'list_subtitle', 'Search and manage project assets.')}
            </Typography>
          </Stack>
          <PermissionGuard href="/assets/assets" action="ADD">
            <Button
              component={Link}
              href={`/${locale}/assets/assets/create`}
              variant="contained"
              startIcon={<AddIcon />}
              sx={actionButtonSx}
            >
              {assetText(dictionary, 'add_asset', 'Add Asset')}
            </Button>
          </PermissionGuard>
        </Stack>

        <AssetFilterBar
          dictionary={dictionary}
          filter={assets.draftFilter}
          onChange={assets.updateDraftFilter}
          onCategoryChange={assets.handleCategoryChange}
          onStatusChange={assets.handleStatusChange}
          onSearch={assets.handleSearch}
          onReset={assets.handleReset}
        />

        {assets.error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void assets.loadData()}>
                {commonText(dictionary, 'retry', 'Retry')}
              </Button>
            }
          >
            {assets.error}
            {assets.errorReference && ` ${commonText(dictionary, 'error_reference', 'Error Reference')}: ${assets.errorReference}`}
          </Alert>
        )}

        <AssetTable
          dictionary={dictionary}
          locale={locale}
          rows={assets.rows}
          loading={assets.loading}
          pageSize={assets.filter.page_size}
          onOpenDetail={asset => handleViewAsset(asset.id)}
        />

        {assets.totalCount > 0 && (
          <PaginationPage
            page={assets.filter.page_index}
            pageSize={assets.filter.page_size}
            totalResults={assets.totalCount}
            jumpPage={assets.filter.page_index}
            handlePageSizeChange={assets.handlePageSizeChange}
            handlePageChange={assets.handlePageChange}
            handleJumpPage={assets.handleJumpPage}
            dictionary={dictionary}
          />
        )}
      </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default AssetManagementPage
