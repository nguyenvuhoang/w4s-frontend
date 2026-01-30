import React from 'react';
import { Box } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import QuotaList from '@/components/api-manager/quota/QuotaList';

async function getQuotaRules() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/quota`, { cache: 'no-store' });
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
}

export default async function QuotaPage() {
    const rules = await getQuotaRules();

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Quota Policy" breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Quota' }]} />
            <QuotaList rules={rules} />
        </Box>
    );
}
