import { Box, Typography } from '@mui/material'

import ReadOnlyJsonViewer from '@/shared/components/json-view-editor/ReadOnlyJsonViewer'
import type { AuditLogsDictionary } from '../types'
import { maskSensitiveValue } from './sensitiveDataMasking'

type Props = {
  title?: string
  value: unknown
  height?: string
  dictionary: AuditLogsDictionary
}

const AuditLogJsonBlock = ({ title, value, height = '300px', dictionary }: Props) => {
  const labels = dictionary.audit_logs

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
      {title && (
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800 }}>
          {title}
        </Typography>
      )}
      <ReadOnlyJsonViewer
        value={value}
        height={height}
        sanitize={maskSensitiveValue}
        labels={{
          tree: labels.json_view_tree,
          json: labels.json_view_json,
          viewMode: labels.json_view_mode,
          copy: labels.json_copy,
          copySuccess: labels.json_copy_success,
          copyFailed: labels.json_copy_failed
        }}
      />
    </Box>
  )
}

export default AuditLogJsonBlock
