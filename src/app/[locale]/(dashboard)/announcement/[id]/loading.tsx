import CampaignIcon from '@mui/icons-material/Campaign'
import { Box, Paper, Skeleton, Stack } from '@mui/material'

const AnnouncementDetailLoading = () => (
  <Box className="mx-auto p-6">
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={3}>
        <Stack direction="row" gap={1.5} alignItems="flex-start">
          <CampaignIcon color="primary" sx={{ fontSize: 34, mt: 0.25 }} />
          <Stack sx={{ flex: 1 }}>
            <Skeleton variant="text" width={260} height={42} />
            <Skeleton variant="text" width="45%" height={22} />
          </Stack>
        </Stack>
        <Stack direction={{ xs: 'column', lg: 'row' }} gap={3}>
          <Stack spacing={2} sx={{ flex: 2 }}>
            <Skeleton variant="rounded" height={180} />
            <Skeleton variant="rounded" height={220} />
            <Skeleton variant="rounded" height={140} />
          </Stack>
          <Skeleton variant="rounded" height={640} sx={{ flex: 1, minWidth: { lg: 320 } }} />
        </Stack>
      </Stack>
    </Paper>
  </Box>
)

export default AnnouncementDetailLoading
