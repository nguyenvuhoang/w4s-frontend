'use client';

import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, TablePagination, Box, CircularProgress, Typography, IconButton
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

export interface Column<T> {
    id: keyof T | 'actions';
    label: string;
    minWidth?: number;
    align?: 'right' | 'left' | 'center';
    format?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    rows: T[];
    count?: number;
    page?: number;
    rowsPerPage?: number;
    onPageChange?: (newPage: number) => void;
    onRowsPerPageChange?: (rowsPerPage: number) => void;
    loading?: boolean;
    onRowClick?: (row: T) => void;
    actions?: (row: T) => React.ReactNode; // Or action menu
}

export default function DataTable<T extends { id: string }>({
    columns, rows, count = 0, page = 0, rowsPerPage = 10,
    onPageChange, onRowsPerPageChange, loading = false, onRowClick, actions
}: DataTableProps<T>) {

    const handleChangePage = (event: unknown, newPage: number) => {
        onPageChange?.(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        onRowsPerPageChange?.(+event.target.value);
        onPageChange?.(0);
    };

    if (loading && rows.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!loading && rows.length === 0) {
        return (
            <Paper sx={{ width: '100%', overflow: 'hidden', p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No data found</Typography>
            </Paper>
        )
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={String(column.id)}
                                    align={column.align}
                                    style={{ minWidth: column.minWidth }}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                            {actions && <TableCell align="right">Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => {
                            return (
                                <TableRow
                                    hover
                                    role="checkbox"
                                    tabIndex={-1}
                                    key={row.id}
                                    onClick={() => onRowClick?.(row)}
                                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                                >
                                    {columns.map((column) => {
                                        const value = row[column.id as keyof T];
                                        return (
                                            <TableCell key={String(column.id)} align={column.align}>
                                                {column.format ? column.format(value, row) : (value as unknown as React.ReactNode)}
                                            </TableCell>
                                        );
                                    })}
                                    {actions && (
                                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                            {actions(row)}
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={count} // Total count from server or memory
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}
