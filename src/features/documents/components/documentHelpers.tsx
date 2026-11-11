import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import FolderRoundedIcon from '@mui/icons-material/FolderRounded'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import type { ChipProps, SvgIconProps } from '@mui/material'

import type { getDictionary } from '@/shared/utils/getDictionary'

import type { DocumentModuleCode, DocumentNodeModel, DocumentStatus } from '../types'

export type DocumentDictionary = Awaited<ReturnType<typeof getDictionary>>
export const documentText = (dictionary: DocumentDictionary, key: string, fallback?: string) => dictionary.document?.[key] ?? fallback ?? key

export const get_module_title = (dictionary: DocumentDictionary, module_code: DocumentModuleCode) =>
  module_code === 'resident_documents'
    ? documentText(dictionary, 'resident_title')
    : documentText(dictionary, 'internal_title')

export const get_status_label = (dictionary: DocumentDictionary, status: DocumentStatus | 'all') => {
  const labels = {
    all: documentText(dictionary, 'status_all'),
    active: documentText(dictionary, 'status_active'),
    inactive: documentText(dictionary, 'status_inactive'),
    deleted: documentText(dictionary, 'status_deleted')
  }

  return labels[status]
}

export const get_status_color = (status: DocumentStatus): ChipProps['color'] => {
  if (status === 'active') return 'success'
  if (status === 'inactive') return 'warning'

  return 'error'
}

export const format_file_size = (size: number | null) => {
  if (!size) return '-'
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export const format_document_date = (date: string | null | undefined): string => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export const get_node_type_label = (dictionary: DocumentDictionary, node: DocumentNodeModel) =>
  node.item_type === 'folder' ? documentText(dictionary, 'folder_type') : (node.file_extension || documentText(dictionary, 'file_type')).toUpperCase()

export const DocumentNodeIcon = ({ node, ...props }: { node: DocumentNodeModel } & SvgIconProps) => {
  if (node.item_type === 'folder') return <FolderRoundedIcon {...props} sx={{ color: '#f2b705', ...props.sx }} />
  if (node.file_extension === 'pdf') return <PictureAsPdfOutlinedIcon {...props} sx={{ color: 'error.main', ...props.sx }} />
  if (node.file_extension === 'doc' || node.file_extension === 'docx') return <ArticleOutlinedIcon {...props} sx={{ color: 'primary.main', ...props.sx }} />
  if (node.mime_type?.startsWith('image/')) return <ImageOutlinedIcon {...props} sx={{ color: 'success.main', ...props.sx }} />

  return <DescriptionOutlinedIcon {...props} sx={{ color: 'text.secondary', ...props.sx }} />
}

export const empty_document_node: DocumentNodeModel = {
  id: '',
  module_code: 'resident_documents',
  parent_id: 'resident_root',
  item_type: 'file',
  name: '',
  file_name: null,
  file_extension: null,
  mime_type: null,
  file_size: null,
  file_url: null,
  preview_url: null,
  download_url: null,
  status: 'active',
  created_by: '',
  created_on_utc: '',
  updated_by: '',
  updated_on_utc: ''
}
