import {
  Chip,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'

import type { Locale } from '@/configs/i18n'
import { useSearchTableRowConfig } from '@/shared/components/table'

import type { MenuCommandItem, MenuManagementDictionary } from '../types'
import {
  displayValue,
  getCommandTypeMeta,
  getGroupMenuVisibleMeta,
  getMenuCommandCaption,
  menuManagementText
} from './menuCommandHelpers'

type Props = {
  dictionary: MenuManagementDictionary
  locale: Locale
  rows: MenuCommandItem[]
  loading: boolean
  pageSize: number
  onOpenDetail: (row: MenuCommandItem) => void
}

// No "Thao tác" column here on purpose — double-clicking a row is the single way to open detail
// (see MenuManagementContent's onOpenDetail). A per-row view button would just be a second path
// to the same screen. No "Thứ tự" (display_order) column either — it's a raw sort value with no
// search/scan value on this list; it still shows on the detail page.
const columns = [
  'command_id',
  'name',
  'command_type',
  'parent_id',
  'href',
  'action_code',
  'group_menu_visible'
] as const

const columnWidths: Record<typeof columns[number], number> = {
  command_id: 130,
  name: 360,
  command_type: 110,
  parent_id: 140,
  href: 300,
  action_code: 120,
  group_menu_visible: 130
}

const tableMinWidth = Object.values(columnWidths).reduce((sum, width) => sum + width, 0)

const compactCellSx = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}

const truncateTextSx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'block'
}

const chipSx = {
  minWidth: 84,
  justifyContent: 'center'
}

const getColumnLabel = (dictionary: MenuManagementDictionary, column: typeof columns[number]) => {
  const labels: Record<typeof columns[number], string> = {
    command_id: menuManagementText(dictionary, 'field_command_id', 'Mã'),
    name: menuManagementText(dictionary, 'field_name', 'Tên menu / tính năng'),
    command_type: menuManagementText(dictionary, 'field_command_type', 'Loại'),
    parent_id: menuManagementText(dictionary, 'field_parent_id', 'Menu cha'),
    href: menuManagementText(dictionary, 'field_href', 'Đường dẫn'),
    action_code: menuManagementText(dictionary, 'field_action_code', 'Action Code'),
    group_menu_visible: menuManagementText(dictionary, 'field_group_menu_visible', 'Hiển thị menu')
  }

  return labels[column]
}

const TruncatedCell = ({ value, fontWeight }: { value: string, fontWeight?: number }) => (
  <Tooltip title={value === '-' ? '' : value}>
    <Typography component="span" sx={{ ...truncateTextSx, fontWeight, fontSize: 'inherit' }}>
      {value}
    </Typography>
  </Tooltip>
)

const MenuManagementTable = ({ dictionary, locale, rows, loading, pageSize, onOpenDetail }: Props) => {
  const table = useSearchTableRowConfig<MenuCommandItem>({
    rowInteraction: { onOpenDetail }
  })

  return (
  <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', minWidth: tableMinWidth }}>
        <colgroup>
          {columns.map(column => <col key={column} style={{ width: columnWidths[column] }} />)}
        </colgroup>
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell
                key={column}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  fontWeight: 800,
                  whiteSpace: 'nowrap'
                }}
              >
                {getColumnLabel(dictionary, column)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map(column => <TableCell key={column}><Skeleton height={28} /></TableCell>)}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {menuManagementText(dictionary, 'empty_title', 'Không tìm thấy menu/tính năng phù hợp.')}
                </Typography>
              </TableCell>
            </TableRow>
          ) : rows.map((row, index) => {
            const typeMeta = getCommandTypeMeta(dictionary, row.command_type)
            const visibleMeta = getGroupMenuVisibleMeta(dictionary, row.group_menu_visible)
            const caption = getMenuCommandCaption(row, locale)

            return (
              <TableRow
                key={`${row.command_id}-${index}`}
                {...table.getRowProps(row)}
              >
                <TableCell sx={compactCellSx}>{displayValue(row.command_id)}</TableCell>
                <TableCell>
                  <TruncatedCell value={caption} fontWeight={700} />
                  {row.label && row.label !== caption && (
                    <Typography variant="caption" color="text.secondary" sx={truncateTextSx}>
                      {row.label}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip size="small" color={typeMeta.color} label={typeMeta.label} sx={chipSx} />
                </TableCell>
                <TableCell sx={compactCellSx}>{displayValue(row.parent_id)}</TableCell>
                <TableCell>
                  <TruncatedCell value={displayValue(row.href)} />
                </TableCell>
                <TableCell sx={compactCellSx}>{displayValue(row.action_code)}</TableCell>
                <TableCell>
                  <Chip size="small" color={visibleMeta.color} label={visibleMeta.label} sx={chipSx} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>
  )
}

export default MenuManagementTable
