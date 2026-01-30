// components/table/DataTable.tsx
'use client';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton } from '@mui/material';
import { ReactNode } from 'react';

export type Column<TRow> = {
    key: string;
    header: ReactNode;
    width?: number | string;
    render?: (row: TRow) => ReactNode;
    accessor?: (row: TRow) => ReactNode;
};

export function DataTable<TRow>({
    columns,
    rows,
    loading,
    rowKey,
    onRowDoubleClick,
    selectionCell,
    empty,
    rowsPerPage
}: {
    columns: Column<TRow>[];
    rows: TRow[];
    loading?: boolean;
    rowKey: (row: TRow, index: number) => string;
    onRowDoubleClick?: (row: TRow) => void;
    selectionCell?: (row: TRow, index: number) => ReactNode;
    empty: ReactNode;
    rowsPerPage: number;
}) {
    return (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
            <Table
                size="small"
                sx={{
                    border: '1px solid #d0d0d0',
                    fontSize: '15px',
                    '& th, & td': { borderBottom: '1px solid #e0e0e0', py: '12px', px: '10px' },
                    '& th': { fontSize: '14px', fontWeight: 600, backgroundColor: '#225087', color: 'white' },
                    '& tbody tr:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                    '& tbody tr:hover': { backgroundColor: '#f1fdf5' }
                }}
            >
                <TableHead>
                    <TableRow>
                        {selectionCell && <TableCell sx={{ width: 48 }} />}
                        {columns.map(col => (
                            <TableCell key={col.key} sx={{ width: col.width }}>{col.header}</TableCell>
                        ))}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {loading
                        ? [...Array(rowsPerPage)].map((_, r) => (
                            <TableRow key={`skeleton-${r}`}>
                                {(selectionCell ? [0, ...columns] : columns).map((__, c) => (
                                    <TableCell key={`sk-${r}-${c}`}><Skeleton variant="text" width="100%" height={20} /></TableCell>
                                ))}
                            </TableRow>
                        ))
                        : rows.length === 0
                            ? (
                                <TableRow>
                                    <TableCell colSpan={(selectionCell ? 1 : 0) + columns.length}>{empty}</TableCell>
                                </TableRow>
                            )
                            : rows.map((row, i) => (
                                <TableRow
                                    key={rowKey(row, i)}
                                    hover
                                    onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}
                                >
                                    {selectionCell && <TableCell sx={{ width: 48, px: 2 }}>{selectionCell(row, i)}</TableCell>}
                                    {columns.map(col => (
                                        <TableCell key={col.key}>
                                            {col.render ? col.render(row) : col.accessor ? col.accessor(row) : null}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
