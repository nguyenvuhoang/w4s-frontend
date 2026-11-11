'use client'

import AssessmentIcon from '@mui/icons-material/Assessment'
import { Box, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'
import WorkflowErrorAlert from '@/shared/components/WorkflowErrorAlert'

import ReportFilterBar from './components/ReportFilterBar'
import ReportTable from './components/ReportTable'
import { commonText, reportText } from './components/reportHelpers'
import { useReportSearch } from './hooks/useReportSearch'
import type {
  ReportFilterModel,
  ReportItem,
  ReportPageProps,
  ReportSearchResponse,
  ReportWorkflowError
} from './types'

type Props = ReportPageProps & {
  initialFilter: ReportFilterModel
  initialData: ReportSearchResponse
  initialError?: ReportWorkflowError | null
}

const ReportManagementPage = ({
  dictionary,
  session,
  locale,
  initialFilter,
  initialData,
  initialError = null
}: Props) => {
  const router = useRouter()
  const reports = useReportSearch({
    dictionary,
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    initialFilter,
    initialData,
    initialError
  })

  const handleOpenDetail = (row: ReportItem) => {
    if (!row.code) return

    router.push(`/${locale}/report/view/${row.code}`)
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        <Stack>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <AssessmentIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {reportText(dictionary, 'reportmenu', 'Report list')}
            </Typography>
          </Stack>
        </Stack>

        <ReportFilterBar
          dictionary={dictionary}
          filter={reports.draftFilter}
          onChange={reports.updateDraftFilter}
          onSearch={reports.handleSearch}
          onReset={reports.handleReset}
        />

        {reports.error && (
          <WorkflowErrorAlert
            title={reportText(dictionary, 'report_load_failed', 'Unable to load reports.')}
            message={reports.error.message}
            workflowId={reports.error.workflowId}
            errorCode={reports.error.errorCode}
            errorCodeLabel={commonText(dictionary, 'errorcode', 'Error code')}
            executionId={reports.error.executionId}
            executionIdLabel={commonText(dictionary, 'executionid', 'Execution ID')}
            copyLabel={commonText(dictionary, 'copy', 'Copy')}
            copiedLabel={locale === 'vi' ? 'Đã sao chép' : 'Copied'}
            copySuccessMessage={commonText(dictionary, 'copiedErrorReference', 'Copied error reference')}
            copyFailedMessage={locale === 'vi' ? 'Không thể sao chép mã tra cứu.' : 'Unable to copy error reference.'}
            retryLabel={commonText(dictionary, 'retry', 'Retry')}
            onRetry={() => void reports.loadData()}
          />
        )}

        <ReportTable
          dictionary={dictionary}
          rows={reports.rows}
          loading={reports.loading}
          pageIndex={reports.filter.page_index}
          pageSize={reports.filter.page_size}
          onOpenDetail={handleOpenDetail}
        />

        {reports.totalCount > 0 && (
          <PaginationPage
            page={reports.filter.page_index + 1}
            pageSize={reports.filter.page_size}
            totalResults={reports.totalCount}
            jumpPage={reports.filter.page_index + 1}
            handlePageSizeChange={reports.handlePageSizeChange}
            handlePageChange={reports.handlePageChange}
            handleJumpPage={reports.handleJumpPage}
            dictionary={dictionary}
          />
        )}
      </Stack>
    </Box>
  )
}

export default ReportManagementPage
