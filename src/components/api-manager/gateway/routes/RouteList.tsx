'use client';

import React from 'react';
import { Paper } from '@mui/material';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import { Route } from '@/types/api-manager';

interface RouteListProps {
    routes: Route[];
}

export default function RouteList({ routes }: RouteListProps) {
    const columns: Column<Route>[] = [
        { id: 'paths', label: 'Paths', format: (val: string[]) => val.join(', ') },
        { id: 'protocols', label: 'Protocols', format: (val: string[]) => val.join(', ').toUpperCase() },
        { id: 'upstreamId', label: 'Upstream ID' },
        { id: 'stripPath', label: 'Strip Path', format: (val) => val ? 'Yes' : 'No' }
    ];

    return (
        <Paper>
            <DataTable columns={columns} rows={routes} />
        </Paper>
    );
}
