import { Grid, Paper, Skeleton, Stack } from '@mui/material'

const ApartmentDetailLoading = () => (
  <Stack spacing={3.5} sx={{ mt: 3 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
      <Stack spacing={1}>
        <Skeleton width={220} height={20} />
        <Skeleton width={160} height={32} />
      </Stack>
      <Stack direction="row" gap={1}>
        <Skeleton variant="rounded" width={140} height={36} />
        <Skeleton variant="rounded" width={100} height={36} />
        <Skeleton variant="rounded" width={100} height={36} />
      </Stack>
    </Stack>
    {Array.from({ length: 4 }).map((_, sectionIndex) => (
      <Paper key={sectionIndex} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Skeleton width={180} height={24} sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rounded" height={68} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    ))}
  </Stack>
)

export default ApartmentDetailLoading
