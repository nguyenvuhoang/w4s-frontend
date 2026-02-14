'use client';

import {
    NotificationsActive as AlertsIcon,
    ArrowForward as ArrowForwardIcon,
    Circle as CircleIcon,
    Close as CloseIcon,
    Memory as CpuIcon,
    ErrorOutline as ErrorIcon,
    Timer as LatencyIcon,
    MoreVert as MoreIcon,
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Speed as SpeedIcon,
    Storage as StorageIcon,
    TrendingDown as TrendingDownIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
    alpha,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Drawer,
    Grid,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Select,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis
} from 'recharts';

// =============================================================================
// MOCK DATA & GENERATORS
// =============================================================================

const generateTimeSeriesData = (points: number, min: number, max: number) => {
    return Array.from({ length: points }, (_, i) => ({
        time: `${i}:00`,
        value: Math.floor(Math.random() * (max - min + 1) + min),
    }));
};

const trafficData = generateTimeSeriesData(12, 50, 200);
const latencyData = generateTimeSeriesData(12, 10, 80).map(d => ({ ...d, p99: d.value + 20, p50: d.value }));

const endpointPerformance = [
    { name: '/api/v1/auth/login', calls: '142.5k', status: 'Healthy', latency: '42ms', successRate: 99.8 },
    { name: '/api/v1/user/profile', calls: '98.2k', status: 'Healthy', latency: '28ms', successRate: 99.9 },
    { name: '/api/v1/payment/verify', calls: '12.4k', status: 'Degraded', latency: '350ms', successRate: 85.4 },
    { name: '/api/v1/products/list', calls: '245.1k', status: 'Healthy', latency: '15ms', successRate: 100 },
    { name: '/api/v1/orders/create', calls: '5.2k', status: 'Warning', latency: '120ms', successRate: 92.1 },
];

// Infra data is fetched from /api/infra (Node Exporter)
interface InfraData {
    cpuUsage: string;
    memoryUsage: string;
    diskUsage: string;
    networkRxBytes: number;
    networkTxBytes: number;
    uptimeSeconds: number;
    loadAvg1m: number;
    hostname: string;
    status: string;
}

const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

const formatBytes = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
    return `${bytes} B`;
};

const recentLogs = [
    { id: 1, type: 'Error', message: 'Unauthorized access attempt detected', time: '2 mins ago', severity: 'High' },
    { id: 2, type: 'Warning', message: 'Latency spike in /payment/verify', time: '5 mins ago', severity: 'Medium' },
    { id: 3, type: 'Info', message: 'System update completed', time: '15 mins ago', severity: 'Low' },
    { id: 4, type: 'Error', message: 'Database connection timeout', time: '1 hour ago', severity: 'Critical' },
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const GlassCard = ({ children, sx, ...props }: any) => {
    const theme = useTheme();
    return (
        <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            sx={{
                background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(248, 250, 252, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
                border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(51, 65, 85, 0.5)'
                    : '1px solid rgba(226, 232, 240, 0.8)',
                borderRadius: '16px',
                boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                position: 'relative',
                overflow: 'hidden',
                ...sx
            }}
            {...props}
        >
            {children}
        </Card>
    );
};

const StatCard = ({ title, value, unit, icon, color, trend }: any) => (
    <GlassCard sx={{ height: '100%' }}>
        <CardContent sx={{ p: '24px !important' }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(color, 0.1),
                        color: color,
                    }}
                >
                    {icon}
                </Box>
                {trend && (
                    <Chip
                        icon={trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        label={`${Math.abs(trend)}%`}
                        size="small"
                        color={trend > 0 ? 'success' : 'error'}
                        variant="filled"
                        sx={{ fontWeight: 600, bgcolor: trend > 0 ? alpha('#10b981', 0.1) : alpha('#f43f5e', 0.1) }}
                    />
                )}
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                {title}
            </Typography>
            <Box display="flex" alignItems="baseline" gap={1}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {unit}
                </Typography>
            </Box>
        </CardContent>
    </GlassCard>
);

const SystemHealthItem = ({ name, value, icon, color }: any) => (
    <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ color: color, display: 'flex' }}>{icon}</Box>
                <Typography variant="body2" fontWeight={600}>{name}</Typography>
            </Box>
            <Typography variant="body2" fontWeight={700} color={color}>{value}%</Typography>
        </Box>
        <LinearProgress
            variant="determinate"
            value={value}
            sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(color, 0.1),
                '& .MuiLinearProgress-bar': { bgcolor: color }
            }}
        />
    </Box>
);

const SettingsDrawer = ({ open, onClose, settings, onSettingsChange }: any) => {
    const theme = useTheme();

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 360 },
                    background: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
                    p: 0,
                    boxShadow: theme.palette.mode === 'dark' ? '-10px 0 30px rgba(0,0,0,0.5)' : '-10px 0 30px rgba(0,0,0,0.05)',
                }
            }}
        >
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={800}>Dashboard Settings</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </Box>

            <Divider />

            <Box sx={{ p: 3 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mb: 2, display: 'block' }}>
                    DISPLAY SECTIONS
                </Typography>
                <List disablePadding>
                    <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText primary="Quick Stats" secondary="Hide summary count cards" />
                        <Switch
                            checked={settings.visibility.stats}
                            onChange={(e) => onSettingsChange('visibility', { ...settings.visibility, stats: e.target.checked })}
                        />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText primary="Request Chart" secondary="Toggle throughput visualization" />
                        <Switch
                            checked={settings.visibility.chart}
                            onChange={(e) => onSettingsChange('visibility', { ...settings.visibility, chart: e.target.checked })}
                        />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText primary="System Infrastructure" secondary="Memory, CPU & DB status" />
                        <Switch
                            checked={settings.visibility.infrastructure}
                            onChange={(e) => onSettingsChange('visibility', { ...settings.visibility, infrastructure: e.target.checked })}
                        />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText primary="Endpoints" secondary="Performance table by route" />
                        <Switch
                            checked={settings.visibility.endpoints}
                            onChange={(e) => onSettingsChange('visibility', { ...settings.visibility, endpoints: e.target.checked })}
                        />
                    </ListItem>
                    <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText primary="Security Logs" secondary="Live feed of system activity" />
                        <Switch
                            checked={settings.visibility.logs}
                            onChange={(e) => onSettingsChange('visibility', { ...settings.visibility, logs: e.target.checked })}
                        />
                    </ListItem>
                </List>

                <Box mt={4}>
                    <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mb: 2, display: 'block' }}>
                        DATA REFRESH
                    </Typography>
                    <Select
                        fullWidth
                        size="small"
                        value={settings.refreshInterval}
                        onChange={(e) => onSettingsChange('refreshInterval', e.target.value)}
                        sx={{ borderRadius: '12px' }}
                    >
                        <MenuItem value={0}>Manual Refresh</MenuItem>
                        <MenuItem value={15}>Every 15 seconds</MenuItem>
                        <MenuItem value={30}>Every 30 seconds</MenuItem>
                        <MenuItem value={60}>Every 1 minute</MenuItem>
                        <MenuItem value={300}>Every 5 minutes</MenuItem>
                    </Select>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        How often the dashboard updates its indicators automatically.
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ mt: 'auto', p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <Chip
                    label="Reset to Default"
                    icon={<RefreshIcon />}
                    clickable
                    color="primary"
                    variant="outlined"
                    onClick={() => onSettingsChange('reset', null)}
                    sx={{ width: '100%', borderRadius: '12px', height: 40 }}
                />
            </Box>
        </Drawer>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const DashboardPageContent = () => {
    const theme = useTheme();
    const [settingsOpen, setSettingsOpen] = useState(false);

    // ── Infra live data ─────────────────────────────────────────────────
    const [infra, setInfra] = useState<InfraData | null>(null);
    const [infraLoading, setInfraLoading] = useState(true);
    const [infraError, setInfraError] = useState(false);

    const fetchInfra = useCallback(async () => {
        try {
            setInfraLoading(true);
            setInfraError(false);
            const res = await fetch('/api/infra');
            if (!res.ok) throw new Error('API error');
            const data: InfraData = await res.json();
            setInfra(data);
        } catch {
            setInfraError(true);
        } finally {
            setInfraLoading(false);
        }
    }, []);

    // Initialize settings from localStorage directly
    const [settings, setSettings] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dashboard_settings');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error('Failed to parse settings', e);
                }
            }
        }
        return {
            visibility: {
                stats: true,
                chart: true,
                infrastructure: true,
                endpoints: true,
                logs: true
            },
            refreshInterval: 60
        };
    });

    const handleSettingsChange = (type: string, value: any) => {
        let newSettings;
        if (type === 'reset') {
            newSettings = {
                visibility: {
                    stats: true,
                    chart: true,
                    infrastructure: true,
                    endpoints: true,
                    logs: true
                },
                refreshInterval: 60
            };
        } else {
            newSettings = { ...settings, [type]: value };
        }
        setSettings(newSettings);
        localStorage.setItem('dashboard_settings', JSON.stringify(newSettings));
    };

    // Fetch infra on mount + auto-refresh
    useEffect(() => {
        fetchInfra();
        const interval = settings.refreshInterval > 0
            ? setInterval(fetchInfra, settings.refreshInterval * 1000)
            : null;
        return () => { if (interval) clearInterval(interval); };
    }, [settings.refreshInterval, fetchInfra]);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
            {/* Header Area */}
            <Box mb={4} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-1px', color: theme.palette.text.primary }}>
                        Console <Box component="span" sx={{ color: '#6366f1' }}>Admin</Box>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                        Intelligent API Monitoring & System Diagnostics
                    </Typography>
                </motion.div>

                <Box display="flex" gap={2} alignItems="center">
                    <IconButton
                        onClick={() => setSettingsOpen(true)}
                        sx={{ bgcolor: theme.palette.background.paper, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderRadius: '12px' }}
                    >
                        <SettingsIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Quick Stats Grid */}
            <AnimatePresence>
                {settings.visibility.stats && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Grid container spacing={3} mb={4}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <StatCard title="API Traffic" value="2.4M" unit="requests/hr" icon={<SpeedIcon />} color="#6366f1" trend={12} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <StatCard title="Error Rate" value="0.04" unit="%" icon={<ErrorIcon />} color="#f43f5e" trend={-2} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <StatCard title="Avg Latency" value="112" unit="ms" icon={<LatencyIcon />} color="#10b981" trend={-5} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <StatCard title="Active Alerts" value="4" unit="active" icon={<AlertsIcon />} color="#f59e0b" />
                            </Grid>
                        </Grid>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Middle Row: Charts & System Health */}
            <Grid container spacing={3} mb={4}>
                {settings.visibility.chart && (
                    <Grid size={{ xs: 12, lg: settings.visibility.infrastructure ? 8 : 12 }}>
                        <GlassCard sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                                    <Typography variant="h6" fontWeight={700}>Request Throughput</Typography>
                                    <Box display="flex" gap={1}>
                                        <Chip label="Realtime" size="small" sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', fontWeight: 600 }} />
                                    </Box>
                                </Box>
                                <Box sx={{ height: 350, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trafficData}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                                            <RechartsTooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                    backgroundColor: theme.palette.background.paper
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorValue)"
                                                animationDuration={2000}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </GlassCard>
                    </Grid>
                )}

                {settings.visibility.infrastructure && (
                    <Grid size={{ xs: 12, lg: settings.visibility.chart ? 4 : 12 }}>
                        <GlassCard sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h6" fontWeight={700}>System Infrastructure</Typography>
                                    <Tooltip title="Refresh">
                                        <IconButton size="small" onClick={fetchInfra} disabled={infraLoading}>
                                            <RefreshIcon sx={{ fontSize: 18, animation: infraLoading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                {infraError && !infra ? (
                                    <Box textAlign="center" py={4}>
                                        <ErrorIcon sx={{ fontSize: 40, color: '#f43f5e', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary" mb={2}>
                                            Can not fetch data from server information
                                        </Typography>
                                        <Chip label="Retry" clickable color="primary" variant="outlined" onClick={fetchInfra} sx={{ borderRadius: '12px' }} />
                                    </Box>
                                ) : (
                                    <>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {[
                                                { name: 'CPU Usage', value: parseFloat(infra?.cpuUsage || '0'), icon: <CpuIcon />, color: '#6366f1' },
                                                { name: 'Memory', value: parseFloat(infra?.memoryUsage || '0'), icon: <StorageIcon />, color: '#a855f7' },
                                                { name: 'Disk Usage', value: parseFloat(infra?.diskUsage || '0'), icon: <StorageIcon />, color: '#ec4899' },
                                            ].map((metric, idx) => (
                                                <SystemHealthItem key={idx} {...metric} />
                                            ))}
                                        </Box>

                                        {/* Network I/O row */}
                                        <Box mt={2} display="flex" gap={2}>
                                            <Box flex={1} p={1.5} sx={{ bgcolor: alpha('#06b6d4', 0.06), borderRadius: '10px', textAlign: 'center' }}>
                                                <Typography variant="caption" color="text.secondary" display="block">▼ RX</Typography>
                                                <Typography variant="body2" fontWeight={700} color="#06b6d4">
                                                    {infra ? formatBytes(infra.networkRxBytes) : '–'}
                                                </Typography>
                                            </Box>
                                            <Box flex={1} p={1.5} sx={{ bgcolor: alpha('#f59e0b', 0.06), borderRadius: '10px', textAlign: 'center' }}>
                                                <Typography variant="caption" color="text.secondary" display="block">▲ TX</Typography>
                                                <Typography variant="body2" fontWeight={700} color="#f59e0b">
                                                    {infra ? formatBytes(infra.networkTxBytes) : '–'}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Status Summary */}
                                        <Box mt={3} p={2} sx={{ bgcolor: alpha('#6366f1', 0.05), borderRadius: '12px', border: `1px dashed ${alpha('#6366f1', 0.2)}` }}>
                                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                                STATUS SUMMARY
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} display="flex" alignItems="center" gap={1}>
                                                <CircleIcon sx={{ fontSize: 10, color: infraError ? '#f43f5e' : '#10b981' }} />
                                                {infraError ? 'Connection issue' : 'All systems operational'}
                                            </Typography>
                                            <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                                                <Chip label={`Host: ${infra?.hostname || '–'}`} size="small" variant="outlined" />
                                                <Chip label={`Uptime: ${infra ? formatUptime(infra.uptimeSeconds) : '–'}`} size="small" variant="outlined" />
                                                <Chip label={`Load: ${infra?.loadAvg1m?.toFixed(2) ?? '–'}`} size="small" variant="outlined" />
                                            </Box>
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </GlassCard>
                    </Grid>
                )}
            </Grid>

            {/* Bottom Row: Table & Logs */}
            <Grid container spacing={3}>
                {/* Endpoint List */}
                {settings.visibility.endpoints && (
                    <Grid size={{ xs: 12, xl: settings.visibility.logs ? 8 : 12 }}>
                        <GlassCard>
                            <CardContent sx={{ p: 0 }}>
                                <Box p={3} display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" fontWeight={700}>Endpoint Performance</Typography>
                                    <Tooltip title="Export Report">
                                        <IconButton size="small"><MoreIcon /></IconButton>
                                    </Tooltip>
                                </Box>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: alpha(theme.palette.divider, 0.03) }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Endpoint</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Avg Latency</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Throughput</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Success Rate</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                                <TableCell />
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {endpointPerformance.map((row) => (
                                                <TableRow key={row.name} hover>
                                                    <TableCell sx={{ fontWeight: 600, color: '#6366f1' }}>{row.name}</TableCell>
                                                    <TableCell>{row.latency}</TableCell>
                                                    <TableCell>{row.calls}</TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Box sx={{ flex: 1, minWidth: 60 }}>
                                                                <LinearProgress
                                                                    variant="determinate"
                                                                    value={row.successRate}
                                                                    sx={{ height: 4, borderRadius: 2 }}
                                                                    color={row.successRate > 95 ? 'success' : 'warning'}
                                                                />
                                                            </Box>
                                                            <Typography variant="caption" fontWeight={700}>{row.successRate}%</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={row.status}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 600,
                                                                bgcolor: row.status === 'Healthy' ? alpha('#10b981', 0.1) : alpha('#f59e0b', 0.1),
                                                                color: row.status === 'Healthy' ? '#10b981' : '#f59e0b'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small"><ArrowForwardIcon sx={{ fontSize: 16 }} /></IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </GlassCard>
                    </Grid>
                )}

                {/* Live Activity Logs */}
                {settings.visibility.logs && (
                    <Grid size={{ xs: 12, xl: settings.visibility.endpoints ? 4 : 12 }}>
                        <GlassCard sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h6" fontWeight={700}>Live Security Logs</Typography>
                                    <Typography variant="caption" color="#6366f1" sx={{ cursor: 'pointer', fontWeight: 700 }}>VIEW ALL</Typography>
                                </Box>
                                <Box display="flex" flexDirection="column" gap={2}>
                                    {recentLogs.map((log) => (
                                        <Box
                                            key={log.id}
                                            p={2}
                                            sx={{
                                                borderRadius: '12px',
                                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
                                                border: `1px solid ${theme.palette.divider}`,
                                                transition: 'transform 0.2s',
                                                '&:hover': { transform: 'scale(1.02)' }
                                            }}
                                        >
                                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                <Typography variant="caption" fontWeight={800} color={log.type === 'Error' ? '#f43f5e' : log.type === 'Warning' ? '#f59e0b' : '#6366f1'}>
                                                    {log.type.toUpperCase()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">{log.time}</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={500} mb={1}>{log.message}</Typography>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Chip label={log.severity} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                                                <Typography variant="caption" sx={{ opacity: 0.6 }}>PID: {1000 + log.id * 123}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </GlassCard>
                    </Grid>
                )}
            </Grid>

            {/* Settings Drawer */}
            <SettingsDrawer
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={settings}
                onSettingsChange={handleSettingsChange}
            />
        </Box>
    );
};

export default DashboardPageContent;
