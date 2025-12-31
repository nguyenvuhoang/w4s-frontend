'use client';

import {
    Box,
    Card,
    CardContent,
    Grid,
    Link,
    MenuItem,
    Paper,
    Select,
    Typography,
} from '@mui/material';
import {
    AccessTime as RecentIcon,
    Collections as CollectionsIcon,
    NotificationsActive as AlertsIcon,
    Speed as TrafficIcon,
    Timeline as TimelineIcon,
    TroubleshootOutlined as InvestigateIcon,
    Warning as ErrorIcon,
} from '@mui/icons-material';
import { useState } from 'react';

// =============================================================================
// MOCK DATA - Hard-coded data for the dashboard
// =============================================================================

const mockTrafficData = {
    title: 'Total Traffic',
    value: '136.486',
    unit: 'rps',
    items: [
        { name: 'perfBenchmark_invalid_v1', value: '78.428' },
        { name: 'perfBenchmark_v1', value: '46.387' },
    ],
};

const mockErrorRateData = {
    title: 'Error Rate',
    value: '54.747',
    unit: '%',
    items: [
        { name: 'perfBenchmark_invalid_v1', value: '78.428%' },
        { name: 'perfBenchmark_v1', value: '12.156%' },
    ],
};

const mockLatencyData = {
    title: 'Top Proxy Latency P99',
    value: '114',
    unit: 'ms',
    items: [
        { name: 'oauth_v1', value: '114 ms' },
        { name: 'perfBenchmark_invalid_v1', value: '89 ms' },
    ],
};

const mockAlertsData = {
    title: 'Alerts',
    value: '109',
    unit: '',
    alerts: [
        { name: 'Collection Alert', count: 20 },
        { name: 'Test New Format of Alert', count: 10 },
        { name: 'jundebug', count: 10 },
    ],
};

const navigationTiles = [
    {
        icon: RecentIcon,
        title: 'Recent',
        subtitle: 'Track anomalies for the last hour',
    },
    {
        icon: TimelineIcon,
        title: 'Timeline',
        subtitle: 'View trends history for context',
    },
    {
        icon: InvestigateIcon,
        title: 'Investigate',
        subtitle: 'Drilldown and diagnose from logs',
    },
    {
        icon: AlertsIcon,
        title: 'Alerts',
        subtitle: 'Configure alerts and get notified of issues',
    },
    {
        icon: CollectionsIcon,
        title: 'Collections',
        subtitle: 'Create Collection to monitor group of proxies and targets',
    },
];

// =============================================================================
// METRIC CARD COMPONENT - Reusable card for traffic, error rate, latency
// =============================================================================

interface MetricCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    unit: string;
    items: { name: string; value: string }[];
}

const MetricCard = ({ icon, title, value, unit, items }: MetricCardProps) => {
    return (
        <Card
            className="rounded-xl border border-slate-200 h-full"
            sx={{ boxShadow: 1 }}
        >
            <CardContent className="p-4 md:p-5">
                {/* Header with icon and title */}
                <Box className="flex items-center gap-2 mb-3">
                    <Box className="text-slate-500">{icon}</Box>
                    <Typography
                        variant="subtitle2"
                        className="text-slate-600 font-medium"
                    >
                        {title}
                    </Typography>
                </Box>

                {/* Large metric value */}
                <Typography
                    variant="h4"
                    className="font-bold text-slate-900 mb-4"
                >
                    {value}{' '}
                    <Typography
                        component="span"
                        variant="body1"
                        className="text-slate-500 font-normal"
                    >
                        {unit}
                    </Typography>
                </Typography>

                {/* Sub-items list */}
                <Box className="space-y-2 mb-3">
                    {items.map((item, index) => (
                        <Box
                            key={index}
                            className="flex justify-between items-center text-sm"
                        >
                            <Typography
                                variant="body2"
                                className="text-slate-600 truncate max-w-[60%]"
                            >
                                {item.name}
                            </Typography>
                            <Typography
                                variant="body2"
                                className="text-slate-700 font-medium"
                            >
                                {item.value}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* View all link */}
                <Link
                    href="#"
                    underline="hover"
                    className="text-blue-600 text-sm font-medium hover:underline"
                    sx={{
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                >
                    View all
                </Link>
            </CardContent>
        </Card>
    );
};

// =============================================================================
// ALERTS CARD COMPONENT - Special card for alerts with different layout
// =============================================================================

interface AlertsCardProps {
    title: string;
    value: string;
    alerts: { name: string; count: number }[];
}

const AlertsCard = ({ title, value, alerts }: AlertsCardProps) => {
    return (
        <Card
            className="rounded-xl border border-slate-200 h-full"
            sx={{ boxShadow: 1 }}
        >
            <CardContent className="p-4 md:p-5">
                {/* Header with icon and title */}
                <Box className="flex items-center gap-2 mb-3">
                    <Box className="text-orange-500">
                        <AlertsIcon fontSize="small" />
                    </Box>
                    <Typography
                        variant="subtitle2"
                        className="text-slate-600 font-medium"
                    >
                        {title}
                    </Typography>
                </Box>

                {/* Large metric value */}
                <Typography
                    variant="h4"
                    className="font-bold text-slate-900 mb-4"
                >
                    {value}
                </Typography>

                {/* Alerts list with counts on right */}
                <Box className="space-y-2 mb-3">
                    {alerts.map((alert, index) => (
                        <Box
                            key={index}
                            className="flex justify-between items-center text-sm"
                        >
                            <Typography
                                variant="body2"
                                className="text-slate-600 truncate max-w-[70%]"
                            >
                                {alert.name}
                            </Typography>
                            <Typography
                                variant="body2"
                                className="text-slate-700 font-medium"
                            >
                                {alert.count}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* View all link */}
                <Link
                    href="#"
                    underline="hover"
                    className="text-blue-600 text-sm font-medium"
                    sx={{
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    }}
                >
                    View all
                </Link>
            </CardContent>
        </Card>
    );
};

// =============================================================================
// NAVIGATION TILE COMPONENT - Square tiles for navigation
// =============================================================================

interface NavigationTileProps {
    icon: React.ElementType;
    title: string;
    subtitle: string;
}

const NavigationTile = ({ icon: Icon, title, subtitle }: NavigationTileProps) => {
    return (
        <Paper
            className="rounded-xl border border-slate-200 cursor-pointer transition-all duration-200"
            sx={{
                boxShadow: 1,
                '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <Box className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center min-h-[180px]">
                {/* Icon */}
                <Box className="text-blue-600 mb-2">
                    <Icon sx={{ fontSize: 40 }} />
                </Box>

                {/* Title */}
                <Typography
                    variant="subtitle1"
                    className="font-semibold text-slate-800"
                >
                    {title}
                </Typography>

                {/* Subtitle */}
                <Typography
                    variant="body2"
                    className="text-slate-500 text-center max-w-[200px]"
                >
                    {subtitle}
                </Typography>
            </Box>
        </Paper>
    );
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

const DashboardPageContent = () => {
    const [environment, setEnvironment] = useState('prod');

    return (
        // Page container with light gray background
        <Box className="min-h-screen bg-slate-50">
            <Box className="py-6 px-4 md:px-8 max-w-[1600px] mx-auto">
                {/* ================================================================
                    HEADER SECTION
                    - Main title on left
                    - Environment selector below
                ================================================================ */}
                <Box className="mb-6">
                    {/* Main title */}
                    <Typography
                        variant="h4"
                        component="h1"
                        className="font-bold text-slate-900 mb-2"
                    >
                        API Monitoring
                    </Typography>

                    {/* Secondary line with environment selector */}
                    <Box className="flex flex-wrap items-center gap-1 text-slate-600">
                        <Typography variant="body2">
                            Last hour for apigee-pinpoint:
                        </Typography>
                        <Select
                            value={environment}
                            onChange={(e) => setEnvironment(e.target.value)}
                            size="small"
                            variant="standard"
                            sx={{
                                minWidth: 80,
                                '& .MuiSelect-select': {
                                    color: '#2563eb',
                                    fontWeight: 500,
                                    py: 0,
                                },
                                '&:before, &:after': {
                                    display: 'none',
                                },
                            }}
                        >
                            <MenuItem value="prod">prod</MenuItem>
                            <MenuItem value="staging">staging</MenuItem>
                            <MenuItem value="dev">dev</MenuItem>
                        </Select>
                        <Typography variant="body2" className="text-slate-400">
                            ▼
                        </Typography>
                    </Box>
                </Box>

                {/* ================================================================
                    TOP METRICS ROW - 4 Cards
                    - Total Traffic, Error Rate, Latency P99, Alerts
                    - 4 columns on desktop, 1 per row on mobile
                ================================================================ */}
                <Grid container spacing={3}>
                    {/* Card 1 - Total Traffic */}
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <MetricCard
                            icon={<TrafficIcon fontSize="small" />}
                            title={mockTrafficData.title}
                            value={mockTrafficData.value}
                            unit={mockTrafficData.unit}
                            items={mockTrafficData.items}
                        />
                    </Grid>

                    {/* Card 2 - Error Rate */}
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <MetricCard
                            icon={<ErrorIcon fontSize="small" />}
                            title={mockErrorRateData.title}
                            value={mockErrorRateData.value}
                            unit={mockErrorRateData.unit}
                            items={mockErrorRateData.items}
                        />
                    </Grid>

                    {/* Card 3 - Top Proxy Latency P99 */}
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <MetricCard
                            icon={<TimelineIcon fontSize="small" />}
                            title={mockLatencyData.title}
                            value={mockLatencyData.value}
                            unit={mockLatencyData.unit}
                            items={mockLatencyData.items}
                        />
                    </Grid>

                    {/* Card 4 - Alerts */}
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                        <AlertsCard
                            title={mockAlertsData.title}
                            value={mockAlertsData.value}
                            alerts={mockAlertsData.alerts}
                        />
                    </Grid>
                </Grid>

                {/* ================================================================
                    SECOND ROW - Navigation Tiles (5 tiles)
                    - Recent, Timeline, Investigate, Alerts, Collections
                    - 5 columns on desktop, 2 per row on tablet, 1 on mobile
                ================================================================ */}
                <Grid container spacing={3} className="mt-6">
                    {navigationTiles.map((tile, index) => (
                        <Grid
                            key={index}
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 4,
                                lg: 2.4,
                            }}
                        >
                            <NavigationTile
                                icon={tile.icon}
                                title={tile.title}
                                subtitle={tile.subtitle}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
};

export default DashboardPageContent;
