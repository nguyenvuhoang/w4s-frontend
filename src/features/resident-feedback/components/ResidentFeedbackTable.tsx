'use client'

import {
    ButtonBase,
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
import { useState } from 'react'

import { useSearchTableRowConfig } from '@/shared/components/table'

import type { ResidentFeedbackItem, ResidentFeedbackDictionary } from '../types'
import {
    commonText,
    formatResidentFeedbackDate,
    getResidentFeedbackMessagesSummary,
    getFeedbackStatusColor,
    getFeedbackStatusLabel,
    residentFeedbackText
} from './residentFeedbackHelpers'
import ResidentFeedbackMessagesDialog from './ResidentFeedbackMessagesDialog'

type Props = {
    dictionary: ResidentFeedbackDictionary
    locale: string
    rows: ResidentFeedbackItem[]
    loading: boolean
    pageIndex: number
    pageSize: number
    onRowDoubleClick: (row: ResidentFeedbackItem) => void
}

const columns = [
    'no',
    'apartment_code',
    'resident',
    'content',
    'note',
    'assignment',
    'request_status',
    'created_on',
    'requests_message'
] as const

const headerCellSx = {
    bgcolor: 'primary.main',
    color: 'common.white',
    fontWeight: 800,
    whiteSpace: 'nowrap'
}

const ResidentFeedbackTable = ({
    dictionary,
    locale,
    rows,
    loading,
    pageIndex,
    pageSize,
    onRowDoubleClick
}: Props) => {
    const [selectedRow, setSelectedRow] = useState<ResidentFeedbackItem | null>(null)

    const table = useSearchTableRowConfig<ResidentFeedbackItem>({
        rowInteraction: {
            onOpenDetail: onRowDoubleClick,
            isRowInteractive: row => Boolean(row.request_code)
        }
    })

    return (
        <>
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
                <TableContainer>
                    <Table stickyHeader size="small" sx={{ minWidth: 1280 }}>
                <TableHead>
                    <TableRow>
                        {columns.map(column => (
                            <TableCell key={column} sx={headerCellSx}>
                                {column === 'no' ? commonText(dictionary, 'nodot') : residentFeedbackText(dictionary, column)}
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
                                    {residentFeedbackText(dictionary, 'no_resident_feedback_found')}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : rows.map((row, index) => (
                        <TableRow
                            key={row.id || index}
                            {...table.getRowProps(row)}
                        >
                            <TableCell>{pageIndex * pageSize + index + 1}</TableCell>
                            <TableCell>{row.apartment_code || '-'}</TableCell>
                            <TableCell>{row.resident || '-'}</TableCell>
                            <TableCell sx={{ minWidth: 220, maxWidth: 320 }}>{row.content || '-'}</TableCell>
                            <TableCell sx={{ minWidth: 220, maxWidth: 320 }}>{row.note || '-'}</TableCell>
                            <TableCell>{row.assignment || '-'}</TableCell>
                            <TableCell>
                                <Chip size="small" color={getFeedbackStatusColor(row.status)} label={getFeedbackStatusLabel(dictionary, row.status)} />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatResidentFeedbackDate(row.created_on_utc, locale)}</TableCell>
                            <TableCell
                                sx={{ minWidth: 220, maxWidth: 280 }}
                                onClick={event => event.stopPropagation()}
                                onDoubleClick={event => event.stopPropagation()}
                            >
                                {(() => {
                                    const summary = getResidentFeedbackMessagesSummary(row.requests_message)

                                    return (
                                        <Tooltip title={summary?.content || residentFeedbackText(dictionary, 'no_messages')}>
                                            <ButtonBase
                                                onClick={event => {
                                                    event.stopPropagation()
                                                    setSelectedRow(row)
                                                }}
                                                onDoubleClick={event => event.stopPropagation()}
                                                sx={{ display: 'block', maxWidth: '100%', textAlign: 'left' }}
                                            >
                                                <Typography variant="body2" noWrap>
                                                    {summary ? `${summary.count}: ${summary.content || '-'}` : '-'}
                                                </Typography>
                                            </ButtonBase>
                                        </Tooltip>
                                    )
                                })()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            <ResidentFeedbackMessagesDialog dictionary={dictionary} locale={locale} row={selectedRow} onClose={() => setSelectedRow(null)} />
        </>
    )
}

export default ResidentFeedbackTable
