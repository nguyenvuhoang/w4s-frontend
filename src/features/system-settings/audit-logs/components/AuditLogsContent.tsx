'use client'

import HistoryIcon from '@mui/icons-material/History'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useRouter } from '@shared/hooks/useRouter'

import PaginationPage from '@/@core/components/jTable/pagination'

import { useAuditLogSearch } from '../hooks/useAuditLogSearch'
import type { AuditLogFilterModel, AuditLogsPageProps, AuditLogSearchResponse } from '../types'
import { auditLogText, toAuditLogDetailPath } from './auditLogHelpers'
import AuditLogsFilterBar from './AuditLogsFilterBar'
import AuditLogsTable from './AuditLogsTable'

type Props = AuditLogsPageProps & {
  initialFilter: AuditLogFilterModel
  initialData: AuditLogSearchResponse
  initialError?: string | null
}

const AuditLogsContent = ({ dictionary, session, locale, initialFilter, initialData, initialError }: Props) => {
  const router = useRouter()
  const auditLogs = useAuditLogSearch({
    sessiontoken: session?.user?.token ?? undefined,
    language: locale,
    initialFilter,
    initialData,
    initialError
  })

  const handleViewDetail = (row: AuditLogSearchResponse['items'][number]) => {
    if (!row.execution_id) return

    router.push(toAuditLogDetailPath(locale, row.execution_id))
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <HistoryIcon color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
            <Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {auditLogText(locale, 'Nhật ký hệ thống', 'Audit Logs')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {auditLogText(
                  locale,
                  'Tra cứu nhật ký thực thi workflow hệ thống theo workflow id, execution id và khoảng thời gian.',
                  'Search workflow execution logs by workflow id, execution id, and date range.'
                )}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <AuditLogsFilterBar
          locale={locale}
          filter={auditLogs.draftFilter}
          loading={auditLogs.loading}
          onChange={auditLogs.updateDraftFilter}
          onSearch={auditLogs.handleSearch}
          onReset={auditLogs.handleReset}
        />

        {auditLogs.error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void auditLogs.loadData()}>
                {auditLogText(locale, 'Thử lại', 'Retry')}
              </Button>
            }
          >
            {auditLogs.error}
          </Alert>
        )}

        <AuditLogsTable
          locale={locale}
          dictionary={dictionary}
          rows={auditLogs.rows}
          loading={auditLogs.loading}
          pageSize={auditLogs.filter.page_size}
          onView={handleViewDetail}
        />

        {auditLogs.totalCount > 0 && (
          <PaginationPage
            page={auditLogs.filter.page_index + 1}
            pageSize={auditLogs.filter.page_size}
            totalResults={auditLogs.totalCount}
            jumpPage={auditLogs.filter.page_index + 1}
            handlePageSizeChange={auditLogs.handlePageSizeChange}
            handlePageChange={auditLogs.handlePageChange}
            handleJumpPage={auditLogs.handleJumpPage}
            dictionary={dictionary}
          />
        )}
      </Stack>
    </Paper>
  )
}

export default AuditLogsContent
