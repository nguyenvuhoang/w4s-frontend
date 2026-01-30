'use client';

import React from 'react';
import { Paper } from '@mui/material';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import { QuotaRule } from '@/types/api-manager';

interface QuotaListProps {
    rules: QuotaRule[];
}

export default function QuotaList({ rules }: QuotaListProps) {
    const columns: Column<QuotaRule>[] = [
        { id: 'name', label: 'Rule Name' },
        { id: 'targetType', label: 'Target Type' },
        { id: 'targetValue', label: 'Target Value' },
        { id: 'limit', label: 'Limit' },
        { id: 'window', label: 'Window (sec)' },
        { id: 'policy', label: 'Policy' },
    ];

    return (
        <Paper>
            <DataTable columns={columns} rows={rules} />
        </Paper>
    );
}
