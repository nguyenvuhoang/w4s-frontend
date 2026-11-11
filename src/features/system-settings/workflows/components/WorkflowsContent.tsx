'use client'

import { useCallback } from 'react'

import AccountTreeRounded from '@mui/icons-material/AccountTreeRounded'
import FileDownloadRounded from '@mui/icons-material/FileDownloadRounded'
import FileUploadRounded from '@mui/icons-material/FileUploadRounded'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Tooltip, Typography } from '@mui/material'

import PaginationPage from '@/@core/components/jTable/pagination'
import type { Locale } from '@/configs/i18n'

import { useWorkflowImportExport } from '../hooks/useWorkflowImportExport'
import { useWorkflowSearch } from '../hooks/useWorkflowSearch'
import type { WorkflowsDictionary } from '../types'
import WorkflowsChannelTabs from './WorkflowsChannelTabs'
import { workflowText } from './workflowHelpers'
import WorkflowsFilterBar from './WorkflowsFilterBar'
import WorkflowsTable from './WorkflowsTable'

type Props = {
  dictionary: WorkflowsDictionary
  locale: Locale
}

const WorkflowsContent = ({ dictionary, locale }: Props) => {
  const workflows = useWorkflowSearch({ dictionary, language: locale })

  const handleImported = useCallback(() => {
    void workflows.loadData({ search_text: '', page_index: 0, page_size: 10, channel_id: '' })
  }, [workflows])

  const importExport = useWorkflowImportExport({ dictionary, language: locale, onImported: handleImported })

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={2}>
          <Stack direction="row" gap={1.5} alignItems="flex-start">
            <AccountTreeRounded color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
            <Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {workflowText(dictionary, 'list_title', 'Workflow Management')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workflowText(dictionary, 'list_subtitle', 'Look up and manage workflow definitions, processing steps, and their status.')}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" gap={1.5} flexWrap="wrap">
            <Tooltip title={workflowText(dictionary, 'export_tooltip', 'Download all workflow definitions as a JSON file.')}>
              <span>
                <Button
                  variant="outlined"
                  startIcon={importExport.isExporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadRounded />}
                  onClick={() => void importExport.handleExport()}
                  disabled={importExport.isExporting || importExport.isImporting}
                >
                  {importExport.isExporting
                    ? workflowText(dictionary, 'exporting', 'Exporting...')
                    : workflowText(dictionary, 'export_button', 'Export Data')}
                </Button>
              </span>
            </Tooltip>

            <Tooltip title={workflowText(dictionary, 'import_tooltip', 'Import a list of workflows from a JSON file.')}>
              <span>
                <Button
                  variant="contained"
                  startIcon={importExport.isImporting ? <CircularProgress size={16} color="inherit" /> : <FileUploadRounded />}
                  onClick={importExport.handleImportClick}
                  disabled={importExport.isExporting || importExport.isImporting}
                >
                  {importExport.isImporting
                    ? workflowText(dictionary, 'importing', 'Importing...')
                    : workflowText(dictionary, 'import_button', 'Import Data')}
                </Button>
              </span>
            </Tooltip>

            <Box
              component="input"
              type="file"
              accept=".json,application/json"
              ref={importExport.fileInputRef}
              onChange={importExport.handleFileSelected}
              sx={{ display: 'none' }}
              aria-label={workflowText(dictionary, 'select_json_file', 'Select JSON file')}
            />
          </Stack>
        </Stack>
      </Paper>

      <WorkflowsChannelTabs
        dictionary={dictionary}
        value={workflows.filter.channel_id}
        loading={workflows.loading}
        onChange={workflows.handleChannelChange}
      />

      <WorkflowsFilterBar
        dictionary={dictionary}
        searchText={workflows.draftSearchText}
        loading={workflows.loading}
        onSearchTextChange={workflows.handleSearchTextChange}
        onSearch={workflows.handleSearch}
        onRefresh={workflows.handleRefresh}
      />

      {workflows.errorText && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={workflows.handleRefresh}>
              {workflowText(dictionary, 'retry', 'Retry')}
            </Button>
          }
        >
          {workflows.errorText}
        </Alert>
      )}

      <WorkflowsTable
        dictionary={dictionary}
        locale={locale}
        rows={workflows.rows}
        loading={workflows.loading}
        pageSize={workflows.filter.page_size}
      />

      {workflows.totalCount > 0 && (
        <PaginationPage
          page={workflows.filter.page_index + 1}
          pageSize={workflows.filter.page_size}
          totalResults={workflows.totalCount}
          jumpPage={workflows.filter.page_index + 1}
          handlePageSizeChange={workflows.handlePageSizeChange}
          handlePageChange={workflows.handlePageChange}
          handleJumpPage={workflows.handleJumpPage}
          dictionary={dictionary}
        />
      )}
    </Stack>
  )
}

export default WorkflowsContent
