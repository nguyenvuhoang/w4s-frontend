'use client'

import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import type { GenerateFeeSheetPreview } from '../types'

type Props = {
    sheetPreview: GenerateFeeSheetPreview
}

const cellSx = {
    maxWidth: 260,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    fontSize: 13
}

const GenerateFeeSheetViewer = ({ sheetPreview }: Props) => {
    const columnCount = sheetPreview.rows.reduce((max, row) => Math.max(max, row.length), 1)
    const columnIndexes = Array.from({ length: columnCount }, (_, index) => index)

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {sheetPreview.sheet_name}
                {sheetPreview.truncated && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({sheetPreview.rows.length} rows shown)
                    </Typography>
                )}
            </Typography>

            <TableContainer sx={{ maxHeight: 520, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table stickyHeader size="small" sx={{ minWidth: 'max-content' }}>
                    <TableHead>
                        <TableRow>
                            {columnIndexes.map(colIndex => (
                                <TableCell key={colIndex} sx={{ ...cellSx, fontWeight: 700 }}>
                                    {String.fromCharCode(65 + colIndex)}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sheetPreview.rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex} hover>
                                {columnIndexes.map(colIndex => {
                                    const cell = row[colIndex]

                                    return (
                                        <TableCell key={colIndex} title={cell != null ? String(cell) : undefined} sx={cellSx}>
                                            {cell != null && cell !== '' ? String(cell) : ''}
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default GenerateFeeSheetViewer
