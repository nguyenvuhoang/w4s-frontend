import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Box, Chip, IconButton, Paper, Skeleton, Stack, Typography } from '@mui/material'

import { documentService } from '../services/documentService'
import type { DocumentModuleCode, DocumentNodeModel } from '../types'
import { DocumentNodeIcon, documentText, format_document_date, format_file_size, get_status_color, get_status_label, type DocumentDictionary } from './documentHelpers'

type Props = {
  dictionary: DocumentDictionary
  rows: DocumentNodeModel[]
  loading: boolean
  page_size: number
  empty_text: string
  module_code: DocumentModuleCode
  on_open: (row: DocumentNodeModel) => void
  on_open_action_menu: (event: React.MouseEvent<HTMLElement>, row: DocumentNodeModel) => void
  show_actions?: boolean
}

const DocumentTileView = ({ dictionary, rows, loading, page_size, empty_text, module_code, on_open, on_open_action_menu, show_actions = true }: Props) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 2
    }}
  >
    {loading ? (
      Array.from({ length: page_size }).map((_, index) => <Skeleton key={index} variant="rounded" height={190} />)
    ) : rows.length === 0 ? (
      <Paper variant="outlined" sx={{ gridColumn: '1 / -1', py: 6, textAlign: 'center', borderRadius: 2 }}>
        <Typography fontWeight={800}>{empty_text}</Typography>
      </Paper>
    ) : (
      rows.map(row => (
        <Paper
          key={row.id}
          variant="outlined"
          onClick={() => row.item_type === 'folder' && on_open(row)}
          onDoubleClick={() => row.item_type === 'file' && on_open(row)}
          sx={{
            p: 2,
            minHeight: 190,
            borderRadius: 2,
            cursor: row.item_type === 'folder' ? 'pointer' : 'default',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
          }}
        >
          <Stack height="100%" justifyContent="space-between" gap={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <DocumentNodeIcon node={row} sx={{ fontSize: 46 }} />
              {show_actions && (
                <IconButton size="small" onClick={event => on_open_action_menu(event, row)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
            <Box>
              <Typography variant="body2" fontWeight={800} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 42 }}>
                {row.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.item_type === 'folder'
                  ? `${documentService.get_folder_child_count(module_code, row.id)} ${documentText(dictionary, 'item_count_label')}`
                  : `${row.file_extension?.toUpperCase()} · ${format_file_size(row.file_size)}`}
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {format_document_date(row.created_on_utc)}
              </Typography>
              <Chip size="small" color={get_status_color(row.status)} label={get_status_label(dictionary, row.status)} />
            </Stack>
          </Stack>
        </Paper>
      ))
    )}
  </Box>
)

export default DocumentTileView
