import React from 'react';
import { Box } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import ApiList from '@/components/api-manager/apis/ApiList';

async function getApis() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/apis`, { cache: 'no-store' });
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
}

export default async function ApisPage() {
    const apis = await getApis();

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title="APIs"
                breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'APIs' }]}
            />
            <ApiList initialData={apis} />
        </Box>
    );
}
