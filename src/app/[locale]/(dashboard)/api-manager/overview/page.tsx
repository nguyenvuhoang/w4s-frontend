export const dynamic = 'force-dynamic';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import StatsCard from '@/components/api-manager/shared/StatsCard';
import { Box, Chip, Grid, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';

const getData = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/overview`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
    } catch (e) {
        console.error(e);
        return null;
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
