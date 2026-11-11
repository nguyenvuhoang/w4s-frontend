export type DocumentModuleCode = 'resident_documents' | 'internal_documents'
export type DocumentItemType = 'folder' | 'file'
export type DocumentStatus = 'active' | 'inactive' | 'deleted'
export type DocumentViewMode = 'tree' | 'list' | 'tile' | 'compact'

export type DocumentExplorerConfig = {
  module_code: DocumentModuleCode
  title?: string
  subtitle?: string
  require_project?: boolean
}

export type DocumentNodeModel = {
  id: string
  module_code: DocumentModuleCode
  parent_id: string
  item_type: DocumentItemType
  name: string
  file_name: string | null
  file_extension: string | null
  mime_type: string | null
  file_size: number | null
  file_url: string | null
  preview_url: string | null
  download_url: string | null
  status: DocumentStatus
  created_by: string
  created_on_utc: string
  updated_by: string
  updated_on_utc: string
}

export type DocumentFolderTreeNode = DocumentNodeModel & {
  children: DocumentFolderTreeNode[]
}

export type DocumentBreadcrumbItem = {
  id: string
  name: string
}

export type DocumentFilterModel = {
  module_code: DocumentModuleCode
  project_id: number | null
  folder_id: string | null
  keyword: string
  status: 'all' | DocumentStatus
  view_mode: DocumentViewMode
  page_index: number
  page_size: number
}

export type DocumentListResponse = {
  items: DocumentNodeModel[]
  breadcrumb: DocumentBreadcrumbItem[]
  folder_id: string
  parent_id: string | null
  module_code: DocumentModuleCode
  root_folder_id: string
  page_index: number
  page_size: number
  total_items: number
  total_pages: number
}

export type DocumentExplorerEmptyState = {
  title: string
  description: string
}

export type CreateDocumentFolderPayload = {
  module_code: DocumentModuleCode
  parent_id: string
  folder_name: string
  description?: string
  status: DocumentStatus
}

export type UploadDocumentsPayload = {
  module_code: DocumentModuleCode
  parent_id: string
  files: File[]
  status: DocumentStatus
  description?: string
}

export type RenameDocumentNodePayload = {
  name: string
}

export type MoveDocumentNodePayload = {
  parent_id: string
}

export type CopyDocumentNodePayload = {
  parent_id: string
}

export type PresignedUploadResult = {
  upload_url: string
  object_key: string
  bucket_name: string
}
