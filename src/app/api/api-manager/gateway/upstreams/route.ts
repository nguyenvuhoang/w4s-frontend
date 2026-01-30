import { NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';
import { Upstream } from '@/types/api-manager';

export async function GET() {
    return NextResponse.json(store.upstreams);
}

export async function POST(request: Request) {
    const body = await request.json();
    const newUpstream: Upstream = {
        ...body,
        id: `upstream-${Date.now()}`
    };
    store.upstreams.push(newUpstream);
    return NextResponse.json(newUpstream);
}
