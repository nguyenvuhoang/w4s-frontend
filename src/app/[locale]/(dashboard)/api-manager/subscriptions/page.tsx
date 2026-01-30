import React from 'react';
import { Box } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import SubscriptionList from '@/components/api-manager/subscriptions/SubscriptionList';

async function getSubscriptions() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/subscriptions`, { cache: 'no-store' });
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
}

export default async function SubscriptionsPage() {
    const subscriptions = await getSubscriptions();

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Subscriptions" breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Subscriptions' }]} />
            <SubscriptionList subscriptions={subscriptions} />
        </Box>
    );
}
