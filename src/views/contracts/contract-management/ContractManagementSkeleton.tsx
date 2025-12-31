'use client'

import { Box, Button, Grid, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { getDictionary } from '@/utils/getDictionary'

interface ContractManagementSkeletonProps {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const ContractManagementSkeleton = ({ dictionary }: ContractManagementSkeletonProps) => {
    const rowsCount = 10

    return (
        <Box sx={{ my: 5, width: '100%' }}>
            {/* Search Form Skeleton */}
            <Grid container spacing={3} mb={5}>
                {[...Array(8)].map((_, index) => (
                    <Grid key={`field-${index}`} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Skeleton variant="rounded" width="100%" height={40} />
                    </Grid>
                ))}

                <Grid size={{ xs: 12 }} display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                    {/* Left side buttons skeleton */}
                    <Box display="flex" gap={2}>
                        <Skeleton variant="rounded" width={100} height={36}>
                            <Button startIcon={<AddIcon />} disabled />
                        </Skeleton>
                        <Skeleton variant="rounded" width={100} height={36}>
                            <Button startIcon={<VisibilityIcon />} disabled />
                        </Skeleton>
                        <Skeleton variant="rounded" width={100} height={36}>
                            <Button startIcon={<EditIcon />} disabled />
                        </Skeleton>
                        <Skeleton variant="rounded" width={100} height={36}>
                            <Button startIcon={<DeleteIcon />} disabled />
                        </Skeleton>
                    </Box>

                    {/* Right side search button skeleton */}
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
                            color: 'white'
                        },
                        '& tbody tr:nth-of-type(odd)': {
                            backgroundColor: '#fafafa'
                        }
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 48 }}>
                                <Skeleton variant="rectangular" width={18} height={18} />
                            </TableCell>
                            {[
                                'contractnumber',
                                'phonenumber',
                                'fullname',
                                'idcard',
                                'usercreated',
                                'opendate',
                                'expiredate',
                                'corebankingcifnumber',
                                'status',
                                'branchcode'
                            ].map((key, index) => (
                                <TableCell key={`header-${index}`}>
                                    {dictionary.contract?.[key as keyof typeof dictionary.contract] ?? key}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {[...Array(rowsCount)].map((_, rowIndex) => (
                            <TableRow key={`skeleton-row-${rowIndex}`}>
                                <TableCell sx={{ width: 48, padding: '0 16px' }}>
                                    <Skeleton variant="rectangular" width={18} height={18} />
                                </TableCell>
                                {[...Array(10)].map((_, colIndex) => (
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

export default ContractManagementSkeleton
