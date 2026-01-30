'use client';

import React from 'react';
import { Paper, Chip } from '@mui/material';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import { Subscription } from '@/types/api-manager';

interface SubscriptionListProps {
    subscriptions: Subscription[];
}

export default function SubscriptionList({ subscriptions }: SubscriptionListProps) {
    const columns: Column<Subscription>[] = [
        { id: 'consumerId', label: 'Consumer' },
        { id: 'productId', label: 'Product' },
        { id: 'status', label: 'Status', format: (val) => <Chip label={val} size="small" color={val === 'active' ? 'success' : 'default'} /> },
        { id: 'createdAt', label: 'Created', format: (val) => new Date(val).toLocaleDateString() },
    ];

    return (
        <Paper>
            <DataTable columns={columns} rows={subscriptions} />
        </Paper>
    );
}
