'use client'

import { Alert, AlertTitle, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { getDictionary } from '@/utils/getDictionary'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface CoreInboundErrorProps {
  dictionary: Dictionary
  execute_id?: string
  errorinfo?: string
  message?: string
}

const CoreInboundError = ({ dictionary, execute_id, errorinfo, message }: CoreInboundErrorProps) => {
  return (
    <Box p={5}>
      <Alert severity="error" sx={{ mb: 4 }}>
        <AlertTitle>{dictionary["coreinbound"].error_load_title}</AlertTitle>
        {message && <Box mb={1}>{dictionary.common.message}: {message}</Box>}
        {execute_id && <Box mb={1}>{dictionary.common.execution_id}: {execute_id}</Box>}
        {errorinfo && <Box>{dictionary.common.info}: {errorinfo}</Box>}
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{dictionary["coreinbound"].executionid}</TableCell>
              <TableCell>{dictionary["coreinbound"].createdonutc}</TableCell>
              <TableCell>{dictionary["coreinbound"].transactioncode}</TableCell>
              <TableCell>{dictionary["coreinbound"].endtoend}</TableCell>
              <TableCell>{dictionary["coreinbound"].channel}</TableCell>
              <TableCell>{dictionary["coreinbound"].service}</TableCell>
              <TableCell>{dictionary["coreinbound"].status}</TableCell>
              <TableCell>{dictionary["coreinbound"].signatureverified}</TableCell>
              <TableCell>{dictionary["coreinbound"].errordescription}</TableCell>
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

export default CoreInboundError
