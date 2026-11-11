import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import { Box, Button, Skeleton, Stack, Typography } from '@mui/material'

const AuditLogDetailLoading = () => (
  <Box sx={{ p: 6 }}>
    <Stack spacing={3}>
      <Button href="../audit-logs" startIcon={<ArrowBackRounded />} sx={{ alignSelf: 'flex-start' }}>
        Back
      </Button>
      <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
        Audit Log Detail
      </Typography>
      <Skeleton variant="rounded" height={180} />
      <Skeleton variant="rounded" height={260} />
      <Skeleton variant="rounded" height={260} />
    </Stack>
  </Box>
)

export default AuditLogDetailLoading
