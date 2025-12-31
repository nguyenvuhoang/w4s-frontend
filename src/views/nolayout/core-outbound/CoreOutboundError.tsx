'use client'

import { Alert, AlertTitle, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { getDictionary } from '@/utils/getDictionary'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface CoreOutboundErrorProps {
  dictionary: Dictionary
  execute_id?: string
  errorinfo?: string
  message?: string
}

const CoreOutboundError = ({ dictionary, execute_id, errorinfo, message }: CoreOutboundErrorProps) => {
  return (
    <Box p={5}>
      <Alert severity="error" sx={{ mb: 4 }}>
        <AlertTitle>{dictionary["coreoutbound"].error_load_title}</AlertTitle>
        {message && <Box mb={1}>{dictionary.common.message}: {message}</Box>}
        {execute_id && <Box mb={1}>{dictionary.common.execution_id}: {execute_id}</Box>}
        {errorinfo && <Box>{dictionary.common.info}: {errorinfo}</Box>}
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{dictionary["coreoutbound"].executionid}</TableCell>
              <TableCell>{dictionary["coreoutbound"].createdonutc}</TableCell>
              <TableCell>{dictionary["coreoutbound"].reference}</TableCell>
              <TableCell>{dictionary["coreoutbound"].messagetype}</TableCell>
              <TableCell>{dictionary["coreoutbound"].targetendpoint}</TableCell>
              <TableCell>{dictionary["coreoutbound"].httpmethod}</TableCell>
              <TableCell>{dictionary["coreoutbound"].status}</TableCell>
              <TableCell>{dictionary["coreoutbound"].lasterror}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                {dictionary.common.error_details}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default CoreOutboundError
