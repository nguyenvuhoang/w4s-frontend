import { Grid, Paper, Skeleton, Stack } from '@mui/material'

const VendorEditLoading = () => (
  <Stack spacing={3} sx={{ mt: 3 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
      <Skeleton variant="rounded" width={128} height={36} />
      <Stack direction="row" gap={1}>
        <Skeleton variant="rounded" width={96} height={36} />
        <Skeleton variant="rounded" width={96} height={36} />
      </Stack>
    </Stack>

    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Skeleton width={260} height={34} />
          <Skeleton width={360} height={22} />
        </Stack>

        <Grid container spacing={2.5}>
          {Array.from({ length: 7 }).map((_, index) => (
            <Grid key={index} size={{ xs: 12, md: index === 6 ? 12 : 6 }}>
              <Skeleton variant="rounded" width="100%" height={40} />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Paper>
  </Stack>
)

export default VendorEditLoading
