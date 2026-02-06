'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Tabs, Tab, Paper, Typography, Chip, Tooltip, Stack,
    ToggleButtonGroup, ToggleButton, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Grid, FormControl, InputLabel, MenuItem, Select,
    Fab, Alert, Zoom, useTheme
} from '@mui/material';
import {
    TableChart as TableIcon,
    Code as JsonIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Save as SaveIcon,
    DeleteOutline as DeleteOutlineIcon
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import { YarpRoute, YarpCluster } from '@/types/yarp';
import dynamic from 'next/dynamic';

// Dynamically import JSON Editor to avoid SSR issues
const JsonEditor = dynamic(
    () => import('jsoneditor-react').then((mod) => mod.JsonEditor),
    { ssr: false }
);
import 'jsoneditor-react/es/editor.min.css';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`yarp-tabpanel-${index}`}
            aria-labelledby={`yarp-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </Box>
    );
}

interface YarpConfigViewProps {
    initialRoutes: YarpRoute[];
    initialClusters: YarpCluster[];
}

export default function YarpConfigView({ initialRoutes, initialClusters }: YarpConfigViewProps) {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);
    const [viewType, setViewType] = useState<'table' | 'json'>('table');
    const [routes, setRoutes] = useState<YarpRoute[]>(initialRoutes);
    const [clusters, setClusters] = useState<YarpCluster[]>(initialClusters);

    // Form States
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogType, setDialogType] = useState<'route' | 'cluster'>('route');
    const [editingItem, setEditingItem] = useState<any>(null);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleViewTypeChange = (event: React.MouseEvent<HTMLElement>, nextView: 'table' | 'json' | null) => {
        if (nextView !== null) {
            setViewType(nextView);
        }
    };

    const handleEdit = (type: 'route' | 'cluster', item: any) => {
        setDialogType(type);
        setEditingItem(item);
        setOpenDialog(true);
    };

    const handleDelete = (type: 'route' | 'cluster', id: string) => {
        if (type === 'route') {
            setRoutes(routes.filter(r => r.id !== id));
        } else {
            setClusters(clusters.filter(c => c.id !== id));
        }
    };

    const handleAdd = (type: 'route' | 'cluster') => {
        setDialogType(type);
        setEditingItem(null);
        setOpenDialog(true);
    };

    const routeColumns: Column<YarpRoute>[] = [
        { id: 'id', label: 'Route ID', minWidth: 150 },
        { id: 'ClusterId', label: 'Cluster ID', minWidth: 150 },
        {
            id: 'Match',
            label: 'Path Match',
            minWidth: 200,
            format: (val: any) => (
                <Chip label={val?.Path} color="primary" variant="outlined" size="small" />
            )
        },
        {
            id: 'Transforms',
            label: 'Transforms',
            minWidth: 200,
            format: (val: any[]) => {
                if (!val || val.length === 0) return '-';
                return (
                    <Stack direction="row" spacing={1}>
                        {val.map((t, idx) => {
                            const key = Object.keys(t)[0];
                            return (
                                <Tooltip key={idx} title={`${key}: ${t[key]}`}>
                                    <Chip label={key} size="small" />
                                </Tooltip>
                            );
                        })}
                    </Stack>
                );
            }
        },
        {
            id: 'actions',
            label: 'Actions',
            align: 'right',
            format: (_, row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton size="small" color="primary" onClick={() => handleEdit('route', row)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete('route', row.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )
        }
    ];

    const clusterColumns: Column<YarpCluster>[] = [
        { id: 'id', label: 'Cluster ID', minWidth: 150 },
        {
            id: 'Destinations',
            label: 'Destinations',
            minWidth: 250,
            format: (val: any) => (
                <Stack spacing={0.5}>
                    {Object.entries(val || {}).map(([key, dest]: [string, any]) => (
                        <Typography key={key} variant="body2">
                            <strong>{key}:</strong> {dest.Address}
                        </Typography>
                    ))}
                </Stack>
            )
        },
        {
            id: 'HttpRequest',
            label: 'HTTP Settings',
            minWidth: 250,
            format: (val: any) => {
                if (!val) return '-';
                return (
                    <Stack spacing={0.5}>
                        {val.ActivityTimeout && (
                            <Typography variant="caption" display="block">
                                Timeout: {val.ActivityTimeout}
                            </Typography>
                        )}
                        {val.Version && (
                            <Typography variant="caption" display="block">
                                HTTP {val.Version} ({val.VersionPolicy})
                            </Typography>
                        )}
                    </Stack>
                );
            }
        },
        {
            id: 'actions',
            label: 'Actions',
            align: 'right',
            format: (_, row) => (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton size="small" color="primary" onClick={() => handleEdit('cluster', row)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete('cluster', row.id)}>
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )
        }
    ];

    const handleDialogClose = () => {
        setOpenDialog(false);
    };

    const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData);

        if (dialogType === 'route') {
            const newRoute: YarpRoute = {
                id: data.id as string,
                ClusterId: data.ClusterId as string,
                Match: { Path: data.Path as string },
                Transforms: editingItem?.Transforms || []
            };

            if (editingItem) {
                setRoutes(routes.map(r => r.id === editingItem.id ? newRoute : r));
            } else {
                setRoutes([...routes, newRoute]);
            }
        } else {
            const newCluster: YarpCluster = {
                id: data.id as string,
                Destinations: {
                    primary: { Address: data.Address as string }
                },
                HttpRequest: editingItem?.HttpRequest
            };

            if (editingItem) {
                setClusters(clusters.map(c => c.id === editingItem.id ? newCluster : c));
            } else {
                setClusters([...clusters, newCluster]);
            }
        }
        setOpenDialog(false);
    };

    const getFullJson = () => {
        const fullConfig = {
            ReverseProxy: {
                Routes: routes.reduce((acc, r) => {
                    const { id, ...rest } = r;
                    acc[id] = rest;
                    return acc;
                }, {} as any),
                Clusters: clusters.reduce((acc, c) => {
                    const { id, ...rest } = c;
                    acc[id] = rest;
                    return acc;
                }, {} as any)
            }
        };
        return fullConfig;
    };

    const handleJsonUpdate = (newJson: any) => {
        if (newJson?.ReverseProxy) {
            const newRoutes = Object.entries(newJson.ReverseProxy.Routes || {}).map(([id, config]: [string, any]) => ({
                id,
                ...config
            }));
            const newClusters = Object.entries(newJson.ReverseProxy.Clusters || {}).map(([id, config]: [string, any]) => ({
                id,
                ...config
            }));
            setRoutes(newRoutes);
            setClusters(newClusters);
        }
    };

    return (
        <Box sx={{ width: '100%', px: { xs: 2, md: 4 }, pb: 8 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px 12px 0 0',
                    px: 2,
                    mb: 0
                }}
            >
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="yarp configuration tabs"
                    sx={{
                        '& .MuiTab-root': {
                            fontWeight: 600,
                            minHeight: 48,
                        }
                    }}
                >
                    <Tab label="Routes" id="yarp-tab-0" aria-controls="yarp-tabpanel-0" />
                    <Tab label="Clusters" id="yarp-tab-1" aria-controls="yarp-tabpanel-1" />
                </Tabs>

                <ToggleButtonGroup
                    value={viewType}
                    exclusive
                    onChange={handleViewTypeChange}
                    aria-label="view type"
                    size="small"
                >
                    <ToggleButton value="table" aria-label="table view">
                        <TableIcon fontSize="small" sx={{ mr: 1 }} />
                        Table
                    </ToggleButton>
                    <ToggleButton value="json" aria-label="json view">
                        <JsonIcon fontSize="small" sx={{ mr: 1 }} />
                        JSON
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {viewType === 'table' ? (
                <>
                    <CustomTabPanel value={tabValue} index={0}>
                        <DataTable columns={routeColumns} rows={routes} />
                    </CustomTabPanel>
                    <CustomTabPanel value={tabValue} index={1}>
                        <DataTable columns={clusterColumns} rows={clusters} />
                    </CustomTabPanel>
                </>
            ) : (
                <Box sx={{ mt: 3 }}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 5,
                        }}
                    >
                        <JsonEditor
                            value={getFullJson()}
                            onChange={handleJsonUpdate}
                            mode="code"
                            allowedModes={['code', 'tree', 'form']}
                        />
                    </Paper>
                </Box>
            )}

            <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                <form onSubmit={handleFormSubmit}>
                    <DialogTitle>
                        {editingItem ? 'Edit' : 'Add New'} {dialogType === 'route' ? 'Route' : 'Cluster'}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    name="id"
                                    label="ID"
                                    fullWidth
                                    required
                                    defaultValue={editingItem?.id || ''}
                                    disabled={!!editingItem}
                                />
                            </Grid>
                            {dialogType === 'route' ? (
                                <>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Cluster ID</InputLabel>
                                            <Select
                                                name="ClusterId"
                                                defaultValue={editingItem?.ClusterId || ''}
                                                label="Cluster ID"
                                            >
                                                {clusters.map(c => (
                                                    <MenuItem key={c.id} value={c.id}>{c.id}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <TextField
                                            name="Path"
                                            label="Match Path"
                                            fullWidth
                                            required
                                            defaultValue={editingItem?.Match?.Path || ''}
                                            placeholder="/api/example/{**catch-all}"
                                        />
                                    </Grid>
                                </>
                            ) : (
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        name="Address"
                                        label="Destination Address"
                                        fullWidth
                                        required
                                        defaultValue={editingItem?.Destinations?.primary?.Address || ''}
                                        placeholder="https://localhost:5000"
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDialogClose}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {editingItem ? 'Update' : 'Add'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Zoom in={viewType === 'table'}>
                <Fab
                    color="primary"
                    aria-label="add"
                    sx={{ position: 'fixed', bottom: 32, right: 32 }}
                    onClick={() => handleAdd(tabValue === 0 ? 'route' : 'cluster')}
                >
                    <AddIcon />
                </Fab>
            </Zoom>
        </Box>
    );
}
