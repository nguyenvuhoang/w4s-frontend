import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Checkbox, Chip, IconButton, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import type { DocumentNodeModel } from '../types'
import { DocumentNodeIcon, documentText, format_document_date, format_file_size, get_status_color, get_status_label, type DocumentDictionary } from './documentHelpers'

type Props = {
  dictionary: DocumentDictionary
  rows: DocumentNodeModel[]
  loading: boolean
  selected_ids: string[]
  page_size: number
  empty_text: string
  on_select: (id: string) => void
  on_select_only: (id: string) => void
  on_open: (row: DocumentNodeModel) => void
  on_open_action_menu: (event: React.MouseEvent<HTMLElement>, row: DocumentNodeModel) => void
  show_actions?: boolean
}

const DocumentListView = ({ dictionary, rows, loading, selected_ids, page_size, empty_text, on_select, on_select_only, on_open, on_open_action_menu, show_actions = true }: Props) => (
  <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table stickyHeader size="small" sx={{ minWidth: 1120 }}>
        <TableHead>
          <TableRow>
            {[
              '',
              documentText(dictionary, 'name'),
              documentText(dictionary, 'status'),
              documentText(dictionary, 'created_at'),
              documentText(dictionary, 'created_by'),
              documentText(dictionary, 'size'),
              ...(show_actions ? [documentText(dictionary, 'actions')] : [])
            ].map(label => (
              <TableCell key={label} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800 }}>
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: page_size }).map((_, index) => (
              <TableRow key={index}>
                {Array.from({ length: show_actions ? 7 : 6 }).map((__, cell_index) => <TableCell key={cell_index}><Skeleton height={28} /></TableCell>)}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={show_actions ? 7 : 6} align="center" sx={{ py: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{empty_text}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map(row => (
              <TableRow
                key={row.id}
                hover
                selected={selected_ids.includes(row.id)}
                onClick={() => {
                  row.item_type === 'folder' ? on_open(row) : on_select_only(row.id)
                }}
                onDoubleClick={() => row.item_type === 'file' && on_open(row)}
                sx={{ cursor: row.item_type === 'folder' ? 'pointer' : 'default' }}
              >
                <TableCell padding="checkbox">
                  <Checkbox checked={selected_ids.includes(row.id)} onClick={event => event.stopPropagation()} onChange={() => on_select(row.id)} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={1.25}>
                    <DocumentNodeIcon node={row} fontSize="small" />
                    <Typography variant="body2" fontWeight={row.item_type === 'folder' ? 800 : 600} noWrap maxWidth={520}>
                      {row.name}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell><Chip size="small" color={get_status_color(row.status)} label={get_status_label(dictionary, row.status)} /></TableCell>
                <TableCell>{format_document_date(row.created_on_utc)}</TableCell>
                <TableCell>{row.created_by}</TableCell>
                <TableCell>{row.item_type === 'folder' ? '-' : format_file_size(row.file_size)}</TableCell>
                {show_actions && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={event => on_open_action_menu(event, row)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
)

export default DocumentListView
