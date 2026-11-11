import { Grid, Paper, Skeleton, Stack } from '@mui/material'

const VendorDetailLoading = () => (
  <Stack spacing={3} sx={{ mt: 3 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
      <Skeleton variant="rounded" width={128} height={36} />
      <Stack direction="row" gap={1}>
        <Skeleton variant="rounded" width={112} height={36} />
        <Skeleton variant="rounded" width={112} height={36} />
      </Stack>
    </Stack>

    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
          <Stack spacing={1}>
            <Skeleton width={260} height={34} />
            <Skeleton width={160} height={22} />
          </Stack>
          <Skeleton variant="rounded" width={96} height={28} />
        </Stack>

        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid key={index} size={{ xs: 12, md: 6 }}>
              <Skeleton width={120} height={18} />
              <Skeleton width="80%" height={30} />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Paper>
  </Stack>
)

export default VendorDetailLoading
