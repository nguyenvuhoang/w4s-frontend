import React from 'react';
import { Box } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import UpstreamList from '@/components/api-manager/gateway/upstreams/UpstreamList';

async function getUpstreams() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/gateway/upstreams`, { cache: 'no-store' });
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
}

export default async function UpstreamsPage() {
    const upstreams = await getUpstreams();

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Gateway Upstreams" breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Upstreams' }]} />
            <UpstreamList upstreams={upstreams} />
        </Box>
    );
}
