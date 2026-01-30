'use client';

import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import { AnalyticsPoint } from '@/types/api-manager';

interface AnalyticsListProps {
    data: (AnalyticsPoint & { id: string })[];
}

export default function AnalyticsList({ data }: AnalyticsListProps) {
    const columns: Column<typeof data[0]>[] = [
        { id: 'timestamp', label: 'Time', format: (val) => new Date(val).toLocaleTimeString() },
        { id: 'requests', label: 'Requests' },
        { id: 'latencyAvg', label: 'Avg Latency (ms)' },
        { id: 'latencyP99', label: 'P99 Latency (ms)' },
        { id: 'errors_4xx', label: '4xx Errors' },
        { id: 'errors_5xx', label: '5xx Errors' },
    ];

    return (
        <Paper>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6">Traffic Data</Typography>
            </Box>
            <DataTable columns={columns} rows={data} rowsPerPage={24} />
        </Paper>
    );
}
