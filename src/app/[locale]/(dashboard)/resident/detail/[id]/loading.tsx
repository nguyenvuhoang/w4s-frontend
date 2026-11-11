import { Box, Grid, Paper, Skeleton, Stack } from '@mui/material'

const ResidentDetailLoading = () => (
    <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
            <Stack spacing={1}>
                <Skeleton width={280} height={24} />
                <Skeleton width={240} height={44} />
            </Stack>
            <Stack direction="row" gap={1}>
                <Skeleton width={150} height={38} />
                <Skeleton width={110} height={38} />
                <Skeleton width={180} height={38} />
            </Stack>
        </Stack>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                <Stack alignItems="center" spacing={1.5} sx={{ minWidth: 220 }}>
                    <Skeleton variant="circular" width={96} height={96} />
                    <Skeleton width={180} height={28} />
                    <Skeleton width={90} height={24} />
                </Stack>
                <Grid container spacing={2} sx={{ flex: 1 }}>
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Skeleton width="45%" />
                            <Skeleton width="85%" height={30} />
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack spacing={2}>
                <Skeleton width={240} height={34} />
                {Array.from({ length: 2 }).map((_, cardIndex) => (
                    <Box key={cardIndex}>
                        <Skeleton width="35%" height={30} />
                        <Skeleton width="100%" height={120} />
                    </Box>
                ))}
            </Stack>
        </Paper>
    </Stack>
)

export default ResidentDetailLoading
