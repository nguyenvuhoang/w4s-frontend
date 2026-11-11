import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Menu, MenuItem } from '@mui/material'

import type { DocumentNodeModel } from '../types'
import { documentText, type DocumentDictionary } from './documentHelpers'

type Props = {
  dictionary: DocumentDictionary
  anchor_el: HTMLElement | null
  row: DocumentNodeModel | null
  root_folder_id?: string
  on_close: () => void
  on_open: (row: DocumentNodeModel) => void
  on_preview: (row: DocumentNodeModel) => void
  on_download: (row: DocumentNodeModel) => void
  on_status: () => void
  on_delete: () => void
  on_placeholder: (message: string) => void
}

const DocumentActionMenu = ({ dictionary, anchor_el, row, root_folder_id, on_close, on_open, on_preview, on_download, on_status, on_delete, on_placeholder }: Props) => {
  const is_folder = row?.item_type === 'folder'
  const is_root = Boolean(root_folder_id && row?.id === root_folder_id)

  return (
    <Menu anchorEl={anchor_el} open={Boolean(anchor_el)} onClose={on_close}>
      {is_folder ? (
        <MenuItem onClick={() => row && on_open(row)}>
          <OpenInNewOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />{documentText(dictionary, 'open')}
        </MenuItem>
      ) : [
        <MenuItem key="preview" onClick={() => row && on_preview(row)}>
          <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />{documentText(dictionary, 'preview')}
        </MenuItem>,
        <MenuItem key="download" onClick={() => { row && on_download(row); on_close() }}>
          <DownloadOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />{documentText(dictionary, 'download')}
        </MenuItem>
      ]}
      <MenuItem onClick={() => on_placeholder(documentText(dictionary, 'rename_not_available'))}>
        <EditOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />{documentText(dictionary, 'rename')}
      </MenuItem>
      <MenuItem onClick={() => on_placeholder(documentText(dictionary, 'move_not_available'))}>
        <DriveFileMoveOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />{documentText(dictionary, 'move')}
      </MenuItem>
      <MenuItem onClick={() => on_placeholder(documentText(dictionary, 'copy_not_available'))}>
        <ContentCopyOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />{documentText(dictionary, 'copy')}
      </MenuItem>
      <MenuItem onClick={on_status}>
        {row?.status === 'active' ? <LockOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} /> : <LockOpenOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />}
        {documentText(dictionary, 'change_status')}
      </MenuItem>
      {!is_root && (
        <MenuItem sx={{ color: 'error.main' }} onClick={on_delete}>
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1.5 }} />{documentText(dictionary, 'delete')}
        </MenuItem>
      )}
    </Menu>
  )
}

export default DocumentActionMenu
