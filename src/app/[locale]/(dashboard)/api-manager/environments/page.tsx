'use client';

import React from 'react';
import { Box, Paper, Grid, Typography, Card, CardContent, Divider, Button } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import { Add } from '@mui/icons-material';

// Mock client data since route is simple and we want interactive UI feel
const MOCK_ENVS = [
    { id: 'dev', name: 'Development', color: '#4caf50', url: 'https://dev-api.example.com' },
    { id: 'staging', name: 'Staging', color: '#ff9800', url: 'https://staging-api.example.com' },
    { id: 'prod', name: 'Production', color: '#f44336', url: 'https://api.example.com' },
];

export default function EnvironmentsPage() {
    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title="Environments"
                breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Environments' }]}
                action={<Button variant="contained" startIcon={<Add />}>Add Environment</Button>}
            />

            <Grid container spacing={3}>
                {MOCK_ENVS.map((env) => (
                    <Grid size={{ xs: 12, md: 4 }} key={env.id}>
                        <Card sx={{ borderTop: `4px solid ${env.color}` }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{env.name}</Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>Gateway URL:</Typography>
                                <Paper variant="outlined" sx={{ p: 1, bgcolor: 'background.default', mb: 2 }}>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{env.url}</Typography>
                                </Paper>

                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">Variables</Typography>
                                    <Button size="small">Manage (5)</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
