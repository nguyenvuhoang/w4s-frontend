import React from 'react';
import { Box, Grid } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import StatsCard from '@/components/api-manager/shared/StatsCard';
import AnalyticsList from '@/components/api-manager/analytics/AnalyticsList';
import { AnalyticsPoint } from '@/types/api-manager';

async function getAnalytics() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/analytics`, { cache: 'no-store' });
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
}

export default async function AnalyticsPage() {
    const rawData: AnalyticsPoint[] = await getAnalytics();
    const data = rawData.map((item, index) => ({ ...item, id: item.timestamp + index })); // Generate unique ID

    const totalReq = data.reduce((acc, curr) => acc + curr.requests, 0);
    const totalErr = data.reduce((acc, curr) => acc + curr.errors_4xx + curr.errors_5xx, 0);

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Analytics" breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Analytics' }]} />

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <StatsCard label="Total Requests (24h)" value={totalReq.toLocaleString()} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <StatsCard label="Total Errors (24h)" value={totalErr.toLocaleString()} />
                </Grid>
            </Grid>

            <AnalyticsList data={data} />
        </Box>
    );
}
