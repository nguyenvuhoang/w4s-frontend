'use client';

import React from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    InputAdornment,
    Paper,
    Stack,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import {
    AccountTree as RoutesIcon,
    Hub as ClustersIcon,
    Lan as DestinationsIcon,
    Refresh as RefreshIcon,
    Save as SaveIcon,
    Search as SearchIcon,
    SettingsEthernet as ServicesIcon
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import StatsCard from '@/components/api-manager/shared/StatsCard';
import { Locale } from '@/configs/i18n';
import {
    ParsedReverseProxyCluster,
    ParsedReverseProxyRoute,
    ReverseProxyConfig,
    ReverseProxyDestination
} from '@/types/yarp';
import { ClusterEditValues, RouteEditValues, useReverseProxyConfig } from './useReverseProxyConfig';

interface TabPanelProps {
    children: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
    if (value !== index) return null;

    return (
        <Box role="tabpanel" id={`reverse-proxy-tabpanel-${index}`} aria-labelledby={`reverse-proxy-tab-${index}`} sx={{ pt: 3 }}>
            {children}
        </Box>
    );
}

function JsonBlock({ value }: { value: unknown }) {
    return (
        <Paper
            variant="outlined"
            sx={{
                bgcolor: 'background.default',
                maxHeight: 360,
                overflow: 'auto',
                p: 2
            }}
        >
            <Typography
                component="pre"
                variant="caption"
                sx={{ fontFamily: 'monospace', m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
                {JSON.stringify(value ?? {}, null, 2)}
            </Typography>
        </Paper>
    );
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
                {title}
            </Typography>
            <Typography color="text.secondary">
                {description}
            </Typography>
        </Paper>
    );
}

function destinationAddress(destination?: ReverseProxyDestination | null) {
    return destination?.Address || '-';
}

interface YarpConfigViewProps {
    config?: ReverseProxyConfig | null;
    locale: Locale;
    sessionToken: string;
}

export default function YarpConfigView({ config, locale, sessionToken }: YarpConfigViewProps) {
    const {
        activeTab,
        applyClusterDraft,
        applyRouteDraft,
        cancelEditRow,
        closeDetail,
        detail,
        discardChanges,
        editState,
        filteredClusters,
        filteredRoutes,
        getClusterForRoute,
        getDestinationEntries,
        getRoutesForCluster,
        hasUnsavedChanges,
        isDirty,
        reloadConfig,
        saveAllChanges,
        saving,
        searchText,
        selectCluster,
        selectRoute,
        setActiveTab,
        setSearchText,
        startEditCluster,
        startEditRoute,
        statusMessage,
        summary,
        transformToText,
        updateEditValues,
        validationErrors
    } = useReverseProxyConfig({ initialConfig: config, locale, sessionToken });

    const routeColumns: Column<ParsedReverseProxyRoute>[] = [
        { id: 'id', label: 'Route Key', minWidth: 160 },
        {
            id: 'ClusterId',
            label: 'ClusterId',
            minWidth: 160,
            format: value => value || '-'
        },
        {
            id: 'Match',
            label: 'Match Path',
            minWidth: 240,
            format: value => value?.Path ? <Chip label={value.Path} size="small" variant="outlined" /> : '-'
        },
        {
            id: 'Transforms',
            label: 'Transform',
            minWidth: 240,
            format: value => transformToText(value)
        },
        {
            id: 'actions',
            label: 'Destination',
            minWidth: 240,
            format: (_, row) => {
                const cluster = getClusterForRoute(row);
                const addresses = getDestinationEntries(cluster);

                if (!row.ClusterId) return '-';
                if (!cluster) return <Chip label="Cluster missing" size="small" color="warning" variant="outlined" />;
                if (!addresses.length) return '-';

                return (
                    <Stack spacing={0.5}>
                        {addresses.map(([key, destination]) => (
                            <Typography key={key} variant="caption" sx={{ wordBreak: 'break-all' }}>
                                {key}: {destinationAddress(destination)}
                            </Typography>
                        ))}
                    </Stack>
                );
            }
        },
        {
            id: 'actions',
            label: 'Status',
            minWidth: 120,
            format: (_, row) => isDirty('route', row.id) ? <Chip label="Modified" size="small" color="warning" /> : <Chip label="Saved" size="small" variant="outlined" />
        }
    ];

    const clusterColumns: Column<ParsedReverseProxyCluster>[] = [
        { id: 'id', label: 'Cluster Key', minWidth: 180 },
        {
            id: 'Destinations',
            label: 'Primary Address',
            minWidth: 260,
            format: value => destinationAddress(value?.primary ?? Object.values(value ?? {})[0])
        },
        {
            id: 'HttpRequest',
            label: 'ActivityTimeout',
            minWidth: 160,
            format: value => value?.ActivityTimeout || '-'
        },
        {
            id: 'HttpRequest',
            label: 'HTTP Version',
            minWidth: 140,
            format: value => value?.Version || '-'
        },
        {
            id: 'HttpRequest',
            label: 'VersionPolicy',
            minWidth: 180,
            format: value => value?.VersionPolicy || '-'
        },
        {
            id: 'HttpRequest',
            label: 'AllowResponseBuffering',
            minWidth: 200,
            format: value => String(value?.AllowResponseBuffering ?? '-')
        },
        {
            id: 'actions',
            label: 'Status',
            minWidth: 120,
            format: (_, row) => isDirty('cluster', row.id) ? <Chip label="Modified" size="small" color="warning" /> : <Chip label="Saved" size="small" variant="outlined" />
        }
    ];

    const selectedRoute = detail?.type === 'route' ? detail.item : null;
    const selectedCluster = detail?.type === 'cluster' ? detail.item : null;
    const selectedRouteCluster = selectedRoute ? getClusterForRoute(selectedRoute) : undefined;
    const selectedClusterRoutes = selectedCluster ? getRoutesForCluster(selectedCluster.id) : [];

    return (
        <Box sx={{ width: '100%', px: { xs: 2, md: 4 }, pb: 8 }}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard label="Total Routes" value={summary.totalRoutes} icon={<RoutesIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard label="Total Clusters" value={summary.totalClusters} icon={<ClustersIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard label="Total Destinations" value={summary.totalDestinations} icon={<DestinationsIcon />} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatsCard label="Modified Items" value={summary.modifiedItems} icon={<ServicesIcon />} />
                </Grid>
            </Grid>

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <TextField
                        value={searchText}
                        onChange={event => setSearchText(event.target.value)}
                        placeholder="Search route, cluster, path or address"
                        fullWidth
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button disabled={saving} variant="outlined" startIcon={<RefreshIcon />} onClick={() => reloadConfig()} sx={{ minWidth: 120 }}>
                        Refresh
                    </Button>
                    <Button disabled={saving || !hasUnsavedChanges} variant="outlined" color="warning" onClick={discardChanges} sx={{ minWidth: 160 }}>
                        Discard Changes
                    </Button>
                    <Button disabled={saving || !hasUnsavedChanges} variant="contained" startIcon={<SaveIcon />} onClick={saveAllChanges} sx={{ minWidth: 130 }}>
                        Save All
                    </Button>
                </Stack>
                {hasUnsavedChanges && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Unsaved changes are stored in draft only. Save All will send the complete ReverseProxy object.
                    </Alert>
                )}
                {statusMessage && (
                    <Alert severity={statusMessage.severity} sx={{ mt: 2 }}>
                        {statusMessage.text}
                    </Alert>
                )}
                {validationErrors.length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {validationErrors.map(error => error.message).join(' ')}
                    </Alert>
                )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, value: number) => setActiveTab(value)}
                    aria-label="reverse proxy configuration tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label={`Routes (${filteredRoutes.length})`} id="reverse-proxy-tab-0" />
                    <Tab label={`Clusters (${filteredClusters.length})`} id="reverse-proxy-tab-1" />
                </Tabs>

                <TabPanel value={activeTab} index={0}>
                    {filteredRoutes.length ? (
                        <DataTable
                            columns={routeColumns}
                            rows={filteredRoutes}
                            count={filteredRoutes.length}
                            onRowClick={selectRoute}
                            actions={row => (
                                <Button size="small" variant="outlined" onClick={() => startEditRoute(row)}>
                                    Edit
                                </Button>
                            )}
                        />
                    ) : (
                        <EmptyState title="No routes found" description="ReverseProxy.Routes is empty or no route matches your search." />
                    )}
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    {filteredClusters.length ? (
                        <DataTable
                            columns={clusterColumns}
                            rows={filteredClusters}
                            count={filteredClusters.length}
                            onRowClick={selectCluster}
                            actions={row => (
                                <Button size="small" variant="outlined" onClick={() => startEditCluster(row)}>
                                    Edit
                                </Button>
                            )}
                        />
                    ) : (
                        <EmptyState title="No clusters found" description="ReverseProxy.Clusters is empty or no cluster matches your search." />
                    )}
                </TabPanel>
            </Paper>

            <Dialog open={Boolean(editState)} onClose={cancelEditRow} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editState?.type === 'route' ? 'Edit Route Draft' : 'Edit Cluster Draft'}
                </DialogTitle>
                <DialogContent dividers>
                    {editState?.type === 'route' && (
                        <Grid container spacing={2} sx={{ pt: 1 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Route Key"
                                    value={(editState.values as RouteEditValues).id}
                                    onChange={event => updateEditValues({ id: event.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="ClusterId"
                                    value={(editState.values as RouteEditValues).ClusterId}
                                    onChange={event => updateEditValues({ ClusterId: event.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Match.Path"
                                    value={(editState.values as RouteEditValues).Path}
                                    onChange={event => updateEditValues({ Path: event.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Transforms JSON"
                                    value={(editState.values as RouteEditValues).Transforms}
                                    onChange={event => updateEditValues({ Transforms: event.target.value })}
                                    fullWidth
                                    multiline
                                    minRows={5}
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    )}

                    {editState?.type === 'cluster' && (
                        <Grid container spacing={2} sx={{ pt: 1 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Cluster Key"
                                    value={(editState.values as ClusterEditValues).id}
                                    onChange={event => updateEditValues({ id: event.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Primary Address"
                                    value={(editState.values as ClusterEditValues).Address}
                                    onChange={event => updateEditValues({ Address: event.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="ActivityTimeout"
                                    value={(editState.values as ClusterEditValues).ActivityTimeout}
                                    onChange={event => updateEditValues({ ActivityTimeout: event.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="HTTP Version"
                                    value={(editState.values as ClusterEditValues).Version}
                                    onChange={event => updateEditValues({ Version: event.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="VersionPolicy"
                                    value={(editState.values as ClusterEditValues).VersionPolicy}
                                    onChange={event => updateEditValues({ VersionPolicy: event.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={(editState.values as ClusterEditValues).AllowResponseBuffering}
                                            onChange={event => updateEditValues({ AllowResponseBuffering: event.target.checked })}
                                        />
                                    }
                                    label="AllowResponseBuffering"
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelEditRow}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (!editState) return;
                            if (editState.type === 'route') {
                                applyRouteDraft(editState.originalId, editState.values as RouteEditValues);
                            } else {
                                applyClusterDraft(editState.originalId, editState.values as ClusterEditValues);
                            }
                        }}
                    >
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(detail)} onClose={closeDetail} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedRoute ? `Route Detail: ${selectedRoute.id}` : selectedCluster ? `Cluster Detail: ${selectedCluster.id}` : 'Detail'}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedRoute && (
                        <Stack spacing={3}>
                            {!selectedRouteCluster && selectedRoute.ClusterId && (
                                <Alert severity="warning">Route points to a cluster that does not exist: {selectedRoute.ClusterId}</Alert>
                            )}
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">ClusterId</Typography>
                                    <Typography>{selectedRoute.ClusterId || '-'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Match Path</Typography>
                                    <Typography sx={{ wordBreak: 'break-all' }}>{selectedRoute.Match?.Path || '-'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Transform</Typography>
                                    <Typography>{transformToText(selectedRoute.Transforms)}</Typography>
                                </Grid>
                            </Grid>
                            {selectedRouteCluster && (
                                <Box>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Mapped Cluster</Typography>
                                    <JsonBlock value={selectedRouteCluster} />
                                </Box>
                            )}
                            <Box>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>Route JSON</Typography>
                                <JsonBlock value={selectedRoute} />
                            </Box>
                        </Stack>
                    )}

                    {selectedCluster && (
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>Destinations</Typography>
                                {getDestinationEntries(selectedCluster).length ? (
                                    <Stack spacing={1}>
                                        {getDestinationEntries(selectedCluster).map(([key, destination]) => (
                                            <Paper key={key} variant="outlined" sx={{ p: 2 }}>
                                                <Typography variant="subtitle2">{key}</Typography>
                                                <Typography color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                                                    {destinationAddress(destination)}
                                                </Typography>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert severity="info">No destinations configured.</Alert>
                                )}
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>Routes Using This Cluster</Typography>
                                {selectedClusterRoutes.length ? (
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        {selectedClusterRoutes.map(route => (
                                            <Chip key={route.id} label={route.id} variant="outlined" />
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert severity="info">No route is currently using this cluster.</Alert>
                                )}
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>HttpRequest</Typography>
                                <JsonBlock value={selectedCluster.HttpRequest ?? {}} />
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" sx={{ mb: 1 }}>Cluster JSON</Typography>
                                <JsonBlock value={selectedCluster} />
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDetail}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
