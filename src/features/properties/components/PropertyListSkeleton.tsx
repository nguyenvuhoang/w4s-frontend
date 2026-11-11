import { Box, Paper, Skeleton, Stack } from '@mui/material'

const ROWS = 8

/**
 * Route-level loading shell of the Tower / Floor / Unit list screens (rendered by their `loading.tsx`):
 * page header, context/filter bar and table rows, shown right away while the server checks access and
 * renders the screen. Text-free on purpose (no dictionary is available in `loading.tsx`); the persistent
 * Property tabs above it come from the `properties` layout.
 */
const PropertyListSkeleton = () => (
  <Box className="mx-6" sx={{ mt: 3 }} aria-busy="true" data-property-list-skeleton>
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="rounded" width={48} height={48} />
        <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton variant="text" sx={{ width: { xs: '60%', md: 280 }, fontSize: '1.5rem' }} />
          <Skeleton variant="text" sx={{ width: { xs: '85%', md: 420 } }} />
        </Stack>
      </Stack>

      <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, border: 1, borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
          <Skeleton variant="rounded" height={40} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={40} sx={{ width: { xs: '100%', md: 200 } }} />
          <Skeleton variant="rounded" height={40} sx={{ width: { xs: '100%', md: 128 } }} />
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        <Skeleton variant="rectangular" height={44} />
        <Stack spacing={0} sx={{ px: 2, py: 1 }}>
          {Array.from({ length: ROWS }, (_, index) => (
            <Skeleton key={index} height={40} />
          ))}
        </Stack>
      </Paper>
    </Stack>
  </Box>
)

export default PropertyListSkeleton
