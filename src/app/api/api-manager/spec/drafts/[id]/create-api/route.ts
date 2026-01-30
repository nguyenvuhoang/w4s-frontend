import { NextRequest, NextResponse } from 'next/server';
import { store, Api } from '@/server/api-manager/store';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const draft = store.drafts.find(d => d.id === id);

    if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const body = await request.json();

    const newApi: Api = {
        id: uuidv4(),
        name: body.name || draft.title,
        version: body.version || '1.0.0',
        description: `API created from draft ${draft.title}`,
        status: 'unpublished',
        type: 'rest',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: 'admin', // Mock owner
        labels: ['draft-generated']
    };

    store.apis.push(newApi);

    return NextResponse.json(newApi);
}
