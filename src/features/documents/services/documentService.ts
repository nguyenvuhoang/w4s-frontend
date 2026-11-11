import { workflowService } from '@/servers/system-service'
import { WorkflowError, getWorkflowExecutionId } from '@/shared/utils/workflowError'

import type {
  CopyDocumentNodePayload,
  CreateDocumentFolderPayload,
  DocumentBreadcrumbItem,
  DocumentFilterModel,
  DocumentFolderTreeNode,
  DocumentListResponse,
  DocumentModuleCode,
  DocumentNodeModel,
  DocumentStatus,
  MoveDocumentNodePayload,
  RenameDocumentNodePayload,
  UploadDocumentsPayload
} from '../types'

const WF_BROWSER_DOCUMENTS = 'WF_BO_BROWSER_DOCUMENTS'
const WF_CREATE_DOCUMENT = 'WF_BO_CREATE_DOCUMENT'
const WF_DELETE_DOCUMENT = 'WF_BO_DELETE_DOCUMENT'
const WF_GET_DOWNLOAD_URL = 'WF_BO_GET_DOCUMENT_DOWNLOAD_URL'

const pickDocumentListData = (response: any): any => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const outer = dataresponse?.data ?? response?.data ?? response

  return outer?.data ?? outer
}

const assertDocumentSuccess = (response: any, fallback: string) => {
  const dataresponse = response?.payload?.dataresponse ?? response?.dataresponse
  const data = dataresponse?.data ?? response?.data
  const errors = dataresponse?.errors ?? response?.errors ?? []
  const failed =
    dataresponse?.success === false ||
    data?.success === false ||
    dataresponse?.code === 'failed' ||
    data?.code === 'failed'

  if ((Array.isArray(errors) && errors.length > 0) || failed) {
    const msg = errors[0]?.info ?? errors[0]?.message ?? dataresponse?.message ?? data?.message ?? fallback
    const execution_id = getWorkflowExecutionId(dataresponse ?? response)

    throw new WorkflowError(msg, execution_id, errors)
  }
}

const buildBrowserDocumentFields = (
  filter: DocumentFilterModel,
  project_id: number,
  page_index: number
): Record<string, unknown> => {
  const fields: Record<string, unknown> = {
    module_code: filter.module_code,
    project_id,
    page_index,
    page_size: filter.page_size,
    status: filter.status === 'all' ? 'ALL' : filter.status.toUpperCase()
  }

  const folder_id_num = filter.status === 'deleted' ? 0 : filter.folder_id ? Number(filter.folder_id) : 0
  if (Number.isFinite(folder_id_num) && folder_id_num > 0) {
    fields.folder_id = folder_id_num
  }

  const kw = filter.keyword?.trim()
  if (kw) {
    fields.keyword = kw
    fields.search_text = kw
  }

  return fields
}

const mapDocumentNode = (item: any): DocumentNodeModel => ({
  id: String(item.id ?? ''),
  module_code: item.module_code ?? 'resident_documents',
  parent_id: String(item.parent_id ?? ''),
  item_type: String(item.item_type ?? '').toLowerCase() === 'folder' ? 'folder' : 'file',
  name: String(item.name ?? ''),
  file_name: item.file_name ?? null,
  file_extension: item.file_extension ?? null,
  mime_type: item.mime_type ?? null,
  file_size: item.file_size != null ? Number(item.file_size) : null,
  file_url: item.file_url ?? null,
  preview_url: item.preview_url ?? item.file_url ?? null,
  download_url: item.download_url ?? item.file_url ?? null,
  status: String(item.status ?? 'active').toLowerCase() as DocumentStatus,
  created_by: String(item.created_by ?? ''),
  created_on_utc: item.created_on_utc ? String(item.created_on_utc) : '',
  updated_by: String(item.updated_by ?? ''),
  updated_on_utc: item.updated_on_utc ? String(item.updated_on_utc) : ''
})

const mapDocumentListResponse = (data: any, filter: DocumentFilterModel): DocumentListResponse => ({
  items: Array.isArray(data?.items) ? data.items.map(mapDocumentNode) : [],
  breadcrumb: Array.isArray(data?.breadcrumb)
    ? data.breadcrumb.map((b: any) => ({ id: String(b.id ?? ''), name: String(b.name ?? '') }))
    : [],
  folder_id: data?.folder_id ? String(data.folder_id) : (filter.folder_id ?? ''),
  parent_id: data?.parent_id != null ? String(data.parent_id) : null,
  module_code: data?.module_code ?? filter.module_code,
  root_folder_id: data?.root_folder_id
    ? String(data.root_folder_id)
    : data?.folder_id
      ? String(data.folder_id)
      : '',
  page_index: filter.page_index,
  page_size: filter.page_size,
  total_items: Number(data?.total_count ?? data?.total_items ?? 0),
  total_pages: Number(data?.total_pages ?? 0)
})

const mapCollectedVisibleDocumentListResponse = (
  first_data: any,
  filter: DocumentFilterModel,
  visible_items: DocumentNodeModel[]
): DocumentListResponse => {
  const base = mapDocumentListResponse(first_data, filter)
  const start = Math.max(filter.page_index - 1, 0) * filter.page_size
  const items = visible_items.slice(start, start + filter.page_size)

  return {
    ...base,
    items,
    page_index: filter.page_index,
    page_size: filter.page_size,
    total_items: visible_items.length,
    total_pages: Math.max(Math.ceil(visible_items.length / filter.page_size), visible_items.length > 0 ? 1 : 0)
  }
}

const getDefaultDocumentResponse = (filter: DocumentFilterModel): DocumentListResponse => ({
  items: [],
  breadcrumb: [],
  folder_id: '',
  parent_id: null,
  module_code: filter.module_code,
  root_folder_id: '',
  page_index: filter.page_index,
  page_size: filter.page_size,
  total_items: 0,
  total_pages: 0
})

const now_utc = '2026-06-14T00:00:00'

const root_by_module: Record<DocumentModuleCode, string> = {
  resident_documents: 'resident_root',
  internal_documents: 'internal_root'
}

const base_node = {
  file_name: null,
  file_extension: null,
  mime_type: null,
  file_size: null,
  file_url: null,
  preview_url: null,
  download_url: null,
  status: 'active' as DocumentStatus,
  created_by: 'IT Test2',
  created_on_utc: now_utc,
  updated_by: 'IT Test2',
  updated_on_utc: now_utc
}

const folder = (
  id: string,
  module_code: DocumentModuleCode,
  parent_id: string,
  name: string,
  created_on_utc: string = now_utc
): DocumentNodeModel => ({
  ...base_node,
  id,
  module_code,
  parent_id,
  item_type: 'folder',
  name,
  created_on_utc,
  updated_on_utc: created_on_utc
})

const file = (
  id: string,
  module_code: DocumentModuleCode,
  parent_id: string,
  name: string,
  file_extension: string,
  mime_type: string,
  file_size: number,
  created_on_utc: string,
  file_url: string | null = null
): DocumentNodeModel => ({
  ...base_node,
  id,
  module_code,
  parent_id,
  item_type: 'file',
  name,
  file_name: name,
  file_extension,
  mime_type,
  file_size,
  file_url,
  preview_url: file_url,
  download_url: file_url,
  created_on_utc,
  updated_on_utc: created_on_utc
})

let mock_nodes: DocumentNodeModel[] = [
  folder('resident_root', 'resident_documents', '', 'Files', '2026-02-01T00:00:00'),
  folder('resident_folder_moi', 'resident_documents', 'resident_root', 'Mới', '2026-02-05T13:53:00'),
  folder('resident_folder_vi', 'resident_documents', 'resident_root', 'Vi', '2026-02-02T13:45:00'),
  folder('resident_folder_quy_dinh', 'resident_documents', 'resident_root', 'Quy định', '2023-12-07T16:21:00'),
  folder('resident_folder_cu_dan', 'resident_documents', 'resident_folder_quy_dinh', 'Cư dân', '2024-01-08T09:15:00'),
  folder('resident_folder_bieu_mau', 'resident_documents', 'resident_folder_quy_dinh', 'Biểu mẫu', '2024-04-12T10:20:00'),
  file(
    'resident_file_001',
    'resident_documents',
    'resident_folder_vi',
    'IPS-QTKT-TC01. Quy trình hồ sơ thanh toán, tạm ứng, hoàn ứng.pdf',
    'pdf',
    'application/pdf',
    3250585,
    '2026-02-03T13:50:00',
    '/assets/pdf/vi/SAFE_TRANSACTION_MB.pdf'
  ),
  file(
    'resident_file_002',
    'resident_documents',
    'resident_folder_vi',
    'TB kiểm kê tài sản và bảo trì lần 2 - năm 2025.pdf',
    'pdf',
    'application/pdf',
    1258291,
    '2026-02-03T11:54:00',
    '/assets/pdf/vi/SAFE_TRANSACTION_MB.pdf'
  ),
  file(
    'resident_file_003',
    'resident_documents',
    'resident_folder_vi',
    'Sổ Tay Hệ Thống Thông Tin.docx',
    'docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    47718,
    '2026-02-03T11:11:00'
  ),
  file(
    'resident_file_rule',
    'resident_documents',
    'resident_folder_cu_dan',
    'Quy định đăng ký cư trú.pdf',
    'pdf',
    'application/pdf',
    835584,
    '2026-01-10T08:00:00',
    '/assets/pdf/vi/SAFE_TRANSACTION_MB.pdf'
  ),
  folder('internal_root', 'internal_documents', '', 'Files', '2026-02-01T00:00:00'),
  folder('internal_folder_policy', 'internal_documents', 'internal_root', 'Quy định nội bộ', '2026-02-02T13:45:00'),
  folder('internal_folder_process', 'internal_documents', 'internal_root', 'Quy trình nội bộ', '2026-01-18T10:00:00'),
  folder('internal_folder_hr', 'internal_documents', 'internal_folder_policy', 'Nhân sự', '2026-01-20T10:00:00'),
  folder('internal_folder_finance', 'internal_documents', 'internal_folder_policy', 'Tài chính', '2026-01-22T10:00:00'),
  file(
    'internal_file_001',
    'internal_documents',
    'internal_folder_process',
    'Quy trình phê duyệt mua hàng.pdf',
    'pdf',
    'application/pdf',
    2400256,
    '2026-02-12T09:10:00',
    '/assets/pdf/vi/SAFE_TRANSACTION_MB.pdf'
  ),
  file(
    'internal_file_002',
    'internal_documents',
    'internal_folder_hr',
    'Mẫu đánh giá thử việc.docx',
    'docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    128774,
    '2026-02-18T14:25:00'
  )
]

const normalize = (value: string) => value.trim().toLowerCase()

const node_matches_keyword = (node: DocumentNodeModel, keyword: string) => {
  if (!keyword) return true

  const text = [node.name, node.file_name, node.created_by, node.file_extension]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return text.includes(normalize(keyword))
}

const is_root = (module_code: DocumentModuleCode, folder_id: string) => root_by_module[module_code] === folder_id

const get_module_root = (module_code: DocumentModuleCode, root_folder_id?: string) =>
  root_folder_id === root_by_module[module_code] ? root_folder_id : root_by_module[module_code]

const get_folder = (module_code: DocumentModuleCode, folder_id: string) =>
  mock_nodes.find(node => node.module_code === module_code && node.id === folder_id && node.item_type === 'folder') ?? null

const resolve_folder_id = (module_code: DocumentModuleCode, root_folder_id: string, folder_id?: string) => {
  const module_root_id = get_module_root(module_code, root_folder_id)

  if (!folder_id || folder_id === module_root_id) return module_root_id

  return get_folder(module_code, folder_id) ? folder_id : module_root_id
}

const get_children = (module_code: DocumentModuleCode, parent_id: string) =>
  mock_nodes.filter(node => node.module_code === module_code && node.parent_id === parent_id)

const build_breadcrumb = (module_code: DocumentModuleCode, root_folder_id: string, folder_id: string): DocumentBreadcrumbItem[] => {
  const breadcrumb: DocumentBreadcrumbItem[] = [{ id: root_folder_id, name: 'Files' }]
  let current_id = folder_id
  const trail: DocumentBreadcrumbItem[] = []

  while (current_id && !is_root(module_code, current_id)) {
    const node = get_folder(module_code, current_id)

    if (!node || !node.parent_id) break

    trail.unshift({ id: node.id, name: node.name })
    current_id = node.parent_id
  }

  return [...breadcrumb, ...trail]
}

const build_tree = (module_code: DocumentModuleCode, parent_id: string): DocumentFolderTreeNode[] =>
  get_children(module_code, parent_id)
    .filter(node => node.item_type === 'folder' && node.status !== 'deleted')
    .map(node => ({
      ...node,
      children: build_tree(module_code, node.id)
    }))

const sort_nodes = (items: DocumentNodeModel[]) =>
  [...items].sort((a, b) => {
    if (a.item_type !== b.item_type) return a.item_type === 'folder' ? -1 : 1

    return a.name.localeCompare(b.name, 'vi')
  })

export const documentService = {
  async get_document_nodes(
    filter: DocumentFilterModel,
    opts?: { sessiontoken?: string; project_id?: number }
  ): Promise<DocumentListResponse> {
    const resolved_project_id = opts?.project_id ?? filter.project_id ?? undefined

    if (!resolved_project_id || resolved_project_id <= 0) {
      return getDefaultDocumentResponse(filter)
    }

    if (opts?.sessiontoken) {
      const runPage = async (page_index: number) => {
        const response = await workflowService.runFODynamic({
          sessiontoken: opts.sessiontoken!,
          workflowid: WF_BROWSER_DOCUMENTS,
          input: buildBrowserDocumentFields(filter, resolved_project_id, page_index)
        })

        assertDocumentSuccess(response, 'Không thể tải danh sách tài liệu.')

        return pickDocumentListData(response)
      }

      if (filter.status !== 'all') {
        return mapDocumentListResponse(await runPage(Math.max(filter.page_index - 1, 0)), filter)
      }

      const first_data = await runPage(0)
      const first_response = mapDocumentListResponse(first_data, { ...filter, page_index: 1 })
      const total_pages = Math.max(Number(first_data?.total_pages ?? first_response.total_pages ?? 1), 1)
      const visible_items = first_response.items.filter(item => item.status !== 'deleted')

      for (let page_index = 1; page_index < total_pages; page_index += 1) {
        const page_data = await runPage(page_index)
        const page_response = mapDocumentListResponse(page_data, { ...filter, page_index: page_index + 1 })

        visible_items.push(...page_response.items.filter(item => item.status !== 'deleted'))
      }

      return mapCollectedVisibleDocumentListResponse(first_data, filter, visible_items)
    }

    // mock fallback (local dev / no session)
    const root_folder_id = get_module_root(filter.module_code, undefined)
    const folder_id = resolve_folder_id(filter.module_code, root_folder_id, filter.folder_id ?? undefined)
    const current_folder = get_folder(filter.module_code, folder_id)
    const parent_id = is_root(filter.module_code, folder_id) ? null : current_folder?.parent_id ?? root_folder_id
    const source_nodes = filter.status === 'deleted'
      ? mock_nodes.filter(node => node.module_code === filter.module_code)
      : get_children(filter.module_code, folder_id)
    const filtered = sort_nodes(source_nodes).filter(node => {
      const status_matched =
        filter.status === 'all' ? node.status !== 'deleted' : node.status === filter.status

      return status_matched && node_matches_keyword(node, filter.keyword)
    })
    const start = (filter.page_index - 1) * filter.page_size
    const items = filtered.slice(start, start + filter.page_size)

    return {
      items,
      breadcrumb: build_breadcrumb(filter.module_code, root_folder_id, folder_id),
      folder_id,
      parent_id,
      module_code: filter.module_code,
      root_folder_id,
      page_index: filter.page_index,
      page_size: filter.page_size,
      total_items: filtered.length,
      total_pages: Math.max(Math.ceil(filtered.length / filter.page_size), 1)
    }
  },

  async get_document_folder_tree(filter: { module_code: DocumentModuleCode; root_folder_id: string; project_id?: number }) {
    const root_folder_id = get_module_root(filter.module_code, filter.root_folder_id)

    return build_tree(filter.module_code, root_folder_id)
  },

  async get_document_breadcrumb(filter: { module_code: DocumentModuleCode; root_folder_id: string; folder_id: string }) {
    const root_folder_id = get_module_root(filter.module_code, filter.root_folder_id)
    const folder_id = resolve_folder_id(filter.module_code, root_folder_id, filter.folder_id)

    return build_breadcrumb(filter.module_code, root_folder_id, folder_id)
  },

  async get_document_node_by_id(module_code: DocumentModuleCode, id: string) {
    return mock_nodes.find(node => node.module_code === module_code && node.id === id) ?? null
  },

  get_folder_child_count(module_code: DocumentModuleCode, id: string) {
    return mock_nodes.filter(node => node.module_code === module_code && node.parent_id === id).length
  },

  is_duplicate_folder_name(payload: CreateDocumentFolderPayload, ignore_id?: string) {
    return mock_nodes.some(
      node =>
        node.id !== ignore_id &&
        node.item_type === 'folder' &&
        node.module_code === payload.module_code &&
        node.parent_id === payload.parent_id &&
        normalize(node.name) === normalize(payload.folder_name)
    )
  },

  async create_document_folder(
    payload: CreateDocumentFolderPayload,
    opts?: { sessiontoken?: string; project_id?: number }
  ): Promise<DocumentNodeModel> {
    if (opts?.sessiontoken) {
      const fields: Record<string, unknown> = {
        module_code: payload.module_code,
        parent_id: payload.parent_id ? Number(payload.parent_id) : null,
        folder_name: payload.folder_name,
        description: payload.description ?? '',
        status: 'ACTIVE',
        project_id: opts.project_id ?? null
      }

      const response = await workflowService.runFODynamic({
        sessiontoken: opts.sessiontoken,
        workflowid: WF_CREATE_DOCUMENT,
        input: fields
      })

      assertDocumentSuccess(response, 'Không thể tạo thư mục.')

      const raw = pickDocumentListData(response)

      return mapDocumentNode(raw)
    }

    // mock fallback (local dev / no session)
    const parent = get_folder(payload.module_code, payload.parent_id)

    if (!parent) throw new Error('Parent folder does not belong to this document module.')
    if (this.is_duplicate_folder_name(payload)) throw new Error('Folder name already exists in this location.')

    const node = folder(
      `${payload.module_code.replace('_documents', '')}_folder_${Date.now()}`,
      payload.module_code,
      payload.parent_id,
      payload.folder_name,
      new Date().toISOString()
    )

    mock_nodes = [{ ...node, status: payload.status }, ...mock_nodes]

    return node
  },

  async upload_documents(payload: UploadDocumentsPayload) {
    const parent = get_folder(payload.module_code, payload.parent_id)

    if (!parent) throw new Error('Upload folder does not belong to this document module.')

    const created = payload.files.map(selected_file =>
      file(
        `${payload.module_code.replace('_documents', '')}_file_${Date.now()}_${selected_file.name}`,
        payload.module_code,
        payload.parent_id,
        selected_file.name,
        selected_file.name.split('.').pop()?.toLowerCase() || '',
        selected_file.type || 'application/octet-stream',
        selected_file.size,
        new Date().toISOString()
      )
    )

    mock_nodes = [...created.map(node => ({ ...node, status: payload.status, preview_url: node.file_url, download_url: node.file_url })), ...mock_nodes]

    return created
  },

  async upload_document_files(
    payload: UploadDocumentsPayload,
    opts: { sessiontoken: string; project_id?: number }
  ): Promise<DocumentNodeModel[]> {
    const results: DocumentNodeModel[] = []

    for (const selected_file of payload.files) {
      const file_extension = selected_file.name.split('.').pop()?.toLowerCase() ?? ''
      const mime_type = selected_file.type || 'application/octet-stream'
      const project_id = opts.project_id && opts.project_id > 0 ? opts.project_id : 0
      const parent_id_num = payload.parent_id ? Number(payload.parent_id) : 0

      // Step 1: lấy presigned PUT URL từ Next.js API route (server-side MinIO client)
      const presignRes = await fetch('/api/documents/presign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_code: payload.module_code,
          parent_id: parent_id_num,
          project_id,
          file_name: selected_file.name,
          mime_type,
          file_size: selected_file.size
        })
      })

      const presignJson = await presignRes.json().catch(() => ({}))

      if (!presignRes.ok || !presignJson?.success) {
        throw new Error(presignJson?.message ?? `Không thể lấy upload URL cho "${selected_file.name}".`)
      }

      const { upload_url, object_key, bucket_name } = presignJson.data as {
        upload_url: string
        object_key: string
        bucket_name: string
      }

      // Step 2: PUT file trực tiếp lên MinIO qua presigned URL
      const putResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': mime_type },
        body: selected_file
      })

      if (!putResponse.ok) {
        throw new Error(`Upload "${selected_file.name}" lên storage thất bại (${putResponse.status}).`)
      }

      // Step 3: gọi WF_BO_CREATE_DOCUMENT lưu metadata (không gửi file)
      // file_url = object_key MinIO, dùng để tạo presigned GET URL khi download
      const createResponse = await workflowService.runFODynamic({
        sessiontoken: opts.sessiontoken,
        workflowid: WF_CREATE_DOCUMENT,
        input: {
          module_code: payload.module_code,
          parent_id: parent_id_num || null,
          project_id: project_id || null,
          title: selected_file.name,
          description: payload.description ?? '',
          category: null,
          file_name: selected_file.name,
          file_url: object_key,
          file_type: mime_type || file_extension,
          file_size: selected_file.size,
          folder_name: null
        }
      })

      assertDocumentSuccess(createResponse, `Lưu metadata "${selected_file.name}" thất bại.`)

      const raw = pickDocumentListData(createResponse)
      if (raw) results.push(mapDocumentNode(raw))
    }

    return results
  },

  async get_presigned_download_url(
    object_key: string,
    opts: { file_name?: string; mode?: 'inline' | 'attachment' } = {}
  ): Promise<string> {
    const params = new URLSearchParams({ object_key })
    if (opts.file_name) params.set('file_name', opts.file_name)
    if (opts.mode) params.set('mode', opts.mode)

    const res = await fetch(`/api/documents/presign-download?${params.toString()}`)
    const json = await res.json().catch(() => ({}))

    if (!res.ok || !json?.success) {
      throw new Error(json?.message ?? 'Không thể tạo link tải xuống.')
    }

    const url: string = json?.data?.download_url ?? ''
    if (!url) throw new Error('Presigned URL trống.')

    return url
  },

  async get_download_url(
    row: DocumentNodeModel,
    opts: { mode?: 'inline' | 'attachment' } = {}
  ): Promise<string> {
    const object_key = row.file_url ?? ''

    if (!object_key) throw new Error('Tài liệu chưa có file.')

    // object_key MinIO (không bắt đầu bằng http) → dùng presign-download
    if (!object_key.startsWith('http')) {
      return this.get_presigned_download_url(object_key, {
        file_name: row.file_name ?? row.name,
        mode: opts.mode
      })
    }

    // URL đầy đủ (mock dev) → trả thẳng
    return object_key
  },

  async rename_document_node(module_code: DocumentModuleCode, id: string, payload: RenameDocumentNodePayload) {
    mock_nodes = mock_nodes.map(node =>
      node.module_code === module_code && node.id === id
        ? { ...node, name: payload.name, file_name: node.item_type === 'file' ? payload.name : null }
        : node
    )
  },

  async move_document_node(module_code: DocumentModuleCode, id: string, payload: MoveDocumentNodePayload) {
    if (!get_folder(module_code, payload.parent_id)) throw new Error('Target folder does not belong to this document module.')

    mock_nodes = mock_nodes.map(node => (node.module_code === module_code && node.id === id ? { ...node, parent_id: payload.parent_id } : node))
  },

  async copy_document_node(module_code: DocumentModuleCode, id: string, payload: CopyDocumentNodePayload) {
    if (!get_folder(module_code, payload.parent_id)) throw new Error('Target folder does not belong to this document module.')

    const node = mock_nodes.find(item => item.module_code === module_code && item.id === id)

    if (!node) return null

    const copy = { ...node, id: `${node.id}_copy_${Date.now()}`, parent_id: payload.parent_id, name: `${node.name} - Copy` }

    mock_nodes = [copy, ...mock_nodes]

    return copy
  },

  async change_document_status(module_code: DocumentModuleCode, id: string, status: DocumentStatus) {
    mock_nodes = mock_nodes.map(node =>
      node.module_code === module_code && node.id === id ? { ...node, status, updated_on_utc: new Date().toISOString() } : node
    )
  },

  async delete_document_node(
    module_code: DocumentModuleCode,
    id: string,
    opts?: { sessiontoken?: string; project_id?: number }
  ) {
    if (opts?.sessiontoken) {
      const input: Record<string, unknown> = { id: Number(id) }

      if (opts.project_id && opts.project_id > 0) {
        input.project_id = opts.project_id
      }

      const response = await workflowService.runFODynamic({
        sessiontoken: opts.sessiontoken,
        workflowid: WF_DELETE_DOCUMENT,
        input
      })

      assertDocumentSuccess(response, 'Không thể xóa tài liệu.')
      return
    }

    // mock fallback
    await this.change_document_status(module_code, id, 'deleted')
  },

  get_default_document_response(filter: DocumentFilterModel): DocumentListResponse {
    return getDefaultDocumentResponse(filter)
  }
}
