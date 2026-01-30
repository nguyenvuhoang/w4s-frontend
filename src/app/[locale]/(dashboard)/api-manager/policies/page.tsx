'use client';

import React, { useState } from 'react';
import { Box, Paper, Grid, Typography, List, ListItem, ListItemText, ListItemIcon, Button, TextField, ListItemButton } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import { Policy } from '@/types/api-manager';
import { Extension, Add } from '@mui/icons-material';

// Mock Library
const POLICY_LIBRARY = [
    { type: 'rate-limit', name: 'Rate Limiting', description: 'Limit request rate per period' },
    { type: 'cors', name: 'CORS', description: 'Allow Cross-Origin Resource Sharing' },
    { type: 'jwt-verify', name: 'JWT Validation', description: 'Validate JWT tokens' },
    { type: 'ip-restriction', name: 'IP Restriction', description: 'Allow/Deny IPs' },
];

export default function PoliciesPage() {
    const [selectedPolicyType, setSelectedPolicyType] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('{\n  "config": {}\n}');

    const handleSelectType = (type: string) => {
        setSelectedPolicyType(type);
        setEditorContent(`{\n  "policy": "${type}",\n  "config": {\n    \n  }\n}`);
    };

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Policies" breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Policies' }]} />

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ height: '100%' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                            <Typography variant="h6">Policy Library</Typography>
                        </Box>
                        <List>
                            {POLICY_LIBRARY.map((po) => (
                                <ListItem
                                    key={po.type}
                                    disablePadding
                                >
                                    <ListItemButton
                                        selected={selectedPolicyType === po.type}
                                        onClick={() => handleSelectType(po.type)}
                                    >
                                        <ListItemIcon><Extension /></ListItemIcon>
                                        <ListItemText primary={po.name} secondary={po.description} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        {selectedPolicyType ? (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6">Configure {selectedPolicyType}</Typography>
                                    <Button variant="contained" startIcon={<Add />}>Create Policy</Button>
                                </Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={20}
                                    variant="outlined"
                                    value={editorContent}
                                    onChange={(e) => setEditorContent(e.target.value)}
                                    sx={{ fontFamily: 'monospace' }}
                                />
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                                <Typography>Select a policy type to configure</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
