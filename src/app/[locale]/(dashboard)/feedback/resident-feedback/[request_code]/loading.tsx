import { Box, Grid, Paper, Skeleton, Stack } from '@mui/material'

const ResidentFeedbackDetailLoading = () => (
  <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
      <Stack spacing={1}>
        <Skeleton variant="text" width={280} height={42} />
        <Skeleton variant="text" width={220} />
      </Stack>
      <Skeleton variant="rounded" width={140} height={38} />
    </Stack>

    {Array.from({ length: 4 }).map((_, blockIndex) => (
      <Paper key={blockIndex} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width={220} height={30} />
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }} />
          <Grid container spacing={3}>
            {Array.from({ length: 4 }).map((__, fieldIndex) => (
              <Grid key={fieldIndex} size={{ xs: 12, md: 6 }}>
                <Skeleton variant="text" width="35%" />
                <Skeleton variant="text" width="80%" height={28} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>
    ))}
  </Stack>
)

export default ResidentFeedbackDetailLoading
