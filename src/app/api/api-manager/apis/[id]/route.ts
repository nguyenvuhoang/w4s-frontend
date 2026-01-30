import { NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const api = store.apis.find(a => a.id === params.id);
    if (!api) {
        return NextResponse.json({ message: 'API not found' }, { status: 404 });
    }
    return NextResponse.json(api);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const body = await request.json();
    const index = store.apis.findIndex(a => a.id === params.id);
    if (index === -1) {
        return NextResponse.json({ message: 'API not found' }, { status: 404 });
    }
    store.apis[index] = { ...store.apis[index], ...body, updatedAt: new Date().toISOString() };
    return NextResponse.json(store.apis[index]);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const index = store.apis.findIndex(a => a.id === params.id);
    if (index === -1) {
        return NextResponse.json({ message: 'API not found' }, { status: 404 });
    }
    store.apis.splice(index, 1);
    return NextResponse.json({ message: 'Deleted' });
}
