'use client'

import { Alert, AlertTitle, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { getDictionary } from '@utils/getDictionary'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface UserDeviceErrorProps {
  dictionary: Dictionary
  execute_id?: string
  errorinfo?: string
  message?: string
}

const UserDeviceError = ({ dictionary, execute_id, errorinfo, message }: UserDeviceErrorProps) => {
  return (
    <Box p={5}>
      <Alert severity="error" sx={{ mb: 4 }}>
        <AlertTitle>{dictionary["userdevice"].error_load_title}</AlertTitle>
        {message && <Box mb={1}>{dictionary.common.message}: {message}</Box>}
        {execute_id && <Box mb={1}>{dictionary.common.execution_id}: {execute_id}</Box>}
        {errorinfo && <Box>{dictionary.common.info}: {errorinfo}</Box>}
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{dictionary["userdevice"].usercode}</TableCell>
              <TableCell>{dictionary["userdevice"].deviceid}</TableCell>
              <TableCell>{dictionary["userdevice"].devicename}</TableCell>
              <TableCell>{dictionary["userdevice"].devicetype}</TableCell>
              <TableCell>{dictionary["userdevice"].status}</TableCell>
              <TableCell>{dictionary["userdevice"].channelid}</TableCell>
              <TableCell>{dictionary["userdevice"].brand}</TableCell>
              <TableCell>{dictionary["userdevice"].ipaddress}</TableCell>
              <TableCell>{dictionary["userdevice"].osversion}</TableCell>
              <TableCell>{dictionary["userdevice"].appversion}</TableCell>
              <TableCell>{dictionary["userdevice"].lastseendateutc}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={11} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                {dictionary.common.error_details}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default UserDeviceError

