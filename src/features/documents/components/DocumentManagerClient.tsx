'use client'

import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined'
import { Alert, Box, Button, Snackbar, Stack, Typography } from '@mui/material'
import type { Session } from 'next-auth'

import PaginationPage from '@/@core/components/jTable/pagination'
import type { Locale } from '@/configs/i18n'
import ContentWrapper from '@/features/dynamicform/components/layout/content-wrapper'
import RequireWorkingProject from '@/shared/components/project-context/RequireWorkingProject'
import { formatProjectLabel } from '@/shared/services/projectLookupService'
import type { getDictionary } from '@utils/getDictionary'

import { useDocumentManager } from '../hooks/use_document_manager'
import type { DocumentExplorerConfig, DocumentFilterModel, DocumentFolderTreeNode, DocumentListResponse } from '../types'
import DocumentActionMenu from './DocumentActionMenu'
import DocumentBreadcrumb from './DocumentBreadcrumb'
import DocumentCompactView from './DocumentCompactView'
import DocumentConfirmDialog from './DocumentConfirmDialog'
import DocumentCreateFolderDialog from './DocumentCreateFolderDialog'
import { documentText } from './documentHelpers'
import DocumentListView from './DocumentListView'
import DocumentPreviewDialog from './DocumentPreviewDialog'
import DocumentTileView from './DocumentTileView'
import DocumentToolbar from './DocumentToolbar'
import DocumentTreeView from './DocumentTreeView'
import DocumentUploadDialog from './DocumentUploadDialog'

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  config: DocumentExplorerConfig
  session: Session | null
  locale: Locale | string
  initial_filter: DocumentFilterModel
  initial_data: DocumentListResponse
  initial_tree: DocumentFolderTreeNode[]
}

const DocumentExplorer = ({
  dictionary,
  config,
  session,
  locale,
  initial_filter,
  initial_data,
  initial_tree
}: Props) => {
  const sessiontoken = session?.user?.token as string | undefined
  const commonText = (key: string) => dictionary.common?.[key] ?? key
  const manager = useDocumentManager({
    config,
    dictionary,
    session,
    initial_filter,
    initial_data,
    initial_tree
  })

  const empty_text = manager.is_trash
    ? documentText(dictionary, 'trash_empty')
    : manager.filter.keyword
      ? documentText(dictionary, 'empty_search')
      : documentText(dictionary, 'empty_folder')
  const view = manager.filter.view_mode
  const selected_project = config.require_project ? manager.workingProject : null
  const title = config.module_code === 'resident_documents'
    ? documentText(dictionary, 'resident_title')
    : documentText(dictionary, 'internal_title')
  const subtitle = config.module_code === 'resident_documents'
    ? documentText(dictionary, 'resident_subtitle')
    : documentText(dictionary, 'internal_subtitle')
  const current_folder_summary = `${manager.total_items} ${documentText(dictionary, 'items_in_folder')} ${manager.current_folder_name}`

  const explorer_content = (
    <>
      <Stack spacing={2.5} sx={{ mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h6" fontWeight={900}>{documentText(dictionary, 'title')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {selected_project
                ? `${formatProjectLabel(selected_project)} - ${current_folder_summary}`
                : current_folder_summary}
            </Typography>
          </Box>
        </Stack>

        <DocumentToolbar
          dictionary={dictionary}
          filter={manager.filter}
          keyword={manager.draft_keyword}
          actions_disabled={!manager.has_project}
          on_keyword_change={manager.setDraftKeyword}
          on_search={manager.search}
          on_status_change={manager.changeStatus}
          on_refresh={manager.refresh}
          on_create_folder={() => manager.setCreateOpen(true)}
          on_upload={() => manager.setUploadOpen(true)}
          is_trash={manager.is_trash}
          on_trash={manager.openTrash}
          on_exit_trash={manager.leaveTrash}
          on_view_change={manager.changeViewMode}
        />

        {!manager.has_project ? (
          <Alert severity="info">
            {documentText(dictionary, 'select_resident_project_first')}
          </Alert>
        ) : (
          <>
            <DocumentBreadcrumb
              dictionary={dictionary}
              breadcrumb={manager.is_trash ? [{ id: 'trash', name: documentText(dictionary, 'trash') }] : manager.breadcrumb}
              parent_id={manager.is_trash ? null : manager.parent_id}
              on_navigate={manager.navigateToFolder}
              on_parent={manager.goParentFolder}
            />

            {manager.error && (
              <Alert severity="info" onClose={() => manager.setError(null)} action={<Button size="small" onClick={manager.refresh}>{commonText('refresh')}</Button>}>
                {manager.error}
              </Alert>
            )}

            {view === 'list' && (
              <DocumentListView
                dictionary={dictionary}
                rows={manager.rows}
                loading={manager.loading}
                selected_ids={manager.selected_ids}
                page_size={manager.filter.page_size}
                empty_text={empty_text}
                on_select={manager.toggleSelected}
                on_select_only={manager.selectOnly}
                on_open={manager.openNode}
                on_open_action_menu={manager.openActionMenu}
                show_actions={!manager.is_trash}
              />
            )}

            {view === 'tile' && (
              <DocumentTileView
                dictionary={dictionary}
                rows={manager.rows}
                loading={manager.loading}
                page_size={manager.filter.page_size}
                empty_text={empty_text}
                module_code={manager.filter.module_code}
                on_open={manager.openNode}
                on_open_action_menu={manager.openActionMenu}
                show_actions={!manager.is_trash}
              />
            )}

            {view === 'compact' && (
              <DocumentCompactView
                dictionary={dictionary}
                rows={manager.rows}
                loading={manager.loading}
                page_size={manager.filter.page_size}
                empty_text={empty_text}
                on_open={manager.openNode}
                on_open_action_menu={manager.openActionMenu}
                show_actions={!manager.is_trash}
              />
            )}

            {view === 'tree' && manager.root_folder_id && (
              <DocumentTreeView
                dictionary={dictionary}
                tree={manager.tree}
                root_folder_id={manager.root_folder_id}
                selected_folder_id={manager.filter.folder_id ?? ''}
                rows={manager.rows}
                loading={manager.loading}
                page_size={manager.filter.page_size}
                empty_text={empty_text}
                is_trash={manager.is_trash}
                on_navigate={manager.navigateToFolder}
                on_trash={manager.openTrash}
                on_open={manager.openNode}
                on_open_action_menu={manager.openActionMenu}
              />
            )}

            {manager.total_items > 0 && (
              <PaginationPage
                page={manager.filter.page_index}
                pageSize={manager.filter.page_size}
                totalResults={manager.total_items}
                jumpPage={manager.filter.page_index}
                handlePageSizeChange={manager.handlePageSizeChange}
                handlePageChange={manager.handlePageChange}
                handleJumpPage={manager.handleJumpPage}
                dictionary={dictionary}
              />
            )}
          </>
        )}
      </Stack>

      <DocumentActionMenu
        dictionary={dictionary}
        anchor_el={manager.action_anchor}
        row={manager.action_row}
        root_folder_id={manager.root_folder_id}
        on_close={manager.closeActionMenu}
        on_open={manager.openNode}
        on_preview={manager.setPreviewFile}
        on_download={row => void manager.handleDownload(row)}
        on_status={manager.startStatusConfirm}
        on_delete={manager.startDeleteConfirm}
        on_placeholder={message => void manager.placeholderAction(message)}
      />

      <DocumentCreateFolderDialog
        dictionary={dictionary}
        open={manager.create_open}
        saving={manager.saving}
        filter={manager.filter}
        current_folder_name={manager.current_folder_name}
        on_close={() => manager.setCreateOpen(false)}
        on_submit={payload => manager.handleCreateFolder(payload)}
      />

      <DocumentUploadDialog
        dictionary={dictionary}
        open={manager.upload_open}
        saving={manager.saving}
        filter={manager.filter}
        current_folder_name={manager.current_folder_name}
        on_close={() => manager.setUploadOpen(false)}
        on_submit={payload => manager.handleUpload(payload)}
      />

      <DocumentPreviewDialog dictionary={dictionary} file={manager.preview_file} on_close={() => manager.setPreviewFile(null)} />

      <DocumentConfirmDialog
        dictionary={dictionary}
        confirm_action={manager.confirm_action}
        on_close={() => manager.setConfirmAction(null)}
        on_confirm={() => void manager.handleConfirm()}
      />

      <Snackbar
        open={Boolean(manager.success_message)}
        autoHideDuration={3000}
        onClose={() => manager.setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={manager.success_message}
      />
    </>
  )

  return (
    <ContentWrapper
      title={title}
      description={subtitle}
      icon={<FolderCopyOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
      dictionary={dictionary}
      issearch
    >
      {config.require_project ? (
        <RequireWorkingProject dictionary={dictionary} sessiontoken={sessiontoken} language={locale}>
          {explorer_content}
        </RequireWorkingProject>
      ) : explorer_content}
    </ContentWrapper>
  )
}

export default DocumentExplorer
