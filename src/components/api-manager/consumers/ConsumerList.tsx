'use client';

import React from 'react';
import { Box, Chip, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import { Consumer } from '@/types/api-manager';
import RequirePermission from '@/components/api-manager/shared/RequirePermission';

interface ConsumerListProps {
    initialData: Consumer[];
}

export default function ConsumerList({ initialData }: ConsumerListProps) {
    const columns: Column<Consumer>[] = [
        { id: 'username', label: 'Username', minWidth: 150 },
        { id: 'type', label: 'Type', format: (val) => <Chip label={val} size="small" /> },
        { id: 'orgName', label: 'Organization', minWidth: 200 },
        { id: 'contactEmail', label: 'Contact' },
        { id: 'createdAt', label: 'Created', format: (val) => new Date(val).toLocaleDateString() },
    ];

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <RequirePermission permission="consumer.write">
                    <Button variant="contained" startIcon={<Add />}>Add Consumer</Button>
                </RequirePermission>
            </Box>
            <DataTable columns={columns} rows={initialData} />
        </Box>
    );
}
