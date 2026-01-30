'use client';

import React from 'react';
import { Paper } from '@mui/material';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import { Upstream } from '@/types/api-manager';

interface UpstreamListProps {
    upstreams: Upstream[];
}

export default function UpstreamList({ upstreams }: UpstreamListProps) {
    const columns: Column<Upstream>[] = [
        { id: 'name', label: 'Name' },
        { id: 'algorithm', label: 'Algorithm' },
        { id: 'targets', label: 'Targets', format: (val: any[]) => val.length },
        { id: 'healthCheckPath', label: 'Health Check' }
    ];

    return (
        <Paper>
            <DataTable columns={columns} rows={upstreams} />
        </Paper>
    );
}
