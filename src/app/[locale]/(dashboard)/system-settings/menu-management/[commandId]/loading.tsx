import { Box, Paper, Skeleton, Stack } from '@mui/material'

const MenuManagementDetailLoading = () => (
  <Box sx={{ p: 6 }}>
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
      <Stack spacing={3}>
        <Skeleton width={260} height={32} />
        <Skeleton width={360} height={48} />
        <Skeleton width={150} height={36} />
        <Skeleton variant="rounded" height={360} />
      </Stack>
    </Paper>
  </Box>
)

export default MenuManagementDetailLoading
