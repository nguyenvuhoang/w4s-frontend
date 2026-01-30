import React from 'react';
import { Grid, Paper, Box, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import StatsCard from '@/components/api-manager/shared/StatsCard';
// import { apiClient } from '@/server/api-manager/client'; // Can't use client logic in server component if it uses valid client-only things? client.ts was generic fetch.
// Actually, for server component, we need absolute URL or call logic.
// For simplicity in this demo, I will call the logic directly to avoid "Absolute URL" issues in Next.js Server Components without extra config.
// The prompt asked to fetch from Route Handlers. I will simulate that by importing the GET function logic? 
// No, that's cheating the architecture. 
// I will try to use a fetch with a default localhost base.

const getData = async () => {
    // In a real app we'd use headers() to get the host, or an ENV var.
    // For thiscodegen task, we'll assume localhost:3000 or relative fetch if supported (Next 13+ supports relative in some cases but usually needs absolute).
    // Let's rely on process.env.NEXT_PUBLIC_API_URL or default.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/overview`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
    } catch (e) {
        console.error(e);
        return null; // Return null to handle empty state
    }
};

export default async function OverviewPage() {
    const data = await getData();

    if (!data) return <div>Error loading dashboard data. Make sure the server is running.</div>;

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="API Manager Overview" breadcrumbs={[{ label: 'Dashboard' }, { label: 'Overview' }]} />

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard label="Total APIs" value={data.totalApis} trend={{ value: 12, direction: 'up' }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard label="Total Requests (24h)" value={data.totalRequests.toLocaleString()} trend={{ value: 5, direction: 'up' }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard label="Avg Latency" value={`${data.avgLatency}ms`} trend={{ value: 2, direction: 'down' }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard label="Uptime" value={data.uptime} />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>Traffic Analytics (Mock)</Typography>
                        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyItems: 'center', bgcolor: 'background.default' }}>
                            <Typography color="text.secondary" sx={{ width: '100%', textAlign: 'center' }}>
                                [Chart Placeholder: Incoming Requests vs Errors]
                                <br />
                                (Chart.js / Recharts not installed)
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ height: '100%' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6">Top APIs</Typography>
                        </Box>
                        <List>
                            {data.topApis.map((api: any) => (
                                <ListItem key={api.id} divider>
                                    <ListItemText
                                        primary={api.name}
                                        secondary={api.version}
                                    />
                                    <Chip label={api.status} size="small" color={api.status === 'published' ? 'success' : 'default'} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
