
import ApiDetail from '@/components/api-manager/apis/detail/ApiDetail';
import { notFound } from 'next/navigation';

async function getApi(id: string) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
        const res = await fetch(`${baseUrl}/api/api-manager/apis/${id}`, { cache: 'no-store' }); // No store for fresh data
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default async function ApiDetailPage({ params }: { params: { apiId: string } }) {
    const api = await getApi(params.apiId);

    if (!api) {
        notFound();
    }

    return <ApiDetail api={api} />;
}
