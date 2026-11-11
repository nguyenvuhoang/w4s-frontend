import { Grid, Paper, Skeleton, Stack } from '@mui/material'

// Form-shaped skeleton while the route loads the apartment detail.
const ApartmentEditLoading = () => (
  <Stack spacing={3} sx={{ mt: 3 }}>
    <Skeleton width={320} height={20} />
    {[4, 4, 2, 2].map((fields, sectionIndex) => (
      <Paper key={sectionIndex} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Skeleton width={180} height={24} sx={{ mb: 2 }} />
        <Grid container spacing={2.5}>
          {Array.from({ length: fields }).map((_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, lg: 12 / fields }}>
              <Skeleton variant="rounded" height={56} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    ))}
    <Stack direction="row" justifyContent="flex-end" gap={1}>
      <Skeleton variant="rounded" width={90} height={36} />
      <Skeleton variant="rounded" width={130} height={36} />
    </Stack>
  </Stack>
)

export default ApartmentEditLoading
