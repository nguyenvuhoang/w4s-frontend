import { Paper, Skeleton, Stack } from '@mui/material'

const FeeTypeDetailLoading = () => (
  <Stack spacing={3} sx={{ mt: 3 }}>
    <Skeleton variant="rounded" width={120} height={36} />
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Skeleton width="30%" height={40} />
          <Skeleton width="16%" height={24} />
        </Stack>
        <Skeleton variant="rectangular" width="100%" height={1} />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
          {Array.from({ length: 6 }).map((_, index) => (
            <Stack key={index} spacing={1} sx={{ width: { xs: '100%', md: '48%' } }}>
              <Skeleton width="35%" height={20} />
              <Skeleton width="65%" height={28} />
            </Stack>
          ))}
        </Stack>
        <Skeleton width="32%" height={26} />
      </Stack>
    </Paper>
  </Stack>
)

export default FeeTypeDetailLoading
