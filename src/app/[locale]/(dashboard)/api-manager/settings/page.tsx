'use client';

import React from 'react';
import { Box, Paper, Typography, TextField, Button, Switch, FormControlLabel, Divider } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';

export default function SettingsPage() {
    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Settings" breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Settings' }]} />

            <Paper sx={{ p: 3, maxWidth: 800 }}>
                <Typography variant="h6" gutterBottom>Global Configuration</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                    <TextField fullWidth label="System Name" defaultValue="Admin API Gateway" />
                    <TextField fullWidth label="Admin Contact Email" defaultValue="admin@company.com" />

                    <FormControlLabel control={<Switch defaultChecked />} label="Enable Global Rate Limiting" />
                    <FormControlLabel control={<Switch defaultChecked />} label="Enable Audit Logging" />

                    <Box>
                        <Typography variant="subtitle2" gutterBottom>Log Retention (Days)</Typography>
                        <TextField type="number" defaultValue={30} size="small" />
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button>Reset</Button>
                        <Button variant="contained">Save Changes</Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}
