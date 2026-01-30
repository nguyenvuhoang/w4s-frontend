
import React from 'react';
import { Box, Grid, Skeleton } from '@mui/material';

export default function Loading() {
    return (
        <Box sx={{ p: 3 }}>
            <Skeleton variant="text" width={200} height={40} sx={{ mb: 4 }} />
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[1, 2, 3, 4].map((i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                    </Grid>
                ))}
            </Grid>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
                </Grid>
            </Grid>
        </Box>
    );
}
