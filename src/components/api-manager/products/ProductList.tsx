'use client';

import React from 'react';
import { Box, Chip, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import { ProductPlan } from '@/types/api-manager';
import RequirePermission from '@/components/api-manager/shared/RequirePermission';

interface ProductListProps {
    initialData: ProductPlan[];
}

export default function ProductList({ initialData }: ProductListProps) {
    const columns: Column<ProductPlan>[] = [
        { id: 'name', label: 'Name', minWidth: 170 },
        { id: 'description', label: 'Description', minWidth: 200 },
        { id: 'status', label: 'Status', format: (val) => <Chip label={val} size="small" color={val === 'published' ? 'success' : 'default'} /> },
        { id: 'approvalRequired', label: 'Approval', format: (val) => val ? 'Yes' : 'No' },
        { id: 'quota', label: 'Quota', format: (val: any) => `${val.limit} / ${val.period}` },
    ];

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <RequirePermission permission="product.write">
                    <Button variant="contained" startIcon={<Add />}>Create Product</Button>
                </RequirePermission>
            </Box>
            <DataTable columns={columns} rows={initialData} />
        </Box>
    );
}
