import { Paper, Skeleton, Stack } from '@mui/material'

const FeeManagementListLoading = () => (
  <Stack spacing={3} sx={{ mt: 3 }}>
    <Skeleton variant="rounded" width={220} height={40} />
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Skeleton variant="rounded" width="100%" height={40} />
        <Skeleton variant="rounded" width="100%" height={40} />
        <Skeleton variant="rounded" width="100%" height={40} />
        <Skeleton variant="rounded" width={160} height={40} />
      </Stack>
    </Paper>
    <Paper sx={{ borderRadius: 2 }}>
      <Stack spacing={1} sx={{ p: 2 }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={36} />
        ))}
      </Stack>
    </Paper>
  </Stack>
)

export default FeeManagementListLoading
