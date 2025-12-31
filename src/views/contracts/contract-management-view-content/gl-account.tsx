'use client'

import { Locale } from '@/configs/i18n'
import { Contract, Contractaccount, GLAccount } from '@/types/bankType'
import { getDictionary } from '@/utils/getDictionary'
import { Global } from '@emotion/react'
import {
    Box,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from '@mui/material'
import { Session } from 'next-auth'
import { useEffect, useMemo, useState } from 'react'

type GLRow = GLAccount & { accountnumber: string }
type Group = { accountnumber: string; rows: GLRow[] }

const columns: { key: string; label: string; width?: number | string }[] = [
    { key: 'accountnumber', label: 'Account Number' },
    { key: 'catalogcode', label: 'Catalog Code' },
    { key: 'sysaccountname', label: 'Sys Account Name' },
    { key: 'glaccount', label: 'GL Account' },
]

const GLAccountInfo = ({
    contractdata,
    dictionary,
}: {
    contractdata: Contract
    dictionary: Awaited<ReturnType<typeof getDictionary>>
    session?: Session | null
    locale?: Locale
}) => {
    const accounts: Contractaccount[] = contractdata?.contractaccount || []

    // Gom nhóm theo account
    const groups: Group[] = useMemo(() => {
        const result: Group[] = []
        for (const acc of accounts) {
            const accNo = acc.accountnumber || ''
            const list = (acc.glaccounts as unknown as GLAccount[]) || []
            if (!accNo || list.length === 0) continue
            const rows: GLRow[] = list.map(gl => ({ ...gl, accountnumber: accNo }))
            result.push({ accountnumber: accNo, rows })
        }
        return result
    }, [accounts])

    // Phân trang theo account
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(5)

    useEffect(() => {
        const total = groups.length
        const maxPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1)
        if (page > maxPage) setPage(maxPage)
    }, [groups.length, rowsPerPage, page])

    const pagedGroups = useMemo(() => {
        const start = page * rowsPerPage
        const end = start + rowsPerPage
        return groups.slice(start, end)
    }, [groups, page, rowsPerPage])

    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage)
    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = parseInt(e.target.value, 10)
        setRowsPerPage(next)
        setPage(0)
    }

    return (
        <>
            <Global
                styles={{
                    '@keyframes spin': {
                        from: { transform: 'rotate(0deg)' },
                        to: { transform: 'rotate(360deg)' },
                    },
                }}
            />

            <Card className="shadow-md">
                <CardContent>
                    <TableContainer
                        sx={{
                            border: '1px solid #ccc',
                            borderRadius: 1,
                            overflow: 'hidden',
                        }}
                    >
                        <Table
                            sx={{
                                borderCollapse: 'collapse',
                                '& th, & td': {
                                    border: '1px solid #ddd',
                                    padding: '8px 12px',
                                },
                            }}
                        >
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    {columns.map(col => (
                                        <TableCell
                                            key={col.key}
                                            style={{ width: col.width }}
                                            sx={{ fontWeight: 600, color: '#333' }}
                                        >
                                            {col.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {pagedGroups.length > 0 ? (
                                    pagedGroups.map(group => {
                                        const { accountnumber, rows } = group
                                        return rows.map((row, idx) => (
                                            <TableRow
                                                key={`${accountnumber}-${row.glaccount}-${idx}`}
                                                hover
                                                sx={{
                                                    '&:hover': { backgroundColor: '#fafafa' },
                                                }}
                                            >
                                                {/* Merge account number */}
                                                {idx === 0 && (
                                                    <TableCell
                                                        rowSpan={rows.length}
                                                        sx={{
                                                            fontWeight: 500,
                                                            color: 'primary.main',
                                                            verticalAlign: 'middle',
                                                        }}
                                                    >
                                                        {accountnumber || '-'}
                                                    </TableCell>
                                                )}

                                                <TableCell>
                                                    <Typography color="text.secondary">
                                                        {row.catalogcode || '-'}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography className="font-medium">
                                                        {row.sysaccountname || '-'}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography
                                                        sx={{
                                                            fontFamily:
                                                                'ui-monospace, SFMono-Regular, Menlo, monospace',
                                                        }}
                                                    >
                                                        {row.glaccount || '-'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} align="center">
                                            <Typography className="text-gray-500">
                                                {dictionary['account'].nobankaccount}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>


                    </TableContainer>
                </CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <TablePagination
                        component="div"
                        count={groups.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 20, 50, 100]}
                    />
                </Box>
            </Card>
        </>
    )
}

export default GLAccountInfo
