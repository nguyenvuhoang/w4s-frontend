import { NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';
import { Policy } from '@/types/api-manager';

export async function GET() {
    return NextResponse.json(store.policies);
}

export async function POST(request: Request) {
    const body = await request.json();
    const newPolicy: Policy = {
        ...body,
        id: `policy-${Date.now()}`
    };
    store.policies.push(newPolicy);
    return NextResponse.json(newPolicy);
}
