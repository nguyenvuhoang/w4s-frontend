import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const draft = store.drafts.find(d => d.id === id);

    if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json(draft);
}
