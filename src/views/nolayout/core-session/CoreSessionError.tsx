'use client'

import { Alert, AlertTitle, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { getDictionary } from '@/utils/getDictionary'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface CoreSessionErrorProps {
  dictionary: Dictionary
  execute_id?: string
  errorinfo?: string
  message?: string
}

const CoreSessionError = ({ dictionary, execute_id, errorinfo, message }: CoreSessionErrorProps) => {
  return (
    <Box p={5}>
      <Alert severity="error" sx={{ mb: 4 }}>
        <AlertTitle>{dictionary["coresession"].error_load_title}</AlertTitle>
        {message && <Box mb={1}>{dictionary.common.message}: {message}</Box>}
        {execute_id && <Box mb={1}>{dictionary.common.execution_id}: {execute_id}</Box>}
        {errorinfo && <Box>{dictionary.common.info}: {errorinfo}</Box>}
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{dictionary["coresession"].token}</TableCell>
              <TableCell>{dictionary["coresession"].userid}</TableCell>
              <TableCell>{dictionary["coresession"].loginname}</TableCell>
              <TableCell>{dictionary["coresession"].workingdate}</TableCell>
              <TableCell>{dictionary["coresession"].expiresat}</TableCell>
              <TableCell>{dictionary["coresession"].isrevoked}</TableCell>
              <TableCell>{dictionary["coresession"].channel}</TableCell>
              <TableCell>{dictionary["coresession"].createdonutc}</TableCell>
              <TableCell>{dictionary["coresession"].branch}</TableCell>
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

export default CoreSessionError
