'use client'

import { Box, Button, Checkbox, FormControlLabel, Grid, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { getDictionary } from '@utils/getDictionary'

interface TransactionHistorySkeletonProps {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const TransactionHistorySkeleton = ({ dictionary }: TransactionHistorySkeletonProps) => {
    const rowsCount = 10

    return (
        <Box sx={{ my: 5, width: '100%' }}>
            {/* Search Form Skeleton */}
            <Grid container spacing={3} mb={3}>
                {/* 12 text fields */}
                {[...Array(12)].map((_, index) => (
                    <Grid key={`field-${index}`} size={{ xs: 12, md: 6 }}>
                        <Skeleton variant="rounded" width="100%" height={40} />
                    </Grid>
                ))}

                {/* Schedule checkbox */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                        control={<Checkbox disabled size="small" />}
                        label={<Skeleton variant="text" width={80} />}
                    />
                </Grid>

                {/* Search button */}
                <Grid size={{ xs: 12, md: 6 }} display="flex" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Skeleton variant="rounded" width={100} height={36}>
                        <Button startIcon={<SearchIcon />} disabled />
                    </Skeleton>
                </Grid>
            </Grid>

            {/* Table Skeleton */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                <Table
                    size="small"
                    sx={{
                        border: '1px solid #d0d0d0',
                        fontSize: '15px',
                        '& th, & td': {
                            borderBottom: '1px solid #e0e0e0',
                            paddingY: '12px',
                            paddingX: '10px'
                        },
                        '& th': {
                            fontSize: '14px',
                            fontWeight: 600,
                            backgroundColor: '#225087',
                            color: 'white',
                            whiteSpace: 'nowrap'
                        },
                        '& tbody tr:nth-of-type(odd)': {
                            backgroundColor: '#fafafa'
                        }
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell>{dictionary['transaction']?.refnumber ?? 'Ref.Number'}</TableCell>
                            <TableCell>{dictionary['transaction']?.date ?? 'Date'}</TableCell>
                            <TableCell>{dictionary['transaction']?.type ?? 'Type'}</TableCell>
                            <TableCell>{dictionary['transaction']?.debitaccount ?? 'Debit account'}</TableCell>
                            <TableCell>{dictionary['transaction']?.creditaccount ?? 'Credit account'}</TableCell>
                            <TableCell>{dictionary['transaction']?.amount ?? 'Amount'}</TableCell>
                            <TableCell>{dictionary['transaction']?.fee ?? 'Fee'}</TableCell>
                            <TableCell>{dictionary['transaction']?.currency ?? 'Currency'}</TableCell>
                            <TableCell>{dictionary['transaction']?.errordescription ?? 'Error'}</TableCell>
                            <TableCell>{dictionary['transaction']?.description ?? 'Description'}</TableCell>
                            <TableCell>{dictionary['transaction']?.status ?? 'Status'}</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {[...Array(rowsCount)].map((_, rowIndex) => (
                            <TableRow key={`skeleton-row-${rowIndex}`}>
                                {[...Array(11)].map((_, colIndex) => (
                                    <TableCell key={`skeleton-cell-${colIndex}`}>
                                        <Skeleton variant="text" width="100%" height={20} />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination Skeleton */}
            <Box mt={5} display="flex" justifyContent="space-between" alignItems="center">
                <Skeleton variant="rounded" width={200} height={32} />
                <Skeleton variant="rounded" width={300} height={32} />
                <Skeleton variant="rounded" width={150} height={32} />
            </Box>
        </Box>
    )
}

export default TransactionHistorySkeleton

