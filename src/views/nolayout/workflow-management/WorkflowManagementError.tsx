'use client'

import { getDictionary } from '@utils/getDictionary'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import {
    Alert,
    AlertTitle,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material'

interface WorkflowManagementErrorProps {
    executionId?: string
    errorInfo?: string
    errorMessage?: string
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const WorkflowManagementError = ({ executionId, errorInfo, errorMessage, dictionary }: WorkflowManagementErrorProps) => {
    return (
        <Box sx={{ my: 5, width: '100%' }}>
            {/* Empty Table Structure */}
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
                            <TableCell sx={{ width: 48 }}>â˜</TableCell>
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
                        <TableRow>
                            <TableCell colSpan={7} sx={{ py: 8 }}>
                                <Box
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    justifyContent="center"
                                    gap={2}
                                >
                                    <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
                                    <Alert severity="error" sx={{ maxWidth: 600, width: '100%' }}>
                                        <AlertTitle>{dictionary.common?.error || 'Error'}</AlertTitle>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            {errorMessage || dictionary.common?.errorLoadingData || 'An error occurred while loading data'}
                                        </Typography>
                                        {executionId && (
                                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                <strong>Execution ID:</strong> {executionId}
                                            </Typography>
                                        )}
                                        {errorInfo && (
                                            <Typography variant="caption" display="block">
                                                <strong>Details:</strong> {errorInfo}
                                            </Typography>
                                        )}
                                    </Alert>
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default WorkflowManagementError

