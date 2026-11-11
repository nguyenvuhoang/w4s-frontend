'use client'

import { useState } from 'react'

import BugReportRounded from '@mui/icons-material/BugReportRounded'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'

import PaginationPage from '@/@core/components/jTable/pagination'

import { useApplicationLogSearch } from '../hooks/useApplicationLogSearch'
import type { ApplicationLogItem, ApplicationLogsPageProps } from '../types'
import ApplicationLogDetailDialog from './ApplicationLogDetailDialog'
import ApplicationLogsQuickSearch from './ApplicationLogsQuickSearch'
import ApplicationLogsSummaryCards from './ApplicationLogsSummaryCards'
import ApplicationLogsTable from './ApplicationLogsTable'
import ApplicationLogsTimeline from './ApplicationLogsTimeline'
import { applicationLogText } from './applicationLogHelpers'

type Props = ApplicationLogsPageProps & {
  initialExecutionId?: string
}

const ApplicationLogsContent = ({ dictionary, locale, initialExecutionId }: Props) => {
  const appLogs = useApplicationLogSearch({ language: locale, initialExecutionId })
  const [selectedItem, setSelectedItem] = useState<ApplicationLogItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleView = (item: ApplicationLogItem) => {
    setSelectedItem(item)
    setDrawerOpen(true)
  }

  const showTimeline = Boolean(appLogs.filter.correlation_id) && appLogs.timelineItems.length > 0

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Stack direction="row" gap={1.5} alignItems="flex-start">
          <BugReportRounded color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
          <Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {applicationLogText(locale, 'Nhật ký lỗi ứng dụng', 'Application Logs')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {applicationLogText(
                locale,
                'Tra cứu và phân tích toàn bộ luồng xử lý của hệ thống theo Execution ID.',
                'Search and analyze the full processing flow of the system by Execution ID.'
              )}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <ApplicationLogsQuickSearch
        locale={locale}
        filter={appLogs.draftFilter}
        loading={appLogs.loading}
        onChange={appLogs.updateDraftFilter}
        onSearch={appLogs.handleSearch}
        onReset={appLogs.handleReset}
      />

      {appLogs.error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void appLogs.handleRefresh()}>
              {applicationLogText(locale, 'Thử lại', 'Retry')}
            </Button>
          }
        >
          {appLogs.error}
        </Alert>
      )}

      {appLogs.hasSearched && !appLogs.error && (
        <>
          <ApplicationLogsSummaryCards locale={locale} summary={appLogs.summary} />

          {showTimeline && (
            <ApplicationLogsTimeline
              locale={locale}
              items={appLogs.timelineItems}
              firstErrorLogId={appLogs.firstErrorLogId}
              onSelect={handleView}
            />
          )}

          <ApplicationLogsTable
            locale={locale}
            rows={appLogs.items}
            loading={appLogs.loading}
            pageSize={appLogs.filter.page_size}
            onView={handleView}
          />

          {appLogs.totalCount > 0 && (
            <PaginationPage
              page={appLogs.filter.page_index + 1}
              pageSize={appLogs.filter.page_size}
              totalResults={appLogs.totalCount}
              jumpPage={appLogs.filter.page_index + 1}
              handlePageSizeChange={appLogs.handlePageSizeChange}
              handlePageChange={appLogs.handlePageChange}
              handleJumpPage={appLogs.handleJumpPage}
              dictionary={dictionary}
            />
          )}
        </>
      )}

      <ApplicationLogDetailDialog
        locale={locale}
        dictionary={dictionary}
        open={drawerOpen}
        item={selectedItem}
        onClose={() => setDrawerOpen(false)}
      />
    </Stack>
  )
}

export default ApplicationLogsContent
