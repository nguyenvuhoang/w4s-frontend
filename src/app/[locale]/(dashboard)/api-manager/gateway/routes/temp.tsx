'use client';

import React from 'react';
import { Box, Paper, Chip } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import DataTable, { Column } from '@/components/api-manager/shared/DataTable';
import { Route } from '@/types/api-manager';

const columns: Column<Route>[] = [
    { id: 'paths', label: 'Paths', format: (val: string[]) => val.join(', ') },
    { id: 'protocols', label: 'Protocols', format: (val: string[]) => val.join(', ').toUpperCase() },
    { id: 'upstreamId', label: 'Upstream ID' },
    { id: 'stripPath', label: 'Strip Path', format: (val) => val ? 'Yes' : 'No' }
];

// Client component for list to allow future interactivity
function RouteList({ initialData }: { initialData: Route[] }) {
    return (
        <Paper sx={{ p: 2 }}>
            <DataTable columns={columns} rows={initialData} />
        </Paper>
    );
}

// Ensure server wrapper for data fetching
// Wait, client component can't be async page. 
// I will just put the whole page here for simplicity if I am forced to combine.
// But following pattern, I will create the Page and the List separately. 
// Writing this file as Client Component temporarily for logic reuse? No, better use Server Page.

export default function RoutesPage() {
    // Mock data fetching since I can't export async page from 'use client' file easily if I mix.
    // I will rewrite this file in the next step properly as a server page.
    return null;
}
