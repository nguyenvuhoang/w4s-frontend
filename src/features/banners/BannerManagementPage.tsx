'use client'

import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import AddIcon from '@mui/icons-material/Add'
import { Button, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import Link from 'next/link'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'

import BannerFilterBar from './components/BannerFilterBar'
import { bannerText, commonText } from './components/bannerHelpers'
import BannerTable from './components/BannerTable'
import { useBannerSearch } from './hooks/useBannerSearch'
import type {
  BannerPageProps,
  BannerFilterModel,
  BannerSearchResponse
} from './types'

type Props = BannerPageProps & {
  initialFilter: BannerFilterModel
  initialData: BannerSearchResponse
  initialError?: { message: string; executionId?: string } | null
}

const actionButtonSx = {
  minWidth: 116,
  height: 36
}

const BannerManagementPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData,
  initialError = null
}: Props) => {
  const router = useRouter()
  const sessiontoken = session?.user?.token ?? undefined
  const banners = useBannerSearch({
    dictionary,
    sessiontoken,
    language: locale,
    initialFilter,
    initialData,
    initialError
  })
  const handleOpenDetail = (row: { id: number | string | null }) => {
    if (row.id === null || row.id === undefined || row.id === '') return

    router.push(`/${locale}/banner-list/${encodeURIComponent(String(row.id))}`)
  }

  return (
    <ContentWrapper
      title={bannerText(dictionary, 'page_title', 'Banner Management')}
      description={bannerText(dictionary, 'page_subtitle', 'Search and manage project banners.')}
      icon={<CollectionsOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Stack>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {bannerText(dictionary, 'list_title', 'Banners')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {bannerText(dictionary, 'list_subtitle', 'Search and scan banners by project.')}
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ minHeight: 36 }}>
            <PermissionGuard href="/banner-list" action="ADD">
              <Button
                component={Link}
                href={banners.filter.project_id ? `/${locale}/banner-list/create?project_id=${banners.filter.project_id}` : `/${locale}/banner-list/create`}
                variant="contained"
                startIcon={<AddIcon />}
                sx={actionButtonSx}
              >
                {bannerText(dictionary, 'create_button', 'Create')}
              </Button>
            </PermissionGuard>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={banners.handleRefresh} sx={actionButtonSx}>
              {commonText(dictionary, 'refresh', 'Refresh')}
            </Button>
          </Stack>
        </Stack>

        <BannerFilterBar
          dictionary={dictionary}
          filter={banners.draftFilter}
          onChange={banners.updateDraftFilter}
          onSearch={banners.handleSearch}
          onReset={banners.handleReset}
        />

        {banners.error && (
          <WorkflowErrorAlert
            title={bannerText(dictionary, 'error_title', 'Unable to load banners')}
            description={banners.error.message}
            executionId={banners.error.executionId}
            referenceLabel={bannerText(dictionary, 'error_reference_label', 'Error Reference')}
            copyLabel={commonText(dictionary, 'copy', 'Copy')}
            copySuccessMessage={bannerText(dictionary, 'copy_error_reference_success', 'Copied error reference.')}
            copyFailedMessage={bannerText(dictionary, 'copy_error_reference_failed', 'Unable to copy error reference.')}
          />
        )}

        <BannerTable
          dictionary={dictionary}
          rows={banners.rows}
          loading={banners.loading}
          pageIndex={banners.filter.page_index}
          pageSize={banners.filter.page_size}
          onOpenDetail={handleOpenDetail}
        />

        {banners.totalCount > 0 && (
          <PaginationPage
            page={banners.filter.page_index}
            pageSize={banners.filter.page_size}
            totalResults={banners.totalCount}
            jumpPage={banners.filter.page_index}
            handlePageSizeChange={banners.handlePageSizeChange}
            handlePageChange={banners.handlePageChange}
            handleJumpPage={banners.handleJumpPage}
            dictionary={dictionary}
          />
        )}
      </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default BannerManagementPage
