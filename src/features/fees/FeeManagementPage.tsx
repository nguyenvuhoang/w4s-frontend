'use client'

import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PaymentsIcon from '@mui/icons-material/Payments'
import { Button, Stack, Typography } from '@mui/material'
import Link from 'next/link'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'

import FeeTypeFilterBar from './components/FeeTypeFilterBar'
import FeeTypeTable from './components/FeeTypeTable'
import { commonText, feeText } from './components/feeTypeHelpers'
import FeeTypeActionGuard from './components/FeeTypeActionGuard'
import { feeTypeHref, LEGACY_FEE_TYPE_ROUTES, type FeeTypeRouteConfig } from './feeTypeRoutes'
import { useFeeTypeSearch } from './hooks/useFeeTypeSearch'
import type {
  FeePageProps,
  FeeTypeFilterModel,
  FeeTypeSearchResponse,
  FeeWorkflowError
} from './types'

type Props = FeePageProps & {
  initialFilter: FeeTypeFilterModel
  initialData: FeeTypeSearchResponse
  initialError?: FeeWorkflowError | null
  routes?: FeeTypeRouteConfig
}

const actionButtonSx = {
  minWidth: 116,
  height: 36
}

const FeeManagementPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData,
  initialError = null,
  routes = LEGACY_FEE_TYPE_ROUTES
}: Props) => {
  const router = useRouter()
  const feeTypes = useFeeTypeSearch({
    dictionary,
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    initialFilter,
    initialData,
    initialError
  })
  const handleOpenDetail = (row: { id: number | null }) => {
    if (!row.id) return

    router.push(feeTypeHref(locale, routes, `/${row.id}`))
  }

  return (
    <ContentWrapper
      title={feeText(dictionary, 'fee_type_page_title', 'Fee Type Management')}
      description={feeText(dictionary, 'fee_type_page_subtitle', 'Manage shared fee types across the system.')}
      icon={<PaymentsIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      <Stack spacing={3} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Stack>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {feeText(dictionary, 'fee_type_list_title', 'Fee Types')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {feeText(dictionary, 'fee_type_list_subtitle', 'Search and manage shared fee types.')}
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={1}>
            {routes.parentPath && (
              <Button component={Link} href={`/${locale}${routes.parentPath}`} variant="outlined" startIcon={<ArrowBackIcon />} sx={actionButtonSx}>
                {commonText(dictionary, 'back', 'Back')}
              </Button>
            )}
            <FeeTypeActionGuard routes={routes} action="ADD">
              <Button component={Link} href={feeTypeHref(locale, routes, '/create')} variant="contained" startIcon={<AddIcon />} sx={actionButtonSx}>
                {feeText(dictionary, 'add_new', 'Add new')}
              </Button>
            </FeeTypeActionGuard>
          </Stack>
        </Stack>

        <FeeTypeFilterBar
          dictionary={dictionary}
          filter={feeTypes.draftFilter}
          onChange={feeTypes.updateDraftFilter}
          onSearch={feeTypes.handleSearch}
          onReset={feeTypes.handleReset}
        />

        {feeTypes.error && (
          <WorkflowErrorAlert
            title={feeText(dictionary, 'fee_type_load_failed', 'Unable to load fee types.')}
            message={feeTypes.error.message}
            workflowId={feeTypes.error.workflowId}
            workflowLabel={locale === 'vi' ? 'Workflow' : 'Workflow'}
            errorCode={feeTypes.error.errorCode}
            errorCodeLabel={dictionary.common?.errorcode ?? 'Error code'}
            executionId={feeTypes.error.executionId}
            executionIdLabel={dictionary.common?.executionid ?? dictionary.common?.execution_id ?? 'Execution ID'}
            copyLabel={commonText(dictionary, 'copy', 'Copy')}
            copiedLabel={locale === 'vi' ? 'Đã sao chép' : 'Copied'}
            copySuccessMessage={dictionary.common?.copiedErrorReference ?? (locale === 'vi' ? 'Đã sao chép mã tra cứu' : 'Copied error reference')}
            copyFailedMessage={locale === 'vi' ? 'Không thể sao chép mã tra cứu.' : 'Unable to copy error reference.'}
            retryLabel={commonText(dictionary, 'retry', 'Retry')}
            onRetry={() => void feeTypes.loadData()}
          />
        )}

        <FeeTypeTable
          dictionary={dictionary}
          locale={locale}
          rows={feeTypes.rows}
          loading={feeTypes.loading}
          pageIndex={feeTypes.filter.page_index}
          pageSize={feeTypes.filter.page_size}
          onOpenDetail={handleOpenDetail}
        />

        {feeTypes.totalCount > 0 && (
          <PaginationPage
            page={feeTypes.filter.page_index}
            pageSize={feeTypes.filter.page_size}
            totalResults={feeTypes.totalCount}
            jumpPage={feeTypes.filter.page_index}
            handlePageSizeChange={feeTypes.handlePageSizeChange}
            handlePageChange={feeTypes.handlePageChange}
            handleJumpPage={feeTypes.handleJumpPage}
            dictionary={dictionary}
          />
        )}
      </Stack>
    </ContentWrapper>
  )
}

export default FeeManagementPage
