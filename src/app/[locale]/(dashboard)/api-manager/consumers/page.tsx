import React from 'react';
import { Box } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import ConsumerList from '@/components/api-manager/consumers/ConsumerList';

async function getConsumers() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/consumers`, { cache: 'no-store' });
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
}

export default async function ConsumersPage() {
    const consumers = await getConsumers();

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Consumers" breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Consumers' }]} />
            <ConsumerList initialData={consumers} />
        </Box>
    );
}
