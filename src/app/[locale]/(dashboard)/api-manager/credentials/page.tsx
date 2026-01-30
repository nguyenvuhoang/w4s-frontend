import React from 'react';
import { Box } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import CredentialList from '@/components/api-manager/credentials/CredentialList';

async function getCredentials() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/credentials`, { cache: 'no-store' });
        return res.ok ? res.json() : { apiKeys: [], oauthClients: [] };
    } catch {
        return { apiKeys: [], oauthClients: [] };
    }
}

export default async function CredentialsPage() {
    const data = await getCredentials();

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Credentials" breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Credentials' }]} />
            <CredentialList apiKeys={data.apiKeys} oauthClients={data.oauthClients} />
        </Box>
    );
}
