import { NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';
import { QuotaRule } from '@/types/api-manager';

export async function GET() {
    return NextResponse.json(store.quotaRules);
}

export async function POST(request: Request) {
    const body = await request.json();
    const newRule: QuotaRule = {
        ...body,
        id: `quota-${Date.now()}`
    };
    store.quotaRules.push(newRule);
    return NextResponse.json(newRule);
}
