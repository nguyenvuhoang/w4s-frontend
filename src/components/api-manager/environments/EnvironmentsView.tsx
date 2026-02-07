'use client';

import React from 'react';
import { Box, Paper, Grid, Typography, Card, CardContent, Divider, Button, CircularProgress, Chip, Stack, Alert } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import { Add } from '@mui/icons-material';
import { useInfisicalHandler } from '@/services/useInfisicalHandler';

interface EnvironmentsViewProps {
    initialToken: string;
}

export default function EnvironmentsView({ initialToken }: EnvironmentsViewProps) {
    const {
        environments,
        secrets,
        loading,
        error,
        selectedWorkspace,
    } = useInfisicalHandler(initialToken);

    const getEnvColor = (slug: string) => {
        switch (slug) {
            case 'dev': return '#4caf50';
            case 'staging': return '#ff9800';
            case 'prod': return '#f44336';
            default: return '#2196f3';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title="Environments variables"
                breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Environments' }]}
                action={
                    <Stack direction="row" spacing={2} alignItems="center">
                        {loading && <CircularProgress size={24} />}
                        <Button variant="contained" startIcon={<Add />}>Add Environment</Button>
                    </Stack>
                }
            />

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            {!loading && environments.length === 0 && !error && (
                <Alert severity="info" sx={{ mb: 3 }}>No environments found for the selected project.</Alert>
            )}

            <Grid container spacing={3}>
                {environments.map((env) => (
                    <Grid size={{ xs: 12, md: 4 }} key={env.id}>
                        <Card sx={{
                            borderTop: `4px solid ${getEnvColor(env.slug)}`,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="h6">{env.name}</Typography>
                                    <Chip label={env.slug.toUpperCase()} size="small" variant="outlined" />
                                </Box>

                                <Typography variant="body2" color="text.secondary" gutterBottom>Project: {selectedWorkspace?.name}</Typography>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle2" gutterBottom>Secrets ({secrets[env.slug]?.length || 0})</Typography>
                                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                    {secrets[env.slug]?.map((secret) => (
                                        <Paper
                                            key={secret.id}
                                            variant="outlined"
                                            sx={{ p: 1, mb: 1, bgcolor: 'background.default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        >
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                {secret.secretKey}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                ••••••••
                                            </Typography>
                                        </Paper>
                                    ))}
                                    {(!secrets[env.slug] || secrets[env.slug].length === 0) && (
                                        <Typography variant="caption" color="text.disabled">No secrets found</Typography>
                                    )}
                                </Box>
                            </CardContent>
                            <Divider />
                            <Box sx={{ p: 1, textAlign: 'right' }}>
                                <Button size="small">Manage Secrets</Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
