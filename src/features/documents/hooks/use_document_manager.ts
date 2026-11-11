import type { SelectChangeEvent } from '@mui/material/Select'
import type { Session } from 'next-auth'
import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'

import { useWorkingProject } from '@/@core/stores/useWorkingProjectStore'
import SwalAlert from '@/shared/utils/SwalAlert'

import { documentText, type DocumentDictionary } from '../components/documentHelpers'
import { documentService } from '../services/documentService'
import type {
  CreateDocumentFolderPayload,
  DocumentExplorerConfig,
  DocumentFilterModel,
  DocumentFolderTreeNode,
  DocumentBreadcrumbItem,
  DocumentListResponse,
  DocumentNodeModel,
  DocumentViewMode,
  UploadDocumentsPayload
} from '../types'

export type DocumentConfirmAction = { type: 'delete' | 'status'; row: DocumentNodeModel } | null

const build_query = (filter: DocumentFilterModel) => {
  const params = new URLSearchParams()

  if (filter.project_id) params.set('project_id', String(filter.project_id))
  if (filter.folder_id && filter.status !== 'deleted') params.set('folder_id', filter.folder_id)
  params.set('view_mode', filter.view_mode)
  if (filter.keyword) params.set('keyword', filter.keyword)
  if (filter.status !== 'all') params.set('status', filter.status)

  return params.toString()
}

export function useDocumentManager({
  config,
  dictionary,
  session,
  initial_filter,
  initial_data,
  initial_tree
}: {
  config: DocumentExplorerConfig
  dictionary: DocumentDictionary
  session: Session | null
  initial_filter: DocumentFilterModel
  initial_data: DocumentListResponse
  initial_tree: DocumentFolderTreeNode[]
}) {
  const sessiontoken = session?.user?.token as string | undefined
  const workingProject = useWorkingProject()
  const default_folder_name = documentText(dictionary, 'default_folder_name')
  const trash_folder_name = documentText(dictionary, 'trash')
  const localizeBreadcrumb = (items: DocumentBreadcrumbItem[], root_folder_id?: string) =>
    items.map(item => ({
      ...item,
      name: item.id === root_folder_id ? default_folder_name : item.name
    }))

  const [filter, setFilter] = useState<DocumentFilterModel>(initial_filter)
  const [root_folder_id, setRootFolderId] = useState(initial_data.root_folder_id)
  const [draft_keyword, setDraftKeyword] = useState(initial_filter.keyword)
  const [rows, setRows] = useState<DocumentNodeModel[]>(initial_data.items)
  const [breadcrumb, setBreadcrumb] = useState(localizeBreadcrumb(initial_data.breadcrumb, initial_data.root_folder_id))
  const [parent_id, setParentId] = useState(initial_data.parent_id)
  const [tree, setTree] = useState<DocumentFolderTreeNode[]>(initial_tree)
  const [total_items, setTotalItems] = useState(initial_data.total_items)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected_ids, setSelectedIds] = useState<string[]>([])
  const [action_anchor, setActionAnchor] = useState<HTMLElement | null>(null)
  const [action_row, setActionRow] = useState<DocumentNodeModel | null>(null)
  const [upload_open, setUploadOpen] = useState(false)
  const [create_open, setCreateOpen] = useState(false)
  const [preview_file, setPreviewFile] = useState<DocumentNodeModel | null>(null)
  const [confirm_action, setConfirmAction] = useState<DocumentConfirmAction>(null)
  const [saving, setSaving] = useState(false)
  const [success_message, setSuccessMessage] = useState<string | null>(null)
  const [initial_load_requested, setInitialLoadRequested] = useState(false)

  const requires_project = Boolean(config.require_project)
  const has_project = !requires_project || (typeof filter.project_id === 'number' && filter.project_id > 0)
  const is_trash = filter.status === 'deleted'

  const replaceUrl = (next_filter: DocumentFilterModel) => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.search = build_query(next_filter)
    window.history.replaceState(null, '', url.toString())
  }

  const applyResponse = async (response: DocumentListResponse, next_filter: DocumentFilterModel, sync_url: boolean) => {
    const next_root_folder_id = response.root_folder_id || response.folder_id || ''
    const resolved_filter: DocumentFilterModel = {
      ...next_filter,
      folder_id: next_filter.status === 'deleted' ? null : response.folder_id || (next_root_folder_id || null),
      module_code: response.module_code
    }

    setRows(response.items)
    setBreadcrumb(resolved_filter.status === 'deleted' ? [] : localizeBreadcrumb(response.breadcrumb, next_root_folder_id))
    setParentId(resolved_filter.status === 'deleted' ? null : response.parent_id)
    setTotalItems(response.total_items)
    setRootFolderId(next_root_folder_id)
    setFilter(resolved_filter)
    setDraftKeyword(resolved_filter.keyword)
    setSelectedIds([])

    if (next_root_folder_id) {
      setTree(await documentService.get_document_folder_tree({
        module_code: resolved_filter.module_code,
        root_folder_id: next_root_folder_id,
        project_id: resolved_filter.project_id ?? undefined
      }))
    } else {
      setTree([])
    }

    if (sync_url) replaceUrl(resolved_filter)
  }

  const clearProjectScopedState = (next_filter: DocumentFilterModel, sync_url: boolean) => {
    setRows([])
    setBreadcrumb([])
    setParentId(null)
    setTree([])
    setTotalItems(0)
    setRootFolderId('')
    setSelectedIds([])
    setActionAnchor(null)
    setActionRow(null)
    setPreviewFile(null)
    setUploadOpen(false)
    setCreateOpen(false)
    setFilter(next_filter)
    setDraftKeyword(next_filter.keyword)
    if (sync_url) replaceUrl(next_filter)
  }

  const loadData = async (next_filter: DocumentFilterModel = filter, sync_url = true) => {
    if (requires_project && (!next_filter.project_id || next_filter.project_id <= 0)) {
      clearProjectScopedState(next_filter, sync_url)
      setError(null)

      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await documentService.get_document_nodes(next_filter, {
        sessiontoken,
        project_id: next_filter.project_id ?? undefined
      })

      await applyResponse(response, next_filter, sync_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : documentText(dictionary, 'load_documents_failed'))
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folder_id: string) => {
    void loadData({ ...filter, folder_id, status: 'all', keyword: '', page_index: 1 })
  }

  useEffect(() => {
    if (initial_load_requested) return
    if (!has_project) return
    if (root_folder_id) return

    setInitialLoadRequested(true)
    void loadData(filter, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial_load_requested, has_project, root_folder_id])

  const goParentFolder = () => {
    if (parent_id) navigateToFolder(parent_id)
  }

  const changeProject = (project_id: number | null) => {
    const is_initial_project_load = requires_project && (!filter.project_id || filter.project_id <= 0)
    const next_filter: DocumentFilterModel = {
      ...filter,
      project_id,
      folder_id: is_initial_project_load ? filter.folder_id : null,
      keyword: is_initial_project_load ? filter.keyword : '',
      page_index: 1
    }

    setError(null)
    setDraftKeyword(next_filter.keyword)
    clearProjectScopedState(next_filter, true)

    if (project_id && project_id > 0) {
      void loadData(next_filter, false)
    }
  }

  useEffect(() => {
    if (!requires_project) return
    if (!workingProject) return
    if (filter.project_id === workingProject.id) return

    changeProject(workingProject.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingProject?.id, requires_project, filter.project_id])

  const changeViewMode = (view_mode: DocumentViewMode) => {
    void loadData({ ...filter, view_mode })
  }

  const changeStatus = (event: SelectChangeEvent) => {
    void loadData({ ...filter, status: event.target.value as DocumentFilterModel['status'], page_index: 1 })
  }

  const openTrash = () => {
    setActionAnchor(null)
    setActionRow(null)
    setSelectedIds([])
    void loadData({ ...filter, folder_id: null, status: 'deleted', keyword: '', page_index: 1 })
  }

  const leaveTrash = () => {
    setActionAnchor(null)
    setActionRow(null)
    setSelectedIds([])
    void loadData({ ...filter, folder_id: root_folder_id || null, status: 'all', keyword: '', page_index: 1 })
  }

  const search = () => {
    void loadData({ ...filter, keyword: draft_keyword, page_index: 1 })
  }

  const refresh = () => {
    void loadData(filter)
  }

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    void loadData({ ...filter, page_size: Number(event.target.value), page_index: 1 })
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page_index: number) => {
    void loadData({ ...filter, page_index })
  }

  const handleJumpPage: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = event => {
    const page_index = Math.min(
      Math.max(Number(event.target.value) || 1, 1),
      Math.max(Math.ceil(total_items / filter.page_size), 1)
    )

    void loadData({ ...filter, page_index })
  }

  const toggleSelected = (id: string) => {
    setSelectedIds(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]))
  }

  const selectOnly = (id: string) => {
    setSelectedIds([id])
  }

  const openActionMenu = (event: React.MouseEvent<HTMLElement>, row: DocumentNodeModel) => {
    event.stopPropagation()
    setActionAnchor(event.currentTarget)
    setActionRow(row)
  }

  const closeActionMenu = () => {
    setActionAnchor(null)
    setActionRow(null)
  }

  const openNode = (row: DocumentNodeModel) => {
    if (is_trash) {
      if (row.item_type === 'file') setPreviewFile(row)
      return
    }

    if (row.item_type === 'folder') navigateToFolder(row.id)
    else setPreviewFile(row)
  }

  const handleCreateFolder = async (payload: CreateDocumentFolderPayload) => {
    setSaving(true)

    try {
      await documentService.create_document_folder(payload, {
        sessiontoken,
        project_id: filter.project_id ?? workingProject?.id ?? undefined
      })
      setCreateOpen(false)
      await loadData(filter)
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (payload: UploadDocumentsPayload) => {
    setSaving(true)

    try {
      if (sessiontoken) {
        await documentService.upload_document_files(payload, {
          sessiontoken,
          project_id: filter.project_id ?? workingProject?.id ?? undefined
        })
      } else {
        await documentService.upload_documents(payload)
      }

      setUploadOpen(false)
      await loadData(filter)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (row: DocumentNodeModel) => {
    if (!row.file_url) {
      setError(documentText(dictionary, 'document_file_not_available'))
      return
    }

    if (row.file_url.startsWith('http')) {
      window.open(row.file_url, '_blank', 'noopener,noreferrer')
      return
    }

    try {
      const url = await documentService.get_download_url(row, { mode: 'attachment' })
      const a = document.createElement('a')
      a.href = url
      a.download = row.file_name ?? row.name
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : documentText(dictionary, 'download_document_failed'))
    }
  }

  const startStatusConfirm = () => {
    if (action_row) setConfirmAction({ type: 'status', row: action_row })
    closeActionMenu()
  }

  const startDeleteConfirm = () => {
    if (!action_row) return
    const row = action_row
    closeActionMenu()

    const is_folder = row.item_type === 'folder'
    const title = is_folder
      ? documentText(dictionary, 'delete_folder_title')
      : documentText(dictionary, 'delete_document_title')
    const message = is_folder
      ? documentText(dictionary, 'delete_folder_confirmation')
      : documentText(dictionary, 'delete_document_confirmation')

    void Swal.fire({
      title,
      html: `
        <p style="margin: 0 0 12px 0; color: #555; font-size: 15px;">${message}</p>
        <p style="font-weight: 700; color: #222; font-size: 15px;">"${row.name}"</p>
      `,
      iconHtml: '<img src="/images/icon/warning.svg" alt="warning" style="width:64px;height:64px;">',
      customClass: {
        icon: 'no-border',
        popup: 'swal-delete-popup'
      },
      showCancelButton: true,
      confirmButtonText: documentText(dictionary, 'delete'),
      cancelButtonText: documentText(dictionary, 'cancel'),
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false,
      color: 'black',
      didOpen: popup => {
        const header = popup.querySelector('.swal2-header') as HTMLElement | null
        if (header) {
          header.style.cssText = 'background: linear-gradient(135deg, #fff5f5, #ffe8e8); border-radius: 8px 8px 0 0; padding: 24px 24px 16px 24px;'
        }
      },
      preConfirm: async () => {
        Swal.showLoading()
        try {
          await documentService.delete_document_node(filter.module_code, row.id, {
            sessiontoken,
            project_id: filter.project_id ?? undefined
          })
          return true
        } catch (err) {
          Swal.showValidationMessage(err instanceof Error ? err.message : documentText(dictionary, 'delete_failed'))
          return false
        }
      }
    }).then(result => {
      if (result.isConfirmed) {
        if (preview_file?.id === row.id) setPreviewFile(null)
        SwalAlert('success', documentText(dictionary, 'delete_success'), 'center')
        void loadData(filter)
      }
    })
  }

  const handleConfirm = async () => {
    if (!confirm_action) return

    try {
      await documentService.change_document_status(
        filter.module_code,
        confirm_action.row.id,
        confirm_action.row.status === 'active' ? 'inactive' : 'active'
      )
      setSuccessMessage(documentText(dictionary, 'status_update_success'))
    } catch (err) {
      setError(err instanceof Error ? err.message : documentText(dictionary, 'action_failed'))
    } finally {
      setConfirmAction(null)
      await loadData(filter)
    }
  }

  const placeholderAction = async (message: string) => {
    setError(message)
    closeActionMenu()
  }

  const current_folder_name = is_trash ? trash_folder_name : breadcrumb.at(-1)?.name || default_folder_name

  return {
    filter,
    root_folder_id,
    draft_keyword,
    rows,
    breadcrumb,
    parent_id,
    tree,
    total_items,
    loading,
    error,
    selected_ids,
    action_anchor,
    action_row,
    upload_open,
    create_open,
    preview_file,
    confirm_action,
    saving,
    current_folder_name,
    success_message,
    has_project,
    is_trash,
    workingProject,
    setDraftKeyword,
    setUploadOpen,
    setCreateOpen,
    setPreviewFile,
    setConfirmAction,
    setError,
    setSuccessMessage,
    changeProject,
    navigateToFolder,
    goParentFolder,
    changeViewMode,
    changeStatus,
    openTrash,
    leaveTrash,
    search,
    refresh,
    handlePageSizeChange,
    handlePageChange,
    handleJumpPage,
    toggleSelected,
    selectOnly,
    openActionMenu,
    closeActionMenu,
    openNode,
    handleCreateFolder,
    handleUpload,
    handleDownload,
    startStatusConfirm,
    startDeleteConfirm,
    handleConfirm,
    placeholderAction
  }
}
