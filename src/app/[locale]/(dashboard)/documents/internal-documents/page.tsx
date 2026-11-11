import ResolvedProps from '@/@core/components/ResolvedProps'
import { Locale } from '@/configs/i18n'
import DocumentExplorer from '@/features/documents/components/DocumentExplorer'
import { documentService } from '@/features/documents/services/documentService'
import type { DocumentExplorerConfig, DocumentFilterModel, DocumentStatus, DocumentViewMode } from '@/features/documents/types'
import AuthorizedLayout from '@components/layout/AuthorizedLayout'

type SearchParams = Record<string, string | string[] | undefined>

const internal_documents_config: DocumentExplorerConfig = {
  module_code: 'internal_documents',
  require_project: true
}

const getSearchValue = (search_params: SearchParams, key: string) => {
  const value = search_params[key]

  return Array.isArray(value) ? value[0] : value
}

const parseDocumentFilter = (search_params: SearchParams): DocumentFilterModel => {
  const folder_id = getSearchValue(search_params, 'folder_id')
  const view_mode = getSearchValue(search_params, 'view_mode')
  const status = getSearchValue(search_params, 'status')
  const project_id = Number(getSearchValue(search_params, 'project_id'))

  return {
    module_code: internal_documents_config.module_code,
    project_id: Number.isFinite(project_id) && project_id > 0 ? project_id : null,
    folder_id: folder_id || null,
    view_mode: ['tree', 'list', 'tile', 'compact'].includes(view_mode || '') ? view_mode as DocumentViewMode : 'list',
    keyword: getSearchValue(search_params, 'keyword') ?? '',
    status: ['active', 'inactive', 'deleted'].includes(status || '') ? status as DocumentStatus : 'all',
    page_index: 1,
    page_size: 10
  }
}

const InternalDocumentsPage = async (props: {
  params: Promise<{ locale: Locale }>
  searchParams?: Promise<SearchParams>
}) => {
  const params = await props.params
  const search_params = await props.searchParams ?? {}
  const initial_filter = parseDocumentFilter(search_params)
  const initial_data = documentService.get_default_document_response(initial_filter)
  const initial_tree: Awaited<ReturnType<typeof documentService.get_document_folder_tree>> = []

  return (
    <AuthorizedLayout requiredPath="/documents/internal-documents" params={params}>
      {p => (
        <ResolvedProps
          Component={DocumentExplorer}
          props={{
            ...p,
            config: internal_documents_config,
            initial_filter,
            initial_data,
            initial_tree
          }}
        />
      )}
    </AuthorizedLayout>
  )
}

export default InternalDocumentsPage
