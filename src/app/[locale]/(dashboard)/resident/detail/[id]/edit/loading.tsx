import { Grid, Paper, Skeleton, Stack } from '@mui/material'

const ResidentEditLoading = () => (
    <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
            <Stack spacing={1}>
                <Skeleton width={280} height={24} />
                <Skeleton width={240} height={44} />
            </Stack>
            <Skeleton width={180} height={38} />
        </Stack>

        <Skeleton variant="rounded" width={320} height={44} />

        <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stack spacing={2}>
                <Skeleton width="28%" height={34} />
                <Skeleton width="42%" height={22} />
                <Grid container spacing={2}>
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Grid key={index} size={{ xs: 12, sm: 6 }}>
                            <Skeleton width="32%" height={20} />
                            <Skeleton width="100%" height={56} variant="rounded" />
                        </Grid>
                    ))}
                </Grid>
            </Stack>
        </Paper>
    </Stack>
)

export default ResidentEditLoading
