'use client'

import { Alert, AlertTitle, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { getDictionary } from '@/utils/getDictionary'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface TransactionCoreAPIErrorProps {
  dictionary: Dictionary
  execute_id?: string
  errorinfo?: string
  message?: string
}

const TransactionCoreAPIError = ({ dictionary, execute_id, errorinfo, message }: TransactionCoreAPIErrorProps) => {
  return (
    <Box p={5}>
      <Alert severity="error" sx={{ mb: 4 }}>
        <AlertTitle>{dictionary["transactioncoreapi"].error_load_title}</AlertTitle>
        {message && <Box mb={1}>{dictionary.common.message}: {message}</Box>}
        {execute_id && <Box mb={1}>{dictionary.common.execution_id}: {execute_id}</Box>}
        {errorinfo && <Box>{dictionary.common.info}: {errorinfo}</Box>}
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{dictionary['transactioncoreapi'].transactionid}</TableCell>
              <TableCell>{dictionary['transactioncoreapi'].transactioncode}</TableCell>
              <TableCell>{dictionary['transactioncoreapi'].transactiondate}</TableCell>
              <TableCell>{dictionary['transactioncoreapi'].transactionamount}</TableCell>
              <TableCell>{dictionary['transactioncoreapi'].transactionstatus}</TableCell>
              <TableCell>{dictionary['common'].username}</TableCell>
              <TableCell>{dictionary['transactioncoreapi'].channel}</TableCell>
              <TableCell>{dictionary['transactioncoreapi'].transactionresultrefunded}</TableCell>
              <TableCell>{dictionary['transactioncoreapi'].transactiondescription}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                {dictionary.common.error_details}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default TransactionCoreAPIError
