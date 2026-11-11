import { Skeleton, Stack } from '@mui/material'

export default function LoadingCreateBanner() {
  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
      <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1 }} />
      <Stack spacing={2}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rectangular" height={40} sx={{ flex: 1, borderRadius: 1 }} />
          <Skeleton variant="rectangular" height={40} sx={{ flex: 1, borderRadius: 1 }} />
        </Stack>
      </Stack>
    </Stack>
  )
}
