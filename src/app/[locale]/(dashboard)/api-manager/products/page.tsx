import React from 'react';
import { Box } from '@mui/material';
import PageHeader from '@/components/api-manager/shared/PageHeader';
import ProductList from '@/components/api-manager/products/ProductList';

async function getProducts() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/products`, { cache: 'no-store' });
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
}

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader title="Products" breadcrumbs={[{ label: 'Dashboard' }, { label: 'API Manager' }, { label: 'Products' }]} />
            <ProductList initialData={products} />
        </Box>
    );
}
