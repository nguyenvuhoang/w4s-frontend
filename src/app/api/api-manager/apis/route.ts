import { NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';
import { Api } from '@/types/api-manager';

export async function GET() {
    return NextResponse.json(store.apis);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Minimal validation
        if (!body.name || !body.version) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const newApi: Api = {
            ...body,
            id: `api-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ownerId: 'current-user', // Mock
            status: body.status || 'unpublished',
            type: body.type || 'rest',
            labels: body.labels || []
        };

        store.apis.push(newApi);
        return NextResponse.json(newApi, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
