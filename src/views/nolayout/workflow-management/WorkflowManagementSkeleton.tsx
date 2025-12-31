'use client'

import { getDictionary } from '@/utils/getDictionary'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SearchIcon from '@mui/icons-material/Search'
import {
    Box,
    Button,
    Grid,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material'

interface WorkflowManagementSkeletonProps {
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const WorkflowManagementSkeleton = ({ dictionary }: WorkflowManagementSkeletonProps) => {
    const rowsCount = 10

    return (
        <Box sx={{ my: 5, width: '100%' }}>
            {/* Search Form Skeleton */}
            <Grid container spacing={3} mb={5}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Skeleton variant="rounded" width="100%" height={40} />
                </Grid>

                <Grid size={{ xs: 12 }} display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                    {/* Left side buttons skeleton */}
                    <Box display="flex" gap={2}>
                        <Skeleton variant="rounded" width={100} height={36}>
                            <Button startIcon={<AddIcon />} disabled />
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
                        }
                    }}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 48 }}>☐</TableCell>
                            {[
                                'Workflow ID',
                                'Workflow Name',
                                'Description',
                                'Status',
                                'Created Date',
                                'Modified Date'
                            ].map((header, index) => (
                                <TableCell key={`header-${index}`}>
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {[...Array(rowsCount)].map((_, rowIndex) => (
                            <TableRow key={`row-${rowIndex}`}>
                                <TableCell>
                                    <Skeleton variant="rectangular" width={20} height={20} />
                                </TableCell>
                                {[...Array(6)].map((_, colIndex) => (
                                    <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                                        <Skeleton variant="text" width="80%" height={24} />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination Skeleton */}
            <Box display="flex" justifyContent="center" mt={3}>
                <Skeleton variant="rounded" width={300} height={32} />
            </Box>
        </Box>
    )
}

export default WorkflowManagementSkeleton
