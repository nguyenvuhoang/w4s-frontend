import { Box, Checkbox, IconButton, TableCell, TableRow } from '@mui/material'
import { CustomCheckboxIcon } from '@/@core/components/mui/CustomCheckboxIcon'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { MenuItem } from '@shared/types/systemTypes'
import { Locale } from '@configs/i18n'
import { MenuItemWithChildren } from '../hooks/useMenuTree'

const getCommandTypeLabel = (type: string): string => {
    switch (type) {
        case 'M':
            return 'Menu'
        case 'C':
            return 'Command (Button)'
        case 'T':
            return 'Transaction'
        case 'S':
            return 'System'
        default:
            return type
    }
}

type MenuTableRowProps = {
    row: MenuItemWithChildren
    index: number
    locale: Locale
    viewMode: 'table' | 'tree'
    selected: string[]
    hasSelection: boolean
    selectedId: string | null
    expandedRows: Set<string>
    hasChildren: boolean
    onToggleSelect: (id: string) => void
    onToggleExpand: (id: string) => void
    onRowDoubleClick: (commandId: string) => void
    getLocalizedCommandName: (item: MenuItem) => string
}

export const MenuTableRow = ({
    row,
    index,
    locale,
    viewMode,
    selected,
    hasSelection,
    selectedId,
    expandedRows,
    hasChildren,
    onToggleSelect,
    onToggleExpand,
    onRowDoubleClick,
    getLocalizedCommandName
}: MenuTableRowProps) => {
    const id = row.command_id
    const checked = selected.includes(id)
    const isDisabledRow = hasSelection && id !== selectedId
    const isExpanded = expandedRows.has(id)
    const level = row.level || 0

    return (
        <TableRow
            key={`${row.command_id}-${index}`}
            hover
            onDoubleClick={() => onRowDoubleClick(row.command_id)}
            sx={{
                cursor: isDisabledRow ? 'default' : 'pointer',
                pointerEvents: isDisabledRow ? 'none' : 'auto',
                opacity: isDisabledRow ? 0.6 : 1
            }}
        >
            <TableCell sx={{ width: 48, padding: '0 16px' }}>
                <Checkbox
                    icon={
                        isDisabledRow ? (
                            <LockOutlinedIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
                        ) : (
                            <CustomCheckboxIcon checked={false} />
                        )
                    }
                    checkedIcon={<CustomCheckboxIcon checked={true} />}
                    size="small"
                    checked={checked}
                    onChange={() => onToggleSelect(id)}
                    onClick={(e) => e.stopPropagation()}
                    slotProps={{
                        input: {
                            'aria-label': `select row ${id}`
                        }
                    }}
                />
            </TableCell>
            {viewMode === 'tree' && (
                <TableCell sx={{ width: 48, padding: '0 8px' }}>
                    {hasChildren ? (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleExpand(id)
                            }}
                            sx={{ padding: 0 }}
                        >
                            {isExpanded ? (
                                <ExpandMoreIcon fontSize="small" />
                            ) : (
                                <ChevronRightIcon fontSize="small" />
                            )}
                        </IconButton>
                    ) : null}
                </TableCell>
            )}
            <TableCell>
                <Box sx={{ pl: viewMode === 'tree' ? level * 3 : 0 }}>
                    <strong>{row.command_id}</strong>
                    <br />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                        {getLocalizedCommandName(row)}
                    </span>
                </Box>
            </TableCell>
            <TableCell>{row.parent_id === '0' ? '-' : row.parent_id}</TableCell>
            <TableCell>
                <Box>
                    <strong>{row.command_type}</strong>
                    <br />
                    <span style={{ fontSize: '11px', color: '#888' }}>
                        {getCommandTypeLabel(row.command_type)}
                    </span>
                </Box>
            </TableCell>
            <TableCell>{row.command_uri || '-'}</TableCell>
            <TableCell>{row.application_code}</TableCell>
            <TableCell>{row.display_order}</TableCell>
            <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                    {row.is_visible ? (
                        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                    ) : (
                        <CancelIcon sx={{ color: '#f44336', fontSize: 20 }} />
                    )}
                </Box>
            </TableCell>
        </TableRow>
    )
}

