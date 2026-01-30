'use client';

import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab, Chip, Button, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import { ApiKey, OAuthClient } from '@/types/api-manager';
import RequirePermission from '@/components/api-manager/shared/RequirePermission';

interface CredentialListProps {
    apiKeys: ApiKey[];
    oauthClients: OAuthClient[];
}

export default function CredentialList({ apiKeys, oauthClients }: CredentialListProps) {
    const [tab, setTab] = useState(0);

    const apiKeyColumns: Column<ApiKey>[] = [
        { id: 'key', label: 'Key', format: (val) => '••••••••' + val.slice(-4) },
        { id: 'consumerId', label: 'Consumer' },
        { id: 'status', label: 'Status', format: (val) => <Chip label={val} size="small" color={val === 'active' ? 'success' : 'default'} /> },
        { id: 'createdAt', label: 'Created', format: (val) => new Date(val).toLocaleDateString() },
    ];

    const oauthColumns: Column<OAuthClient>[] = [
        { id: 'name', label: 'Name' },
        { id: 'clientId', label: 'Client ID' },
        { id: 'consumerId', label: 'Consumer' },
        { id: 'status', label: 'Status', format: (val) => <Chip label={val} size="small" color={val === 'active' ? 'success' : 'default'} /> },
    ];

    return (
        <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                    <Tab label="API Keys" />
                    <Tab label="OAuth Clients" />
                </Tabs>
                <RequirePermission permission="credential.manage">
                    <Button variant="contained" size="small" startIcon={<Add />}>
                        Create {tab === 0 ? 'API Key' : 'Client'}
                    </Button>
                </RequirePermission>
            </Box>

            <Box sx={{ p: 0 }}>
                {tab === 0 && <DataTable columns={apiKeyColumns} rows={apiKeys} />}
                {tab === 1 && <DataTable columns={oauthColumns} rows={oauthClients} />}
            </Box>
        </Paper>
    );
}
