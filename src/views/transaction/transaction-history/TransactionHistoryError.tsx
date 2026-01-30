'use client'

import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, AlertTitle, Typography } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { getDictionary } from '@utils/getDictionary'

interface TransactionHistoryErrorProps {
    executionId?: string
    errorInfo?: string
    errorMessage?: string
    dictionary: Awaited<ReturnType<typeof getDictionary>>
}

const TransactionHistoryError = ({ executionId, errorInfo, errorMessage, dictionary }: TransactionHistoryErrorProps) => {
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
                            color: 'white',
                            whiteSpace: 'nowrap'
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
                        <TableRow>
                            <TableCell colSpan={11} sx={{ textAlign: 'center', py: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {dictionary.account?.nodatatransactionhistory ?? 'No data available'}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Error Alert Below Table */}
            <Box mt={3}>
                <Alert 
                    severity="error" 
                    icon={<ErrorOutlineIcon fontSize="large" />}
                    sx={{
                        borderRadius: 2,
                        boxShadow: 2,
                        '& .MuiAlert-icon': {
                            fontSize: '2rem'
                        }
                    }}
                >
                    <AlertTitle sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {dictionary.transaction?.error_load_title ?? 'Failed to Load Transaction History'}
                    </AlertTitle>
                    
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                            {dictionary.transaction?.error_load_message ?? 'An error occurred while fetching transaction history data. Please try again later or contact support if the problem persists.'}
                        </Typography>
                        
                        {executionId && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
                                <Typography variant="body2" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {dictionary.common?.error_details ?? 'Error Details'}:
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                    <strong>{dictionary.common?.execution_id ?? 'Execution ID'}:</strong> {executionId}
                                </Typography>
                                {errorInfo && (
                                    <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', mt: 0.5 }}>
                                        <strong>{dictionary.common?.info ?? 'Info'}:</strong> {errorInfo}
                                    </Typography>
                                )}
                                {errorMessage && (
                                    <Typography variant="body2" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', mt: 0.5 }}>
                                        <strong>{dictionary.common?.message ?? 'Message'}:</strong> {errorMessage}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                </Alert>
            </Box>
        </Box>
    )
}

export default TransactionHistoryError

