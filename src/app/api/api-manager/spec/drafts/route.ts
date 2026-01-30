import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/server/api-manager/store';

export async function GET(request: NextRequest) {
    return NextResponse.json(store.drafts);
}
