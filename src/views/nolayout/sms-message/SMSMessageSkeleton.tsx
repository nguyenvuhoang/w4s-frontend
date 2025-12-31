'use client'

import { Box, Button, Grid, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { getDictionary } from '@/utils/getDictionary'

interface SMSMessageSkeletonProps {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const SMSMessageSkeleton = ({ dictionary }: SMSMessageSkeletonProps) => {
    const rowsCount = 10

    return (
        <Box sx={{ mt: 5, width: '100%' }}>
            {/* Filter Section Skeleton */}
            <Box className="my-10 rounded-md">
                <Typography variant="subtitle1" className="mb-2 font-semibold text-black inline-block px-2 py-1 rounded">
                    {dictionary['common']?.filter ?? 'Filter'}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {[...Array(5)].map((_, index) => (
                        <Grid key={`filter-${index}`} size={{ xs: 12, sm: 2.5 }}>
                            <Skeleton variant="rounded" width="100%" height={40} />
                        </Grid>
                    ))}
                    <Grid size={{ xs: 12, sm: 2.5 }} display="flex" alignItems="center">
                        <Skeleton variant="rounded" width={100} height={36}>
                            <Button startIcon={<SearchIcon />} disabled />
                        </Skeleton>
                    </Grid>
                </Grid>
            </Box>

            {/* Table Skeleton */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, mt: 3 }}>
                <Table
                    size="small"
                    sx={{
                        border: '1px solid #d0d0d0',
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
                            <TableCell>{dictionary['sms']?.no ?? 'No'}</TableCell>
                            <TableCell>{dictionary['common']?.phonenumber ?? 'Phone number'}</TableCell>
                            <TableCell>{dictionary['sms']?.contentshort ?? 'Content'}</TableCell>
                            <TableCell>{dictionary['common']?.providername ?? 'Provider'}</TableCell>
                            <TableCell>{dictionary['sms']?.datesent ?? 'Date sent'}</TableCell>
                            <TableCell>{dictionary['sms']?.status ?? 'Status'}</TableCell>
                            <TableCell>{dictionary['sms']?.action ?? 'Action'}</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {[...Array(rowsCount)].map((_, rowIndex) => (
                            <TableRow key={`skeleton-row-${rowIndex}`}>
                                {[...Array(7)].map((_, colIndex) => (
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

export default SMSMessageSkeleton
