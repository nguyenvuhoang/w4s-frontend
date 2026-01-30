import React from 'react';
import { Box } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import RouteList from '@/components/api-manager/gateway/routes/RouteList';

async function getRoutes() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/gateway/routes`, { cache: 'no-store' });
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
}

export default async function GatewaysRoutesPage() {
    const routes = await getRoutes();

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Gateway Routes" breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Gateway Routes' }]} />
            <RouteList routes={routes} />
        </Box>
    );
}
