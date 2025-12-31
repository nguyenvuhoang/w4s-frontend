'use client'

import { Alert, AlertTitle, Box } from '@mui/material'
import type { getDictionary } from '@/utils/getDictionary'

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface ChannelErrorProps {
  dictionary: Dictionary
  execute_id?: string
  errorinfo?: string
  message?: string
}

const ChannelError = ({ dictionary, execute_id, errorinfo, message }: ChannelErrorProps) => {
  return (
    <Box p={5}>
      <Alert severity="error">
        <AlertTitle>{dictionary["channel"].error_load_title}</AlertTitle>
        {message && <Box mb={1}>{dictionary.common.message}: {message}</Box>}
        {execute_id && <Box mb={1}>{dictionary.common.execution_id}: {execute_id}</Box>}
        {errorinfo && <Box>{dictionary.common.info}: {errorinfo}</Box>}
      </Alert>
    </Box>
  )
}

export default ChannelError
