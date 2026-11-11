'use client'

import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import AddIcon from '@mui/icons-material/Add'
import { Button, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'
import Link from 'next/link'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'
import { PermissionGuard } from '@shared/permissions/PermissionGuard'

import PromotionFilterBar from './components/PromotionFilterBar'
import { commonText, promotionText } from './components/promotionHelpers'
import PromotionTable from './components/PromotionTable'
import { usePromotionSearch } from './hooks/usePromotionSearch'
import type {
  PromotionFilterModel,
  PromotionPageProps,
  PromotionSearchResponse,
  PromotionWorkflowError
} from './types'

type Props = PromotionPageProps & {
  initialFilter: PromotionFilterModel
  initialData: PromotionSearchResponse
  initialError?: PromotionWorkflowError | null
}

const actionButtonSx = {
  minWidth: 116,
  height: 36
}

const PromotionManagementPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData,
  initialError = null
}: Props) => {
  const router = useRouter()
  const sessiontoken = session?.user?.token ?? undefined
  const promotions = usePromotionSearch({
    dictionary,
    sessiontoken,
    language: locale,
    initialFilter,
    initialData,
    initialError
  })

  const handleOpenDetail = (row: { id: number | string | null; project_id: number | null }) => {
    if (row.id === null || row.id === undefined || row.id === '') return

    const projectId = row.project_id ?? promotions.filter.project_id
    const query = projectId ? `?project_id=${projectId}` : ''

    router.push(`/${locale}/promotion-management/${encodeURIComponent(String(row.id))}${query}`)
  }

  return (
    <ContentWrapper
      title={promotionText(dictionary, 'page_title', 'Promotion Management')}
      description={promotionText(dictionary, 'page_subtitle', 'Search and manage promotions by project.')}
      icon={<LocalOfferOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
        <Stack spacing={3} sx={{ mt: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
            <Stack>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {promotionText(dictionary, 'list_title', 'Promotions')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {promotionText(dictionary, 'list_subtitle', 'Search and manage promotions by project.')}
              </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ minHeight: 36 }}>
              <PermissionGuard href="/promotion-management" action="ADD">
                <Button
                  component={Link}
                  href={promotions.filter.project_id ? `/${locale}/promotion-management/create?project_id=${promotions.filter.project_id}` : `/${locale}/promotion-management/create`}
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={actionButtonSx}
                >
                  {promotionText(dictionary, 'create_button', 'Add Promotion')}
                </Button>
              </PermissionGuard>
            </Stack>
          </Stack>

          <PromotionFilterBar
            dictionary={dictionary}
            filter={promotions.draftFilter}
            onChange={promotions.updateDraftFilter}
            onSearch={promotions.handleSearch}
            onReset={promotions.handleReset}
          />

          {promotions.error && (
            <WorkflowErrorAlert
              title={promotionText(dictionary, 'error_title', 'Unable to load promotions')}
              description={promotions.error.message}
              executionId={promotions.error.executionId}
              referenceLabel={promotionText(dictionary, 'error_reference_label', 'Error Reference')}
              copyLabel={commonText(dictionary, 'copy', 'Copy')}
              copySuccessMessage={promotionText(dictionary, 'copy_error_reference_success', 'Copied error reference.')}
              copyFailedMessage={promotionText(dictionary, 'copy_error_reference_failed', 'Unable to copy error reference.')}
              onRetry={() => void promotions.handleRefresh()}
            />
          )}

          <PromotionTable
            dictionary={dictionary}
            rows={promotions.rows}
            loading={promotions.loading}
            pageSize={promotions.filter.page_size}
            onOpenDetail={handleOpenDetail}
          />

          {promotions.totalCount > 0 && (
            <PaginationPage
              page={promotions.filter.page_index}
              pageSize={promotions.filter.page_size}
              totalResults={promotions.totalCount}
              jumpPage={promotions.filter.page_index}
              handlePageSizeChange={promotions.handlePageSizeChange}
              handlePageChange={promotions.handlePageChange}
              handleJumpPage={promotions.handleJumpPage}
              dictionary={dictionary}
            />
          )}
        </Stack>
      </RequireWorkingProject>
    </ContentWrapper>
  )
}

export default PromotionManagementPage
