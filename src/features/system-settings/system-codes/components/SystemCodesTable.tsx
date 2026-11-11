import {
  Chip,
  IconButton,
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
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowRightRounded from '@mui/icons-material/KeyboardArrowRightRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import { Fragment, useMemo, useState } from 'react'

import type { Locale } from '@/configs/i18n'
import { useSearchTableRowConfig } from '@/shared/components/table'

import type { SystemCodeItem, SystemCodesDictionary } from '../types'
import { formatSystemCodeNumber, resolveLocalizedCaption, systemCodeText } from './systemCodeHelpers'

type Props = {
  dictionary: SystemCodesDictionary
  locale: Locale
  rows: SystemCodeItem[]
  loading: boolean
  pageSize: number
  onOpenDetail: (row: SystemCodeItem) => void
  onAddValue: (row: SystemCodeItem) => void
}

const detailColumnKeys = [
  'code_id',
  'caption',
  'm_caption',
  'code_group',
  'code_index',
  'code_value',
  'ftag',
  'visible'
] as const

type DetailColumnKey = (typeof detailColumnKeys)[number]

type DetailColumn = {
  key: DetailColumnKey
  labelKey: string
  fallback: string
  minWidth: number
  width?: number
  align?: 'left' | 'center' | 'right'
  bodySx?: object
}

const detailColumns: DetailColumn[] = [
  {
    key: 'code_id',
    labelKey: 'field_code_id',
    fallback: 'Code',
    minWidth: 160,
    bodySx: { fontFamily: 'monospace', fontWeight: 700 }
  },
  {
    key: 'caption',
    labelKey: 'field_caption',
    fallback: 'Default Name',
    minWidth: 200
  },
  {
    key: 'm_caption',
    labelKey: 'field_m_caption',
    fallback: 'Localized Name',
    minWidth: 220,
    bodySx: { fontWeight: 700 }
  },
  {
    key: 'code_group',
    labelKey: 'field_code_group',
    fallback: 'System Group',
    minWidth: 180
  },
  {
    key: 'code_index',
    labelKey: 'field_code_index',
    fallback: 'Order',
    minWidth: 110,
    width: 110,
    align: 'center'
  },
  {
    key: 'code_value',
    labelKey: 'field_code_value',
    fallback: 'Value',
    minWidth: 160
  },
  {
    key: 'ftag',
    labelKey: 'field_ftag',
    fallback: 'Tag',
    minWidth: 120
  },
  {
    key: 'visible',
    labelKey: 'field_visible',
    fallback: 'Visible',
    minWidth: 140,
    width: 140,
    align: 'center'
  }
]

const headerCellSx = {
  bgcolor: 'primary.main',
  color: 'common.white',
  fontWeight: 800,
  whiteSpace: 'nowrap'
}

const emptyText = (value: string) => value.trim() || '-'

const groupRowsByCodeName = (rows: SystemCodeItem[]) => {
  const grouped = new Map<string, SystemCodeItem[]>()

  rows.forEach(row => {
    const groupName = emptyText(row.code_name)
    const groupItems = grouped.get(groupName) ?? []

    groupItems.push(row)
    grouped.set(groupName, groupItems)
  })

  return Array.from(grouped.entries()).map(([codeName, items]) => ({ codeName, items }))
}

const getColumnSx = (column: DetailColumn) => ({
  minWidth: column.minWidth,
  width: column.width
})

const SystemCodesTable = ({ dictionary, locale, rows, loading, pageSize, onOpenDetail, onAddValue }: Props) => {
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(new Set())
  const groupedRows = useMemo(() => groupRowsByCodeName(rows), [rows])
  const table = useSearchTableRowConfig<SystemCodeItem>({
    rowInteraction: { onOpenDetail }
  })

  const toggleGroup = (codeName: string) => {
    setCollapsedGroups(current => {
      const next = new Set(current)

      if (next.has(codeName)) {
        next.delete(codeName)
      } else {
        next.add(codeName)
      }

      return next
    })
  }

  const renderCellValue = (row: SystemCodeItem, column: DetailColumn) => {
    if (column.key === 'm_caption') {
      const localizedCaption = resolveLocalizedCaption({
        locale,
        mCaption: row.m_caption,
        caption: row.caption,
        codeId: row.code_id
      })

      return (
        <Tooltip title={row.m_caption || ''} placement="top" arrow>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {localizedCaption}
          </Typography>
        </Tooltip>
      )
    }

    if (column.key === 'code_index') {
      return formatSystemCodeNumber(row.code_index, locale)
    }

    if (column.key === 'visible') {
      return (
        <Chip
          size="small"
          color={row.visible === false ? 'default' : 'success'}
          variant={row.visible === false ? 'outlined' : 'tonal'}
          label={
            row.visible === false
              ? systemCodeText(dictionary, 'visible_no', 'Hidden')
              : systemCodeText(dictionary, 'visible_yes', 'Visible')
          }
        />
      )
    }

    return emptyText(row[column.key])
  }

  return (
    <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
      <TableContainer>
        <Table stickyHeader size="small" sx={{ minWidth: 1240 }}>
          <TableHead>
            <TableRow>
              {detailColumns.map(column => (
                <TableCell
                  key={column.key}
                  align={column.align ?? 'left'}
                  sx={{ ...headerCellSx, ...getColumnSx(column) }}
                >
                  {systemCodeText(dictionary, column.labelKey, column.fallback)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 10) }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {detailColumns.map(column => (
                    <TableCell key={column.key} align={column.align ?? 'left'} sx={getColumnSx(column)}>
                      <Skeleton height={28} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={detailColumns.length} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {systemCodeText(dictionary, 'empty_title', 'No system codes found.')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : groupedRows.map(group => {
              const isCollapsed = collapsedGroups.has(group.codeName)

              return (
                <Fragment key={`group-${group.codeName}`}>
                  <TableRow>
                    <TableCell
                      colSpan={detailColumns.length}
                      sx={{
                        bgcolor: 'action.hover',
                        borderTop: 1,
                        borderColor: 'divider',
                        py: 1
                      }}
                    >
                      <IconButton
                        size="small"
                        aria-label={group.codeName}
                        onClick={() => toggleGroup(group.codeName)}
                        sx={{ mr: 1 }}
                      >
                        {isCollapsed ? <KeyboardArrowRightRounded fontSize="small" /> : <KeyboardArrowDownRounded fontSize="small" />}
                      </IconButton>
                      <Typography component="span" variant="subtitle2" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>
                        {group.codeName}
                      </Typography>
                      {group.items[0] && (
                        <Tooltip title={systemCodeText(dictionary, 'add_value', 'Add value')}>
                          <IconButton size="small" color="primary" onClick={() => onAddValue(group.items[0])} sx={{ ml: 1 }}>
                            <AddRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                  {!isCollapsed && group.items.map(row => (
                    <TableRow
                      key={`${row.id}-${row.code_group}-${row.code_id}-${row.code_value}`}
                      {...table.getRowProps(row)}
                    >
                      {detailColumns.map(column => (
                        <TableCell
                          key={column.key}
                          align={column.align ?? 'left'}
                          sx={{ ...getColumnSx(column), ...column.bodySx }}
                        >
                          {renderCellValue(row, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

export default SystemCodesTable
