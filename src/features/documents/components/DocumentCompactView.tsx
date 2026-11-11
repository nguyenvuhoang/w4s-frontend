import MoreVertIcon from '@mui/icons-material/MoreVert'
import { IconButton, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import type { DocumentNodeModel } from '../types'
import { DocumentNodeIcon, documentText, format_document_date, format_file_size, get_node_type_label, type DocumentDictionary } from './documentHelpers'

type Props = {
  dictionary: DocumentDictionary
  rows: DocumentNodeModel[]
  loading: boolean
  page_size: number
  empty_text: string
  on_open: (row: DocumentNodeModel) => void
  on_open_action_menu: (event: React.MouseEvent<HTMLElement>, row: DocumentNodeModel) => void
  show_actions?: boolean
}

const DocumentCompactView = ({ dictionary, rows, loading, page_size, empty_text, on_open, on_open_action_menu, show_actions = true }: Props) => (
  <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table stickyHeader size="small" sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            {[
              documentText(dictionary, 'name'),
              documentText(dictionary, 'type'),
              documentText(dictionary, 'size'),
              documentText(dictionary, 'created_at'),
              ...(show_actions ? [documentText(dictionary, 'actions')] : [])
            ].map(label => (
              <TableCell key={label} sx={{ bgcolor: 'primary.main', color: 'common.white', fontWeight: 800, py: 1 }}>
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: page_size }).map((_, index) => (
              <TableRow key={index}>{Array.from({ length: show_actions ? 5 : 4 }).map((__, cell_index) => <TableCell key={cell_index}><Skeleton height={22} /></TableCell>)}</TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={show_actions ? 5 : 4} align="center" sx={{ py: 5 }}><Typography fontWeight={800}>{empty_text}</Typography></TableCell></TableRow>
          ) : (
            rows.map(row => (
              <TableRow
                key={row.id}
                hover
                onClick={() => row.item_type === 'folder' && on_open(row)}
                onDoubleClick={() => row.item_type === 'file' && on_open(row)}
                sx={{ cursor: row.item_type === 'folder' ? 'pointer' : 'default' }}
              >
                <TableCell sx={{ py: 0.75 }}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <DocumentNodeIcon node={row} fontSize="small" />
                    <Typography variant="body2" noWrap maxWidth={520}>{row.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ py: 0.75 }}>{get_node_type_label(dictionary, row)}</TableCell>
                <TableCell sx={{ py: 0.75 }}>{row.item_type === 'folder' ? '-' : format_file_size(row.file_size)}</TableCell>
                <TableCell sx={{ py: 0.75 }}>{format_document_date(row.created_on_utc)}</TableCell>
                {show_actions && (
                  <TableCell align="right" sx={{ py: 0.75 }}>
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

export default DocumentCompactView
