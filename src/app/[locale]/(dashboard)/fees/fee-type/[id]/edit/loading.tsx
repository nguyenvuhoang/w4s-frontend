import { Paper, Skeleton, Stack } from '@mui/material'

const FeeTypeEditLoading = () => (
  <Stack spacing={3} sx={{ mt: 3 }}>
    <Stack direction="row" justifyContent="space-between" gap={2}>
      <Skeleton variant="rounded" width={120} height={36} />
      <Stack direction="row" gap={1}>
        <Skeleton variant="rounded" width={100} height={36} />
        <Skeleton variant="rounded" width={100} height={36} />
      </Stack>
    </Stack>
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Skeleton width="28%" height={34} />
          <Skeleton width="42%" height={22} />
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
          {Array.from({ length: 7 }).map((_, index) => (
            <Stack key={index} spacing={1} sx={{ width: { xs: '100%', md: index === 6 ? '100%' : '48%' } }}>
              <Skeleton width="32%" height={20} />
              <Skeleton width="100%" height={56} variant="rounded" />
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  </Stack>
)

export default FeeTypeEditLoading
